'use client';
// AMAN — AgentCard component
// MADHURA: Style this card — it's the most important UI element on the marketplace

import Link from 'next/link';
import { Agent } from '@/lib/contracts';

const AGENT_TYPE_COLORS: Record<string, string> = {
  trading:     'bg-blue-500/20 text-blue-400',
  farming:     'bg-emerald-500/20 text-emerald-400',
  scheduling:  'bg-purple-500/20 text-purple-400',
  rebalancing: 'bg-amber-500/20 text-amber-400',
  content:     'bg-pink-500/20 text-pink-400',
  business:    'bg-indigo-500/20 text-indigo-400',
};

const AGENT_TYPE_ICONS: Record<string, string> = {
  trading: '📈', farming: '🌾', scheduling: '📅',
  rebalancing: '⚖️', content: '✍️', business: '💼',
};

interface AgentCardProps {
  agent: Agent;
  solPriceUSD?: number; // from PriceDisplay context
}

export function AgentCard({ agent, solPriceUSD }: AgentCardProps) {
  const priceSOL = agent.priceLamports / 1_000_000_000;
  const priceUSD = solPriceUSD ? (priceSOL * solPriceUSD).toFixed(2) : null;

  return (
    <Link href={`/agent/${agent.id}`} className="card-hover group block animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <span className="text-3xl">{AGENT_TYPE_ICONS[agent.agentType] ?? '🤖'}</span>
        <span className={`badge ${AGENT_TYPE_COLORS[agent.agentType] ?? 'bg-bg-elevated text-text-muted'}`}>
          {agent.agentType.charAt(0).toUpperCase() + agent.agentType.slice(1)}
        </span>
      </div>

      {/* Name */}
      <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
        {agent.name}
      </h3>

      {/* Description */}
      <p className="text-text-muted text-sm mb-4 line-clamp-2">
        {agent.description}
      </p>

      {/* Footer: price + CTA */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          <span className="font-semibold text-text-primary">{priceSOL.toFixed(4)} SOL</span>
          {priceUSD && (
            <span className="text-text-muted text-xs ml-2">~${priceUSD}</span>
          )}
        </div>
        <span className="text-primary text-sm font-medium group-hover:underline">
          Activate →
        </span>
      </div>
    </Link>
  );
}
