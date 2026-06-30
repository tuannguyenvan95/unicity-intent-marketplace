import { AgentBase } from "./agent-base";
import { DMContent, IntentPayload } from "./types";
import { UNICITY_CONFIG } from "./config";

export class AgentRequester extends AgentBase {
  private postedIntentId?: string;

  constructor(isSimulation = false) {
    super("requester", "requester", isSimulation);
  }

  public async broadcastIntent(storageGb: number, priceUct: string) {
    this.updateState("broadcasting");
    const intent: IntentPayload = {
      type: "storage_request",
      storageGb,
      priceUct,
      requester: `@${this.nametag}`
    };

    this.log(`Broadcasting Market Intent: "Need ${storageGb}GB storage for ${priceUct} UCT tokens"`, "info");

    if (this.isSimulation) {
      await new Promise(r => setTimeout(r, 1500));
      this.postedIntentId = `intent-${Math.random().toString(36).substring(2, 9)}`;
      this.log(`Market Intent published. ID: ${this.postedIntentId}`, "success");
      this.updateState("idle");
      return;
    }

    try {
      const result = await this.sphere.market.post({
        content: JSON.stringify(intent),
        type: "buy"
      });
      this.postedIntentId = result.id;
      this.log(`Market Intent published. ID: ${this.postedIntentId}`, "success");
      this.updateState("idle");
    } catch (err: any) {
      this.log(`Failed to publish intent: ${err.message}`, "error");
      this.updateState("error");
    }
  }

  public listenForNegotiations(onComplete: (txHash: string) => void) {
    this.log("Listening for Solver negotiation proposals...", "info");

    if (this.isSimulation) {
      // Simulation mode listens to simulated events
      return;
    }

    this.sphere.communications.onDirectMessage(async (msg: any) => {
      const sender = msg.sender;
      this.log(`Received Nostr DM from ${sender}`, "message");

      try {
        const payload: DMContent = JSON.parse(msg.content);
        
        if (payload.type === "negotiate_proposal") {
          this.log(`Solver offered to fill intent. Terms: ${payload.storageGb}GB for ${payload.priceUct} UCT`, "info");
          
          // 1. Validate Terms
          if (payload.storageGb === 10 && payload.priceUct === "5") {
            this.log("Terms verified. Initiating Atomic Swap Escrow...", "warning");
            this.updateState("proposing_swap");

            // 2. Resolve Coin IDs
            const uctCoinId = UNICITY_CONFIG.tokens.UCT.coinId;
            const storageCoinId = UNICITY_CONFIG.tokens.STORAGE.coinId;

            // 3. Propose Escrow Swap: Offer 5 UCT, Want 10 STORAGE
            // 5 UCT (decimals = 6) -> 5,000,000 base units
            // 10 STORAGE (decimals = 6) -> 10,000,000 base units
            const proposal = await this.sphere.swap.propose({
              to: sender,
              offer: { amount: "5000000", coinId: uctCoinId },
              want: { amount: "10000000", coinId: storageCoinId }
            });

            this.log(`Atomic Swap Escrow created. Proposal ID: ${proposal.id}`, "success");

            // 4. Send proposal ID back to solver
            const responsePayload: DMContent = {
              type: "swap_proposed",
              swapId: proposal.id,
              intentId: this.postedIntentId
            };

            this.log(`Sending swap proposal ID ${proposal.id} to solver...`, "info");
            await this.sphere.communications.sendDM(sender, JSON.stringify(responsePayload));
            this.updateState("idle");
          } else {
            this.log("Terms validation failed. Negotiated terms do not match original intent.", "error");
          }
        } 
        
        else if (payload.type === "swap_completed") {
          this.log(`Atomic Swap Escrow settled! TX Hash: ${payload.txHash}`, "success");
          this.updateState("settled");
          if (payload.txHash) {
            onComplete(payload.txHash);
          }
        }
      } catch (err: any) {
        this.log(`Failed to process DM: ${err.message}`, "error");
      }
    });
  }

  // Helper trigger for UI simulation
  public async simulateNegotiation(solverAddress: string, onComplete: (txHash: string) => void) {
    this.log(`[Simulated] Received Nostr DM from ${solverAddress}`, "message");
    await new Promise(r => setTimeout(r, 1000));
    
    this.log(`[Simulated] Solver offered to fill intent. Terms: 10GB for 5 UCT`, "info");
    await new Promise(r => setTimeout(r, 1000));
    
    this.log("Terms verified. Initiating Atomic Swap Escrow...", "warning");
    this.updateState("proposing_swap");
    await new Promise(r => setTimeout(r, 1500));
    
    const swapId = `swap-${Math.random().toString(36).substring(2, 9)}`;
    this.log(`Atomic Swap Escrow created. Proposal ID: ${swapId}`, "success");
    await new Promise(r => setTimeout(r, 1000));
    
    this.log(`Sending swap proposal ID ${swapId} to solver...`, "info");
    this.updateState("idle");

    // Let the Solver process it in the Orchestrator
    return swapId;
  }
}

// Node.js execution entrypoint
if (require.main === module) {
  const agent = new AgentRequester();
  agent.initialize().then(async () => {
    // Top up wallet with UCT
    await agent.mintTokens("UCT", 5000000n);
    // Broadcast
    await agent.broadcastIntent(10, "5");
    // Listen
    agent.listenForNegotiations((tx) => {
      console.log("Settlement complete. Closing agent.");
      process.exit(0);
    });
  }).catch(console.error);
}
