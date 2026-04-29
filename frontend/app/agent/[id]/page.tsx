// AMAN — Agent Detail Page
// Shows agent info, dynamic config form, price in SOL + USD, Activate button
// Route: /agent/[id]

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  // TODO (AMAN):
  // 1. Fetch agent by id from contracts.getAllAgents() or backend
  // 2. Render: name, type badge, description, price (SOL + USD via PriceDisplay)
  // 3. Dynamic config form — parse configSchema JSON from agent and render input fields
  // 4. "Activate" button → call activateAgent(id, configJSON) from lib/contracts.ts
  // 5. On success: show tx hash + Solana Explorer link → redirect to /dashboard
  // 6. Handle: loading, not found, insufficient SOL, wallet not connected

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="card">
        <p className="text-text-muted">TODO: Load agent #{params.id} and render detail + activate flow</p>
      </div>
    </div>
  );
}
