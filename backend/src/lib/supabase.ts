import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ── Lazy client — only created when credentials are present ───────────────────
// This lets the server boot and Gemini agents run even without Supabase configured.
// All DB calls below will silently no-op when SUPABASE_URL is missing.

let _supabase: SupabaseClient | null = null;
let _warned = false;

function getClient(): SupabaseClient | null {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || url.includes('xxxx') || !key || key.includes('your_')) {
    if (!_warned) {
      console.warn('[Supabase] No credentials — DB calls are no-ops (dev mode)');
      _warned = true;
    }
    return null;
  }
  _supabase = createClient(url, key);
  return _supabase;
}

// Export for direct use in farming.ts (single() call pattern)
export const supabase = {
  from: (table: string) => {
    const client = getClient();
    if (!client) {
      // Chainable no-op: .from().select().eq().single() etc all resolve to { data: null, error: null }
      const noopResult = Promise.resolve({ data: null, error: null });
      const chain: any = {
        select: () => chain,
        insert: () => chain,
        update: () => chain,
        upsert: () => chain,
        delete: () => chain,
        eq: () => chain,
        lte: () => chain,
        limit: () => chain,
        order: () => chain,
        single: () => noopResult,
        then: (resolve: any) => noopResult.then(resolve),
      };
      return chain;
    }
    return client.from(table);
  },
};

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
  if (!getClient()) {
    // Dev mode: return a mock job so the scheduling agent doesn't crash
    return { ...job, id: `mock-${Date.now()}`, created_at: new Date().toISOString() } as ScheduledJob;
  }
  const client = getClient()!;
  const { data, error } = await client
    .from('scheduled_jobs')
    .insert(job)
    .select()
    .single();

  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return data as ScheduledJob;
}

export async function getDueJobs(): Promise<ScheduledJob[]> {
  if (!getClient()) return [];
  const client = getClient()!;
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
  if (!getClient()) return;
  const client = getClient()!;
  const { error } = await client
    .from('scheduled_jobs')
    .update({ last_tx_hash: txHash, next_run_at: nextRunAt.toISOString() })
    .eq('id', jobId);

  if (error) throw new Error(`Supabase update failed: ${error.message}`);
}

// ── Execution Logs ────────────────────────────────────────────────────────────

export async function insertExecutionLog(log: ExecutionLog): Promise<void> {
  if (!getClient()) return; // silently skip in dev mode
  const client = getClient()!;
  const { error } = await client.from('execution_logs').insert(log);
  if (error) console.error('[Supabase] Log insert failed:', error.message);
  // Non-fatal — don't throw, just log
}

export async function getExecutionLogs(walletAddress: string, limit = 20) {
  if (!getClient()) return [];
  const client = getClient()!;
  const { data, error } = await client
    .from('execution_logs')
    .select('*')
    .eq('buyer_wallet', walletAddress)
    .order('executed_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  return data || [];
}
