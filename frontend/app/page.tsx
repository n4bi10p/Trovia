// AMAN — Landing Page
// Design spec: hero section with headline, tagline, Connect Wallet CTA, 3 feature cards
// Reference: FINAL_PRD.md Section 7

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      {/* Hero */}
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="badge bg-primary/20 text-primary-light mb-6">
          Built on Solana · Powered by Gemini 2.5 Flash
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-6 leading-tight">
          The On-Chain{' '}
          <span className="text-primary">AI Agent</span>
          {' '}Marketplace
        </h1>
        <p className="text-xl text-text-muted mb-10 max-w-2xl mx-auto">
          Discover, activate, and interact with AI agents on Solana.
          Pay in SOL. Every action is verifiably on-chain.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="/marketplace" className="btn-primary text-lg px-8 py-3">
            Browse Agents
          </a>
          <a href="/publish" className="btn-secondary text-lg px-8 py-3">
            Publish Agent
          </a>
        </div>
      </div>

      {/* Feature cards — AMAN: implement with Madhura's spec */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-4xl w-full">
        {[
          { title: 'On-Chain Payments', desc: 'Pay in SOL. Developer receives instantly. No intermediaries.', icon: '⛓️' },
          { title: 'Gemini-Powered AI', desc: 'Every agent is backed by Google Gemini 2.5 Flash for real intelligence.', icon: '🧠' },
          { title: 'Verifiable Execution', desc: 'Every activation and execution is a real Solana transaction you can verify.', icon: '🔍' },
        ].map((f) => (
          <div key={f.title} className="card text-left">
            <div className="text-3xl mb-4">{f.icon}</div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">{f.title}</h3>
            <p className="text-text-muted text-sm">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
