# 🏪 Trovia — Final PRD (ByteBattle 2026 2026)

**Team:** Nabil · Bhumi · Aman · Madhura
**Hackathon:** ByteBattle 2026 2026 | Dr. D.Y. Patil Institute of Technology, Pimpri
**Track:** Web3 — Solana Blockchain
**Problem Statement:** PS 03 — Agent Marketplace

---

## 1. PRODUCT VISION

> **"An on-chain App Store for AI agents — developers publish them, anyone can activate and use them, all powered by Solana."**

Trovia is a decentralized AI agent marketplace. Developers deploy agents as Anchor programs on Solana Devnet. Buyers pay in SOL, activate agents with one click, and interact through a modern web UI. Every transaction, activation, and execution is logged on-chain.

**What makes us different from SingularityNET / Virtuals Protocol:**
1. Solana-native — sub-second finality, near-zero fees, no EVM compromise
2. AI-first UX — Gemini 2.5 Flash powers every non-financial agent; voice-ready architecture
3. Fully on-chain audit trail — every activation and execution is a verifiable Solana event

---

## 2. ARCHITECTURE

```
┌─────────────────────────────────────────────────────┐
│      FRONTEND  (Next.js 14 — Google Cloud Run)       │
│  Landing · Marketplace · Agent Detail · Dashboard   │
└──────────────────────┬──────────────────────────────┘
                       │  REST  (NEXT_PUBLIC_API_URL)
┌──────────────────────▼──────────────────────────────┐
│      BACKEND API  (Node.js — Google Cloud Run)       │
│  /api/agents/*  ·  /api/cron/*  ·  /api/health      │
└────────┬──────────────────────────────┬─────────────┘
         │                              │
┌────────▼──────────┐    ┌─────────────▼─────────────┐
│  Cloud Scheduler   │    │  ON-CHAIN PROGRAMS        │
│  (Cron — hourly)  │    │  Anchor/Rust · Solana      │
│  → /api/cron/     │    │  Registry·Escrow·Executor  │
│    scheduling      │    └─────────────┬─────────────┘
└───────────────────┘                  │
                              Solana Devnet
                         + Supabase (PostgreSQL)
```

**Two Cloud Run services:**
| Service | Source | Port | Notes |
|---|---|---|---|
| `trovia-frontend` | `frontend/` | 3000 | Next.js, `next start` |
| `trovia-backend` | `backend/` | 8080 | Express/Fastify API |

---

## 3. TECH STACK

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS + Google Fonts (Inter) |
| Wallet | Phantom (`window.solana`) |
| Blockchain SDK | `@solana/web3.js` + `@coral-xyz/anchor` |
| On-chain Programs | Rust + Anchor framework |
| AI Engine | Google Gemini 2.5 Flash API |
| Database | Supabase (PostgreSQL + Realtime) |
| Backend Runtime | Node.js (Express) on Google Cloud Run |
| Cron | Google Cloud Scheduler → Cloud Run HTTP |
| Chain | Solana Devnet |
| Payment | SOL (native — lamports) |
| Price Feed | CoinGecko public API (SOL/USD) |
| Deployment | Google Cloud Run (both services) |

---

## 4. MONOREPO STRUCTURE

```
trovia/                          ← root (Nabil pushes this skeleton first)
├── frontend/                    ← AMAN + MADHURA
│   ├── app/
│   │   ├── page.tsx             → Landing
│   │   ├── marketplace/page.tsx → Marketplace
│   │   ├── agent/[id]/page.tsx  → Agent Detail
│   │   ├── agent/[id]/run/page.tsx → Agent Chat
│   │   ├── dashboard/page.tsx   → Dashboard
│   │   └── publish/page.tsx     → Publish
│   ├── components/
│   │   ├── WalletConnect.tsx
│   │   ├── AgentCard.tsx
│   │   ├── PriceDisplay.tsx     → shows "0.002 SOL (~$0.30)"
│   │   └── ActivityFeed.tsx
│   ├── lib/
│   │   ├── wallet.ts            ← NABIL writes, Aman consumes
│   │   └── contracts.ts         ← NABIL writes, Aman consumes
│   ├── Dockerfile
│   └── .env.local
│
├── backend/                     ← NABIL + BHUMI
│   ├── src/
│   │   ├── index.ts             → Express app entry
│   │   ├── agents/
│   │   │   ├── trading.ts
│   │   │   ├── farming.ts
│   │   │   ├── scheduling.ts
│   │   │   ├── rebalancing.ts
│   │   │   ├── content.ts
│   │   │   └── business.ts
│   │   ├── cron/
│   │   │   └── scheduling.ts    → POST /api/cron/scheduling
│   │   ├── routes/
│   │   │   └── agents.ts        → mounts all agent routes
│   │   └── lib/
│   │       ├── gemini.ts        → Bhumi
│   │       ├── solana.ts        → Nabil (RPC helpers)
│   │       └── supabase.ts      → Nabil (DB client)
│   ├── Dockerfile
│   └── .env
│
└── contracts/                   ← NABIL ONLY
    ├── programs/
    │   ├── agent_registry/
    │   │   └── src/lib.rs
    │   ├── agent_escrow/
    │   │   └── src/lib.rs
    │   └── agent_executor/
    │       └── src/lib.rs
    ├── idl/                     ← auto-generated, committed after every deploy
    │   ├── agent_registry.json
    │   ├── agent_escrow.json
    │   └── agent_executor.json
    ├── Anchor.toml
    └── migrations/deploy.ts
```

