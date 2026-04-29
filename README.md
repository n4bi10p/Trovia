# Trovia — DevClash 2026

> On-chain AI Agent Marketplace built on Solana Devnet, powered by Gemini 2.5 Flash, deployed on Google Cloud Run.

**Team:** Nabil · Bhumi · Aman · Madhura

---

## Monorepo Structure

```
trovia/
├── contracts/    ← Anchor/Rust programs (NABIL)
├── backend/      ← Express API + agent logic (NABIL + BHUMI)
├── frontend/     ← Next.js 14 UI (AMAN + MADHURA)
└── prd/          ← PRDs and planning docs
```

## Quick Start

### Prerequisites
- Node.js 20+
- Rust + Anchor CLI (`cargo install --git https://github.com/coral-xyz/anchor anchor-cli`)
- Solana CLI (`sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`)
- Google Cloud CLI (`gcloud`)
- Phantom wallet (browser extension)

### Branch Setup
```bash
git clone https://github.com/[org]/trovia.git
cd trovia

# Aman
git checkout -b aman/frontend origin/main

# Bhumi
git checkout -b bhumi/agents origin/main

# Madhura
git checkout -b madhura/design origin/main
```

### Backend (local dev)
```bash
cd backend
cp .env.example .env          # fill in your values
npm install
npm run dev                   # runs on http://localhost:8080
```

### Frontend (local dev)
```bash
cd frontend
cp .env.local.example .env.local   # fill in your values
npm install
npm run dev                         # runs on http://localhost:3000
```

### Contracts (Nabil only)
```bash
cd contracts
anchor build
anchor test
anchor deploy --provider.cluster devnet
```

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio key |
| `SOLANA_RPC` | `https://api.devnet.solana.com` |
| `SOLANA_CLUSTER` | `devnet` |
| `AGENT_REGISTRY_PROGRAM_ID` | From anchor deploy |
| `AGENT_ESCROW_PROGRAM_ID` | From anchor deploy |
| `AGENT_EXECUTOR_PROGRAM_ID` | From anchor deploy |
| `SCHEDULER_KEYPAIR` | Base64 encoded server keypair JSON |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `CRON_SECRET` | Shared secret for Cloud Scheduler header |
| `PORT` | `8080` |

### Frontend (`frontend/.env.local`)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend Cloud Run URL (Nabil provides) |
| `NEXT_PUBLIC_SOLANA_RPC` | `https://api.devnet.solana.com` |
| `NEXT_PUBLIC_SOLANA_CLUSTER` | `devnet` |
| `NEXT_PUBLIC_AGENT_REGISTRY_PROGRAM_ID` | From anchor deploy |
| `NEXT_PUBLIC_AGENT_ESCROW_PROGRAM_ID` | From anchor deploy |
| `NEXT_PUBLIC_AGENT_EXECUTOR_PROGRAM_ID` | From anchor deploy |

---

## Deployment

```bash
# Backend
gcloud run deploy trovia-backend \
  --source backend/ --region asia-south1 \
  --allow-unauthenticated --min-instances 1

# Frontend
gcloud run deploy trovia-frontend \
  --source frontend/ --region asia-south1 \
  --allow-unauthenticated --min-instances 1

# Cron (Scheduling Agent)
gcloud scheduler jobs create http trovia-scheduling-cron \
  --schedule="0 * * * *" \
  --uri="[backend-url]/api/cron/scheduling" \
  --headers="x-cron-secret=[CRON_SECRET]" \
  --location=asia-south1
```

---

## AI Tools Used
- Google Gemini 2.5 Flash — content reply, business assistant, trading analysis, farming recommendations, portfolio rebalancing
- Antigravity (Google DeepMind) — PRD generation and project planning

*Built for DevClash 2026 · Trovia Team*
