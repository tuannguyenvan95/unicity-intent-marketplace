import { AgentBase } from "./agent-base";
import { DMContent, IntentPayload } from "./types";
import { UNICITY_CONFIG } from "./config";

export class AgentSolver extends AgentBase {
  constructor(isSimulation = false) {
    super("solver", "solver", isSimulation);
  }

  public async watchMarketAndSolve() {
    this.updateState("searching");
    this.log("Polling market bulletin board for storage requests...", "info");

    if (this.isSimulation) {
      // Simulation mode uses orchestrated flow
      return;
    }

    // Set up polling interval for intents
    const intervalId = setInterval(async () => {
      try {
        const intents = await this.sphere.market.search("storage");
        for (const item of intents) {
          try {
            const data: IntentPayload = JSON.parse(item.content);
            if (data.type === "storage_request" && data.storageGb === 10 && Number(data.priceUct) >= 5) {
              this.log(`Found matching intent! ID: ${item.id}. Creator: ${item.creator}`, "success");
              
              // Stop polling once matching intent is found
              clearInterval(intervalId);
              
              // Initialize negotiation via direct message
              this.updateState("negotiating");
              const dmPayload: DMContent = {
                type: "negotiate_proposal",
                intentId: item.id,
                storageGb: 10,
                priceUct: "5"
              };
              
              this.log(`Sending negotiation proposal to ${item.creator} via Nostr DM...`, "info");
              await this.sphere.communications.sendDM(item.creator, JSON.stringify(dmPayload));
              
              // Start listening for swap proposal
              this.listenForSwapProposals();
              break;
            }
          } catch (e) {
            // ignore non-matching intents
          }
        }
      } catch (err: any) {
        this.log(`Market search failed: ${err.message}`, "error");
      }
    }, 5000);
  }

  private listenForSwapProposals() {
    this.log("Listening for swap proposals from Requester...", "info");
    this.updateState("idle");

    this.sphere.communications.onDirectMessage(async (msg: any) => {
      const sender = msg.sender;
      try {
        const payload: DMContent = JSON.parse(msg.content);
        
        if (payload.type === "swap_proposed" && payload.swapId) {
          this.log(`Received swap proposal ID: ${payload.swapId} from requester`, "message");
          this.updateState("accepting_swap");

          // 1. Retrieve the Swap Proposal from Escrow
          const proposalId = payload.swapId;
          this.log(`Fetching escrow details for proposal ${proposalId}...`, "info");
          const proposal = await this.sphere.swap.getProposal(proposalId);

          // 2. Verify Swap Terms
          // Requester should be offering UCT and wanting STORAGE.
          // That means Solver receives a proposal where:
          // We offer STORAGE, We want UCT.
          const uctCoinId = UNICITY_CONFIG.tokens.UCT.coinId;
          const storageCoinId = UNICITY_CONFIG.tokens.STORAGE.coinId;

          const isOfferValid = proposal.offer.coinId === storageCoinId && proposal.offer.amount === "10000000"; // 10 STORAGE
          const isWantValid = proposal.want.coinId === uctCoinId && proposal.want.amount === "5000000"; // 5 UCT

          if (isOfferValid && isWantValid) {
            this.log("Atomic swap escrow verified. Executing on-chain settlement...", "warning");
            
            // 3. Accept and Execute Swap
            const result = await this.sphere.swap.accept(proposalId);
            
            if (result.success) {
              this.log(`Atomic swap executed successfully! TX: ${result.txHash}`, "success");
              this.updateState("settled");

              // 4. Notify Requester
              const completionPayload: DMContent = {
                type: "swap_completed",
                swapId: proposalId,
                txHash: result.txHash
              };
              
              this.log("Sending settlement confirmation via Nostr DM...", "info");
              await this.sphere.communications.sendDM(sender, JSON.stringify(completionPayload));
            } else {
              throw new Error(result.error);
            }
          } else {
            this.log("Swap terms mismatch! Terminating transaction.", "error");
            this.updateState("error");
          }
        }
      } catch (err: any) {
        this.log(`Failed to process swap: ${err.message}`, "error");
        this.updateState("error");
      }
    });
  }

  // Helper trigger for UI simulation
  public async simulateMarketDiscovery(intent: IntentPayload) {
    this.updateState("searching");
    await new Promise(r => setTimeout(r, 1000));
    
    this.log(`Found matching intent! Creator: ${intent.requester}`, "success");
    this.updateState("negotiating");
    await new Promise(r => setTimeout(r, 1500));

    this.log(`Sending negotiation proposal to ${intent.requester} via Nostr DM...`, "info");
    this.updateState("idle");
  }

  public async simulateSwapAcceptance(swapId: string, requesterAddress: string) {
    this.log(`[Simulated] Received swap proposal ID: ${swapId} from requester`, "message");
    this.updateState("accepting_swap");
    await new Promise(r => setTimeout(r, 1000));

    this.log(`Fetching escrow details for proposal ${swapId}...`, "info");
    await new Promise(r => setTimeout(r, 1000));

    this.log("Atomic swap escrow verified. Executing on-chain settlement...", "warning");
    await new Promise(r => setTimeout(r, 1500));

    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    this.log(`Atomic swap executed successfully! TX: ${txHash}`, "success");
    this.updateState("settled");
    await new Promise(r => setTimeout(r, 1000));

    this.log("Sending settlement confirmation via Nostr DM...", "info");
    return txHash;
  }
}

// Node.js execution entrypoint
if (require.main === module) {
  const agent = new AgentSolver();
  agent.initialize().then(async () => {
    // Mint storage tokens representing the service capacity
    await agent.mintTokens("STORAGE", 10000000n);
    // Watch
    await agent.watchMarketAndSolve();
  }).catch(console.error);
}