**Git branches:**
- `main` — always deployable
- `nabil/blockchain` — Anchor programs + backend lib
- `bhumi/agents` — agent API routes + gemini
- `aman/frontend` — Next.js pages + components
- `madhura/design` — design tokens, Tailwind config

---

## 5. ON-CHAIN PROGRAMS (Anchor / Rust)

### 5.1 agent_registry

```rust
// contracts/programs/agent_registry/src/lib.rs
#[account]
pub struct Agent {
    pub id: u64,
    pub name: String,          // max 64 chars
    pub description: String,   // max 256 chars
    pub agent_type: String,    // "trading"|"farming"|"scheduling"|"rebalancing"|"content"|"business"
    pub price_lamports: u64,   // 1 SOL = 1_000_000_000 lamports
    pub developer: Pubkey,
    pub is_active: bool,
    pub config_schema: String, // JSON string — fields buyer must fill
    pub created_at: i64,
}

// Instructions
pub fn publish_agent(ctx: Context<PublishAgent>, args: PublishAgentArgs) -> Result<()>
pub fn deactivate_agent(ctx: Context<DeactivateAgent>, id: u64) -> Result<()>
pub fn get_all_agents(ctx: Context<GetAllAgents>) -> Result<Vec<Agent>>
```

### 5.2 agent_escrow

```rust
// contracts/programs/agent_escrow/src/lib.rs
#[account]
pub struct Activation {
    pub agent_id: u64,
    pub buyer: Pubkey,
    pub config: String,   // JSON — buyer's runtime config
    pub activated_at: i64,
    pub is_active: bool,
}
// PDA seeds: ["activation", buyer.key, agent_id.to_le_bytes()]

pub fn activate_agent(
    ctx: Context<ActivateAgent>,
    agent_id: u64,
    user_config: String,
) -> Result<()> {
    // 1. Transfer price_lamports from buyer → developer (CPI system_program::transfer)
    // 2. Create Activation PDA
    // 3. emit!(AgentActivated { agent_id, buyer, config, timestamp })
}

pub fn get_user_activations(ctx: Context<GetUserActivations>) -> Result<Vec<Activation>>
```

### 5.3 agent_executor

```rust
// contracts/programs/agent_executor/src/lib.rs
// Lightweight — just logs execution results on-chain
pub fn log_execution(
    ctx: Context<LogExecution>,
    agent_id: u64,
    action: String,   // e.g. "threshold_alert" | "content_reply" | "payment_sent"
    result: String,   // JSON summary of what happened
) -> Result<()>

// emit!(ExecutionLogged { agent_id, user: ctx.accounts.user.key(), action, result, timestamp })
```

**Deploy command (Nabil runs):**
```bash
anchor build
anchor deploy --provider.cluster devnet
# Copy program IDs from output → update Anchor.toml + env vars
anchor idl init <PROGRAM_ID> --filepath target/idl/agent_registry.json --provider.cluster devnet
```

---

## 6. BACKEND API ROUTES

Base URL: `https://[trovia-backend-cloud-run-url]`

### 6.1 Health
```
GET /api/health → { status: "ok", timestamp }
```

### 6.2 Agent Execution Routes (all POST, all require body: `{ agentId, userConfig }`)

| Route | Handler | What it does |
|---|---|---|
| `POST /api/agents/trading` | `agents/trading.ts` | Fetches SOL price via CoinGecko. If below threshold → Gemini generates market summary → returns alert + analysis |
| `POST /api/agents/farming` | `agents/farming.ts` | Reads simulated LP position from Supabase. Checks yield threshold. Gemini recommends action. Returns APY + suggestion |
| `POST /api/agents/rebalancing` | `agents/rebalancing.ts` | Reads wallet SPL token balances via RPC. Computes drift. Gemini writes plain-English rebalance plan |
| `POST /api/agents/content` | `agents/content.ts` | Takes `{ message, tone }`. Gemini returns 3 reply options |
| `POST /api/agents/business` | `agents/business.ts` | Takes `{ query, context }`. Gemini returns high-quality business response |

### 6.3 Scheduling Agent (server-side execution)
```
POST /api/agents/scheduling
Body: { agentId, recipientAddress, amountLamports, frequency, nextRunAt }
→ Saves job to Supabase scheduled_jobs table
→ Returns { jobId, nextRunAt }

POST /api/cron/scheduling                    ← called by Cloud Scheduler every hour
Header: x-cron-secret: $CRON_SECRET
→ Queries Supabase for jobs where next_run_at <= NOW()
→ For each due job: transfer SOL via server keypair, log tx hash, update next_run_at
→ Returns { processed: N, results: [...] }
```

### 6.4 Supabase Tables (Nabil creates schema)

