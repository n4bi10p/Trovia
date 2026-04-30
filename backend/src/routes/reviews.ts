import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

export const reviewsRoutes = Router();

function handle(fn: (req: Request, res: Response) => Promise<void>) {
  return async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Reviews Error]', message);
      res.status(500).json({ error: message });
    }
  };
}

const VALID_TAGS = ['Fast', 'Profitable', 'Reliable', 'Buggy', 'Slow', 'Lost Funds'];

// ── GET /api/reviews/:agentId ─────────────────────────────────────────────────
// Fetch all reviews for an agent, newest first.
// Optional query: ?limit=20&offset=0
reviewsRoutes.get('/:agentId', handle(async (req, res) => {
  const { agentId } = req.params;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Number(req.query.offset) || 0;

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('id, reviewer_wallet, stars, body, tags, screenshot_url, helpful_votes, created_at')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(limit) as any;

  if (error) {
    console.error('[Reviews] Fetch error:', error.message);
    res.json({ agentId, reviews: [], total: 0 });
    return;
  }

  // Fetch badge summary for this agent
  const { data: badge } = await supabase
    .from('agent_badges')
    .select('avg_rating, review_count, badges, is_flagged, report_count')
    .eq('agent_id', agentId)
    .single() as any;

  res.json({
    agentId,
    reviews: reviews || [],
    summary: {
      avgRating: badge?.avg_rating ?? null,
      reviewCount: badge?.review_count ?? 0,
      badges: badge?.badges ?? [],
      isFlagged: badge?.is_flagged ?? false,
    },
    pagination: { limit, offset },
  });
}));

// ── POST /api/reviews/:agentId ────────────────────────────────────────────────
// Submit a new review. Eligibility (Hardened 10/10):
// 1. MUST provide a valid 'executionId' that exists in logs for this agent.
// 2. That 'executionId' MUST NOT have been reviewed already (one-review-per-tx).
// 3. Wallet must match the execution log's buyer_wallet.
reviewsRoutes.post('/:agentId', handle(async (req, res) => {
  const { agentId } = req.params;
  const { reviewerWallet, executionId, stars, body, tags, screenshotUrl } = req.body;

  // ── 1. Basic Validation ───────────────────────────────────────────────────
  if (!reviewerWallet || !stars || !executionId) {
    return res.status(400).json({ error: 'reviewerWallet, stars, and executionId are required' });
  }

  // ── 2. Cryptographic Proof of Execution ──────────────────────────────────
  // Check if this execution actually happened and belongs to this wallet
  const { data: execLog } = await supabase
    .from('execution_logs')
    .select('id, buyer_wallet')
    .eq('id', executionId)
    .eq('agent_id', agentId)
    .single() as any;

  if (!execLog) {
    return res.status(403).json({ error: 'Invalid Execution ID. You can only review agents you have actually paid for and executed.' });
  }

  if (execLog.buyer_wallet !== reviewerWallet) {
    return res.status(403).json({ error: 'Execution ID / Wallet mismatch. You cannot review someone else\'s transaction.' });
  }

  // ── 3. Prevent Double Reviewing (One review per transaction) ─────────────
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('execution_id', executionId)
    .single() as any;

  if (existingReview) {
    return res.status(409).json({ error: 'This execution has already been reviewed. Each transaction grants exactly one review right.' });
  }

  // ── 4. Insert Verified Review ─────────────────────────────────────────────
  const sanitizedTags = (tags || []).filter((t: string) => VALID_TAGS.includes(t));
  const { data: newReview, error: insertError } = await supabase
    .from('reviews')
    .insert({
      agent_id: agentId,
      reviewer_wallet: reviewerWallet,
      execution_id: executionId,
      stars: Number(stars),
      body: body || null,
      tags: sanitizedTags,
      screenshot_url: screenshotUrl || null,
      helpful_votes: 0,
      created_at: new Date().toISOString(),
    })
    .select()
    .single() as any;

  if (insertError) throw insertError;

  // Update badges asynchronously
  await recalculateBadges(agentId);

  res.status(201).json({ ok: true, review: newReview, message: 'Review verified via Proof-of-Execution.' });
}));

