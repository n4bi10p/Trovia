import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ── Hardened Supabase Client (10/10) ──────────────────────────────────────────
// Logic: Uses a Proxy for lazy initialization, but falls back to a chainable
// No-Op object if credentials are missing. This prevents crashes in Dev/CI.

let _cachedClient: SupabaseClient | null = null;
let _warned = false;

export function getSupabaseClient(): SupabaseClient | null {
  if (_cachedClient) return _cachedClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || url.includes('xxxx') || !key || key.includes('your_')) {
    if (!_warned) {
      console.warn('[Supabase] No credentials — DB calls are no-ops (dev mode)');
      _warned = true;
    }
    return null;
  }

  _cachedClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _cachedClient;
}

// Global proxy client that either routes to real Supabase or our No-Op chain
export const supabase = {
  from: (table: string) => {
    const client = getSupabaseClient();
    if (!client) {
      const noopResult = Promise.resolve({ data: null, error: null });
      const chain: any = {
        select: () => chain, insert: () => chain, update: () => chain,
        upsert: () => chain, delete: () => chain, eq: () => chain,
        neq: () => chain, lte: () => chain, gte: () => chain,
        gt: () => chain, lt: () => chain, in: () => chain,
        not: () => chain, onConflict: () => chain, returns: () => chain,
        limit: () => chain, order: () => chain, single: () => noopResult,
        then: (resolve: any) => noopResult.then(resolve),
      };
      return chain;
    }
    return client.from(table);
  },
} as any;


// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScheduledJob {
  id: string;
  agent_id: string;
  buyer_wallet: string;
  recipient_address: string;
  amount_lamports: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  next_run_at: string;
  last_tx_hash?: string;
  created_at: string;
}

export interface ExecutionLog {
  id?: string;
  agent_id: string;
  buyer_wallet: string;
  action: string;
  result: object;
  tx_hash?: string;
  executed_at?: string;
}

// ── Scheduled Jobs ────────────────────────────────────────────────────────────

export async function createScheduledJob(
  job: Omit<ScheduledJob, 'id' | 'created_at'>
): Promise<ScheduledJob> {
  const client = getSupabaseClient();
  if (!client) {
    // Dev mode: return a mock job so the scheduling agent doesn't crash
    return { ...job, id: `mock-${Date.now()}`, created_at: new Date().toISOString() } as ScheduledJob;
  }
  const { data, error } = await client
    .from('scheduled_jobs')
    .insert(job)
    .select()
    .single();

  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return data as ScheduledJob;
}

export async function getDueJobs(): Promise<ScheduledJob[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from('scheduled_jobs')
    .select('*')
    .lte('next_run_at', new Date().toISOString());

  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  return (data || []) as ScheduledJob[];
}

export async function updateJobAfterRun(
  jobId: string,
  txHash: string,
  nextRunAt: Date
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client
    .from('scheduled_jobs')
    .update({ last_tx_hash: txHash, next_run_at: nextRunAt.toISOString() })
    .eq('id', jobId);

  if (error) throw new Error(`Supabase update failed: ${error.message}`);
}

// ── Execution Logs ────────────────────────────────────────────────────────────

export async function insertExecutionLog(log: ExecutionLog): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return; // silently skip in dev mode
  try {
    const { error } = await client.from('execution_logs').insert(log);
    if (error) console.error('[Supabase] Log insert failed:', error.message);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Supabase error';
    console.error('[Supabase] Log insert skipped:', message);
  }
}

export async function getExecutionLogs(walletAddress: string, limit = 20) {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from('execution_logs')
    .select('*')
    .eq('buyer_wallet', walletAddress)
    .order('executed_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  return data || [];
}