```sql
-- scheduled_jobs
CREATE TABLE scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  buyer_wallet TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  amount_lamports BIGINT NOT NULL,
  frequency TEXT NOT NULL,       -- 'daily' | 'weekly' | 'monthly'
  next_run_at TIMESTAMPTZ NOT NULL,
  last_tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- execution_logs
CREATE TABLE execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  buyer_wallet TEXT NOT NULL,
  action TEXT NOT NULL,
  result JSONB,
  tx_hash TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. FRONTEND PAGES & COMPONENTS

### Pages

| Route | File | What to build |
|---|---|---|
| `/` | `app/page.tsx` | Hero: headline + tagline + "Connect Wallet" CTA + 3 feature callouts. Dark gradient bg. |
| `/marketplace` | `app/marketplace/page.tsx` | Grid of 6 AgentCards. Filter tabs by type. Each card shows name, type badge, description, price in SOL + USD. |
| `/agent/[id]` | `app/agent/[id]/page.tsx` | Agent detail: full description, config form (dynamic fields from configSchema), price, "Activate" button → triggers Phantom tx |
| `/agent/[id]/run` | `app/agent/[id]/run/page.tsx` | Chat interface: input box, submit, response area. For Content + Business agents. Others show status/last execution. |
| `/dashboard` | `app/dashboard/page.tsx` | Grid of user's active agents. Activity feed (execution_logs from Supabase). Each agent card has "Run" link. |
| `/publish` | `app/publish/page.tsx` | Form: name, type dropdown, description, price (SOL), config schema builder. Submits `publishAgent` Anchor tx. |

### Key Components

**`WalletConnect.tsx`**
```tsx
// Shows: [Connect Wallet] when disconnected
// Shows: [0x1a2b...3c4d] [2.45 SOL / ~$410] [Devnet badge] when connected
// Uses window.solana (Phantom). Calls lib/wallet.ts
```

**`AgentCard.tsx`**
```tsx
// Props: { id, name, agentType, description, priceLamports, developer }
// Shows: type badge (color-coded), name, 2-line description, price ("0.002 SOL · ~$0.33"), [View Agent] button
// Hover: subtle lift + glow effect
```

**`PriceDisplay.tsx`**
```tsx
// Props: { lamports: number }
// Fetches SOL/USD from CoinGecko once on mount, stores in context
// Renders: "0.002 SOL · ~$0.33"
```

**`lib/wallet.ts`** (Nabil writes)
```ts
export async function connectWallet(): Promise<string>   // returns pubkey base58
export async function getSOLBalance(pubkey: string): Promise<number>  // in SOL
export async function signAndSendTransaction(tx: Transaction): Promise<string> // returns txHash
export function isConnected(): boolean
```

**`lib/contracts.ts`** (Nabil writes)
```ts
export async function publishAgent(args: PublishAgentArgs): Promise<string>
export async function activateAgent(agentId: number, userConfig: string): Promise<string>
export async function getUserActivations(wallet: string): Promise<Activation[]>
export async function getAllAgents(): Promise<Agent[]>
```

---

## 8. THE 6 AGENTS — COMPLETE SPEC

### Agent 1 — Trading Agent 📈
- **UX:** User fills: token pair (e.g. SOL/USDC), threshold price ($), action (alert/simulate-swap), amount
- **Backend flow:** CoinGecko → check price → if threshold hit → Gemini prompt: *"SOL dropped to $X. Generate a 3-sentence market analysis and recommended action for a trader."* → return `{ alert: true, analysis: "...", simulatedAction: "..." }`
- **On-chain:** Activation PDA + ExecutionLogged event

### Agent 2 — Farming Agent 🌾
- **UX:** User fills: LP pool address, compound threshold (%), check frequency
- **Backend flow:** Fetch simulated APY from Supabase (seeded demo data on Devnet) → if above threshold → Gemini: *"APY is X%. Recommend whether to compound now or wait, in 2 sentences."* → return `{ shouldCompound: bool, recommendation: "..." }`
- **On-chain:** Activation PDA + ExecutionLogged event
- **Note:** Raydium/Orca have no real liquidity on Devnet. Use Supabase-seeded APY values. Label UI as "Simulated on Devnet".

### Agent 3 — Scheduling Agent 📅
- **UX:** User fills: recipient Solana address, amount in SOL, frequency (daily/weekly/monthly), start date
- **Backend flow:** On activate → saves job to `scheduled_jobs` Supabase table. Cloud Scheduler runs cron hourly → backend reads due jobs → fires real SOL transfer via server keypair → logs tx hash
- **On-chain:** Activation PDA + real SOL transfer tx on Devnet (visible on Solana Explorer)
- **Dashboard shows:** last tx hash, next scheduled run, amount sent

### Agent 4 — Portfolio Rebalancing Agent ⚖️
- **UX:** User fills: target allocation (e.g. SOL 60%, USDC 40%), drift tolerance (%)
- **Backend flow:** Fetch SPL token balances via `@solana/web3.js` → compute current allocation → if drift > tolerance → Gemini: *"Portfolio is X% SOL, Y% USDC. Target is 60/40. Write a plain-English rebalance recommendation."* → return `{ driftDetected: bool, currentAllocation: {...}, recommendation: "..." }`
- **On-chain:** ExecutionLogged event

### Agent 5 — Content Reply Agent ✍️
- **UX:** User pastes received message (tweet/email/DM). Selects tone: Professional / Casual / Witty. Clicks "Generate Replies".
- **Backend flow:** Gemini prompt: *"Generate exactly 3 reply options to this message: '{message}'. Tone: {tone}. Return as JSON array: [{reply: "..."}]"*
- **Returns:** 3 reply cards, each with a Copy button
- **On-chain:** ExecutionLogged event (usage tracking)

### Agent 6 — Business Assistant Agent 💼
- **UX:** User fills: business context (what is your business?), then types query in chat interface
- **Backend flow:** Gemini prompt: *"You are a business assistant for {businessContext}. Answer: {query}"*
- **Returns:** Structured response with sections (e.g. Answer, Key Points, Next Steps)
- **On-chain:** ExecutionLogged event per session

---

## 9. USER FLOWS

### Flow A — Buyer Activates Agent
```
1. Connect Phantom wallet (Devnet)
2. Browse /marketplace → click AgentCard
3. /agent/[id] → fill config form → see price in SOL + USD
4. Click "Activate" → lib/contracts.ts calls agent_escrow.activate_agent()
5. Phantom shows tx approval → user confirms
6. SOL transferred from buyer → developer wallet
7. Activation PDA created on-chain
8. Frontend redirects to /dashboard
9. Agent appears as active → click "Run" to use
```

### Flow B — Developer Publishes Agent
```
1. Connect Phantom wallet
2. /publish → fill form (name, type, description, price in SOL, config schema JSON)
3. Click "Publish" → lib/contracts.ts calls agent_registry.publish_agent()
4. Phantom confirms → Agent PDA created on-chain
5. Agent appears on /marketplace immediately
```

### Flow C — Interact with Agent
```
1. /dashboard → click active agent → /agent/[id]/run
2. For Content/Business agents: type in chat input → POST /api/agents/{type} → Gemini responds
3. For Trading/Farming/Rebalancing: shows last execution result + "Run Now" button
4. For Scheduling: shows next run time + last tx hash + Solana Explorer link
5. All executions: POST /api/agents/{type} → backend logs to Supabase + calls agent_executor.log_execution()
```

---

## 10. JUDGING CRITERIA

| Criteria | Weight | How we deliver |
|---|---|---|
| Functional Correctness | 80% | All 6 agents work end-to-end. Real Phantom tx. Real SOL on Devnet. Real Gemini responses. No hardcoded outputs. |
| Completeness | 20% | All 6 PS 03 agent types implemented. Full marketplace → detail → activate → dashboard → run flow. |

**Rule: Every feature shown to judges MUST be live. If something breaks, show "Demo Mode" label — never pretend broken output is live.**

---

## 11. TEAM ASSIGNMENTS

> **Nabil + Bhumi = Backend & Blockchain | Aman + Madhura = Frontend**
> **Nabil does Phase 0 (initial setup) and pushes skeleton FIRST. Everyone else pulls and starts.**

---

### ⚡ PHASE 0 — NABIL: Initial Setup (Do This Tonight, Push Before Sleep)

This is the skeleton everyone else builds on. Don't skip any step.

```bash
# 1. Create monorepo
mkdir trovia && cd trovia
git init
git remote add origin https://github.com/[your-org]/trovia.git

