"use client";

import { useEffect, useState } from "react";
import { getAllAgents, Agent, AGENT_TYPES } from "@/lib/contracts";
import AgentCard from "@/components/AgentCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";

const TYPE_MAP: Record<string, string> = {
  All: "",
  Trading: "trading",
  Farming: "farming",
  Scheduling: "scheduling",
  Rebalancing: "rebalancing",
  "Content Reply": "content",
  "Business Assistant": "business",
};

export default function MarketplaceSection() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    getAllAgents().then((data) => {
      setAgents(data);
      setLoading(false);
    });
  }, []);

  const filtered =
    activeFilter === "All"
      ? agents
      : agents.filter((a) => a.agentType === TYPE_MAP[activeFilter]);

  return (
    <section id="marketplace" className="relative min-h-screen px-4 py-24">
      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2
            className="mb-2 text-4xl font-bold tracking-tight"
            style={{ color: "#F5F5F0" }}
          >
            Marketplace
          </h2>
          <p className="text-sm" style={{ color: "#888880" }}>
            Discover and deploy autonomous AI agents on Solana
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-12 flex flex-wrap justify-center gap-2">
          {AGENT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className="px-4 py-2 text-sm font-medium transition-all"
              style={{
                borderRadius: "999px",
                border:
                  activeFilter === type
                    ? "1px solid rgba(212, 168, 83, 0.4)"
                    : "1px solid rgba(255, 255, 255, 0.08)",
                background:
                  activeFilter === type
                    ? "rgba(212, 168, 83, 0.1)"
                    : "rgba(20, 20, 18, 0.5)",
                color: activeFilter === type ? "#D4A853" : "#888880",
                cursor: "pointer",
                backdropFilter: "blur(8px)",
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Agent Grid */}
        {loading ? (
          <LoadingSkeleton count={6} />
        ) : filtered.length === 0 ? (
          <div className="glass flex flex-col items-center justify-center py-20">
            <p className="mb-2 text-lg font-medium" style={{ color: "#F5F5F0" }}>
              No agents found
            </p>
            <p className="mb-4 text-sm" style={{ color: "#888880" }}>
              Try a different filter or check back later.
            </p>
            <button
              onClick={() => setActiveFilter("All")}
              className="btn-secondary text-sm"
            >
              Show All Agents
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((agent, i) => (
              <div
                key={agent.id}
                className="animate-fadeInUp"
                style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
              >
                <AgentCard agent={agent} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
