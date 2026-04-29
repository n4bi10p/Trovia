# Trovia — Team TODOs

> **Read this before you touch any code.**
> The skeleton is committed. Your job is to fill in the TODOs for your section only.
> Never edit files that aren't yours. When done with a task, check it off and commit.

---

## 🌿 GIT WORKFLOW — Read This First (Everyone)

### Step 0 — One-Time Setup (Do Tonight Before Sleeping)

```bash
# 1. Clone the repo
git clone https://github.com/n4bi10p/Trovia.git
cd Trovia

# 2. Create YOUR branch from main (use exactly these names)
#    Bhumi:
git checkout -b bhumi/agents origin/main
git push origin bhumi/agents

#    Aman:
git checkout -b aman/frontend origin/main
git push origin aman/frontend

#    Madhura:
git checkout -b madhura/design origin/main
git push origin madhura/design

# 3. Confirm you're on your branch (should NOT say "main")
git branch
# Should show: * bhumi/agents  (or aman/frontend or madhura/design)

# 4. Set your branch to track remote so push/pull work without flags
git branch --set-upstream-to=origin/YOUR_BRANCH YOUR_BRANCH
# Example: git branch --set-upstream-to=origin/bhumi/agents bhumi/agents
```

---

### Step 1 — Your Daily Work Loop (Repeat All Day)

```bash
# ── Every time you start working ───────────────────────────────────────────
git pull origin main --rebase      # Get latest changes from main into your branch
                                   # DO THIS every time you sit down to work

# ── Work on your files ─────────────────────────────────────────────────────
# ... edit files ...

# ── Commit every ~1 hour (don't hold big uncommitted changes) ──────────────
git add .                          # Stage everything you changed
git status                         # Double-check what you're committing
git commit -m "feat(section): short description of what you did"
# Examples:
#   git commit -m "feat(agents): implement content reply agent"
#   git commit -m "feat(frontend): marketplace page grid + filter tabs"
#   git commit -m "fix(agents): handle Gemini JSON parse failure"

# ── Push to YOUR branch (not main) ────────────────────────────────────────
git push origin YOUR_BRANCH
# Examples:
#   git push origin bhumi/agents
#   git push origin aman/frontend
#   git push origin madhura/design
```

---

### Step 2 — How to Avoid Merge Conflicts (THE MOST IMPORTANT RULE)

> **The #1 rule: Only touch files in your section.**

| Who | Files you OWN | Files you NEVER touch |
|---|---|---|
| **Nabil** | `contracts/**`, `backend/src/lib/**`, `backend/src/routes/**`, `backend/src/index.ts`, `backend/src/cron/**`, `frontend/lib/wallet.ts`, `frontend/lib/contracts.ts` | frontend pages, agent files, tailwind config |
| **Bhumi** | `backend/src/agents/**` | lib files, contracts, frontend anything |
| **Aman** | `frontend/app/**`, `frontend/components/**` (except lib files) | backend anything, contracts, tailwind tokens |
| **Madhura** | `frontend/tailwind.config.ts`, `frontend/app/globals.css` | backend anything, contracts, page logic |

**If you need something from someone else's file — ask them to add/export it. Don't edit their file yourself.**

---

### Step 3 — Syncing With Main (Pull Before Every Session)

```bash
# ── Pull latest main into your branch before starting work ─────────────────
git pull origin main --rebase

# What this does:
# 1. Fetches latest commits from main (Nabil's deploys, etc.)
# 2. Replays your commits on top of them — clean linear history
# 3. No ugly merge commits

# ── If rebase has conflicts (rare if you follow the file ownership rules) ──
# Git will pause and show which file has conflicts.
# Open the file, look for <<<<<<< and >>>>>>> markers, fix them manually.
# Then:
git add <conflicted-file>
git rebase --continue
# If it gets messy and you want to abort:
git rebase --abort   # Goes back to how it was before the rebase
```

---

### Step 4 — Merging Your Work Into Main

> **Only merge when your feature is COMPLETE and TESTED. Not before.**

