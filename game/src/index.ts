import { GameMasterAgent } from './gm';
import { PlayerAgent } from './player';

async function main() {
    console.log("Starting The Cryptographic Scavenger Hunt Integration Test...\n");

    const gm = new GameMasterAgent();
    await gm.start();

    // Small delay to ensure GM is fully listening
    setTimeout(async () => {
        const player = new PlayerAgent("Player1");
        await player.start();
    }, 1000);
}

main().catch(console.error);