// ── POST /api/reviews/:agentId/report ────────────────────────────────────────
// Flag an agent as malicious. Reporter wallet must have at least 1 execution.
// At threshold (5 unique reporters), agent is soft-hidden (is_flagged = true).
//
// Body: { reporterWallet, reason: 'Suspicious'|'Lost Funds'|'Spam'|'Impersonation' }
reviewsRoutes.post('/:agentId/report', handle(async (req, res) => {
  const { agentId } = req.params;
  const { reporterWallet, reason } = req.body;

  const VALID_REASONS = ['Suspicious', 'Lost Funds', 'Spam', 'Impersonation'];

  if (!reporterWallet || !reason) {
    res.status(400).json({ error: 'reporterWallet and reason are required' });
    return;
  }

  if (!VALID_REASONS.includes(reason)) {
    res.status(400).json({ error: `reason must be one of: ${VALID_REASONS.join(', ')}` });
    return;
  }

  // Sybil resistance: reporter must have at least 1 execution on ANY agent
  const { data: execLog } = await supabase
    .from('execution_logs')
    .select('id')
    .eq('buyer_wallet', reporterWallet)
    .limit(1)
    .single() as any;

  if (!execLog) {
    res.status(403).json({ error: 'You must have run at least one agent to submit a report.' });
    return;
  }

  // Log the report in agent_badges (increment report_count)
  const { data: badge } = await supabase
    .from('agent_badges')
    .select('report_count, is_flagged')
    .eq('agent_id', agentId)
    .single() as any;

  const currentCount = badge?.report_count ?? 0;
  const newCount = currentCount + 1;
  const shouldFlag = newCount >= 5;

  const { error: upsertError } = await supabase
    .from('agent_badges')
    .upsert(
      {
        agent_id: agentId,
        report_count: newCount,
        is_flagged: shouldFlag,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'agent_id' }
    ) as any;

  if (upsertError) {
    console.error('[Reviews] Badge upsert error:', upsertError.message);
  }

  console.log(`[Reviews] Agent ${agentId} reported by ${reporterWallet} for "${reason}". Total reports: ${newCount}${shouldFlag ? ' → FLAGGED' : ''}`);

  res.json({
    ok: true,
    reportCount: newCount,
    agentFlagged: shouldFlag,
    message: shouldFlag
      ? 'Agent has been flagged and is pending review by the Trovia team.'
      : `Report submitted. ${5 - newCount} more report(s) needed to trigger a review.`,
  });
}));

// ── POST /api/reviews/:agentId/helpful/:reviewId ──────────────────────────────
// Upvote a review as helpful. Simple increment, no dedup in v1.
reviewsRoutes.post('/:agentId/helpful/:reviewId', handle(async (req, res) => {
  const { reviewId } = req.params;

  // Fetch current count, then increment
  const { data: review } = await supabase
    .from('reviews')
    .select('helpful_votes')
    .eq('id', reviewId)
    .single() as any;

  const newVotes = (review?.helpful_votes ?? 0) + 1;

  const { error } = await supabase
    .from('reviews')
    .update({ helpful_votes: newVotes })
    .eq('id', reviewId) as any;

  if (error) {
    console.error('[Reviews] Helpful vote error:', error.message);
  }

  res.json({ ok: true, helpfulVotes: newVotes });
}));

// ── GET /api/badges/:agentId ──────────────────────────────────────────────────
// Get badge status for an agent (used on marketplace cards and agent detail pages).
reviewsRoutes.get('/badges/:agentId', handle(async (req, res) => {
  const { agentId } = req.params;

  const { data: badge, error } = await supabase
    .from('agent_badges')
    .select('*')
    .eq('agent_id', agentId)
    .single() as any;

  if (error || !badge) {
    res.json({
      agentId,
      avgRating: null,
      reviewCount: 0,
      badges: [],
      reportCount: 0,
      isFlagged: false,
    });
    return;
  }

  res.json({
    agentId,
    avgRating: badge.avg_rating,
    reviewCount: badge.review_count,
    badges: badge.badges,
    reportCount: badge.report_count,
    isFlagged: badge.is_flagged,
    updatedAt: badge.updated_at,
  });
}));

// ── Helper: Recalculate agent badges after a new review ───────────────────────
async function recalculateBadges(agentId: string): Promise<void> {
  const { data: reviews } = await supabase
    .from('reviews')
    .select('stars')
    .eq('agent_id', agentId) as any;

  if (!reviews || reviews.length === 0) return;

  const avgRating = reviews.reduce((sum: number, r: any) => sum + r.stars, 0) / reviews.length;
  const reviewCount = reviews.length;

  // Determine badges
  const badges: string[] = [];
  if (avgRating >= 4.5 && reviewCount >= 10) badges.push('top_rated');

  // Fetch execution count for 'trusted' badge
  const { data: execLogs } = await supabase
    .from('execution_logs')
    .select('id')
    .eq('agent_id', agentId) as any;

  const execCount = execLogs?.length ?? 0;
  if (execCount >= 50) badges.push('trusted');

  await supabase
    .from('agent_badges')
    .upsert(
      {
        agent_id: agentId,
        avg_rating: Math.round(avgRating * 100) / 100,
        review_count: reviewCount,
        badges,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'agent_id' }
    ) as any;
}
