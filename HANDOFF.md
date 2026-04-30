# Trovia — Team Handoff Booklet
> **ByteBattle 2026 · Team 7x7=49 · Nabil · Bhumi · Aman · Madhura**
> Last updated: 30 Apr 2026 · 09:47 IST (HARDENED v1.1)

---

## 🛡️ Hardened Architecture (Security & Scale)
*Note for Nabil: The backend is now production-grade. Do not revert these security measures.*

### 1. Cryptographic Identity (Ed25519)
- **Messaging Verification**: The `/api/messaging/verify` route requires an **Ed25519 Signature** signed by the user's wallet. 
- **Proof-of-Ownership**: Authentication is verified using `tweetnacl`. The frontend must sign a nonce to link a wallet to Telegram/WhatsApp.

### 2. Proof-of-Execution (Review System)
- **Anti-Sybil**: Users can only leave reviews for agents they have actually executed and paid for.
- **Unique Proof**: Each `execution_id` grants exactly one "Review Right." Once used, the ID is invalidated.

### 3. L1/L2 Caching Strategy
- **Performance**: Analytics (`/api/analytics/protocol`) now uses a 2-tier cache.
- **L1 (Memory)**: 60s TTL for high-frequency public reads.
- **L2 (Persistent)**: Supabase `protocol_stats_cache` table for aggregated stats. This prevents CoinGecko rate-limiting and DB bottlenecks.

---

## Quick Links

| Resource | URL |
|---|---|
| 🌐 Frontend (local) | http://localhost:3000 |
| ⚡ Backend API (local) | http://localhost:8080 |
| 📖 Interactive API Docs | **http://localhost:8080/api/docs** |
| 🔍 Health Check | http://localhost:8080/api/health |
| 🎙️ Voice Panel UI | Global (Bottom Right) |

---

## How to Run Everything

### Backend
```bash
cd Trovia/backend
npm install
npm run dev
# ✅ Hardened backend running on port 8080
```

### Frontend
```bash
cd Trovia/frontend
npm install
npm run dev
# ▲ Next.js ready on http://localhost:3000
```

---

## Project Structure (Updated)

```
Trovia/
├── backend/
│   ├── src/
│   │   ├── cron/
│   │   │   └── scheduling.ts         ✅ HARDENED — Async polling + isolation
│   │   ├── routes/
│   │   │   ├── messaging.ts          ✅ HARDENED — Ed25519 signature verify
│   │   │   ├── reviews.ts            ✅ HARDENED — Proof-of-Execution required
│   │   │   ├── analytics.ts          ✅ HARDENED — L1/L2 Caching active
│   │   │   └── voice.ts              ✅ HARDENED — Gemini Flash STT native
│   │   └── agents/
│   │       └── rebalancing.ts        ✅ HARDENED — Demo mode transparency
└── frontend/
    └── components/
        └── VoicePanel.tsx            ✅ Global Voice Control (Puter.js)
```

---

## Feature 1: Voice-to-Agent (AI Powered)
- **Engine**: Powered by **Gemini 1.5 Flash** (Native Audio Understanding).
- **Control**: "Launch trading agent with 0.5 SOL" → Parsed and confirmed via TTS.
- **Fallback**: Uses Puter.js on the client for zero-latency browser transcription.

## Feature 2: Omni-Channel Messaging
- **Platforms**: Telegram and WhatsApp.
- **Security**: Deep-linking via signed nonces.
- **Commands**: `/agents`, `/status [id]`, `/ask [question]`.

---

## Demo Flow (For Judges)

1. **Connect Wallet** (Phantom Devnet).
2. **Browse Marketplace** (6 agents visible).
3. **Voice Command**: Click Mic → "Rebalance my portfolio" → System shows drift chart + demo data notice.
4. **Link Bot**: Use `/start` in Telegram → Sign on web → Bot confirms "Wallet Linked".
5. **Verified Review**: Run an agent → Leave a 5-star review → Check Reputation badge change.

---

## 🔴 Critical Tasks for NABIL (Blockchain & Infra)

1.  **Supabase Cache Table**: You **MUST** create the `protocol_stats_cache` table in Supabase. Without this, the hardened Analytics router will fall back to expensive live queries.
    ```sql
    CREATE TABLE protocol_stats_cache (
      id SERIAL PRIMARY KEY,
      stats_json JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    INSERT INTO protocol_stats_cache (stats_json) VALUES ('{}');
    ```
2.  **Cron Security**: Set the `CRON_SECRET` in your production environment. The `/api/cron/scheduling` endpoint is now protected.
3.  **Supabase Persistence**: The backend has "No-Op" logic for dev. For the final demo, ensure `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are valid so reviews and logs actually save.
4.  **Transaction Polling**: I have updated the scheduler to parallelize jobs. Do not change the `preflightCommitment` settings; they are tuned for Solana devnet congestion.

---

## 🟢 Critical Tasks for AMAN (Frontend & UI)

1.  **Messaging Auth (New Requirement)**: The `/api/messaging/verify` route now requires an **Ed25519 Signature**. 
    - You must use `wallet.signMessage(new TextEncoder().encode(message))` in the frontend.
    - Pass the `signature` (base58) and the original `message` in the POST body.
2.  **Demo Mode UI**: The `rebalancing` agent now returns an `isDemoData: boolean` flag. 
    - If `true`, you **MUST** show a "Demo Mode" or "Simulation" badge on the result card so judges aren't confused.
3.  **Verified Reviews**: When calling `POST /api/reviews/:agentId`, you **MUST** now pass a valid `executionId` from the user's logs. Reviews without a linked transaction will now be rejected with a `403 Forbidden`.
4.  **Analytics L1/L2**: Use the `/api/analytics/protocol` endpoint for the global stats. It now returns an `X-Cache` header—you can use this to show a "Last updated" timestamp.

---

*Trovia · ByteBattle 2026 · Team 7x7=49*
