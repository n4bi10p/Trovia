import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';

// ── Connection ────────────────────────────────────────────────────────────────

export const connection = new Connection(
  process.env.SOLANA_RPC || 'https://api.devnet.solana.com',
  'confirmed'
);

// ── Scheduler keypair (for server-side SOL transfers in cron) ─────────────────
// Loaded from base64 encoded JSON in env
export function getSchedulerKeypair(): Keypair {
  const raw = process.env.SCHEDULER_KEYPAIR;
  if (!raw) throw new Error('SCHEDULER_KEYPAIR env var not set');
  const decoded = Buffer.from(raw, 'base64').toString('utf-8');
  const arr = JSON.parse(decoded) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(arr));
}

// ── SOL balance ───────────────────────────────────────────────────────────────

export async function getSOLBalance(walletAddress: string): Promise<number> {
  const pubkey = new PublicKey(walletAddress);
  const lamports = await connection.getBalance(pubkey);
  return lamports / LAMPORTS_PER_SOL;
}

// ── Transfer SOL (server-side, used by scheduling cron) ───────────────────────

export async function transferSOL(
  fromKeypair: Keypair,
  toAddress: string,
  lamports: number
): Promise<string> {
  const toPubkey = new PublicKey(toAddress);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey,
      lamports,
    })
  );

  const signature = await sendAndConfirmTransaction(connection, tx, [fromKeypair]);
  return signature;
}

// ── Solana Explorer link ───────────────────────────────────────────────────────

export function explorerUrl(signature: string): string {
  const cluster = process.env.SOLANA_CLUSTER || 'devnet';
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}

// ── SOL/USD price from CoinGecko ──────────────────────────────────────────────

let cachedPrice: { usd: number; fetchedAt: number } | null = null;

export async function getSOLPrice(): Promise<number> {
  // Cache for 60 seconds
  if (cachedPrice && Date.now() - cachedPrice.fetchedAt < 60_000) {
    return cachedPrice.usd;
  }
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
    );
    const data = await res.json() as { solana: { usd: number } };
    cachedPrice = { usd: data.solana.usd, fetchedAt: Date.now() };
    return data.solana.usd;
  } catch {
    // Fallback if CoinGecko is down
    return cachedPrice?.usd ?? 150;
  }
}

export function lamportsToSOL(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}