# 2. Initialize Anchor workspace
anchor init contracts --no-git
cd contracts
# Edit Anchor.toml — set cluster = "devnet"

# 3. Create backend
mkdir -p backend/src/{agents,cron,routes,lib}
cd backend && npm init -y
npm install express @solana/web3.js @coral-xyz/anchor @supabase/supabase-js \
  node-fetch dotenv cors
npm install -D typescript @types/express @types/node ts-node nodemon
# Create tsconfig.json, src/index.ts (basic Express app on port 8080)
# Create Dockerfile

# 4. Create frontend
cd ..
npx create-next-app@latest frontend --typescript --tailwind --app --no-git
cd frontend
npm install @solana/web3.js @coral-xyz/anchor @solana/wallet-adapter-react \
  @solana/wallet-adapter-phantom
# Create Dockerfile

# 5. Root files
# Create .gitignore (node_modules, .env, target/, .anchor/)
# Create README.md
# Create docker-compose.yml (for local dev)

# 6. Google Cloud setup
gcloud projects create trovia-devclash-2026
gcloud config set project trovia-devclash-2026
gcloud services enable run.googleapis.com cloudscheduler.googleapis.com \
  secretmanager.googleapis.com

# 7. Supabase
# Go to supabase.com → New Project → "trovia"
# Run SQL from Section 6.4 to create scheduled_jobs + execution_logs tables
# Copy URL + anon key + service key

# 8. Solana Devnet
solana config set --url devnet
solana-keygen new --outfile ~/.config/solana/devnet-id.json
solana airdrop 5 --url devnet
# Also airdrop to a separate scheduler keypair for cron transfers

