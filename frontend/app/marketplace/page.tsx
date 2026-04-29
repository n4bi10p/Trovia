// AMAN — Marketplace Page
// Shows grid of all 6 agent cards with filter tabs by type
// Calls lib/contracts.ts → getAllAgents()

export default function MarketplacePage() {
  // TODO (AMAN):
  // 1. Call getAllAgents() from lib/contracts.ts (or fetch from backend)
  // 2. Add filter tabs: All | Trading | Farming | Scheduling | Rebalancing | Content | Business
  // 3. Render AgentCard grid
  // 4. Add loading skeleton (6 skeleton cards) and empty state

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-2">Agent Marketplace</h1>
      <p className="text-text-muted mb-8">Discover and activate AI agents. Pay in SOL.</p>

      {/* Filter tabs — AMAN: make these functional */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {['All', 'Trading', 'Farming', 'Scheduling', 'Rebalancing', 'Content', 'Business'].map((tab) => (
          <button key={tab} className="badge bg-bg-elevated text-text-muted hover:bg-primary/20 hover:text-primary px-4 py-2 cursor-pointer transition-colors">
            {tab}
          </button>
        ))}
      </div>

      {/* Agent grid — AMAN: replace with AgentCard components */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card text-text-muted">TODO: Load agents from Solana + render AgentCard grid</div>
      </div>
    </div>
  );
}
