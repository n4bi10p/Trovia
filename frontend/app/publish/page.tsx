// AMAN — Publish Agent Page
// Form for developers to publish an agent to the marketplace
// Route: /publish

export default function PublishPage() {
  // TODO (AMAN):
  // 1. Form fields: name, type (dropdown), description, price (SOL input), config schema (JSON textarea)
  // 2. Price input: show estimated USD below using PriceDisplay
  // 3. Config schema: help text explaining it's a JSON object of required fields
  // 4. Submit → call publishAgent(args) from lib/contracts.ts → Phantom popup
  // 5. On success: show tx hash + "Your agent is now live on the marketplace" → link to /marketplace
  // 6. Validation: require wallet connected, all fields filled, valid SOL amount

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-2">Publish an Agent</h1>
      <p className="text-text-muted mb-8">List your AI agent on the Trovia marketplace. Earn SOL every time someone activates it.</p>

      <div className="card space-y-6">
        <p className="text-text-muted">TODO: Build publish form — name, type, description, price, config schema</p>
      </div>
    </div>
  );
}
