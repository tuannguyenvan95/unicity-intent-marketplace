import { GameMasterAgent } from './gm';
import { PlayerAgent } from './player';

export async function runSimulation(): Promise<string[]> {
    const logs: string[] = [];
    const originalConsoleLog = console.log;

    // Capture logs to return them
    console.log = (...args: any[]) => {
        logs.push(args.join(' '));
        originalConsoleLog(...args); // still print to stdout
    };

    logs.push("Starting The Cryptographic Scavenger Hunt Integration Test...\n");

    const gm = new GameMasterAgent();
    await gm.start();

    return new Promise((resolve) => {
        setTimeout(async () => {
            const player = new PlayerAgent("Player1");
            
            player.onFinish = (success: boolean) => {
                // Restore console.log
                console.log = originalConsoleLog;
                resolve(logs);
            };

            await player.start();
        }, 1000);
    });
}

// If run directly from CLI
if (require.main === module) {
    runSimulation().then(() => process.exit(0)).catch(console.error);
}
