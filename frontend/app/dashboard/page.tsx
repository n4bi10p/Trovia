// AMAN — Dashboard Page
// Shows user's active agents + execution activity feed
// Route: /dashboard

export default function DashboardPage() {
  // TODO (AMAN):
  // 1. Get wallet from WalletContext (must be connected — show "Connect wallet" if not)
  // 2. Call getUserActivations(wallet) from lib/contracts.ts → render active agent cards
  // 3. Call GET $NEXT_PUBLIC_API_URL/api/agents/logs?wallet=... → render activity feed
  // 4. Each active agent card: type badge, name, "Run" link → /agent/[id]/run
  // 5. Activity feed: action, timestamp, tx hash (with Explorer link)
  // 6. Empty state: "No active agents. Browse the marketplace."

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-2">Your Dashboard</h1>
      <p className="text-text-muted mb-8">Manage your active agents and view execution history.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Agents */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Active Agents</h2>
          <div className="card">
            <p className="text-text-muted">TODO: Load active agents + render grid</p>
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Activity</h2>
          <div className="card">
            <p className="text-text-muted">TODO: Load execution logs + render feed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
