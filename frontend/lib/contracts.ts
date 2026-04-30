'use client';
// NABIL — Contracts lib
// Browser-safe Solana client for Trovia Anchor programs. Aman imports this file.

import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { Buffer } from 'buffer';
import { connection, signAndSendTransaction } from './wallet';

// ── Program IDs (from env after anchor deploy) ────────────────────────────────

const REGISTRY_PROGRAM_ID = process.env.NEXT_PUBLIC_AGENT_REGISTRY_PROGRAM_ID || '11111111111111111111111111111111';
const ESCROW_PROGRAM_ID = process.env.NEXT_PUBLIC_AGENT_ESCROW_PROGRAM_ID || '11111111111111111111111111111111';
const EXECUTOR_PROGRAM_ID = process.env.NEXT_PUBLIC_AGENT_EXECUTOR_PROGRAM_ID || '11111111111111111111111111111111';
const PLACEHOLDER_PROGRAM_ID = '11111111111111111111111111111111';

// Anchor discriminators: first 8 bytes of sha256("namespace:name").
const REGISTRY_ACCOUNT_DISCRIMINATOR = Uint8Array.from([47, 174, 110, 246, 184, 182, 252, 218]);
const AGENT_ACCOUNT_DISCRIMINATOR = Uint8Array.from([47, 166, 112, 147, 155, 197, 86, 7]);
const ACTIVATION_ACCOUNT_DISCRIMINATOR = Uint8Array.from([126, 103, 164, 158, 220, 35, 33, 132]);
const INITIALIZE_REGISTRY_DISCRIMINATOR = Uint8Array.from([189, 181, 20, 17, 174, 57, 249, 59]);
const PUBLISH_AGENT_DISCRIMINATOR = Uint8Array.from([84, 236, 75, 145, 32, 51, 66, 240]);
const ACTIVATE_AGENT_DISCRIMINATOR = Uint8Array.from([252, 139, 87, 21, 195, 152, 29, 217]);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Agent {
  id: number;
  name: string;
  description: string;
  agentType: 'trading' | 'farming' | 'scheduling' | 'rebalancing' | 'content' | 'business';
  priceLamports: number;
  developer: string;
  isActive: boolean;
  configSchema: string;
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

// ── Public API ────────────────────────────────────────────────────────────────

export async function getAllAgents(): Promise<Agent[]> {
  if (!hasConfiguredPrograms()) {
    console.warn('[Trovia] Program IDs not configured; returning mock marketplace agents.');
    return getMockAgents();
  }

  try {
    const registryProgram = new PublicKey(REGISTRY_PROGRAM_ID);
    const accounts = await connection.getProgramAccounts(registryProgram);
    return accounts
      .map(({ account }) => decodeAgentAccount(account.data))
      .filter((agent): agent is Agent => !!agent?.isActive);
  } catch (err) {
    console.warn('[Trovia] Failed to fetch on-chain agents; returning mock fallback.', err);
    return getMockAgents();
  }
}

export async function publishAgent(args: PublishAgentArgs): Promise<string> {
  requireConfiguredPrograms('publish agents');
  validatePublishArgs(args);

  const developer = getConnectedWallet();
  const registryProgram = new PublicKey(REGISTRY_PROGRAM_ID);
  const [registry] = getRegistryPda();
  const registryInfo = await connection.getAccountInfo(registry);
  const tx = new Transaction();

  let nextAgentId = 0;
  if (!registryInfo) {
    tx.add(
      new TransactionInstruction({
        programId: registryProgram,
        keys: [
          { pubkey: registry, isSigner: false, isWritable: true },
          { pubkey: developer, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: Buffer.from(INITIALIZE_REGISTRY_DISCRIMINATOR),
      })
    );
  } else {
    nextAgentId = decodeRegistryAgentCount(registryInfo.data);
  }

  const [agent] = getAgentPda(nextAgentId);
  tx.add(
    new TransactionInstruction({
      programId: registryProgram,
      keys: [
        { pubkey: agent, isSigner: false, isWritable: true },
        { pubkey: registry, isSigner: false, isWritable: true },
        { pubkey: developer, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: Buffer.from(encodePublishAgent(args)),
    })
  );

  return signAndSendTransaction(tx);
}

export async function activateAgent(agentId: number, userConfig: string): Promise<string> {
  requireConfiguredPrograms('activate agents');
  if (userConfig.length > 512) throw new Error('Activation config must be 512 characters or fewer');

  const buyer = getConnectedWallet();
  const agents = await getAllAgents();
  const agentData = agents.find((agent) => agent.id === agentId);
  if (!agentData || agentData.developer === PLACEHOLDER_PROGRAM_ID) {
    throw new Error('Cannot activate this agent until real on-chain agent data is available');
  }

  const [activation] = getActivationPda(buyer, agentId);
  const [agent] = getAgentPda(agentId);
  const tx = new Transaction().add(
    new TransactionInstruction({
      programId: new PublicKey(ESCROW_PROGRAM_ID),
      keys: [
        { pubkey: activation, isSigner: false, isWritable: true },
        { pubkey: agent, isSigner: false, isWritable: false },
        { pubkey: buyer, isSigner: true, isWritable: true },
        { pubkey: new PublicKey(agentData.developer), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(REGISTRY_PROGRAM_ID), isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: Buffer.from(concatBytes([ACTIVATE_AGENT_DISCRIMINATOR, u64Bytes(agentId), stringBytes(userConfig)])),
    })
  );

  return signAndSendTransaction(tx);
}

export async function getUserActivations(walletAddress: string): Promise<Activation[]> {
  if (!hasConfiguredPrograms()) return [];

  const wallet = new PublicKey(walletAddress);
  const accounts = await connection.getProgramAccounts(new PublicKey(ESCROW_PROGRAM_ID));
  return accounts
    .map(({ account }) => decodeActivationAccount(account.data))
    .filter((activation): activation is Activation => {
      return !!activation && activation.buyer === wallet.toString() && activation.isActive;
    });
}

// ── Encoding / decoding ───────────────────────────────────────────────────────

function encodePublishAgent(args: PublishAgentArgs): Uint8Array {
  return concatBytes([
    PUBLISH_AGENT_DISCRIMINATOR,
    stringBytes(args.name),
    stringBytes(args.description),
    stringBytes(args.agentType),
    u64Bytes(args.priceLamports),
    stringBytes(args.configSchema),
  ]);
}

function decodeRegistryAgentCount(data: Uint8Array): number {
  const decoder = new Decoder(data);
  if (!decoder.takeDiscriminator(REGISTRY_ACCOUNT_DISCRIMINATOR)) return 0;
  return decoder.u64();
}

function decodeAgentAccount(data: Uint8Array): Agent | null {
  const decoder = new Decoder(data);
  if (!decoder.takeDiscriminator(AGENT_ACCOUNT_DISCRIMINATOR)) return null;

  return {
    id: decoder.u64(),
    name: decoder.string(),
    description: decoder.string(),
    agentType: decoder.string() as Agent['agentType'],
    priceLamports: decoder.u64(),
    developer: decoder.publicKey().toString(),
    isActive: decoder.bool(),
    configSchema: decoder.string(),
    createdAt: decoder.i64(),
  };
}

function decodeActivationAccount(data: Uint8Array): Activation | null {
  const decoder = new Decoder(data);
  if (!decoder.takeDiscriminator(ACTIVATION_ACCOUNT_DISCRIMINATOR)) return null;

  return {
    agentId: decoder.u64(),
    buyer: decoder.publicKey().toString(),
    config: decoder.string(),
    activatedAt: decoder.i64(),
    isActive: decoder.bool(),
  };
}

class Decoder {
  private offset = 0;

  constructor(private readonly data: Uint8Array) {}

  takeDiscriminator(expected: Uint8Array): boolean {
    if (this.data.length < expected.length) return false;
    for (let i = 0; i < expected.length; i += 1) {
      if (this.data[i] !== expected[i]) return false;
    }
    this.offset = expected.length;
    return true;
  }

  u64(): number {
    const value = this.view(8).getBigUint64(0, true);
    this.offset += 8;
    return Number(value);
  }

  i64(): number {
    const value = this.view(8).getBigInt64(0, true);
    this.offset += 8;
    return Number(value);
  }

  string(): string {
    const length = this.view(4).getUint32(0, true);
    this.offset += 4;
    const bytes = this.data.slice(this.offset, this.offset + length);
    this.offset += length;
    return new TextDecoder().decode(bytes);
  }

  publicKey(): PublicKey {
    const key = new PublicKey(this.data.slice(this.offset, this.offset + 32));
    this.offset += 32;
    return key;
  }

  bool(): boolean {
    const value = this.data[this.offset] === 1;
    this.offset += 1;
    return value;
  }

  private view(length: number): DataView {
    return new DataView(this.data.buffer, this.data.byteOffset + this.offset, length);
  }
}

// ── PDA / wallet helpers ──────────────────────────────────────────────────────

function getRegistryPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [new TextEncoder().encode('registry')],
    new PublicKey(REGISTRY_PROGRAM_ID)
  );
}

function getAgentPda(agentId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [new TextEncoder().encode('agent'), u64Bytes(agentId)],
    new PublicKey(REGISTRY_PROGRAM_ID)
  );
}

function getActivationPda(buyer: PublicKey, agentId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [new TextEncoder().encode('activation'), buyer.toBytes(), u64Bytes(agentId)],
    new PublicKey(ESCROW_PROGRAM_ID)
  );
}

function getConnectedWallet(): PublicKey {
  if (!window.solana?.publicKey) throw new Error('Wallet not connected');
  return window.solana.publicKey;
}

// ── Validation and byte helpers ───────────────────────────────────────────────

function hasConfiguredPrograms(): boolean {
  return [REGISTRY_PROGRAM_ID, ESCROW_PROGRAM_ID, EXECUTOR_PROGRAM_ID].every(isConfiguredProgramId);
}

function requireConfiguredPrograms(action: string) {
  if (!hasConfiguredPrograms()) {
    throw new Error(`Cannot ${action}: Anchor program IDs are not configured yet`);
  }
}

function isConfiguredProgramId(value: string): boolean {
  if (!value || value === PLACEHOLDER_PROGRAM_ID) return false;
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

function validatePublishArgs(args: PublishAgentArgs) {
  if (!args.name || args.name.length > 64) throw new Error('Agent name must be 1-64 characters');
  if (!args.description || args.description.length > 256) {
    throw new Error('Agent description must be 1-256 characters');
  }
  if (!['trading', 'farming', 'scheduling', 'rebalancing', 'content', 'business'].includes(args.agentType)) {
    throw new Error('Invalid agent type');
  }
  if (!Number.isFinite(args.priceLamports) || args.priceLamports <= 0) {
    throw new Error('Price must be greater than 0 lamports');
  }
  if (!args.configSchema || args.configSchema.length > 512) {
    throw new Error('Config schema must be 1-512 characters');
  }
}

function u64Bytes(value: number): Uint8Array {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigUint64(0, BigInt(value), true);
  return bytes;
}

function stringBytes(value: string): Uint8Array {
  const encoded = new TextEncoder().encode(value);
  const length = new Uint8Array(4);
  new DataView(length.buffer).setUint32(0, encoded.length, true);
  return concatBytes([length, encoded]);
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function getMockAgents(): Agent[] {
  return [
    { id: 0, name: 'Trading Agent', agentType: 'trading', description: 'Gets alerted and acts when your token hits your price target.', priceLamports: 2_000_000, developer: PLACEHOLDER_PROGRAM_ID, isActive: true, configSchema: JSON.stringify({ tokenPair: 'string', thresholdPrice: 'number', action: 'string' }), createdAt: Date.now() },
    { id: 1, name: 'Farming Agent', agentType: 'farming', description: 'Monitors your LP yield and tells you exactly when to compound.', priceLamports: 1_500_000, developer: PLACEHOLDER_PROGRAM_ID, isActive: true, configSchema: JSON.stringify({ poolAddress: 'string', compoundThreshold: 'number' }), createdAt: Date.now() },
    { id: 2, name: 'Scheduling Agent', agentType: 'scheduling', description: 'Sends recurring SOL payments automatically - set it and forget it.', priceLamports: 1_000_000, developer: PLACEHOLDER_PROGRAM_ID, isActive: true, configSchema: JSON.stringify({ recipientAddress: 'string', amountSOL: 'number', frequency: 'string', startDate: 'string' }), createdAt: Date.now() },
    { id: 3, name: 'Rebalancing Agent', agentType: 'rebalancing', description: 'Watches your portfolio drift and tells you how to rebalance.', priceLamports: 2_500_000, developer: PLACEHOLDER_PROGRAM_ID, isActive: true, configSchema: JSON.stringify({ targetAllocation: 'object', driftTolerance: 'number' }), createdAt: Date.now() },
    { id: 4, name: 'Content Reply Agent', agentType: 'content', description: 'Generates 3 ready-to-send replies for any message in your tone.', priceLamports: 500_000, developer: PLACEHOLDER_PROGRAM_ID, isActive: true, configSchema: JSON.stringify({ tone: 'string' }), createdAt: Date.now() },
    { id: 5, name: 'Business Assistant', agentType: 'business', description: 'Answers any business question, drafts emails, and writes proposals.', priceLamports: 500_000, developer: PLACEHOLDER_PROGRAM_ID, isActive: true, configSchema: JSON.stringify({ businessContext: 'string' }), createdAt: Date.now() },
  ];
}
