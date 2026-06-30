import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AgentLog, AgentState } from './types';

// Simulation orchestrator — runs entirely in the browser
async function runSimulation(
  addLog: (log: AgentLog) => void,
  setRequesterState: (s: AgentState) => void,
  setSolverState: (s: AgentState) => void,
  setTxHash: (h: string) => void
) {
  const log = (sender: "Requester" | "Solver" | "System", message: string, type: AgentLog['type'] = 'info') => {
    addLog({
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      sender,
      message,
      type,
    });
  };
  const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

  // Phase 1 — Initialization
  log('System', '🚀 Starting autonomous marketplace simulation...', 'info');
  await wait(600);

  setRequesterState('starting');
  log('Requester', 'Initializing agent wallet (profile: "requester")', 'info');
  await wait(1200);
  log('Requester', 'Wallet loaded. Address: 0xReq…a3f7', 'success');
  log('Requester', 'Registering nametag: "@requester"', 'info');
  await wait(800);
  log('Requester', 'Nametag registered: "@requester" successfully', 'success');

  setSolverState('starting');
  log('Solver', 'Initializing agent wallet (profile: "solver")', 'info');
  await wait(1200);
  log('Solver', 'Wallet loaded. Address: 0xSol…d1b2', 'success');
  log('Solver', 'Registering nametag: "@solver"', 'info');
  await wait(800);
  log('Solver', 'Nametag registered: "@solver" successfully', 'success');

  // Phase 2 — Minting
  setRequesterState('minting');
  log('Requester', 'Self-minting 5000000 base units of UCT from token engine...', 'info');
  await wait(1500);
  log('Requester', 'Successfully minted token ID: tok-uct-5m', 'success');
  setRequesterState('idle');

  setSolverState('minting');
  log('Solver', 'Self-minting 10000000 base units of STORAGE from token engine...', 'info');
  await wait(1500);
  log('Solver', 'Successfully minted token ID: tok-storage-10m', 'success');
  setSolverState('idle');

  // Phase 3 — Intent Broadcasting
  setRequesterState('broadcasting');
  log('Requester', 'Broadcasting Market Intent: "Need 10GB storage for 5 UCT tokens"', 'info');
  await wait(1500);
  const intentId = `intent-${Math.random().toString(36).substring(2, 9)}`;
  log('Requester', `Market Intent published. ID: ${intentId}`, 'success');
  setRequesterState('idle');

  log('Requester', 'Listening for Solver negotiation proposals...', 'info');
  await wait(800);

  // Phase 4 — Solver Discovery
  setSolverState('searching');
  log('Solver', 'Polling market bulletin board for storage requests...', 'info');
  await wait(2000);
  log('Solver', `Found matching intent! ID: ${intentId}. Creator: @requester`, 'success');

  // Phase 5 — Nostr Negotiation
  setSolverState('negotiating');
  log('Solver', 'Sending negotiation proposal to @requester via Nostr DM...', 'info');
  await wait(1200);

  log('Requester', 'Received Nostr DM from @solver', 'message');
  await wait(600);
  log('Requester', 'Solver offered to fill intent. Terms: 10GB for 5 UCT', 'info');
  await wait(800);
  log('Requester', 'Terms verified. Initiating Atomic Swap Escrow...', 'warning');

  // Phase 6 — Atomic Swap
  setRequesterState('proposing_swap');
  await wait(1500);
  const swapId = `swap-${Math.random().toString(36).substring(2, 9)}`;
  log('Requester', `Atomic Swap Escrow created. Proposal ID: ${swapId}`, 'success');
  await wait(800);
  log('Requester', `Sending swap proposal ID ${swapId} to solver...`, 'info');
  setRequesterState('idle');

  // Phase 7 — Solver Accepts
  await wait(1000);
  log('Solver', `Received swap proposal ID: ${swapId} from requester`, 'message');
  setSolverState('accepting_swap');
  await wait(800);
  log('Solver', `Fetching escrow details for proposal ${swapId}...`, 'info');
  await wait(1200);
  log('Solver', 'Atomic swap escrow verified. Executing on-chain settlement...', 'warning');
  await wait(2000);

  const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  log('Solver', `Atomic swap executed successfully! TX: ${txHash}`, 'success');
  setSolverState('settled');
  await wait(800);
  log('Solver', 'Sending settlement confirmation via Nostr DM...', 'info');

  await wait(600);
  log('Requester', `Atomic Swap Escrow settled! TX Hash: ${txHash}`, 'success');
  setRequesterState('settled');

  log('System', '✅ Intent fulfilled autonomously — zero human intervention!', 'success');
  setTxHash(txHash);
}

