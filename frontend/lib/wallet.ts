'use client';
// NABIL — Wallet lib
// Aman imports and calls these functions. Do NOT call window.solana directly in pages.

import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';
const CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'devnet';

export const connection = new Connection(RPC, 'confirmed');

// ── Types ─────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    solana?: {
      isPhantom: boolean;
      connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
      disconnect: () => Promise<void>;
      publicKey: PublicKey | null;
      signTransaction: (tx: Transaction) => Promise<Transaction>;
      signAndSendTransaction: (tx: Transaction) => Promise<{ signature: string }>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

// ── Connect / Disconnect ──────────────────────────────────────────────────────

export async function connectWallet(): Promise<string> {
  if (!window.solana?.isPhantom) {
    throw new Error('Phantom wallet not found. Install it from phantom.app');
  }
  const resp = await window.solana.connect();
  return resp.publicKey.toString();
}

export async function disconnectWallet(): Promise<void> {
  await window.solana?.disconnect();
}

export function isConnected(): boolean {
  return !!window.solana?.publicKey;
}

export function getWalletAddress(): string | null {
  return window.solana?.publicKey?.toString() ?? null;
}

// ── Balance ───────────────────────────────────────────────────────────────────

export async function getSOLBalance(pubkeyStr: string): Promise<number> {
  const pubkey = new PublicKey(pubkeyStr);
  const lamports = await connection.getBalance(pubkey);
  return lamports / LAMPORTS_PER_SOL;
}

// ── Sign & Send ───────────────────────────────────────────────────────────────

export async function signAndSendTransaction(tx: Transaction): Promise<string> {
  if (!window.solana) throw new Error('Wallet not connected');
  const { signature } = await window.solana.signAndSendTransaction(tx);
  await connection.confirmTransaction(signature, 'confirmed');
  return signature;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function explorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${CLUSTER}`;
}

export function shortenAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}