# 9. Anchor skeleton programs (just the lib.rs stubs — Nabil fills in during hackathon)
# contracts/programs/agent_registry/src/lib.rs — empty Anchor program stub
# contracts/programs/agent_escrow/src/lib.rs — empty Anchor program stub
# contracts/programs/agent_executor/src/lib.rs — empty Anchor program stub

# 10. Push
git add .
git commit -m "feat: initial monorepo skeleton — contracts, backend, frontend"
git push origin main

# 11. Create branches for the team
git checkout -b nabil/blockchain && git push origin nabil/blockchain
git checkout main
# Tell each person to: git checkout -b [their-branch] origin/main
```

**What you push includes:**
- `frontend/` — Next.js scaffold with Tailwind, folder structure, empty route files
- `backend/` — Express app stub, empty agent files, Dockerfile
- `contracts/` — Anchor workspace with 3 empty program stubs, Anchor.toml set to devnet
- Root `.gitignore`, `README.md`, `docker-compose.yml`
- Both `Dockerfile`s ready to build

**After push, message team:**
> "Skeleton is up. Pull main. Create your branch. ENV file template is in the README. Aman: start from `frontend/`. Bhumi: start from `backend/src/agents/`. I'll deploy programs and share Program IDs by 11 AM."

---

### 🔴 NABIL — Blockchain + Backend Infrastructure

**During hackathon (on `nabil/blockchain` branch):**

**Step 1 — Deploy Anchor Programs (10:00–11:30 AM)**
- [ ] Fill in `agent_registry/src/lib.rs` — full implementation
- [ ] Fill in `agent_escrow/src/lib.rs` — full implementation (SOL transfer CPI)
- [ ] Fill in `agent_executor/src/lib.rs` — log_execution instruction
- [ ] `anchor test` locally with devnet
- [ ] `anchor deploy --provider.cluster devnet`
- [ ] Commit all 3 IDL JSON files to `contracts/idl/`
- [ ] Post Program IDs in team chat immediately

**Step 2 — Backend Lib (11:30 AM–1:00 PM)**
- [ ] `backend/src/lib/solana.ts` — RPC connection, SOL transfer helper, getBalance
- [ ] `backend/src/lib/supabase.ts` — Supabase client, insertLog, getDueJobs, updateJob
- [ ] `backend/src/index.ts` — Express app, CORS headers, `/api/health` route, mount routes

**Step 3 — Cloud Run Deploy (1:00–2:00 PM)**
- [ ] `backend/Dockerfile` finalized
- [ ] `gcloud run deploy trovia-backend --source backend/ --region asia-south1 --allow-unauthenticated --set-env-vars ...`
- [ ] Share backend Cloud Run URL with Aman (`NEXT_PUBLIC_API_URL`)
- [ ] `frontend/Dockerfile` finalized
- [ ] `gcloud run deploy trovia-frontend --source frontend/ --region asia-south1 --allow-unauthenticated --set-env-vars ...`

**Step 4 — Cloud Scheduler (2:00–2:30 PM)**
- [ ] `gcloud scheduler jobs create http trovia-scheduling-cron --schedule="0 * * * *" --uri="[backend-url]/api/cron/scheduling" --message-body="{}" --headers="x-cron-secret=[CRON_SECRET]" --location=asia-south1`
- [ ] Test: `gcloud scheduler jobs run trovia-scheduling-cron --location=asia-south1`

**Step 5 — Frontend Lib (2:30–4:00 PM)**
- [ ] `frontend/lib/wallet.ts` — connectWallet, getSOLBalance, signAndSendTransaction, isConnected
- [ ] `frontend/lib/contracts.ts` — publishAgent, activateAgent, getUserActivations, getAllAgents using IDL from `contracts/idl/`

**Step 6 — QA**
- [ ] Test full activate flow: wallet connect → activate agent → check Phantom confirmation → check Solana Explorer
- [ ] Test all backend routes with curl
- [ ] Verify programs on explorer.solana.com?cluster=devnet

---

### 🟡 BHUMI — AI Agent Engine

**During hackathon (on `bhumi/agents` branch):**

**Step 1 — Gemini Wrapper (10:00–10:30 AM)**
```ts
// backend/src/lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function ask(prompt: string): Promise<string> {
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

**Step 2 — Agent Implementations (10:30 AM–2:00 PM)**

- [ ] `backend/src/agents/trading.ts`
  ```ts
  // 1. Fetch SOL price: GET https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd
  // 2. Compare to userConfig.thresholdPrice
  // 3. If hit: ask(marketAnalysisPrompt) → return { thresholdHit, currentPrice, analysis, simulatedAction }
  // 4. Always return currentPrice regardless
  ```

- [ ] `backend/src/agents/farming.ts`
  ```ts
  // 1. Read simulated APY from Supabase (seeded row by agent_id)
  // 2. Compare to userConfig.compoundThreshold
  // 3. ask(farmingPrompt) → return { currentAPY, shouldCompound, recommendation }
  ```

- [ ] `backend/src/agents/scheduling.ts`
  ```ts
  // 1. Validate recipientAddress (valid Solana pubkey)
  // 2. INSERT into scheduled_jobs (Supabase)
  // 3. Return { jobId, recipientAddress, amountSOL, frequency, nextRunAt }
  ```