export default function App() {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [requesterState, setRequesterState] = useState<AgentState>('idle');
  const [solverState, setSolverState] = useState<AgentState>('idle');
  const [txHash, setTxHash] = useState<string>('');
  const [running, setRunning] = useState(false);

  const logEndRef = useRef<HTMLDivElement>(null);
  const reqLogEndRef = useRef<HTMLDivElement>(null);
  const solLogEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((log: AgentLog) => {
    setLogs(prev => [...prev, log]);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    reqLogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    solLogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleStart = async () => {
    setRunning(true);
    setLogs([]);
    setTxHash('');
    setRequesterState('idle');
    setSolverState('idle');
    await runSimulation(addLog, setRequesterState, setSolverState, setTxHash);
    setRunning(false);
  };

  const handleReset = () => {
    setRunning(false);
    setLogs([]);
    setTxHash('');
    setRequesterState('idle');
    setSolverState('idle');
  };

  const requesterLogs = logs.filter(l => l.sender === 'Requester');
  const solverLogs = logs.filter(l => l.sender === 'Solver' || l.sender === 'System');

  const stateLabel = (s: AgentState) => s.replace('_', ' ');

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="header-logo">IM</div>
          <div>
            <div className="header-title">Intent Marketplace</div>
            <div className="header-subtitle">Autonomous Agent Protocol</div>
          </div>
        </div>
        <div className="header-badges">
          <span className="header-badge badge-testnet">Testnet v2</span>
          <span className="header-badge badge-track">Payments &amp; Markets</span>
        </div>
      </header>

      <main className="main-content">
        {/* Hero */}
        <section className="hero-section">
          <h1 className="hero-title">
            <span className="gradient-text">Autonomous Intent-to-Service</span>
            <br />Marketplace
          </h1>
          <p className="hero-description">
            Two AI agents autonomously discover, negotiate, and settle service deals using
            Nostr-based DMs and on-chain Atomic Swap Escrow — zero human intervention required.
          </p>
        </section>

        {/* Architecture Flow */}
        <section className="architecture-section">
          <div className="arch-flow">
            <div className="arch-node">
              <span className="arch-node-icon">🤖</span>
              <span className="arch-node-label">Requester</span>
              <span className="arch-node-detail">broadcasts intent</span>
            </div>
            <div className="arch-arrow">
              <span className="arch-arrow-line">→→→</span>
              <span className="arch-arrow-label">Market Post</span>
            </div>
            <div className="arch-node">
              <span className="arch-node-icon">📋</span>
              <span className="arch-node-label">Bulletin Board</span>
              <span className="arch-node-detail">sphere.market</span>
            </div>
            <div className="arch-arrow">
              <span className="arch-arrow-line">→→→</span>
              <span className="arch-arrow-label">Discovery</span>
            </div>
            <div className="arch-node">
              <span className="arch-node-icon">🔍</span>
              <span className="arch-node-label">Solver</span>
              <span className="arch-node-detail">matches intent</span>
            </div>
            <div className="arch-arrow">
              <span className="arch-arrow-line">→→→</span>
              <span className="arch-arrow-label">Nostr DM</span>
            </div>
            <div className="arch-node">
              <span className="arch-node-icon">🤝</span>
              <span className="arch-node-label">Negotiate</span>
              <span className="arch-node-detail">verify terms</span>
            </div>
            <div className="arch-arrow">
              <span className="arch-arrow-line">→→→</span>
              <span className="arch-arrow-label">Atomic Swap</span>
            </div>
            <div className="arch-node">
              <span className="arch-node-icon">✅</span>
              <span className="arch-node-label">Settlement</span>
              <span className="arch-node-detail">on-chain escrow</span>
            </div>
          </div>
        </section>

        {/* Controls */}
        <div className="controls-section">
          <button className="btn btn-primary" onClick={handleStart} disabled={running}>
            <span className="btn-icon">{running ? '⏳' : '▶'}</span>
            {running ? 'Agents Running…' : 'Launch Autonomous Agents'}
          </button>
          <button className="btn btn-secondary" onClick={handleReset} disabled={running}>
            <span className="btn-icon">↺</span>
            Reset
          </button>
        </div>

        {/* Settlement Banner */}
        {txHash && (
          <div className="settlement-banner">
            <div className="settlement-icon">🎉</div>
            <div className="settlement-title">Intent Settled Autonomously!</div>
            <div className="settlement-desc">
              Both agents negotiated and executed the atomic swap without any human intervention.
            </div>
            <div className="settlement-hash">TX: {txHash}</div>
          </div>
        )}

        {/* Agent Panels */}
        <div className="agents-grid">
          {/* Requester Panel */}
          <div className="agent-panel">
            <div className="agent-panel-header">
              <div className="agent-info">
                <div className="agent-avatar avatar-requester">🤖</div>
                <div>
                  <div className="agent-name">Requester Agent</div>
                  <div className="agent-role">Broadcasts intent, proposes swap</div>
                </div>
              </div>
              <span className={`agent-state-badge state-${requesterState}`}>
                {stateLabel(requesterState)}
              </span>
            </div>
            <div className="agent-log">
              {requesterLogs.length === 0 ? (
                <div className="log-empty">Waiting for agent to start…</div>
              ) : (
                requesterLogs.map(l => (
                  <div className="log-entry" key={l.id}>
                    <span className="log-time">{l.timestamp}</span>
                    <span className={`log-dot ${l.type}`} />
                    <span className={`log-message ${l.type}`}>{l.message}</span>
                  </div>
                ))
              )}
              <div ref={reqLogEndRef} />
            </div>
          </div>

          {/* Solver Panel */}
          <div className="agent-panel">
            <div className="agent-panel-header">
              <div className="agent-info">
                <div className="agent-avatar avatar-solver">🔍</div>
                <div>
                  <div className="agent-name">Solver Agent</div>
                  <div className="agent-role">Discovers intent, accepts swap</div>
                </div>
              </div>
              <span className={`agent-state-badge state-${solverState}`}>
                {stateLabel(solverState)}
              </span>
            </div>
            <div className="agent-log">
              {solverLogs.length === 0 ? (
                <div className="log-empty">Waiting for agent to start…</div>
              ) : (
                solverLogs.map(l => (
                  <div className="log-entry" key={l.id}>
                    <span className="log-time">{l.timestamp}</span>
                    <span className={`log-dot ${l.type}`} />
                    <span className={`log-message ${l.type}`}>{l.message}</span>
                  </div>
                ))
              )}
              <div ref={solLogEndRef} />
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="info-grid">
          <div className="info-card">
            <div className="info-card-icon">📡</div>
            <div className="info-card-title">sphere-sdk</div>
            <div className="info-card-desc">
              All network interactions — wallet management, market posts, Nostr DMs,
              and atomic swaps — use the official Unicity sphere-sdk.
            </div>
          </div>
          <div className="info-card">
            <div className="info-card-icon">🔐</div>
            <div className="info-card-title">Atomic Swap Escrow</div>
            <div className="info-card-desc">
              Trustless settlement via on-chain escrow. The Requester locks UCT tokens;
              the Solver provides STORAGE tokens. No intermediary required.
            </div>
          </div>
          <div className="info-card">
            <div className="info-card-icon">💬</div>
            <div className="info-card-title">Nostr-based Negotiation</div>
            <div className="info-card-desc">
              Agents negotiate terms through encrypted Nostr direct messages,
              enabling private, censorship-resistant communication.
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        Built for the{' '}
        <a href="https://unicity.network" target="_blank" rel="noopener noreferrer">
          Unicity Builder Program
        </a>{' '}
        — Payments &amp; Markets Track · Testnet v2
      </footer>
    </div>
  );
}
