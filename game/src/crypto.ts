import * as secrets from 'secrets.js-grempe';

export class CryptoHelper {
    /**
     * Splits a private key into 'n' shards using Shamir's Secret Sharing.
     * We'll require all 'n' shards to reconstruct the key.
     */
    static splitKey(privateKey: string, n: number): string[] {
        const hexSecret = secrets.str2hex(privateKey);
        // Requires all n shards to combine (threshold = n)
        return secrets.share(hexSecret, n, n);
    }

    /**
     * Reconstructs the private key from all shards.
     */
    static reconstructKey(shards: string[]): string {
        if (shards.length === 0) return '';
        try {
            const combinedHex = secrets.combine(shards);
            return secrets.hex2str(combinedHex);
        } catch (e) {
            return '';
        }
    }

    /**
     * Creates a simple riddle for a shard.
     */
    static createRiddleForShard(shardIndex: number): string {
        const riddles = [
            "I speak without a mouth and hear without ears. What am I?",
            "The more of this there is, the less you see. What is it?",
            "I have cities, but no houses. I have mountains, but no trees. What am I?"
        ];
        return riddles[shardIndex % riddles.length];
    }
}