- [ ] `backend/src/agents/rebalancing.ts`
  ```ts
  // 1. Use @solana/web3.js to fetch token accounts for wallet
  // 2. Compute allocation percentages
  // 3. Compare to userConfig.targetAllocation
  // 4. ask(rebalancePrompt) → return { currentAllocation, targetAllocation, driftDetected, recommendation }
  ```

- [ ] `backend/src/agents/content.ts`
  ```ts
  // Prompt: "Generate exactly 3 reply options for: '{message}'. Tone: {tone}.
  //          Return valid JSON array: [{"reply": "..."}, {"reply": "..."}, {"reply": "..."}]"
  // Parse JSON from Gemini response
  // return { replies: [{ reply: string }, ...] }
  ```

- [ ] `backend/src/agents/business.ts`
  ```ts
  // Prompt: "You are a business assistant for: {businessContext}. User asks: {query}.
  //          Respond with: Answer, Key Points (3 bullets), Recommended Next Step."
  // return { response: string }
  ```

**Step 3 — Cron Handler (2:00–3:00 PM)**
- [ ] `backend/src/cron/scheduling.ts`
  ```ts
  // POST /api/cron/scheduling
  // 1. Verify x-cron-secret header
  // 2. SELECT * FROM scheduled_jobs WHERE next_run_at <= NOW()
  // 3. For each job: transfer SOL via server keypair (lib/solana.ts)
  // 4. UPDATE scheduled_jobs SET last_tx_hash, next_run_at (+ frequency interval)
  // 5. INSERT execution_log
  // 6. Return { processed: N, results }
  ```

**Step 4 — Routes + Error Handling (3:00–4:00 PM)**
- [ ] `backend/src/routes/agents.ts` — mount all agent handlers
- [ ] Wrap all handlers in try/catch — return `{ error: string }` on failure, never 500 crash
- [ ] Rate limit Gemini calls: add 500ms delay between requests if >10 req/min

**Step 5 — API QA**
- [ ] Content agent: returns exactly 3 replies
- [ ] Business agent: answers "What is a good pricing strategy for a SaaS?"
- [ ] Trading agent: correctly detects threshold breach
- [ ] Scheduling agent: job appears in Supabase after activation

---

### 🟢 AMAN — Frontend Engineering

**Tonight (before hackathon):**
- [ ] Pull `main` → `git checkout -b aman/frontend`
- [ ] Confirm `frontend/` builds: `cd frontend && npm install && npm run dev`
- [ ] Set up `frontend/.env.local` with placeholder values
- [ ] Write `Dockerfile` for Next.js:
  ```dockerfile
  FROM node:20-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npm run build
  EXPOSE 3000
  CMD ["npm", "start"]
  ```
- [ ] Configure `tailwind.config.ts` with Madhura's color tokens when she sends them

**During hackathon (10:00 AM onward):**

**Step 1 — Design System (10:00–11:00 AM)**
- [ ] Implement Madhura's tokens in `app/globals.css` and `tailwind.config.ts`
- [ ] Google Fonts: add Inter to `app/layout.tsx`
- [ ] Base layout: nav with WalletConnect, footer

**Step 2 — Core Components (11:00 AM–12:00 PM)**
- [ ] `WalletConnect.tsx` — connect/disconnect Phantom, show address + SOL balance
- [ ] `PriceDisplay.tsx` — fetch SOL/USD once, cache in context, format "0.002 SOL · ~$0.33"
- [ ] `AgentCard.tsx` — all props from Agent struct

**Step 3 — Pages (12:00 PM–3:00 PM)**
- [ ] `app/page.tsx` — Landing: hero, 3 feature cards, CTA
- [ ] `app/marketplace/page.tsx` — calls `getAllAgents()` from `lib/contracts.ts`, renders 6 cards, filter tabs
- [ ] `app/agent/[id]/page.tsx` — calls `getAgent(id)`, renders config form dynamically from `configSchema`, Activate button calls `activateAgent()`
- [ ] `app/dashboard/page.tsx` — calls `getUserActivations(wallet)`, activity feed from Supabase via backend API
- [ ] `app/agent/[id]/run/page.tsx` — chat interface: POST to `$NEXT_PUBLIC_API_URL/api/agents/{type}`
- [ ] `app/publish/page.tsx` — form, calls `publishAgent()`

**Step 4 — Polish + States (3:00–5:00 PM)**
- [ ] Every page: loading skeleton, empty state, error state
- [ ] Show tx hash with Solana Explorer link after every on-chain action
- [ ] Mobile responsive check on all pages

**Step 5 — Frontend QA Checklist**
- [ ] Phantom connects on Devnet
- [ ] All 6 agent cards render on marketplace
- [ ] Config form renders correctly for each agent type
- [ ] SOL + USD price shows correctly on all cards
- [ ] Activation triggers Phantom popup + shows tx hash on success
- [ ] Dashboard shows activated agents
- [ ] Content agent returns 3 reply cards
- [ ] Business agent shows formatted response
- [ ] No console errors

---

### 🟣 MADHURA — Frontend Design & UX