```bash
# Option A — GitHub PR (recommended for clean history)
# 1. Push your branch: git push origin YOUR_BRANCH
# 2. Go to github.com/n4bi10p/Trovia
# 3. Click "Compare & pull request" for your branch
# 4. Tag Nabil as reviewer for backend PRs, Aman for frontend PRs
# 5. Nabil/Aman reviews and clicks Merge

# Option B — Command line (during crunch time)
git checkout main
git pull origin main                # Get latest main
git merge YOUR_BRANCH --no-ff       # Merge your branch (--no-ff keeps branch history)
git push origin main                # Push merged main
git checkout YOUR_BRANCH            # Go back to your branch
```

---

### Step 5 — Commit Message Format

Use this format for every commit so the log is readable:

```
feat(section): short description
fix(section): what was broken and how you fixed it
docs(section): documentation update
chore(section): dependency update / config change

Examples:
  feat(agents): implement content reply agent with Gemini
  feat(frontend): marketplace page with filter tabs
  feat(contracts): deploy all 3 programs to devnet
  fix(agents): handle empty Gemini response gracefully
  fix(frontend): wallet balance NaN when disconnected
  chore(backend): add @google/generative-ai dependency
```

---

### Step 6 — When Nabil Deploys Contracts (Critical Sync Point)

When Nabil posts Program IDs in team chat, everyone does this immediately:

```bash
# 1. Pull latest main (has updated Anchor.toml + IDL files)
git pull origin main --rebase

# 2. Update YOUR .env file:
#    Bhumi → backend/.env:
AGENT_REGISTRY_PROGRAM_ID=<paste ID>
AGENT_ESCROW_PROGRAM_ID=<paste ID>
AGENT_EXECUTOR_PROGRAM_ID=<paste ID>

#    Aman → frontend/.env.local:
NEXT_PUBLIC_AGENT_REGISTRY_PROGRAM_ID=<paste ID>
NEXT_PUBLIC_AGENT_ESCROW_PROGRAM_ID=<paste ID>
NEXT_PUBLIC_AGENT_EXECUTOR_PROGRAM_ID=<paste ID>

# NOTE: .env files are in .gitignore — you update them locally, never commit them
```

---

### Quick Reference Cheat Sheet

```bash
# Start of every session:
git pull origin main --rebase

# During work (every ~1 hour):
git add . && git commit -m "feat(X): description" && git push origin YOUR_BRANCH

# Check what branch you're on:
git branch

# Check what's changed:
git status
git diff

# Undo last commit (keep changes):
git reset --soft HEAD~1

# Discard all local changes (dangerous):
git restore .

# See recent commits:
git log --oneline -10
```

---

## 🔴 NABIL — Blockchain + Backend Infrastructure

### TONIGHT (before hackathon starts)

- [ ] **Add GitHub remote and push**
  ```bash
  git remote add origin https://github.com/[your-org]/trovia.git
  git push -u origin main
  ```

- [ ] **Create team branches**
  ```bash
  git checkout -b nabil/blockchain && git push origin nabil/blockchain
  git checkout main
  # Tell each person their branch name
  ```

- [ ] **Set up Solana Devnet**
  ```bash
  solana config set --url devnet
  solana-keygen new --outfile ~/.config/solana/devnet-id.json
  solana airdrop 5 --url devnet
  # Also create a scheduler keypair for cron SOL transfers:
  solana-keygen new --outfile ~/.config/solana/scheduler-keypair.json
  solana airdrop 2 ~/.config/solana/scheduler-keypair.json --url devnet
  # Encode scheduler keypair for env var:
  base64 -w 0 ~/.config/solana/scheduler-keypair.json
  # Paste output into SCHEDULER_KEYPAIR in backend/.env
  ```

- [ ] **Create Google Cloud project**
  ```bash
  gcloud projects create trovia-devclash-2026
  gcloud config set project trovia-devclash-2026
  gcloud services enable run.googleapis.com cloudscheduler.googleapis.com secretmanager.googleapis.com
  ```

- [ ] **Create Supabase project**
  - Go to supabase.com → New Project → name it "trovia"
  - Run this SQL in the Supabase SQL editor:
  ```sql
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
  ```
  - Copy: Project URL, anon key, service role key → paste into `backend/.env`

