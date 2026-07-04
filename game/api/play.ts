import { runSimulation } from '../src/index';

export default async function handler(req: any, res: any) {
    try {
        const logs = await runSimulation();
        res.status(200).json({
            success: true,
            message: "The Cryptographic Scavenger Hunt Simulation Completed!",
            logs: logs
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