**Tonight (before hackathon):**
- [ ] **Lock design direction** (share with team tonight — Aman needs this to start):
  - Dark mode (recommended: dark slate background, not pure black)
  - Primary: electric purple `#7C3AED` or teal `#0EA5E9` — pick one
  - Surface: `#1E1E2E`
  - Border: `#2E2E3E`
  - Text primary: `#F8F8FC`
  - Text muted: `#8888AA`
  - Accent/success: `#10B981`
- [ ] **Typography:** Inter (Google Fonts). Sizes: 14/16/20/28/40px. Weights: 400/500/600/700.
- [ ] **6 Agent one-liners** for marketplace cards:
  - Trading: "Gets alerted and acts when your token hits your price target."
  - Farming: "Monitors your LP yield and tells you exactly when to compound."
  - Scheduling: "Sends recurring SOL payments automatically — set it and forget it."
  - Rebalancing: "Watches your portfolio drift and tells you how to rebalance."
  - Content Reply: "Generates 3 ready-to-send replies for any message in your tone."
  - Business Assistant: "Answers any business question, drafts emails, and writes proposals."

**During hackathon:**
- [ ] Full design system spec: spacing scale (4/8/12/16/24/32/48px), border-radius (4/8/12px), shadows
- [ ] Page designs for all 6 routes — can be Figma frames or detailed written spec for Aman
- [ ] Component specs: AgentCard states (default/hover/active), button variants (primary/secondary/ghost), form inputs, badges
- [ ] Loading states: skeleton loaders (not spinners) for marketplace grid and dashboard
- [ ] Empty states: illustrated or icon-based, with helpful CTAs
- [ ] Error states: inline form errors + toast notifications
- [ ] Competitive talking points for judges Q&A:
  1. "Unlike SingularityNET, we're Solana-native — every activation is an on-chain transaction with sub-second finality and near-zero fees."
  2. "Unlike Virtuals Protocol, our agents use Gemini 2.5 Flash for real AI output — not simulated responses."
  3. "We're the only marketplace at this hackathon where you can see your AI agent's execution history on Solana Explorer in real time."

---

## 12. TIMELINE

| Time | Milestone | Owner |
|---|---|---|
| **Tonight** | Phase 0 complete: skeleton pushed, Cloud project created, Supabase tables created, Devnet funded | Nabil |
| **Tonight** | Design tokens locked, 6 agent one-liners written, Tailwind config ready to paste | Madhura |
| **Tonight** | Frontend scaffold running locally, Dockerfile tested | Aman |
| **Tonight** | Gemini API key tested, read all 6 agent specs | Bhumi |
| **10:00 AM** | Hackathon starts — everyone on their branch |  |
| **10:00–11:30** | Anchor programs deployed. Program IDs shared. Gemini wrapper done. | Nabil + Bhumi |
| **10:00–12:00** | Design system implemented. WalletConnect + AgentCard built. | Aman + Madhura |
| **11:30–2:00 PM** | All 6 agent routes built. Backend lib complete. | Bhumi + Nabil |
| **12:00–2:00 PM** | Marketplace + Agent Detail pages done. | Aman |
| **2:00 PM** | Backend Cloud Run deployed. Nabil shares `NEXT_PUBLIC_API_URL`. | Nabil |
| **2:00–3:30 PM** | Frontend wired to backend. Activate flow end-to-end. | Aman + Nabil |
| **3:30–4:30 PM** | Dashboard + Agent Run pages. Cloud Scheduler tested. | All |
| **4:30 PM** | 🚨 FEATURE FREEZE — bug fixes only | Nabil |
| **5:00–6:00 PM** | 🔴 1st Judging Round | Nabil presents |
| **6:00–9:00 PM** | All 6 agents working. UI polish. | All |
| **9:00 PM–12:00 AM** | README, demo video, slides. | All |
| **12:00–1:00 AM** | 🔴 2nd Judging Round — full 8-min demo | Nabil presents |
| **1:00–7:00 AM** | Final polish, submission form filled | All |
| **8:00 AM** | Submit everything | Aman confirms checklist |
| **9:00 AM** | 🔴 3rd Judging Round — full polished demo | Nabil + Madhura |
| **10:00 AM** | Hacking ends ✅ | |

---

## 13. SUBMISSION CHECKLIST

- [ ] GitHub repo — public, all commits within hackathon window
- [ ] Frontend live on Cloud Run (URL in README)
- [ ] Backend live on Cloud Run (URL in README)
- [ ] Cloud Scheduler job active (`gcloud scheduler jobs list`)
- [ ] All 3 Anchor programs verified on Solana Explorer (devnet)
- [ ] Demo video 3–5 minutes (full flow: connect wallet → activate → use agent)
- [ ] Presentation deck 5–10 slides (PDF)
- [ ] README with: tech stack, AI tools used, run instructions, env var list
- [ ] Submission form filled on DevKraft portal

---

## 14. ENVIRONMENT VARIABLES