- [ ] **Create `backend/.env`** from `backend/.env.example` and fill in all values

- [ ] **Install backend deps and verify it runs**
  ```bash
  cd backend && npm install && npm run dev
  # Should print: ✅ Trovia backend running on port 8080
  # Test: curl http://localhost:8080/api/health
  ```

- [ ] **Install frontend deps and verify it runs**
  ```bash
  cd frontend && npm install && npm run dev
  # Should open on http://localhost:3000
  ```

---

### DURING HACKATHON — Step-by-step in order

#### Step 1 — Deploy Anchor Programs (10:00–11:30 AM)
**File: `contracts/programs/agent_registry/src/lib.rs`** ← already written, review it
**File: `contracts/programs/agent_escrow/src/lib.rs`** ← already written, review it
**File: `contracts/programs/agent_executor/src/lib.rs`** ← already written, review it

- [ ] `cd contracts && anchor build` — fix any compile errors
- [ ] `anchor test` — run against devnet
- [ ] `anchor deploy --provider.cluster devnet`
- [ ] Copy the 3 Program IDs from deploy output
- [ ] Update `contracts/Anchor.toml` — replace `11111111111111111111111111111111` with real IDs
- [ ] Update `backend/.env` — fill `AGENT_REGISTRY_PROGRAM_ID`, `AGENT_ESCROW_PROGRAM_ID`, `AGENT_EXECUTOR_PROGRAM_ID`
- [ ] Run `anchor idl init <PROGRAM_ID> --filepath target/idl/agent_registry.json --provider.cluster devnet` for all 3
- [ ] `git add contracts/ && git commit -m "feat(contracts): deploy programs to devnet — Program IDs updated"`
- [ ] **Post all 3 Program IDs in team chat immediately so Aman can update his `.env.local`**

#### Step 2 — Backend Lib (verify + test) (11:30 AM–1:00 PM)
**Files already written:** `backend/src/lib/solana.ts`, `backend/src/lib/supabase.ts`, `backend/src/lib/gemini.ts`

- [ ] Verify `lib/solana.ts` — test `getSOLBalance` with your devnet wallet
- [ ] Verify `lib/supabase.ts` — test `createScheduledJob` inserts a row in Supabase dashboard
- [ ] Verify `lib/gemini.ts` — test `ask("Hello")` returns a string (add a quick test script)
- [ ] Test `/api/health` still returns 200

#### Step 3 — Deploy Backend to Cloud Run (1:00–2:00 PM)
- [ ] Finalize `backend/Dockerfile` (already written — just verify it builds)
  ```bash
  cd backend && docker build -t trovia-backend .
  docker run -p 8080:8080 --env-file .env trovia-backend
  # Test: curl http://localhost:8080/api/health
  ```
- [ ] Deploy:
  ```bash
  gcloud run deploy trovia-backend \
    --source backend/ \
    --region asia-south1 \
    --allow-unauthenticated \
    --min-instances 1 \
    --set-env-vars "GEMINI_API_KEY=...,SOLANA_RPC=https://api.devnet.solana.com,..."
  ```
- [ ] Copy backend Cloud Run URL → **share with Aman as `NEXT_PUBLIC_API_URL`**

#### Step 4 — Deploy Frontend to Cloud Run (2:00–2:30 PM)
- [ ] `cd frontend && docker build -t trovia-frontend .` — verify it builds
- [ ] Deploy:
  ```bash
  gcloud run deploy trovia-frontend \
    --source frontend/ \
    --region asia-south1 \
    --allow-unauthenticated \
    --min-instances 1 \
    --set-env-vars "NEXT_PUBLIC_API_URL=https://[backend-url],NEXT_PUBLIC_SOLANA_CLUSTER=devnet,..."
  ```
- [ ] Verify frontend Cloud Run URL opens in browser

#### Step 5 — Cloud Scheduler (2:30 PM)
- [ ] Create cron job:
  ```bash
  gcloud scheduler jobs create http trovia-scheduling-cron \
    --schedule="0 * * * *" \
    --uri="https://[backend-cloud-run-url]/api/cron/scheduling" \
    --message-body="{}" \
    --headers="x-cron-secret=[CRON_SECRET],Content-Type=application/json" \
    --location=asia-south1
  ```
