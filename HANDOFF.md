# Trovia — Team Handoff Booklet
> **ByteBattle 2026 · Team 7x7=49 · Nabil · Bhumi · Aman · Madhura**
> Last updated: 30 Apr 2026 · 05:27 IST

---

## Quick Links

| Resource | URL |
|---|---|
| 🌐 Frontend (local) | http://localhost:3000 |
| ⚡ Backend API (local) | http://localhost:8080 |
| 📖 Interactive API Docs | **http://localhost:8080/api/docs** |
| 🔍 Health Check | http://localhost:8080/api/health |
| 🐙 GitHub Repo | https://github.com/n4bi10p/Trovia |

---

## How to Run Everything (Start Here)

### Backend
```bash
cd Trovia/backend
cp .env.example .env          # only first time
# Fill in GEMINI_API_KEY in .env (get from aistudio.google.com)
npm install                   # only first time
npm run dev
# ✅ Trovia backend running on port 8080
```

### Frontend
```bash
cd Trovia/frontend
cp .env.local.example .env.local   # only first time
npm install                         # only first time
npm run dev
# ▲ Next.js ready on http://localhost:3000
```

> ⚠️ **Known fix already applied:** `next.config.ts` was renamed to `next.config.js` (Next.js 14 doesn't support `.ts` config). `tsconfig.json` has `baseUrl + paths` added for `@/` alias.

> ⚠️ **Known fix already applied:** `lib/gemini.ts` uses lazy init — API key is read at call time, not import time. Always restart backend after changing `.env`.

---

## Project Structure

```
Trovia/
├── backend/
│   ├── src/
│   │   ├── index.ts                  ← Express server entry point
│   │   ├── agents/
│   │   │   ├── content.ts            ✅ DONE — Content Reply Agent
│   │   │   ├── business.ts           ✅ DONE — Business Assistant
│   │   │   ├── trading.ts            ✅ DONE — Trading Agent
│   │   │   ├── farming.ts            ✅ DONE — Farming Agent
│   │   │   ├── rebalancing.ts        ✅ DONE — Rebalancing Agent
│   │   │   ├── scheduling.ts         ✅ DONE — Scheduling Agent (Nabil)
│   │   │   └── farming_pools_seed.sql ← Run in Supabase SQL editor
│   │   ├── lib/
│   │   │   ├── gemini.ts             ✅ DONE — Gemini AI wrapper (lazy init)
│   │   │   ├── supabase.ts           ✅ DONE — Supabase client (no-op safe)
│   │   │   └── solana.ts             ✅ DONE — SOL price, balance, transfer
│   │   ├── routes/
│   │   │   ├── agents.ts             ✅ DONE — All 6 agent routes + logs
│   │   │   └── docs.ts               ✅ DONE — Interactive API docs page
│   │   └── cron/
│   │       └── scheduling.ts         ✅ DONE — Cloud Scheduler handler (Nabil)
│   ├── .env.example                  ← Copy to .env and fill values
│   └── package.json
│
└── frontend/
    ├── app/
    │   ├── page.tsx                  ✅ Landing page (skeleton done, needs polish)
    │   ├── marketplace/page.tsx      🟡 TODO (Aman) — needs getAllAgents + AgentCard grid
    │   ├── agent/[id]/page.tsx       🟡 TODO (Aman) — detail + activate form
    │   ├── agent/[id]/run/page.tsx   🟡 TODO (Aman) — chat + run interface
    │   ├── dashboard/page.tsx        🟡 TODO (Aman) — active agents + activity feed
    │   └── publish/page.tsx          🟡 TODO (Aman) — publish form
    ├── components/
    │   ├── AgentCard.tsx             ✅ DONE — card component (needs Madhura styling)
    │   ├── Nav.tsx                   ✅ DONE
    │   ├── WalletConnect.tsx         ✅ DONE
    │   └── WalletProvider.tsx        ✅ DONE
    ├── lib/
    │   ├── contracts.ts              🟡 TODO (Nabil) — replace mock with Anchor
    │   └── wallet.ts                 ✅ DONE
    ├── next.config.js                ✅ Fixed (was .ts)
    └── tsconfig.json                 ✅ Fixed (added @/ path alias)
```

---

## Backend API Reference

> Full interactive docs at **http://localhost:8080/api/docs** — has ▶ Try it buttons.

### `GET /api/health`
```json
{ "status": "ok", "service": "trovia-backend", "cluster": "devnet" }
```

---

### `POST /api/agents/content` — Content Reply Agent
**Owner: Bhumi ✅**

```json
// Request
{
  "agentId": "4",
  "userConfig": {
    "walletAddress": "YourSolanaAddress",
    "message": "Just launched my startup!",
    "tone": "Casual"
  }
}

// Response — always exactly 3 replies
{
  "replies": [
    { "reply": "That's huge, congrats! How long did it take?" },
    { "reply": "Love to see it! What problem are you solving?" },
    { "reply": "Amazing milestone! What's next for you?" }
  ]
}
```
- `tone`: `"Professional"` | `"Casual"` | `"Witty"`
- Always returns exactly 3 replies — even if Gemini fails (uses tone-matched fallbacks)

---

### `POST /api/agents/business` — Business Assistant
**Owner: Bhumi ✅**

```json
// Request
{
  "agentId": "5",
  "userConfig": {
    "walletAddress": "YourSolanaAddress",
    "businessContext": "SaaS platform for small restaurants",
    "query": "How should I price my product?"
  }
}

// Response
{
  "response": "**Answer:**\nFor a restaurant SaaS...\n\n**Key Points:**\n• Start with value-based pricing...\n• ...\n\n**Recommended Next Step:**\nRun a 30-day pilot..."
}
```
- Always returns structured sections: `**Answer:**`, `**Key Points:**`, `**Recommended Next Step:**`
- Frontend should parse `\n` and render markdown-style

---

### `POST /api/agents/trading` — Trading Agent
**Owner: Bhumi ✅**

```json
// Request
{
  "agentId": "0",
  "userConfig": {
    "walletAddress": "YourSolanaAddress",
    "tokenPair": "SOL/USDC",
    "thresholdPrice": 200,
    "action": "alert"
  }
}

// Response
{
  "currentPrice": 145.20,
  "thresholdPrice": 200,
  "thresholdHit": true,
  "analysis": "SOL is trading at $145.20, below your alert at $200..."
}
```
- `action`: `"alert"` | `"simulate_swap"` — simulate_swap adds `simulatedAction` field
- Fetches live SOL/USD price from CoinGecko (cached 60s)
- `thresholdHit: true` when `currentPrice <= thresholdPrice`

---

### `POST /api/agents/farming` — Farming Agent
**Owner: Bhumi ✅**

```json
// Request
{
  "agentId": "1",
  "userConfig": {
    "walletAddress": "YourSolanaAddress",
    "poolAddress": "orca_sol_usdc",
    "compoundThreshold": 12
  }
}

// Response
{
  "currentAPY": 18.5,
  "poolName": "SOL-USDC (Orca Whirlpool Simulated)",
  "shouldCompound": true,
  "recommendation": "At 18.5% APY...",
  "note": "Simulated on Devnet — APY values are seeded for demo purposes"
}
```
- Valid `poolAddress` values: `raydium_sol_usdc`, `raydium_sol_usdt`, `orca_sol_usdc`, `orca_bonk_sol`, `marinade_msol`
- Falls back to hardcoded APY values if Supabase `farming_pools` table not seeded

---

### `POST /api/agents/rebalancing` — Rebalancing Agent
**Owner: Bhumi ✅**

```json
// Request
{
  "agentId": "3",
  "userConfig": {
    "walletAddress": "YourSolanaAddress",
    "targetAllocation": { "SOL": 60, "USDC": 40 },
    "driftTolerance": 5
  }
}

// Response
{
  "currentAllocation": { "SOL": 75, "USDC": 25 },
  "targetAllocation": { "SOL": 60, "USDC": 40 },
  "driftDetected": true,
  "driftTolerance": 5,
  "driftDetails": [
    { "asset": "SOL", "current": 75, "target": 60, "drift": 15 },
    { "asset": "USDC", "current": 25, "target": 40, "drift": 15 }
  ],
  "recommendation": "Consider selling 15% of your SOL position..."
}
```
- Uses real `@solana/web3.js` to fetch SPL token accounts
- On Devnet empty wallets: synthesizes demo values (2.5 SOL + 80 USDC) so demo always works

---

### `POST /api/agents/scheduling` — Scheduling Agent
**Owner: Nabil ✅**

```json
// Request
{
  "agentId": "2",
  "userConfig": {
    "walletAddress": "YourSolanaAddress",
    "recipientAddress": "RecipientSolanaAddress",
    "amountSOL": 0.01,
    "frequency": "daily",
    "startDate": "2026-05-01T00:00:00Z"
  }
}

// Response
{
  "jobId": "uuid-here",
  "recipientAddress": "...",
  "amountSOL": 0.01,
  "frequency": "daily",
  "nextRunAt": "2026-05-01T00:00:00.000Z"
}
```
- `frequency`: `"daily"` | `"weekly"` | `"monthly"`
- Without Supabase: returns mock `jobId` starting with `mock-`

---

### `GET /api/agents/logs?wallet=<address>` — Execution Logs
```json
{
  "logs": [
    {
      "agent_id": "4",
      "buyer_wallet": "YourAddress",
      "action": "content_reply",
      "result": { "tone": "Casual", "repliesGenerated": 3 },
      "executed_at": "2026-04-30T00:00:00Z"
    }
  ]
}
```

---

## Environment Variables

### `backend/.env`
```bash
GEMINI_API_KEY=          # From aistudio.google.com (REQUIRED for real AI responses)
SOLANA_RPC=https://api.devnet.solana.com
SOLANA_CLUSTER=devnet
SUPABASE_URL=            # From supabase.com project → Settings → API
SUPABASE_SERVICE_KEY=    # Service role key (same page)
CRON_SECRET=trovia-cron-secret-change-me
PORT=8080
# After Nabil deploys Anchor programs:
AGENT_REGISTRY_PROGRAM_ID=
AGENT_ESCROW_PROGRAM_ID=
AGENT_EXECUTOR_PROGRAM_ID=
SCHEDULER_KEYPAIR=       # base64 of scheduler-keypair.json
```

### `frontend/.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080    # backend URL
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
# After Nabil deploys:
NEXT_PUBLIC_AGENT_REGISTRY_PROGRAM_ID=
NEXT_PUBLIC_AGENT_ESCROW_PROGRAM_ID=
NEXT_PUBLIC_AGENT_EXECUTOR_PROGRAM_ID=
```

---

## Current Status by Team Member

### 🔴 Nabil — Blockchain + Backend Infra
| Task | Status |
|---|---|
| Supabase project + tables | ⬜ Needed |
| Solana Devnet setup + keypairs | ⬜ Needed |
| Anchor build + deploy (3 programs) | ⬜ Needed |
| Share Program IDs with team | ⬜ Blocking Aman |
| Backend deployed to Cloud Run | ⬜ Needed |
| Cloud Scheduler cron job | ⬜ Needed |
| `lib/solana.ts`, `lib/supabase.ts`, `lib/gemini.ts` | ✅ Done |
| `cron/scheduling.ts` | ✅ Done |
| `routes/agents.ts` | ✅ Done |

### 🟡 Bhumi — AI Agent Engine
| Task | Status |
|---|---|
| Content Reply Agent | ✅ Done |
| Business Assistant Agent | ✅ Done |
| Trading Agent (live SOL price + Gemini) | ✅ Done |
| Farming Agent (Supabase APY + Gemini) | ✅ Done |
| Rebalancing Agent (web3.js + drift calc) | ✅ Done |
| Scheduling Agent (Nabil's — read only) | ✅ Done |
| Error handling + fallbacks on all agents | ✅ Done |
| `farming_pools_seed.sql` ready to run | ✅ Done — run when Supabase is up |
| **Git: create bhumi/agents branch + push** | ⬜ Needed |
| **QA all 6 agents with real Gemini key** | ⬜ Test with http://localhost:8080/api/docs |

### 🟢 Aman — Frontend Engineering
| Task | Status |
|---|---|
| `WalletProvider`, `Nav`, `WalletConnect`, `AgentCard` | ✅ Done (components exist) |
| Marketplace page — getAllAgents + AgentCard grid | ⬜ TODO |
| Agent detail page — config form + activate button | ⬜ TODO |
| Agent run page — chat UI + result cards | ⬜ TODO |
| Dashboard page — active agents + activity feed | ⬜ TODO |
| Publish page — form + publishAgent() | ⬜ TODO |
| `PriceDisplay.tsx` + `SolPriceContext.tsx` | ⬜ TODO |
| Loading skeletons + empty states on all pages | ⬜ TODO |

### 🟣 Madhura — Frontend Design & UX
| Task | Status |
|---|---|
| Share color tokens with Aman | ⬜ Blocking Aman's design system |
| AgentCard styling spec | ⬜ Needed |
| All 6 page layout specs | ⬜ Needed |
| State specs (loading, empty, error, success) | ⬜ Needed |
| Microcopy (button labels, placeholders, toasts) | ⬜ Needed |

---

## Key Bugs Fixed (Don't Revert These)

| Bug | File | Fix Applied |
|---|---|---|
| Gemini key not loaded at startup | `lib/gemini.ts` | Lazy init — reads key at call time, not import |
| Supabase crashes server if no credentials | `lib/supabase.ts` | Per-function null guards, no-op in dev mode |
| `next.config.ts` not supported by Next.js 14 | `next.config.js` | Renamed to `.js`, converted to CommonJS |
| `@/` import alias not resolving | `tsconfig.json` | Added `baseUrl: "."` and `paths: {"@/*": ["./*"]}` |
| Port 8080 conflict on second `npm run dev` | — | Kill old process: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess -Force` |

---

## What Aman Needs to Build (Priority Order)

### 1. `SolPriceContext.tsx` + `PriceDisplay.tsx`
```tsx
// components/SolPriceContext.tsx — fetch once, share everywhere
const { data } = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
// solPriceUSD = data.solana.usd
// Pass solPriceUSD to <AgentCard agent={agent} solPriceUSD={solPriceUSD} />
```

### 2. Marketplace Page (`app/marketplace/page.tsx`)
```tsx
'use client';
import { getAllAgents } from '@/lib/contracts';
import { AgentCard } from '@/components/AgentCard';
// getAllAgents() returns mock data instantly — no Anchor needed yet
// Render: filter tabs + 3-col AgentCard grid
```

### 3. Agent Run Page — Content/Business Chat UI
```tsx
// POST to process.env.NEXT_PUBLIC_API_URL + '/api/agents/content'
// Body: { agentId, userConfig: { walletAddress, message, tone } }
// Render 3 reply cards each with a Copy button

// For business: render response with section headers parsed
// **Answer:** → <h3>Answer</h3>
// **Key Points:** → <ul> bullets
// **Recommended Next Step:** → highlighted box
```

### 4. Agent Run Page — Trading/Farming/Rebalancing
```tsx
// "Run Now" button → POST to backend → show result card:
// Trading: show currentPrice, thresholdHit badge, analysis text
// Farming: show APY bar, shouldCompound badge, recommendation
// Rebalancing: show drift details table, recommendation
```

---

## Supabase Tables Needed (Nabil to create)

```sql
-- Already in TODOS.md, copy-paste into Supabase SQL editor:

CREATE TABLE scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  buyer_wallet TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  amount_lamports BIGINT NOT NULL,
  frequency TEXT NOT NULL,
  next_run_at TIMESTAMPTZ NOT NULL,
  last_tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  buyer_wallet TEXT NOT NULL,
  action TEXT NOT NULL,
  result JSONB,
  tx_hash TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bhumi: also run farming_pools_seed.sql (in backend/src/agents/)
```

---

## Git Workflow (Quick Reference)

```bash
# Your branch names:
# Bhumi  → bhumi/agents
# Aman   → aman/frontend
# Madhura → madhura/design

# Start every session:
git pull origin main --rebase

# Commit every ~1 hour:
git add .
git commit -m "feat(agents): implement farming agent"
git push origin YOUR_BRANCH

# File ownership — NEVER edit others' files:
# Bhumi  → backend/src/agents/**
# Aman   → frontend/app/**, frontend/components/**
# Madhura → frontend/tailwind.config.ts, frontend/app/globals.css
# Nabil  → backend/src/lib/**, contracts/**, backend/src/routes/**
```

---

## Demo Flow (Memorize for Judges)

1. **Open** http://localhost:3000 — landing page loads
2. **Connect** Phantom wallet (Devnet)
3. **Browse** marketplace → 6 agent cards visible
4. **Click** Content Reply Agent → detail page
5. **Activate** → Phantom popup → confirm SOL tx → tx hash shown
6. **Go to Dashboard** → agent card appears → click **Run**
7. **Type a message** → 3 AI-generated reply cards appear → **Copy** one
8. **Show Trading Agent** — enter threshold below current SOL price → `thresholdHit: true` → Gemini analysis appears
9. **Show Scheduling Agent** — creates a job → appears in Supabase dashboard

**Minimum viable demo (P1 before 5 PM judging):**
- ✅ Marketplace renders 6 cards
- ✅ Wallet connects on Devnet
- ✅ Content agent returns 3 Gemini replies
- ✅ Scheduling agent creates a job

---

*Trovia · ByteBattle 2026 · Team 7x7=49*
