export interface IntentPayload {
  id?: string;
  type: "storage_request";
  storageGb: number;
  priceUct: string; // UCT token amount (decimal string)
  requester: string; // nametag or direct address
  createdAt?: number;
}

export type DMType = 
  | "negotiate_proposal" // Sent by Solver -> Requester to propose terms
  | "swap_proposed"      // Sent by Requester -> Solver with the swap ID
  | "swap_completed";    // Sent by Solver -> Requester to notify completion

export interface DMContent {
  type: DMType;
  intentId?: string;
  swapId?: string;
  storageGb?: number;
  priceUct?: string;
  txHash?: string;
  message?: string;
}

export interface AgentLog {
  id: string;
  timestamp: string;
  sender: "Requester" | "Solver" | "System";
  message: string;
  type: "info" | "success" | "warning" | "error" | "message";
}

export type AgentState =
  | "idle"
  | "starting"
  | "minting"
  | "broadcasting"
  | "searching"
  | "negotiating"
  | "proposing_swap"
  | "accepting_swap"
  | "settled"
  | "error";