- [ ] Test it manually: `gcloud scheduler jobs run trovia-scheduling-cron --location=asia-south1`
- [ ] Verify a job in Supabase `scheduled_jobs` table gets processed (insert a test row first)

#### Step 6 — Frontend Lib (2:30–4:00 PM)
**Files:** `frontend/lib/wallet.ts` (already written) and `frontend/lib/contracts.ts` (has mock data + TODO stubs)

- [ ] In `frontend/lib/contracts.ts` — replace mock `getAllAgents()` with real Anchor program fetch using IDL
- [ ] Implement `publishAgent()` — build and send Anchor `publishAgent` instruction
- [ ] Implement `activateAgent()` — build and send Anchor `activateAgent` instruction  
- [ ] Implement `getUserActivations()` — fetch Activation PDAs for the wallet
- [ ] Update `frontend/.env.local` with real Program IDs
- [ ] Test: connect Phantom → call `getAllAgents()` → check it returns real on-chain data
- [ ] `git commit -m "feat(contracts): implement Anchor client in lib/contracts.ts"`

#### Step 7 — QA (4:00–4:30 PM)
- [ ] Full flow: connect Phantom → browse marketplace → activate agent → Phantom confirms → tx appears on Solana Explorer
- [ ] Test all 6 backend routes with curl
- [ ] Verify Cloud Scheduler cron fires correctly
- [ ] Check no console errors in browser

---

## 🟡 BHUMI — AI Agent Engine

### TONIGHT (before hackathon starts)

- [ ] **Pull the repo and create your branch**
  ```bash
  git clone https://github.com/[org]/trovia.git
  cd trovia
  git checkout -b bhumi/agents origin/main
  ```

- [ ] **Get your Gemini API key**
  - Go to aistudio.google.com → Get API Key
  - Create `backend/.env` from `backend/.env.example`
  - Set `GEMINI_API_KEY=your_key_here`

- [ ] **Run the backend locally and verify Gemini works**
  ```bash
  cd backend && npm install && npm run dev
  # In a separate terminal, test Gemini:
  curl -X POST http://localhost:8080/api/agents/content \
    -H "Content-Type: application/json" \
    -d '{"agentId":"4","userConfig":{"walletAddress":"test","message":"Hello world","tone":"Casual"}}'
  ```

- [ ] **Read all 6 agent files** in `backend/src/agents/` — understand what each needs to return
- [ ] **Read `backend/src/lib/gemini.ts`** — you'll use `ask()` and `askJSON()` in every agent

---

### DURING HACKATHON — Step-by-step in order

#### Step 1 — Gemini Wrapper (already done — just verify)
**File: `backend/src/lib/gemini.ts`** — written by Nabil, do NOT modify

- [ ] Verify `ask("Say hello")` returns text
- [ ] Verify `askJSON<{name:string}>('Return {"name": "test"}')` parses JSON correctly

#### Step 2 — Content Reply Agent (10:30 AM — PRIORITY 1)
**File: `backend/src/agents/content.ts`**

- [ ] Replace the TODO stub with real implementation:
  - Build prompt asking Gemini for exactly 3 replies in JSON array format
  - Use `askJSON<{reply:string}[]>()` to parse the response
  - Handle JSON parse failures (return 3 placeholder replies, never crash)
  - Call `insertExecutionLog()` from `lib/supabase.ts`
  - Return `{ replies: [{reply: string}, {reply: string}, {reply: string}] }`
- [ ] Test: POST `/api/agents/content` with a message → must return exactly 3 replies
- [ ] `git commit -m "feat(agents): implement content reply agent"`

#### Step 3 — Business Assistant Agent (11:00 AM — PRIORITY 1)
**File: `backend/src/agents/business.ts`**

- [ ] Implement with prompt: *"You are a business assistant for {businessContext}. Answer: {query}. Structure your response with: Answer, Key Points (3 bullets), Recommended Next Step."*
- [ ] Return `{ response: string }`
- [ ] Log to Supabase
- [ ] Test: POST `/api/agents/business` with `businessContext + query` → returns structured response

