'use client';
// NABIL — Contracts lib
// Wraps all Anchor program calls. Aman imports and calls these. Never touch internals.
// Fill in after anchor deploy — update Program IDs in .env.local

import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { connection, signAndSendTransaction } from './wallet';

// ── Program IDs (from env after anchor deploy) ────────────────────────────────

const REGISTRY_PROGRAM_ID  = process.env.NEXT_PUBLIC_AGENT_REGISTRY_PROGRAM_ID  || '11111111111111111111111111111111';
const ESCROW_PROGRAM_ID    = process.env.NEXT_PUBLIC_AGENT_ESCROW_PROGRAM_ID    || '11111111111111111111111111111111';
const EXECUTOR_PROGRAM_ID  = process.env.NEXT_PUBLIC_AGENT_EXECUTOR_PROGRAM_ID  || '11111111111111111111111111111111';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Agent {
  id: number;
  name: string;
  description: string;
  agentType: 'trading' | 'farming' | 'scheduling' | 'rebalancing' | 'content' | 'business';
  priceLamports: number;
  developer: string;
  isActive: boolean;
  configSchema: string; // JSON string
  createdAt: number;
}

export interface PublishAgentArgs {
  name: string;
  description: string;
  agentType: string;
  priceLamports: number;
  configSchema: string;
}

export interface Activation {
  agentId: number;
  buyer: string;
  config: string;
  activatedAt: number;
  isActive: boolean;
}

// ── getAllAgents ───────────────────────────────────────────────────────────────
// TODO (NABIL): Use Anchor + IDL to fetch all Agent PDAs from the registry program
// For now returns mock data so Aman can build the UI without blocking

export async function getAllAgents(): Promise<Agent[]> {
  // TODO (NABIL): Replace with real Anchor program account fetch after deploy
  // Example:
  // const program = getRegistryProgram();
  // const agents = await program.account.agent.all();
  // return agents.map(a => a.account);

  // MOCK DATA — remove after Anchor deploy
  return [
    { id: 0, name: 'Trading Agent', agentType: 'trading', description: 'Gets alerted and acts when your token hits your price target.', priceLamports: 2_000_000, developer: '11111111111111111111111111111111', isActive: true, configSchema: JSON.stringify({ tokenPair: 'string', thresholdPrice: 'number', action: 'string' }), createdAt: Date.now() },
    { id: 1, name: 'Farming Agent', agentType: 'farming', description: 'Monitors your LP yield and tells you exactly when to compound.', priceLamports: 1_500_000, developer: '11111111111111111111111111111111', isActive: true, configSchema: JSON.stringify({ poolAddress: 'string', compoundThreshold: 'number' }), createdAt: Date.now() },
    { id: 2, name: 'Scheduling Agent', agentType: 'scheduling', description: 'Sends recurring SOL payments automatically — set it and forget it.', priceLamports: 1_000_000, developer: '11111111111111111111111111111111', isActive: true, configSchema: JSON.stringify({ recipientAddress: 'string', amountSOL: 'number', frequency: 'string', startDate: 'string' }), createdAt: Date.now() },
    { id: 3, name: 'Rebalancing Agent', agentType: 'rebalancing', description: 'Watches your portfolio drift and tells you how to rebalance.', priceLamports: 2_500_000, developer: '11111111111111111111111111111111', isActive: true, configSchema: JSON.stringify({ targetAllocation: 'object', driftTolerance: 'number' }), createdAt: Date.now() },
    { id: 4, name: 'Content Reply Agent', agentType: 'content', description: 'Generates 3 ready-to-send replies for any message in your tone.', priceLamports: 500_000, developer: '11111111111111111111111111111111', isActive: true, configSchema: JSON.stringify({ tone: 'string' }), createdAt: Date.now() },
    { id: 5, name: 'Business Assistant', agentType: 'business', description: 'Answers any business question, drafts emails, and writes proposals.', priceLamports: 500_000, developer: '11111111111111111111111111111111', isActive: true, configSchema: JSON.stringify({ businessContext: 'string' }), createdAt: Date.now() },
  ];
}

// ── publishAgent ──────────────────────────────────────────────────────────────
// TODO (NABIL): Build and send Anchor publishAgent instruction

export async function publishAgent(args: PublishAgentArgs): Promise<string> {
  // TODO (NABIL): Implement with Anchor after deploy
  throw new Error('publishAgent: not implemented yet — waiting for Anchor deploy');
}

// ── activateAgent ─────────────────────────────────────────────────────────────
// TODO (NABIL): Build and send Anchor activateAgent instruction

export async function activateAgent(agentId: number, userConfig: string): Promise<string> {
  // TODO (NABIL): Implement with Anchor after deploy
  throw new Error('activateAgent: not implemented yet — waiting for Anchor deploy');
}

// ── getUserActivations ────────────────────────────────────────────────────────
// TODO (NABIL): Fetch all Activation PDAs for the given wallet

export async function getUserActivations(walletAddress: string): Promise<Activation[]> {
  // TODO (NABIL): Implement with Anchor after deploy
  return [];
}