```bash
# ─── backend/.env (set in Cloud Run via --set-env-vars or Secret Manager) ───
GEMINI_API_KEY=AIzaSy...
SOLANA_RPC=https://api.devnet.solana.com
SOLANA_CLUSTER=devnet
AGENT_REGISTRY_PROGRAM_ID=<base58>   # Nabil fills after anchor deploy
AGENT_ESCROW_PROGRAM_ID=<base58>
AGENT_EXECUTOR_PROGRAM_ID=<base58>
SCHEDULER_KEYPAIR=<base64-encoded-keypair-json>  # server keypair for cron SOL transfers
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...           # service role — NEVER expose to frontend
CRON_SECRET=trovia-cron-secret-2026   # x-cron-secret header Cloud Scheduler sends
PORT=8080

# ─── frontend env (set in Cloud Run via --set-env-vars) ───────────────────────
NEXT_PUBLIC_API_URL=https://trovia-backend-xxxx-uc.a.run.app  # Nabil shares after deploy
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_AGENT_REGISTRY_PROGRAM_ID=<base58>
NEXT_PUBLIC_AGENT_ESCROW_PROGRAM_ID=<base58>
NEXT_PUBLIC_AGENT_EXECUTOR_PROGRAM_ID=<base58>
```

---

## 15. DEPLOYMENT — GOOGLE CLOUD RUN

```bash
# ── Backend ────────────────────────────────────────────────────────────────
gcloud run deploy trovia-backend \
  --source backend/ \
  --region asia-south1 \
  --allow-unauthenticated \
  --min-instances 1 \
  --set-env-vars GEMINI_API_KEY=$GEMINI_API_KEY,SOLANA_RPC=https://api.devnet.solana.com,...

# ── Frontend ───────────────────────────────────────────────────────────────
gcloud run deploy trovia-frontend \
  --source frontend/ \
  --region asia-south1 \
  --allow-unauthenticated \
  --min-instances 1 \
  --set-env-vars NEXT_PUBLIC_API_URL=https://trovia-backend-xxxx-uc.a.run.app,...

# ── Cloud Scheduler ────────────────────────────────────────────────────────
gcloud scheduler jobs create http trovia-scheduling-cron \
  --schedule="0 * * * *" \
  --uri="https://trovia-backend-xxxx-uc.a.run.app/api/cron/scheduling" \
  --message-body="{}" \
  --headers="x-cron-secret=trovia-cron-secret-2026,Content-Type=application/json" \
  --location=asia-south1

# ── Test cron manually before demo ────────────────────────────────────────
gcloud scheduler jobs run trovia-scheduling-cron --location=asia-south1
```

**Dockerfiles:**
```dockerfile
# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["node", "dist/index.js"]

# frontend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 16. DEMO SCRIPT (8 minutes)

| Time | Action |
|---|---|
| 0:00–0:30 | Open landing page. "This is Trovia — an on-chain AI agent marketplace built on Solana." |
| 0:30–1:00 | Connect Phantom wallet to Devnet. Show address + SOL balance. |
| 1:00–2:00 | Browse marketplace. Show all 6 agent cards. "All 6 agent types from PS 03 — live." |
| 2:00–4:00 | Click Scheduling Agent → fill config → Activate → Phantom popup → confirm → show tx hash → open Solana Explorer. "Real SOL transfer, real on-chain record." |
| 4:00–6:00 | Go to Content Reply Agent → paste tweet → generate → show 3 replies. "Powered by Gemini 2.5 Flash. Usage logged on-chain." |
| 6:00–7:00 | Dashboard → show both activated agents + activity log. |
| 7:00–8:00 | "Why Solana? Sub-second finality, near-zero fees. Why Trovia? The only AI agent marketplace where every action is verifiably on-chain. Questions?" |

---

## 17. RISK MITIGATION

| Risk | Mitigation |
|---|---|
| Solana Devnet unstable | Fallback to QuickNode free tier RPC. Run `solana airdrop 2 --url devnet` before demo. Cache last RPC response. |
| Gemini rate limit (15 req/min free) | Cache responses by input hash. Pre-generate 2 content replies + 1 business answer as static fallback. |
| Phantom tx rejected / insufficient SOL | `solana airdrop 5 --url devnet` before demo. Show `faucet.solana.com` link in UI. |
| Anchor build/deploy error | `anchor test` locally first. IDL committed — Aman can develop frontend even if redeploy is blocked. |
| Cloud Run cold start during demo | `--min-instances 1` on both services. Hit `/api/health` before starting demo. |
| Cloud Scheduler not firing | Test manually: `gcloud scheduler jobs run`. Add "Trigger Now" button in dashboard. |
| Frontend can't reach backend (CORS) | Backend `index.ts` has `app.use(cors())` — Nabil verifies on first deploy. |
| Merge conflict | Strict dir split. Never touch other person's files. PR required before merge to main. |
| Key person goes to sleep | Nabil + Bhumi minimum awake until 1 AM (2nd judging). |
| Not enough features by 1st judging | Priority 1: Trading + Content + Scheduling. Priority 2: Farming + Rebalancing + Business. |

---

*Trovia — ByteBattle 2026 2026*
*Team: Nabil · Bhumi · Aman · Madhura*
*Built on Solana Devnet · Powered by Gemini 2.5 Flash · Deployed on Google Cloud Run*