#### Step 4 — Trading Agent (11:30 AM — PRIORITY 1)
**File: `backend/src/agents/trading.ts`** — skeleton already written

- [ ] The skeleton calls `getSOLPrice()` and `ask()` — fill in the Gemini prompt
- [ ] Gemini prompt: *"SOL is at $X. User set alert at $Y for {tokenPair}. Give a 3-sentence market analysis and recommended action."*
- [ ] Test: POST `/api/agents/trading` with `thresholdPrice` below current SOL price → must trigger alert + Gemini response

#### Step 5 — Scheduling Agent (12:00 PM — PRIORITY 1)
**File: `backend/src/agents/scheduling.ts`** — already fully implemented by Nabil

- [ ] Read and understand it — Nabil already wrote this one
- [ ] Test: POST `/api/agents/scheduling` → check row appears in Supabase `scheduled_jobs` table
- [ ] Verify `src/cron/scheduling.ts` is also already implemented — read it

#### Step 6 — Farming Agent (1:00 PM — PRIORITY 2)
**File: `backend/src/agents/farming.ts`**

- [ ] Seed mock APY data in Supabase: add a `farming_pools` table with `{ agent_id, apy, pool_name }`
- [ ] Implement: read APY from Supabase → compare to threshold → ask Gemini for recommendation
- [ ] Return `{ currentAPY, shouldCompound, recommendation, note: "Simulated on Devnet" }`
- [ ] Label response as simulated (no real Raydium/Orca data on Devnet)

#### Step 7 — Rebalancing Agent (2:00 PM — PRIORITY 2)
**File: `backend/src/agents/rebalancing.ts`**

- [ ] Use `@solana/web3.js` to fetch token accounts for the wallet address
- [ ] Compute current allocation percentages
- [ ] If drift > `driftTolerance`: ask Gemini for rebalance plan
- [ ] Return `{ currentAllocation, targetAllocation, driftDetected, recommendation }`

#### Step 8 — Error Handling + Rate Limiting (3:00 PM)
- [ ] All agents: every Gemini call inside try/catch — never let Gemini error crash the server
- [ ] If Gemini fails: return a pre-written fallback response (not an error)
- [ ] Add 200ms delay between sequential Gemini calls if you're testing multiple rapidly
- [ ] Verify all routes return proper error JSON (not HTML 500 pages)

#### Step 9 — API QA Checklist
- [ ] Content agent: returns **exactly 3** replies with any message
- [ ] Business agent: answers "What is a good pricing strategy for a SaaS?"
- [ ] Trading agent: detects threshold breach, returns Gemini analysis
- [ ] Scheduling agent: job appears in Supabase `scheduled_jobs` after POST
- [ ] Farming agent: returns APY + recommendation
- [ ] Rebalancing agent: returns allocation + drift status
- [ ] All routes: crash-resistant (bad input returns `{error: "..."}` not 500)

---

## 🟢 AMAN — Frontend Engineering

### TONIGHT (before hackathon starts)

- [ ] **Pull the repo and create your branch**
  ```bash
  git clone https://github.com/[org]/trovia.git
  cd trovia
  git checkout -b aman/frontend origin/main
  ```

- [ ] **Copy env file and install deps**
  ```bash
  cd frontend
  cp .env.local.example .env.local
  npm install
  npm run dev
  # Should open on http://localhost:3000
  # Landing page and basic nav should render immediately (uses mock data)
  ```

- [ ] **Verify the app renders** — you should see the landing page, nav bar, and "Browse Agents" button
- [ ] **Wait for Madhura's design tokens** — she'll send colors tonight. Update `tailwind.config.ts` when she does.

---

### DURING HACKATHON — Step-by-step in order

#### Step 1 — Design System (10:00–11:00 AM)
**Files:** `tailwind.config.ts`, `app/globals.css`

- [ ] Paste Madhura's final color tokens into `tailwind.config.ts` (replace the placeholders in the `colors` block)
- [ ] Add Google Fonts Inter in `app/layout.tsx` (already set up — verify it loads)
- [ ] Check base styles in `globals.css` look right (scrollbar, body bg, font)
- [ ] Verify `.btn-primary`, `.card`, `.input`, `.badge` utility classes render correctly

