import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

export const messagingRoutes = Router();

// ── Helper ────────────────────────────────────────────────────────────────────
function handle(fn: (req: Request, res: Response) => Promise<void>) {
  return async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Messaging Error]', message);
      res.status(500).json({ error: message });
    }
  };
}

// ── In-memory store for pending auth tokens (dev mode) ────────────────────────
// In production these would live in Supabase messaging_sessions table
const pendingTokens = new Map<string, { walletAddress?: string; platform: string; expiresAt: number }>();

// ── POST /api/telegram/webhook ───────────────────────────────────────────────
// Receives incoming updates from the Telegram Bot API (webhook mode in prod,
// polling in dev). Parses /commands and dispatches to handlers.
messagingRoutes.post('/telegram/webhook', handle(async (req, res) => {
  const update = req.body;

  // Telegram sends { update_id, message: { chat, text, from } }
  const message = update?.message;
  if (!message) {
    res.status(200).json({ ok: true }); // acknowledge with 200 always
    return;
  }

  const chatId = String(message.chat?.id);
  const text: string = message.text || '';
  const from = message.from;

  console.log(`[Telegram] chat=${chatId} text="${text}"`);

  // Route commands — real bot reply logic goes here via TELEGRAM_BOT_TOKEN
  let replyText = '';

  if (text.startsWith('/start')) {
    // Generate a one-time auth token valid for 5 min
    const token = `tg_${chatId}_${Date.now()}`;
    pendingTokens.set(token, { platform: 'telegram', expiresAt: Date.now() + 5 * 60 * 1000 });

    const webAppUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    replyText = `👋 Welcome to Trovia!\n\nTo link your Solana wallet, open this link (expires in 5 min):\n${webAppUrl}/auth/messaging?token=${token}&platform=telegram`;

  } else if (text.startsWith('/agents')) {
    // Requires wallet auth — look up messaging session
    const { data: session } = await supabase
      .from('messaging_sessions')
      .select('wallet_address')
      .eq('messaging_user_id', chatId)
      .eq('platform', 'telegram')
      .single() as any;

    if (!session?.wallet_address) {
      replyText = '🔐 Please link your wallet first using /start';
    } else {
      const { data: logs } = await supabase
        .from('execution_logs')
        .select('agent_id, action, executed_at')
        .eq('buyer_wallet', session.wallet_address)
        .order('executed_at', { ascending: false })
        .limit(5) as any;

      if (!logs || logs.length === 0) {
        replyText = '📭 No active agents found for your wallet.';
      } else {
        const lines = logs.map((l: any) => `• ${l.agent_id} — ${l.action} (${new Date(l.executed_at).toLocaleString()})`);
        replyText = `🤖 Your recent agents:\n${lines.join('\n')}`;
      }
    }

  } else if (text.startsWith('/marketplace')) {
    const { data: agents } = await supabase
      .from('agent_badges')
      .select('agent_id, avg_rating, review_count')
      .order('avg_rating', { ascending: false })
      .limit(5) as any;

    if (!agents || agents.length === 0) {
      replyText = '🛒 Marketplace is warming up — check back shortly!';
    } else {
      const lines = agents.map((a: any, i: number) => `${i + 1}. ${a.agent_id} ⭐ ${(a.avg_rating || 0).toFixed(1)} (${a.review_count} reviews)`);
      replyText = `🔥 Top agents:\n${lines.join('\n')}`;
    }

  } else if (text.startsWith('/balance')) {
    replyText = '💰 Balance check: connect via /start to fetch your SOL balance.';

  } else if (text.startsWith('/status')) {
    const agentId = text.split(' ')[1];
    if (!agentId) {
      replyText = 'Usage: /status [agentId]';
    } else {
      const { data: log } = await supabase
        .from('execution_logs')
        .select('*')
        .eq('agent_id', agentId)
        .order('executed_at', { ascending: false })
        .limit(1)
        .single() as any;

      if (!log) {
        replyText = `❓ No execution found for agent: ${agentId}`;
      } else {
        replyText = `📊 Agent: ${agentId}\nLast action: ${log.action}\nTx: ${log.tx_hash || 'N/A'}\nAt: ${new Date(log.executed_at).toLocaleString()}`;
      }
    }

  } else if (text.startsWith('/ask')) {
    const question = text.replace('/ask', '').trim();
    if (!question) {
      replyText = 'Usage: /ask [your question]';
    } else {
      try {
        const { ask } = await import('../lib/gemini');
        const answer = await ask(`You are a helpful assistant for Trovia, a Solana AI agent marketplace. Answer concisely (max 200 chars): ${question}`);
        replyText = `🤖 ${answer.slice(0, 200)}`;
      } catch {
        replyText = '⚠️ AI is unavailable right now. Try again later.';
      }
    }

  } else {
    replyText = `Available commands:\n/start - Link wallet\n/agents - Your agents\n/marketplace - Browse top agents\n/status [id] - Agent status\n/balance - SOL balance\n/ask [question] - Ask AI`;
  }

  // Send reply via Telegram Bot API if token is configured
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (botToken && replyText) {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: replyText, parse_mode: 'Markdown' }),
    });
  } else {
    console.log(`[Telegram] Would reply to ${chatId}: ${replyText}`);
  }

  res.status(200).json({ ok: true, reply: replyText });
}));

// ── POST /api/whatsapp/webhook ────────────────────────────────────────────────
// Receives incoming WhatsApp messages via Meta Cloud API.
// Also handles the GET verification challenge from Meta during webhook setup.
messagingRoutes.get('/whatsapp/webhook', (req, res) => {
  // Meta sends a verification challenge when registering the webhook
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[WhatsApp] Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ error: 'Verification failed' });
  }
});

