"use client";

import Link from "next/link";
import { Agent, AGENT_TYPE_LABELS } from "@/lib/contracts";
import { useSolPrice } from "@/context/SolPriceContext";
import AgentIcon from "./AgentIcon";

const BADGE_CLASS: Record<string, string> = {
  trading: "badge-trading",
  farming: "badge-farming",
  scheduling: "badge-scheduling",
  rebalancing: "badge-rebalancing",
  content: "badge-content",
  business: "badge-business",
};

export default function AgentCard({ agent }: { agent: Agent }) {
  const { solPriceUSD } = useSolPrice();
  const usdPrice = solPriceUSD ? (agent.priceSOL * solPriceUSD).toFixed(2) : "...";

  return (
    <Link
      href={`?agent=${agent.id}`}
      className="group block no-underline transition-all duration-300"
      style={{ textDecoration: "none" }}
    >
      <div
        className="glass relative overflow-hidden p-6 transition-all duration-300"
        style={{
          borderColor: "rgba(255,255,255,0.08)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(212, 168, 83, 0.3)";
          e.currentTarget.style.boxShadow = "0 0 30px rgba(212, 168, 83, 0.08)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {/* Badge */}
        <div className="mb-4">
          <span className={`badge ${BADGE_CLASS[agent.agentType]}`}>
            {AGENT_TYPE_LABELS[agent.agentType]}
          </span>
        </div>

        {/* Icon + Name */}
        <div className="mb-3 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "rgba(212, 168, 83, 0.1)" }}
          >
            <AgentIcon type={agent.agentType} size={20} />
          </div>
          <h3 className="text-base font-bold" style={{ color: "#F5F5F0" }}>
            {agent.name}
          </h3>
        </div>

        {/* Description */}
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: "#888880" }}
        >
          {agent.description}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span
            className="text-sm font-bold"
            style={{ color: "#F5F5F0", fontFamily: "monospace" }}
          >
            {agent.priceSOL} SOL
          </span>
          <span
            className="text-xs"
            style={{ color: "#666660", fontFamily: "monospace" }}
          >
            · ~${usdPrice}
          </span>
        </div>

        {/* Activations */}
        <div className="mt-3 flex items-center justify-between text-xs" style={{ color: "#555550" }}>
          <span>{agent.totalActivations.toLocaleString()} activations</span>
          <span>{agent.successRate}% success</span>
        </div>
      </div>
    </Link>
  );
}
