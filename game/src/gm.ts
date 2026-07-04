import { SphereSDK } from './sphere-sdk-mock';
import { CryptoHelper } from './crypto';
import { CONFIG } from './config';

export class GameMasterAgent {
    private sdk: SphereSDK;
    private shards: string[] = [];
    private playerSessions: Map<string, { currentShard: number }> = new Map();

    constructor() {
        this.sdk = new SphereSDK(CONFIG.GM_NAMETAG);
    }

    async start() {
        await this.sdk.init();
        console.log(`[GM] Started Game Master Agent as ${this.sdk.identity.nametag}`);

        // 1. Shard the private key
        this.shards = CryptoHelper.splitKey(CONFIG.PRIZE_POOL_WALLET_KEY, CONFIG.TOTAL_SHARDS);
        console.log(`[GM] Generated ${this.shards.length} cryptographic shards for the prize pool.`);

        // 2. Listen on Nostr for incoming player interactions
        this.sdk.nostr.onMessage(async (msg) => {
            await this.handleMessage(msg.from, msg.content);
        });

        console.log(`[GM] Listening for player interactions...`);
    }

    private async handleMessage(playerNametag: string, content: any) {
        console.log(`[GM] Received message from ${playerNametag}:`, content);

        if (!this.playerSessions.has(playerNametag)) {
            this.playerSessions.set(playerNametag, { currentShard: 0 });
        }

        const session = this.playerSessions.get(playerNametag)!;

        if (content.type === 'REQUEST_CLUE') {
            if (session.currentShard >= this.shards.length) {
                await this.sdk.nostr.sendDM(playerNametag, {
                    type: 'NO_MORE_CLUES',
                    message: "You have all the shards! Decrypt them to claim the prize."
                });
                return;
            }

            // Generate payment request
            const reqId = await this.sdk.wallet.createPaymentRequest(CONFIG.CLUE_PRICE, `Clue for shard ${session.currentShard + 1}`);
            
            // Send payment request back
            await this.sdk.nostr.sendDM(playerNametag, {
                type: 'PAYMENT_REQUEST',
                reqId,
                amount: CONFIG.CLUE_PRICE,
                shardIndex: session.currentShard
            });
        } else if (content.type === 'PAYMENT_FULFILLED') {
            const reqId = content.reqId;
            const amount = content.amount;
            const shardIndex = content.shardIndex;

            // Verify payment
            const isApproved = await this.sdk.wallet.approvePaymentRequest(reqId, amount);
            
            if (isApproved) {
                const shard = this.shards[shardIndex];
                const riddle = CryptoHelper.createRiddleForShard(shardIndex);

                console.log(`[GM] Payment verified for ${playerNametag}. Sending shard ${shardIndex}...`);
                
                await this.sdk.nostr.sendDM(playerNametag, {
                    type: 'SHARD_DELIVERY',
                    shardIndex,
                    riddle,
                    shard
                });

                // Advance player state
                session.currentShard++;
            } else {
                await this.sdk.nostr.sendDM(playerNametag, {
                    type: 'PAYMENT_FAILED',
                    message: "Payment verification failed."
                });
            }
        }
    }
}
