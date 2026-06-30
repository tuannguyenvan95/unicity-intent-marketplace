import { UNICITY_CONFIG } from "./config";
import { AgentLog, AgentState } from "./types";

// Dynamic imports to prevent browser bundle crashes
let SphereClass: any;
let createNodeProvidersFunc: any;
let createWalletApiProvidersFunc: any;
let getCoinIdBySymbolFunc: any;

export abstract class AgentBase {
  public sphere: any;
  public profile: string;
  public nametag: string;
  public state: AgentState = "idle";
  public logCallback?: (log: AgentLog) => void;
  public stateCallback?: (state: AgentState) => void;
  public isSimulation: boolean = false;

  constructor(profile: string, nametag: string, isSimulation = false) {
    this.profile = profile;
    this.nametag = nametag;
    this.isSimulation = isSimulation;
  }

  protected log(message: string, type: "info" | "success" | "warning" | "error" | "message" = "info") {
    const logEntry: AgentLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      sender: this.profile === "requester" ? "Requester" : "Solver",
      message,
      type
    };
    console.log(`[${logEntry.timestamp}] [${logEntry.sender}] ${message}`);
    if (this.logCallback) {
      this.logCallback(logEntry);
    }
  }

  protected updateState(newState: AgentState) {
    this.state = newState;
    if (this.stateCallback) {
      this.stateCallback(newState);
    }
  }

  public async initialize() {
    this.updateState("starting");
    this.log(`Initializing agent wallet (profile: "${this.profile}")`, "info");

    if (this.isSimulation) {
      this.log("Running in Agentic Simulation mode (no local Node files)", "info");
      await new Promise(r => setTimeout(r, 1000));
      this.updateState("idle");
      return;
    }

    try {
      // Lazy load SDK components to prevent Vite bundling crashes for browser
      const sdk = await import("@unicitylabs/sphere-sdk");
      const nodeImpl = await import("@unicitylabs/sphere-sdk/impl/nodejs");
      const walletApi = await import("@unicitylabs/sphere-sdk/impl/shared/wallet-api");

      SphereClass = sdk.Sphere;
      createNodeProvidersFunc = nodeImpl.createNodeProviders;
      createWalletApiProvidersFunc = walletApi.createWalletApiProviders;
      getCoinIdBySymbolFunc = sdk.getCoinIdBySymbol;

      // 1. Create Base Node Providers
      const base = createNodeProvidersFunc({
        network: UNICITY_CONFIG.network,
        dataDir: `./wallet-data/${this.profile}`,
        tokensDir: `./tokens-data/${this.profile}`,
        oracle: {
          apiKey: UNICITY_CONFIG.oracle.apiKey,
          url: UNICITY_CONFIG.oracle.url
        },
        transport: {
          relays: UNICITY_CONFIG.nostr.relays
        }
      });

      // 2. Wrap with v2 Wallet-API rails (provides mailbox delivery and token inventory storage)
      const providers = createWalletApiProvidersFunc(base, {
        baseUrl: UNICITY_CONFIG.walletApi.baseUrl,
        network: UNICITY_CONFIG.walletApi.network,
        deviceId: `device-${this.profile}-stable-id`
      });

      // 3. Initialize Sphere
      const { sphere, created, generatedMnemonic } = await SphereClass.init({
        ...providers,
        network: "testnet2",
        autoGenerate: true
      });

      this.sphere = sphere;

      if (created && generatedMnemonic) {
        this.log(`New wallet generated! Mnemonic: "${generatedMnemonic}"`, "warning");
      }

      this.log(`Wallet loaded. Address: ${this.sphere.identity?.directAddress}`, "success");
      
      // Register nametag to make the agent discoverable on Nostr
      this.log(`Registering nametag: "@${this.nametag}"`, "info");
      await this.sphere.registerNametag(this.nametag);
      this.log(`Nametag registered: "@${this.nametag}" successfully`, "success");
      
      this.updateState("idle");
    } catch (error: any) {
      this.log(`Initialization error: ${error.message || error}`, "error");
      this.updateState("error");
      throw error;
    }
  }

  public async getBalance(symbol: string): Promise<string> {
    if (this.isSimulation) {
      return "0";
    }
    try {
      const assets = await this.sphere.payments.getAssets();
      const asset = assets.find((a: any) => a.symbol === symbol);
      return asset ? asset.totalAmount : "0";
    } catch (err: any) {
      this.log(`Failed to fetch balance: ${err.message}`, "error");
      return "0";
    }
  }

  public async mintTokens(symbol: string, amount: bigint) {
    this.updateState("minting");
    this.log(`Self-minting ${amount.toString()} base units of ${symbol} from token engine...`, "info");
    
    if (this.isSimulation) {
      await new Promise(r => setTimeout(r, 1500));
      this.log(`Successfully minted ${amount.toString()} units of ${symbol} (simulated)`, "success");
      this.updateState("idle");
      return;
    }

    try {
      const coinId = getCoinIdBySymbolFunc ? getCoinIdBySymbolFunc(symbol) : UNICITY_CONFIG.tokens[symbol as keyof typeof UNICITY_CONFIG.tokens]?.coinId;
      if (!coinId) throw new Error(`Unknown coin symbol: ${symbol}`);

      const result = await this.sphere.payments.mintFungibleToken(coinId, amount);
      if (result.success) {
        this.log(`Successfully minted token ID: ${result.tokenId}`, "success");
      } else {
        throw new Error(result.error);
      }
      this.updateState("idle");
    } catch (err: any) {
      this.log(`Minting failed: ${err.message}`, "error");
      this.updateState("error");
      throw err;
    }
  }

  public async destroy() {
    if (this.sphere) {
      await this.sphere.destroy();
      this.log("Agent sphere context destroyed", "info");
    }
  }
}
