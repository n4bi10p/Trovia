"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { getUserActivations, getExecutionLogs, ExecutionLog, AGENT_TYPE_LABELS } from "@/lib/contracts";
import AgentIcon from "@/components/AgentIcon";
import Link from "next/link";

export default function DashboardSection() {
  const { connected, connect, address } = useWallet();
  const [activations, setActivations] = useState<Awaited<ReturnType<typeof getUserActivations>>>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (connected && address) {
      Promise.all([
        getUserActivations(address),
        getExecutionLogs(address),
      ]).then(([acts, lgs]) => {
        setActivations(acts);
        setLogs(lgs);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [connected, address]);

  if (!connected) {
    return (
      <section id="dashboard" className="relative min-h-screen px-4 py-24 flex items-center justify-center">
        <div className="glass glow-golden p-12 text-center" style={{ maxWidth: "420px" }}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "rgba(212, 168, 83, 0.1)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4A853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a4 4 0 0 0-8 0v2" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold" style={{ color: "#F5F5F0" }}>
            Connect Your Wallet
          </h2>
          <p className="mb-6 text-sm" style={{ color: "#888880" }}>
            Connect your Phantom wallet to view your active agents and execution history.
          </p>
          <button onClick={connect} className="btn-golden w-full justify-center">
            Connect Wallet
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="dashboard" className="relative min-h-screen px-4 py-24">
      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-4xl font-bold tracking-tight" style={{ color: "#F5F5F0" }}>
            My Dashboard
          </h2>
          <p className="text-sm" style={{ color: "#888880" }}>
            Manage your active agents and track execution history
          </p>
        </div>

        {/* Stats Row */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              label: "Active Agents",
              value: loading ? "..." : activations.length.toString(),
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4A853" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 12l2 2 4-4" /></svg>
              ),
            },
            {
              label: "Total Spent",
              value: "0.006 SOL",
              icon: (
                <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg, #9945FF, #14F195)" }}>
                  <span className="text-[8px] font-bold text-white">S</span>
                </div>
              ),
            },
            {
              label: "Executions",
              value: loading ? "..." : "47",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4A853" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              ),
            },
          ].map((stat) => (
            <div key={stat.label} className="glass p-5">
              <div className="mb-2 flex items-center gap-2">
                {stat.icon}
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#888880" }}>
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl font-bold" style={{ color: "#F5F5F0" }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Active Agents (left) */}
          <div className="lg:col-span-3">
            <h3 className="mb-4 text-lg font-semibold" style={{ color: "#F5F5F0" }}>
              Active Agents
            </h3>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass p-5">
                    <div className="flex items-center gap-4">
                      <div className="skeleton h-10 w-10 rounded-xl" />
                      <div className="flex-1">
                        <div className="skeleton mb-2 h-4 w-32" />
                        <div className="skeleton h-3 w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activations.length === 0 ? (
              <div className="glass flex flex-col items-center py-12">
                <p className="mb-2 text-sm" style={{ color: "#888880" }}>No active agents yet</p>
                <a href="#marketplace" className="btn-secondary text-sm">Browse the Marketplace →</a>
              </div>
            ) : (
              <div className="space-y-4">
                {activations.map((act) => (
                  <div
                    key={act.agentId}
                    className="glass flex items-center justify-between p-5 transition-all duration-200"
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(212,168,83,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(212, 168, 83, 0.1)" }}>
                        <AgentIcon type={act.agent.agentType} size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#F5F5F0" }}>
                          {act.agent.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`badge badge-${act.agent.agentType}`} style={{ fontSize: "10px", padding: "2px 6px" }}>
                            {AGENT_TYPE_LABELS[act.agent.agentType]}
                          </span>
                          <span className="flex items-center gap-1 text-xs" style={{ color: act.status === "running" ? "#10B981" : "#888880" }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: act.status === "running" ? "#10B981" : "#888880" }} />
                            {act.status === "running" ? "Running" : "Idle"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link href={`?agent=${act.agentId}&mode=run`} className="btn-golden px-4 py-2 text-xs">
                      Run →
                    </Link>
                  </div>
                ))}

                <a
                  href="#marketplace"
                  className="mt-2 block text-center text-sm transition-colors hover:text-amber-400"
                  style={{ color: "#D4A853", textDecoration: "none" }}
                >
                  Activate more agents from the Marketplace →
                </a>
              </div>
            )}
          </div>

          {/* Activity Feed (right) */}
          <div className="lg:col-span-2">
            <h3 className="mb-4 text-lg font-semibold" style={{ color: "#F5F5F0" }}>
              Activity Feed
            </h3>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-sm p-4">
                    <div className="skeleton mb-2 h-4 w-full" />
                    <div className="skeleton h-3 w-20" />
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="glass-sm py-8 text-center">
                <p className="text-sm" style={{ color: "#888880" }}>No activity yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="glass-sm p-4"
                    style={{ borderLeft: "2px solid rgba(212, 168, 83, 0.3)" }}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <AgentIcon type={log.agentType} size={14} />
                      <p className="flex-1 text-sm" style={{ color: "#F5F5F0" }}>
                        {log.action}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "#555550" }}>
                        {log.timestamp}
                      </span>
                      <a href="#" className="text-xs" style={{ color: "#D4A853", textDecoration: "none" }}>
                        View on Explorer →
                      </a>
                    </div>
                  </div>
                ))}

                <a href="#" className="mt-2 block text-center text-xs" style={{ color: "#D4A853", textDecoration: "none" }}>
                  View All Activity →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
