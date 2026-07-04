import { SphereSDK } from './sphere-sdk-mock';
import { CryptoHelper } from './crypto';
import { CONFIG } from './config';

export class PlayerAgent {
    private sdk: SphereSDK;
    private shardsCollected: string[] = [];
    public onFinish?: (success: boolean) => void;

    constructor(nametag: string) {
        this.sdk = new SphereSDK(nametag);
    }

    async start() {
        await this.sdk.init();
        console.log(`[Player] Started Player Agent as ${this.sdk.identity.nametag}`);

        this.sdk.nostr.onMessage(async (msg) => {
            await this.handleMessage(msg.from, msg.content);
        });

        // 1. Discover GM and request first clue
        this.requestNextClue();
    }

    private requestNextClue() {
        if (this.shardsCollected.length < CONFIG.TOTAL_SHARDS) {
            console.log(`[Player] Requesting clue from GM...`);
            this.sdk.nostr.sendDM(CONFIG.GM_NAMETAG, { type: 'REQUEST_CLUE' });
        } else {
            this.attemptSettlement();
        }
    }

    private async handleMessage(fromNametag: string, content: any) {
        if (fromNametag !== CONFIG.GM_NAMETAG) return;

        console.log(`[Player] Received message from GM:`, content);

        if (content.type === 'PAYMENT_REQUEST') {
            console.log(`[Player] Approving payment of ${content.amount} for request ${content.reqId}...`);
            // In a real scenario, this would interact with wallet primitives to send funds
            
            // Send fulfillment notification
            this.sdk.nostr.sendDM(CONFIG.GM_NAMETAG, {
                type: 'PAYMENT_FULFILLED',
                reqId: content.reqId,
                amount: content.amount,
                shardIndex: content.shardIndex
            });
        } else if (content.type === 'SHARD_DELIVERY') {
            console.log(`[Player] Received shard ${content.shardIndex}. Riddle: ${content.riddle}`);
            
            // Player Agent attempts to solve the riddle
            let isSolved = false;
            const riddleLower = content.riddle.toLowerCase();
            
            if (riddleLower.includes("mouth") && riddleLower.includes("ears")) {
                console.log(`[Player] Solving riddle... Answer: Echo`);
                isSolved = true;
            } else if (riddleLower.includes("more") && riddleLower.includes("less")) {
                console.log(`[Player] Solving riddle... Answer: Darkness`);
                isSolved = true;
            } else if (riddleLower.includes("cities") && riddleLower.includes("houses")) {
                console.log(`[Player] Solving riddle... Answer: Map`);
                isSolved = true;
            }

            if (isSolved) {
                this.shardsCollected.push(content.shard);
                console.log(`[Player] Successfully decrypted and stored shard ${content.shardIndex}. Total shards: ${this.shardsCollected.length}`);
            } else {
                console.log(`[Player] Failed to solve riddle. Shard lost.`);
            }

            // Request next clue
            this.requestNextClue();
        } else if (content.type === 'NO_MORE_CLUES') {
            this.attemptSettlement();
        }
    }

    private attemptSettlement() {
        console.log(`[Player] All shards collected. Reconstructing private key...`);
        const reconstructedKey = CryptoHelper.reconstructKey(this.shardsCollected);
        
        if (reconstructedKey) {
            console.log(`[Player] Key reconstructed successfully: ${reconstructedKey}`);
            console.log(`[Player] Executing settlement transaction. Sweeping funds to ${this.sdk.wallet.address}...`);
            console.log(`[Player] VICTORY!`);
            if (this.onFinish) this.onFinish(true);
        } else {
            console.log(`[Player] Failed to reconstruct key.`);
            if (this.onFinish) this.onFinish(false);
        }
    }
}
