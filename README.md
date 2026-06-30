# 🏪 Intent Marketplace — Autonomous Intent-to-Service Marketplace

> **Unicity Builder Program — Payments & Markets Track — Testnet v2**

An autonomous agent-to-agent service marketplace built on the Unicity Testnet v2 using the `sphere-sdk`. Two AI agents discover, negotiate, and settle service deals using Nostr-based DMs and on-chain Atomic Swap Escrow — **zero human intervention required**.

---

## 🏗 Architecture

```
┌─────────────┐    Market Post    ┌────────────────┐    Discovery    ┌─────────────┐
│  Requester   │ ───────────────► │ Bulletin Board │ ──────────────► │   Solver    │
│    Agent     │                  │ (sphere.market)│                  │    Agent    │
└──────┬───── ┘                  └────────────────┘                  └──────┬──────┘
       │                                                                     │
       │◄──────────────── Nostr DM (negotiate_proposal) ────────────────────┤
       │                                                                     │
       │──────────────── Nostr DM (swap_proposed + ID) ─────────────────────►│
       │                                                                     │
       │                    On-Chain Atomic Swap Escrow                       │
       │◄──────────────── Nostr DM (swap_completed + TX) ───────────────────┤
       │                                                                     │
    SETTLED ✅                                                          SETTLED ✅
```

## 🔑 Key Features

| Feature | Description |
|---------|-------------|
| **Intent Broadcasting** | Requester agent broadcasts structured service requests to the market bulletin board |
| **Solver Discovery** | Solver agent autonomously polls, discovers, and validates matching intents |
| **Nostr Negotiation** | Agents negotiate terms via encrypted Nostr direct messages |
| **Atomic Swap Escrow** | Trustless on-chain settlement — Requester locks UCT, Solver provides STORAGE |
| **Fully Autonomous** | Zero human clicks — agents communicate and settle entirely on their own |

## 🛠 Tech Stack

- **Runtime**: TypeScript + Node.js
- **SDK**: `@unicitylabs/sphere-sdk` (wallet, market, communications, swap)
- **Messaging**: Nostr protocol for agent-to-agent encrypted DMs
- **Settlement**: On-chain atomic swap escrow via `sphere.swap`
- **UI Dashboard**: React + Vite (simulation mode)

## 📁 Project Structure

```
src/
├── config.ts           # Unicity Testnet v2 configuration
├── types.ts            # Intent, DM, and Agent type definitions
├── agent-base.ts       # Base agent class (wallet, minting, lifecycle)
├── agent-requester.ts  # Requester agent (broadcast intent, propose swap)
├── agent-solver.ts     # Solver agent (discover intent, accept swap)
├── App.tsx             # React dashboard UI with simulation
├── main.tsx            # React entry point
└── index.css           # Design system and styles
```

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- npm or yarn

### Installation

```bash
git clone https://github.com/tuannguyenvan95/unicity-intent-marketplace.git
cd unicity-intent-marketplace
npm install
```

### Run the Dashboard (Simulation Mode)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **"Launch Autonomous Agents"** to watch the full intent→negotiate→settle flow.

### Run Agents in Node.js (Live Testnet)

**Terminal 1 — Start the Solver Agent:**
```bash
npm run agent:solver
```

**Terminal 2 — Start the Requester Agent:**
```bash
npm run agent:requester
```

The Requester will broadcast an intent, the Solver will discover it, negotiate via Nostr DMs, and settle via atomic swap — all autonomously.

### Fund Wallets via Faucet

Visit [https://faucet.testnet2.unicity.network](https://faucet.testnet2.unicity.network) and paste your agent wallet addresses to receive testnet UCT tokens.

## 📊 Agent Flow (Detailed)

1. **Requester** initializes wallet, registers nametag `@requester`
2. **Requester** mints 5 UCT tokens (testnet)
3. **Requester** broadcasts intent: _"Need 10GB storage for 5 UCT"_
4. **Solver** initializes wallet, registers nametag `@solver`
5. **Solver** mints 10 STORAGE tokens
6. **Solver** polls market, discovers matching intent
7. **Solver** → **Requester**: Nostr DM with `negotiate_proposal`
8. **Requester** validates terms, creates atomic swap escrow
9. **Requester** → **Solver**: Nostr DM with `swap_proposed` + proposal ID
10. **Solver** verifies escrow, accepts atomic swap
11. **Solver** → **Requester**: Nostr DM with `swap_completed` + TX hash
12. ✅ Both agents reach `settled` state

## 📜 License

MIT

---

**Built for the [Unicity Builder Program](https://unicity.network) — Payments & Markets Track**