#### Step 2 — Core Components (11:00 AM–12:00 PM)
**Files already written:** `WalletProvider.tsx`, `WalletConnect.tsx`, `Nav.tsx`, `AgentCard.tsx`

- [ ] **WalletConnect.tsx** — test: click "Connect Wallet" → Phantom popup opens → address + balance shows in nav
- [ ] **AgentCard.tsx** — style it properly with Madhura's spec (colors, hover state, badge styles)
- [ ] **PriceDisplay** — add SOL/USD price fetching. Create `components/PriceDisplay.tsx`:
  - Fetch SOL/USD once from CoinGecko on mount: `https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd`
  - Cache in React context (don't fetch on every card)
  - Format: `"0.002 SOL · ~$0.33"`
  - Pass `solPriceUSD` prop to `AgentCard`
- [ ] Create `components/SolPriceContext.tsx` to share SOL price app-wide

#### Step 3 — Marketplace Page (12:00–1:00 PM)
**File: `app/marketplace/page.tsx`**

- [ ] Import `getAllAgents` from `lib/contracts.ts` — it returns mock data immediately (no Anchor needed yet)
- [ ] Render 6 `AgentCard` components in a responsive grid
- [ ] Make filter tabs functional (filter by `agentType`)
- [ ] Add loading skeleton: 6 skeleton cards while fetching
- [ ] Add empty state: "No agents found" with a link to /marketplace (clear filter)
- [ ] `git commit -m "feat(frontend): marketplace page with agent grid + filter tabs"`

#### Step 4 — Agent Detail Page (1:00–2:00 PM)
**File: `app/agent/[id]/page.tsx`**

- [ ] Find agent by `params.id` from `getAllAgents()`
- [ ] Render: icon, type badge, name, description, price in SOL + USD
- [ ] **Dynamic config form** — parse `agent.configSchema` (JSON string) and render a text input for each field
  ```ts
  const schema = JSON.parse(agent.configSchema); // { recipientAddress: "string", amountSOL: "number", ... }
  Object.entries(schema).map(([key, type]) => <input key={key} placeholder={key} ... />)
  ```
- [ ] "Activate" button: on click → collect form values → call `activateAgent(id, JSON.stringify(config))` from `lib/contracts.ts`
- [ ] Show: loading spinner during tx, tx hash + Solana Explorer link on success, error message on failure
- [ ] Add "Wallet not connected" state if wallet is disconnected

#### Step 5 — Dashboard Page (2:00–3:00 PM)
**File: `app/dashboard/page.tsx`**

- [ ] If wallet not connected → show "Connect your wallet to see your agents"
- [ ] Call `getUserActivations(address)` from `lib/contracts.ts`
- [ ] Render active agent cards (name, type, "Run" button → `/agent/${id}/run`)
- [ ] Fetch execution logs: `GET ${NEXT_PUBLIC_API_URL}/api/agents/logs?wallet=${address}`
- [ ] Render activity feed: action, time, tx hash with Explorer link
- [ ] Empty states for both sections

#### Step 6 — Agent Run Page (3:00–4:00 PM)
**File: `app/agent/[id]/run/page.tsx`**

- [ ] For `content` + `business` agent types: build chat interface
  - Text input + submit button
  - POST to `${NEXT_PUBLIC_API_URL}/api/agents/{agentType}` with `{ agentId, userConfig: { walletAddress, message/query, tone/businessContext } }`
  - For content: render 3 reply cards, each with a Copy button
  - For business: render formatted response (parse sections)
- [ ] For `trading`, `farming`, `rebalancing`: show last result + "Run Now" button (POST to backend → show result card)
- [ ] For `scheduling`: show job status from dashboard logs (next run, last tx hash + Explorer link)

#### Step 7 — Publish Page (4:00–4:30 PM)
**File: `app/publish/page.tsx`**

- [ ] Form: name, type dropdown (6 options), description textarea, price (SOL) number input, config schema textarea
- [ ] Price input: show `~$X.XX` below it using SOL/USD price
- [ ] Validation: all required, wallet connected, price > 0
- [ ] Submit → `publishAgent(args)` from `lib/contracts.ts` → Phantom popup → success message

#### Step 8 — Polish (4:00–5:00 PM)
- [ ] Every page has: loading state (skeleton), error state, empty state
- [ ] All on-chain actions show tx hash with Solana Explorer link
- [ ] Nav highlights active route
- [ ] Mobile responsive (test at 375px width)
- [ ] No hardcoded values — everything reads from env or props

#### Step 9 — Frontend QA Checklist
- [ ] Phantom connects on Devnet (shows green "Devnet" badge)
- [ ] All 6 agent cards render on marketplace with correct icons and type badges
- [ ] Filter tabs show correct agents for each type
- [ ] SOL + USD price shows on all agent cards (not NaN, not $0)
- [ ] Agent detail: config form renders different fields per agent type
- [ ] Activate button: Phantom popup → tx confirmed → tx hash shown → redirect to dashboard
- [ ] Dashboard: shows activated agents + activity log
- [ ] Content agent: 3 reply cards each with Copy button
- [ ] Business agent: formatted structured response
- [ ] No console errors in browser DevTools

---

## 🟣 MADHURA — Frontend Design & UX

### TONIGHT (before hackathon starts)

- [ ] **Share design tokens with Aman TONIGHT** — he needs these to start the design system at 10 AM

  Copy this into a message to Aman and fill in your choices:
  ```
  COLORS:
  bg-base:    [your choice — recommended: #0F0F1A]
  bg-surface: [your choice — recommended: #1A1A2E]
  bg-elevated:[your choice — recommended: #252540]
  primary:    [your choice — recommended: #7C3AED or #0EA5E9]
  border:     [your choice — recommended: #2E2E50]
  text-primary: [your choice — recommended: #F8F8FC]
  text-muted: [your choice — recommended: #8888AA]
  success:    #10B981
  danger:     #EF4444

  FONT: Inter (already set up)
  MODE: Dark
  ```

- [ ] **Lock down the 6 agent type badge colors** (or use the defaults in `tailwind.config.ts`)

- [ ] **Write 6 agent one-liners** for marketplace cards (Aman needs these for `lib/contracts.ts` mock data):
  - Trading: "Gets alerted and acts when your token hits your price target."
  - Farming: "Monitors your LP yield and tells you exactly when to compound."
  - Scheduling: "Sends recurring SOL payments automatically — set it and forget it."
  - Rebalancing: "Watches your portfolio drift and tells you how to rebalance."
  - Content Reply: "Generates 3 ready-to-send replies for any message in your tone."
  - Business Assistant: "Answers any business question, drafts emails, and writes proposals."

---

### DURING HACKATHON — Step-by-step in order

#### Step 1 — Design System Spec (10:00–11:00 AM)
Share these specs with Aman in writing (message him directly, not verbal):

- [ ] **Full color token table** (all values from your locked choices tonight)
- [ ] **Type scale:** body (14px), ui (16px), h3 (20px), h2 (28px), h1 (40px) — all font-weight specified
- [ ] **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px
- [ ] **Border radius:** sm=4px, md=8px, lg=12px, xl=16px
- [ ] **Shadows:** card shadow, glow effect for hover/active states

#### Step 2 — Component Specs (11:00 AM–1:00 PM)
For each component, write exact specs (values, not "make it look good"):

- [ ] **AgentCard** (`components/AgentCard.tsx`):
  - Default: bg-surface, border-border, shadow-card
  - Hover: border-primary, shadow-glow, cursor-pointer, slight translate-y(-2px)
  - Badge: `AGENT_TYPE_COLORS` in `AgentCard.tsx` — confirm or override each color
  - Price line: SOL in text-primary bold, USD in text-muted small
  
- [ ] **Buttons** (already in `globals.css` as `.btn-primary`, `.btn-secondary`, `.btn-ghost`):
  - Confirm the primary color and hover color match your palette
  - Specify active scale (already `active:scale-95`)

- [ ] **WalletConnect button** — spec the connected state appearance (Aman has a version, you review it)

- [ ] **Input fields** (`.input` class in `globals.css`) — confirm border focus color matches primary

- [ ] **Activity feed item** — spec layout: [icon] [action text] [time] [tx hash link]

#### Step 3 — Page Designs (1:00–3:00 PM)
For each page, give Aman a written spec or quick wireframe (can be a photo of a sketch):

- [ ] **Landing `/`** — hero layout, feature cards grid, CTA button placement
- [ ] **Marketplace `/marketplace`** — filter tab position, card grid columns, page header
- [ ] **Agent Detail `/agent/[id]`** — left/right layout or single column, form placement, activate button
- [ ] **Agent Run `/agent/[id]/run`** — chat bubble layout for content/business, result card for others
- [ ] **Dashboard `/dashboard`** — agent grid + sidebar activity feed, or stacked layout
- [ ] **Publish `/publish`** — form layout, price input with USD conversion

#### Step 4 — States (3:00–4:00 PM)
For every key interaction, give Aman the exact spec:

- [ ] **Loading:** Skeleton card spec (not spinner — skeleton lines)
- [ ] **Empty marketplace:** Illustration or icon + "No agents yet. Be the first to publish." CTA
- [ ] **Empty dashboard:** "No active agents. Browse the marketplace." with link
- [ ] **Success state:** After activate — what does the success toast look like? Color, duration, message
- [ ] **Error state:** After failed tx — inline error below button or toast?
- [ ] **Wallet disconnected:** Inline banner or prompt on pages that require wallet

#### Step 5 — Microcopy (4:00–5:00 PM)
Write exact text for every button label, placeholder, and empty state:

- [ ] All 6 button labels in Activate flow: "Activate Agent", "Confirm Activation", "Activating...", "Activated ✓"
- [ ] Config form placeholders per agent type (e.g., scheduling: "e.g. 0.01" for amount, "e.g. 7znV8..." for address)
- [ ] All toast messages: success, error, pending
- [ ] Footer text (already set — confirm it's correct)

#### Step 6 — Judges Q&A Prep
- [ ] Prepare 3 bullet points on why Trovia > SingularityNET/Virtuals Protocol (already in FINAL_PRD.md Section 11, Madhura section)
- [ ] Review the demo flow (FINAL_PRD.md Section 16) — know it cold for the 3rd judging round

---

## 📋 SHARED RULES

1. **Your branch, your files.** Never edit files outside your section.
2. **Commit often.** Every hour minimum. Message: `feat(section): what you did`
3. **Never push to `main` directly.** PR → other person on your team reviews → merge.
4. **When Nabil deploys programs and shares Program IDs** — everyone update their `.env` files immediately.
5. **Feature freeze at 4:30 PM** — only bug fixes after that.
6. **Before 1st judging (5 PM):** Make sure at least Trading agent + Content agent + Scheduling agent work end-to-end. That's your minimum viable demo.

---

## 🚨 PRIORITY ORDER

If time runs out, ship in this order:

| Priority | Feature | Owner |
|---|---|---|
| P1 | Marketplace renders all 6 agent cards | Aman |
| P1 | Wallet connect (Phantom on Devnet) | Aman + Nabil |
| P1 | Content Reply Agent (3 Gemini replies) | Bhumi |
| P1 | Scheduling Agent (saves job, cron runs) | Bhumi + Nabil |
| P1 | Activate flow (SOL tx on Devnet, Phantom) | Nabil |
| P1 | Dashboard shows activated agents | Aman |
| P2 | Trading Agent (threshold + Gemini analysis) | Bhumi |
| P2 | Business Assistant | Bhumi |
| P2 | Agent Detail config form dynamic fields | Aman |
| P2 | Agent Run chat interface | Aman |
| P2 | Publish Agent form | Aman |
| P3 | Farming + Rebalancing agents | Bhumi |
| P3 | UI polish + animations | Aman + Madhura |
| P3 | Solana Explorer links everywhere | Aman |

---

*Trovia · ByteBattle 2026 · Team 7x7=49: Nabil · Bhumi · Aman · Madhura*
