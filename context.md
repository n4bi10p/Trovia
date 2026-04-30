# Trovia Nabil Context

## Project Goal
Trovia is a ByteBattle 2026 Solana Devnet AI agent marketplace. Developers publish agents, buyers activate them with SOL through Phantom, and executions are logged through the backend/Supabase and, where available, on-chain events.

## Nabil Scope
- Anchor programs in `contracts/**`
- Backend infrastructure and shared libs in `backend/src/lib/**`, `backend/src/index.ts`, `backend/src/routes/**`, and `backend/src/cron/**`
- Frontend wallet/contract integration in `frontend/lib/**`
- Deployment wiring for Cloud Run and Cloud Scheduler

## Current Repo State
- `backend/src/index.ts` mounts health, agent routes, and cron routes.
- `backend/src/lib/solana.ts`, `supabase.ts`, and `gemini.ts` exist but need verification and safer env handling.
- `contracts/programs/*/src/lib.rs` exist but program IDs are placeholders and the registry lacks initialization.
- `frontend/lib/contracts.ts` currently returns mock agents and throws for publish/activate.
- Bhumi-owned agent files still contain TODO placeholders; they are intentionally out of strict Nabil scope unless infrastructure blocks them.

## Decisions
- Keep scope strict to Nabil-owned files.
- Use real Anchor/Solana as the primary path.
- Keep mock agent catalog only as a clearly marked fallback when IDLs/program IDs are unavailable.
- Do not fake publish or activation success.
- Keep Supabase service role usage server-side only.

## Change Log
- 2026-04-30: Created this context handoff file before implementation.
- 2026-04-30: Updated Anchor programs:
  - `agent_registry` now has `initialize_registry`, account size constants, publish validation, and allowed agent type checks.
  - `agent_escrow` now manually verifies registry-owned agent PDAs, checks agent activity/developer, validates config length, and creates activation PDAs after SOL transfer.
  - `agent_executor` now emits validated execution events without creating per-execution accounts, making demo logging cheaper and simpler.
- 2026-04-30: Hardened backend shared infrastructure:
  - `backend/src/lib/supabase.ts` now creates the service-role Supabase client lazily, disables auth session persistence, and logs execution-log failures as non-fatal.
  - `backend/src/lib/gemini.ts` now creates the Gemini model lazily and throws a clear missing-env error only when Gemini is actually called.
  - `backend/src/cron/scheduling.ts` now rejects missing `CRON_SECRET` and does not require `SCHEDULER_KEYPAIR` when there are no due jobs.
- 2026-04-30: Replaced `frontend/lib/contracts.ts` mock-only stub with an Anchor client:
  - Initial implementation used `@coral-xyz/anchor`, then was replaced with a browser-safe `@solana/web3.js` implementation because frontend webpack failed without useful detail.
  - `getAllAgents()` fetches registry program accounts when program IDs are configured and falls back to clearly logged mock agents when they are not.
  - `publishAgent()` initializes the registry if needed, derives the next agent PDA, validates args, and sends a real transaction using Anchor instruction discriminators.
  - `activateAgent()` derives activation and agent PDAs, refuses mock data activation, and sends a real escrow transaction.
  - `getUserActivations()` fetches escrow activation accounts and filters by wallet.
- 2026-04-30: Updated `frontend/lib/wallet.ts` to set fee payer and recent blockhash before Phantom `signAndSendTransaction`.
- 2026-04-30: Converted frontend config from `next.config.ts` to `next.config.mjs` because Next 14 build failed before compilation with `Configuring Next.js via 'next.config.ts' is not supported`.
- 2026-04-30: Added browser shims for Solana frontend code in `next.config.mjs` and installed frontend `buffer`/`process` packages so `@solana/web3.js` can bundle in client components.
- 2026-04-30: Added missing frontend `tsconfig.json`/`next-env.d.ts` for the `@/*` import alias and removed `next/font/google` from `app/layout.tsx` so builds do not fail when Google Fonts cannot be fetched.
- 2026-04-30: Fixed frontend contract instruction data typing by importing `Buffer` explicitly and wrapping transaction instruction data.
- 2026-04-30: Fixed `agent_escrow` compile issue by removing a stale `address = agent.developer` account constraint after switching `agent` to manual unchecked registry validation.
- 2026-04-30: Fixed deployment packaging:
  - `backend/Dockerfile` now installs dev dependencies for `tsc`, builds, then prunes dev dependencies.
  - Added `frontend/public/.gitkeep` so the standalone frontend Dockerfile can copy `/app/public`.

## Verification Log
- 2026-04-30: `cd contracts && anchor build` could not run because `anchor` is not installed in the current environment (`/bin/bash: line 1: anchor: command not found`).
- 2026-04-30: `cd backend && npm run build` passed after installing dependencies.
- 2026-04-30: First `cd frontend && npm run build` failed because `next.config.ts` is unsupported by this pinned Next version; config was converted to `.mjs`.
- 2026-04-30: Frontend build still failed with generic webpack errors after the config conversion; likely caused by browser bundling of Solana dependencies, so browser shims were added.
- 2026-04-30: After shims, frontend build exposed real errors: Google Fonts fetch failed in the sandbox and `@/*` imports were unresolved due missing `tsconfig.json`.
- 2026-04-30: `cd frontend && npm run build` passed.
- 2026-04-30: `cd frontend && npx tsc --noEmit --pretty false` passed after the successful Next build regenerated `.next/types`.
- 2026-04-30: `cd contracts && cargo check` passed. It prints Anchor/Solana `unexpected cfg` warnings from macros and an unused `toolchain` manifest warning, but no Rust errors.
- 2026-04-30: `cd backend && node dist/index.js` could not smoke-test `/api/health` because the sandbox rejected port binding with `listen EPERM: operation not permitted 0.0.0.0:8080`. Escalation request was rejected by auto-review due usage-limit messaging.
- 2026-04-30: Final verification rerun passed: `cd backend && npm run build`, `cd frontend && npm run build`, and `cd contracts && cargo check`.

## Blockers
- Real devnet deploy requires local Solana/Anchor tooling, a funded deploy wallet, and network access.
- Current environment is missing the Anchor CLI, so contract compile/deploy/IDL generation must be run in Nabil's local Anchor setup.
- Backend runtime `/api/health` smoke test needs to be rerun outside this port-binding sandbox.
- Cloud Run and Cloud Scheduler verification require local Google Cloud credentials.
- Supabase runtime verification requires project URL and service role key in backend env.

## Next Steps
- In Nabil's local Anchor setup, run `cd contracts && anchor build`; then deploy all three programs to devnet, update `declare_id!`, `contracts/Anchor.toml`, backend/frontend env vars, and generate `contracts/idl/*.json`.
- Outside this sandbox, run `cd backend && node dist/index.js`, verify `GET /api/health`, then test cron with real `CRON_SECRET`, Supabase env, and `SCHEDULER_KEYPAIR`.
- After deploy, test frontend with real program IDs: publish an agent, fetch real marketplace agents, activate with Phantom, and verify the tx on Solana Explorer.
- Ignore the existing untracked `.codex` unless Nabil intentionally wants to commit it.
