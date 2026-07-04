// Mocking the sphere-sdk for prototype purposes

export class SphereIdentity {
    nametag: string;
    publicKey: string;
    privateKey: string;

    constructor(nametag: string) {
        this.nametag = nametag;
        // Mock keys
        this.publicKey = "pub_" + Math.random().toString(36).substring(7);
        this.privateKey = "priv_" + Math.random().toString(36).substring(7);
    }
}

export class SphereWallet {
    address: string;
    balance: number;

    constructor(identity: SphereIdentity) {
        this.address = "0x" + identity.publicKey;
        this.balance = 100; // Start with some testnet tokens
    }

    async createPaymentRequest(amount: number, memo: string): Promise<string> {
        console.log(`[Wallet] Created payment request for ${amount} tokens. Memo: ${memo}`);
        return `req_${amount}_${Date.now()}`;
    }

    async approvePaymentRequest(reqId: string, amount: number): Promise<boolean> {
        console.log(`[Wallet] Approving payment request ${reqId} for ${amount} tokens...`);
        if (this.balance >= amount) {
            this.balance -= amount;
            console.log(`[Wallet] Payment successful. Remaining balance: ${this.balance}`);
            return true;
        }
        console.log(`[Wallet] Insufficient funds.`);
        return false;
    }
}

// Mocking Nostr communications abstracted by the SDK
export class SphereNostr {
    private identity: SphereIdentity;
    private messageHandlers: ((msg: any) => void)[] = [];

    // Global message bus for the mock to allow local processes to communicate
    static mockNetworkBus: { to: string; from: string; content: any }[] = [];

    constructor(identity: SphereIdentity) {
        this.identity = identity;
        setInterval(() => this.pollMessages(), 1000);
    }

    async sendDM(toNametag: string, content: any) {
        console.log(`[Nostr] Sending DM from ${this.identity.nametag} to ${toNametag}`);
        SphereNostr.mockNetworkBus.push({
            to: toNametag,
            from: this.identity.nametag,
            content
        });
    }

    onMessage(handler: (msg: { from: string; content: any }) => void) {
        this.messageHandlers.push(handler);
    }

    private pollMessages() {
        const messages = SphereNostr.mockNetworkBus.filter(m => m.to === this.identity.nametag);
        SphereNostr.mockNetworkBus = SphereNostr.mockNetworkBus.filter(m => m.to !== this.identity.nametag);

        for (const msg of messages) {
            for (const handler of this.messageHandlers) {
                handler({ from: msg.from, content: msg.content });
            }
        }
    }
}

export class SphereSDK {
    identity: SphereIdentity;
    wallet: SphereWallet;
    nostr: SphereNostr;

    constructor(nametag: string) {
        this.identity = new SphereIdentity(nametag);
        this.wallet = new SphereWallet(this.identity);
        this.nostr = new SphereNostr(this.identity);
    }

    async init() {
        console.log(`[SphereSDK] Initialized for ${this.identity.nametag}`);
    }
}