messagingRoutes.post('/whatsapp/webhook', handle(async (req, res) => {
  const body = req.body;

  // Meta Cloud API payload structure
  const entry = body?.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const messages = value?.messages;

  if (!messages || messages.length === 0) {
    res.status(200).json({ ok: true }); // Always 200 to prevent Meta retries
    return;
  }

  const message = messages[0];
  const from: string = message.from; // phone number
  const text: string = message.text?.body || '';

  console.log(`[WhatsApp] from=${from} text="${text}"`);

  let replyText = '';

  if (text.toLowerCase().includes('/start') || text.toLowerCase() === 'hi') {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const webAppUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    pendingTokens.set(code, { platform: 'whatsapp', expiresAt: Date.now() + 5 * 60 * 1000 });

    replyText = `👋 Welcome to Trovia!\n\nYour link code: *${code}*\n\nVisit ${webAppUrl}/auth/messaging?platform=whatsapp and enter this code to link your Solana wallet.`;

  } else if (text.startsWith('/agents')) {
    replyText = '📋 To manage agents, link your wallet first by sending "hi"';
  } else {
    replyText = 'Send "hi" or /start to get started with Trovia.';
  }

  // Reply via WhatsApp Cloud API
  const waToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (waToken && phoneNumberId && replyText) {
    await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${waToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: from,
        text: { body: replyText },
      }),
    });
  } else {
    console.log(`[WhatsApp] Would reply to ${from}: ${replyText}`);
  }

  res.status(200).json({ ok: true, reply: replyText });
}));

// ── POST /api/messaging/verify ────────────────────────────────────────────────
// Called by the Trovia web app after a user signs a nonce with their Solana wallet.
// Stores the verified session in Supabase messaging_sessions table.
//
// Body: { token: string, walletAddress: string, platform: 'telegram'|'whatsapp', signature: string, message: string }
messagingRoutes.post('/messaging/verify', handle(async (req, res) => {
  const { token, walletAddress, platform, signature, message } = req.body;

  // 1. Basic validation
  if (!token || !walletAddress || !platform || !signature || !message) {
    return res.status(400).json({ error: 'token, walletAddress, platform, message, and signature are required' });
  }

  // 2. Token validation
  const pending = pendingTokens.get(token);
  if (!pending || pending.expiresAt < Date.now()) {
    return res.status(401).json({ error: 'Token invalid or expired. Re-open the link from your bot.' });
  }

  if (pending.platform !== platform) {
    return res.status(400).json({ error: 'Platform mismatch' });
  }

  // 3. Cryptographic Signature Verification (10/10 Hardening)
  try {
    const { PublicKey } = await import('@solana/web3.js');
    const nacl = (await import('tweetnacl')).default;
    const bs58 = (await import('bs58')).default;

    const pubkey = new PublicKey(walletAddress);
    const signatureUint8 = bs58.decode(signature);
    const messageUint8 = new TextEncoder().encode(message);

    const isValid = nacl.sign.detached.verify(
      messageUint8,
      signatureUint8,
      pubkey.toBytes()
    );

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid wallet signature. Authentication failed.' });
    }
  } catch (err) {
    console.error('[Messaging] Verification logic error:', err);
    return res.status(500).json({ error: 'Failed to verify signature' });
  }

  console.log(`[Messaging] ✅ Verified ${walletAddress} for ${platform}`);

  // 4. Persistence
  const messagingUserId = token.startsWith('tg_') ? token.split('_')[1] : token;

  const { error } = await supabase
    .from('messaging_sessions')
    .upsert(
      {
        messaging_user_id: messagingUserId,
        platform,
        wallet_address: walletAddress,
        auth_token: null,
        alerts_enabled: true,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'messaging_user_id,platform' }
    ) as any;

  if (error) console.error('[Messaging] Persistence failed:', error.message);

  // 5. Cleanup
  pendingTokens.delete(token);

  res.json({
    ok: true,
    message: 'Identity confirmed via Ed25519. Wallet linked successfully.',
    platform,
    walletAddress,
  });
}));

// ── GET /api/messaging/session?wallet= ───────────────────────────────────────
// Check if a wallet has any linked messaging sessions (used by the frontend).
messagingRoutes.get('/messaging/session', handle(async (req, res) => {
  const wallet = req.query.wallet as string;
  if (!wallet) {
    res.status(400).json({ error: 'wallet query param required' });
    return;
  }

  const { data, error } = await supabase
    .from('messaging_sessions')
    .select('platform, messaging_user_id, alerts_enabled, created_at')
    .eq('wallet_address', wallet) as any;

  if (error) {
    res.json({ sessions: [] });
    return;
  }

  res.json({ sessions: data || [] });
}));

// ── PATCH /api/messaging/alerts ───────────────────────────────────────────────
// Toggle alerts on/off for a wallet's messaging sessions.
// Body: { walletAddress: string, platform: string, enabled: boolean }
messagingRoutes.patch('/messaging/alerts', handle(async (req, res) => {
  const { walletAddress, platform, enabled } = req.body;

  if (!walletAddress || typeof enabled !== 'boolean') {
    res.status(400).json({ error: 'walletAddress and enabled (boolean) are required' });
    return;
  }

  const query = supabase
    .from('messaging_sessions')
    .update({ alerts_enabled: enabled })
    .eq('wallet_address', walletAddress) as any;

  if (platform) {
    query.eq('platform', platform);
  }

  const { error } = await query;
  if (error) {
    console.error('[Messaging] Alert update error:', error.message);
  }

  res.json({ ok: true, alerts_enabled: enabled });
}));
