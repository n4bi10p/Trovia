// AMAN — Agent Run / Chat Page
// For Content + Business agents: chat interface
// For Trading/Farming/Rebalancing: status + "Run Now"
// For Scheduling: next run time + last tx hash + Explorer link
// Route: /agent/[id]/run

export default function AgentRunPage({ params }: { params: { id: string } }) {
  // TODO (AMAN):
  // 1. Load agent by id (type determines which UI to show)
  // 2. Content + Business: chat input → POST $NEXT_PUBLIC_API_URL/api/agents/{type} → render response
  // 3. Trading/Farming/Rebalancing: "Run Now" → POST → show result card
  // 4. Scheduling: show job status from backend/Supabase (last tx hash, next run)
  // 5. All: show execution history from GET /api/agents/logs?wallet=...

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="card">
        <p className="text-text-muted">TODO: Agent run interface for agent #{params.id}</p>
      </div>
    </div>
  );
}
