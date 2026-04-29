import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

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
  const { data, error } = await supabase
    .from('scheduled_jobs')
    .insert(job)
    .select()
    .single();

  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return data as ScheduledJob;
}

export async function getDueJobs(): Promise<ScheduledJob[]> {
  const { data, error } = await supabase
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
  const { error } = await supabase
    .from('scheduled_jobs')
    .update({ last_tx_hash: txHash, next_run_at: nextRunAt.toISOString() })
    .eq('id', jobId);

  if (error) throw new Error(`Supabase update failed: ${error.message}`);
}

// ── Execution Logs ────────────────────────────────────────────────────────────

export async function insertExecutionLog(log: ExecutionLog): Promise<void> {
  const { error } = await supabase.from('execution_logs').insert(log);
  if (error) console.error('[Supabase] Log insert failed:', error.message);
  // Non-fatal — don't throw, just log
}

export async function getExecutionLogs(walletAddress: string, limit = 20) {
  const { data, error } = await supabase
    .from('execution_logs')
    .select('*')
    .eq('buyer_wallet', walletAddress)
    .order('executed_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  return data || [];
}
