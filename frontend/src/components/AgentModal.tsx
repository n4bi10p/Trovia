"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAgentById, activateAgent, Agent, AGENT_TYPE_LABELS } from "@/lib/contracts";
import { useWallet } from "@/context/WalletContext";
import { useSolPrice } from "@/context/SolPriceContext";
import AgentIcon from "@/components/AgentIcon";

export default function AgentModal() {
  return (
    <Suspense fallback={null}>
      <AgentModalInner />
    </Suspense>
  );
}

function AgentModalInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get("agent");
  const mode = searchParams.get("mode") || "detail"; // "detail" or "run"

  const { connected, connect } = useWallet();
  const { solPriceUSD } = useSolPrice();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(false);

  // Detail state
  const [config, setConfig] = useState<Record<string, string>>({});
  const [activating, setActivating] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Run state
  const [runResult, setRunResult] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role: string; content: string}[]>([]);

  useEffect(() => {
    if (agentId) {
      setLoading(true);
      getAgentById(agentId).then((a) => {
        setAgent(a);
        if (a && a.configSchema) {
          try {
            const schema = JSON.parse(a.configSchema);
            const initial: Record<string, string> = {};
            Object.keys(schema).forEach((k) => (initial[k] = ""));
            setConfig(initial);
          } catch (e) {}
        }
        setLoading(false);
      });
    } else {
      setAgent(null);
      setTxHash(null);
      setError(null);
      setRunResult(null);
      setMessages([]);
    }
  }, [agentId]);

  const closeModal = () => {
    router.push(window.location.pathname, { scroll: false });
  };

  const handleActivate = async () => {
    if (!connected) {
      connect();
      return;
    }
    if (!agent) return;
    setActivating(true);
    setError(null);
    try {
      const result = await activateAgent(agent.id, JSON.stringify(config));
      setTxHash(result.txHash);
    } catch {
      setError("Transaction failed. Please try again.");
    } finally {
      setActivating(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    await new Promise((r) => setTimeout(r, 2000));
    setRunResult("Execution successful! See dashboard for logs.");
    setRunning(false);
  };

  if (!agentId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md transition-all">
      <div 
        className="glass relative max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6 md:p-8"
        style={{ border: "1px solid rgba(212, 168, 83, 0.3)", boxShadow: "0 0 80px rgba(212, 168, 83, 0.1)" }}
      >
        <button 
          onClick={closeModal}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-amber-500" />
          </div>
        ) : !agent ? (
          <div className="py-12 text-center text-white">Agent not found.</div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {/* Left Col - Agent Info */}
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "rgba(212, 168, 83, 0.1)", color: "#D4A853" }}>
                <AgentIcon type={agent.agentType} size={14} />
                {AGENT_TYPE_LABELS[agent.agentType]}
              </div>
              
              <h2 className="mb-2 text-3xl font-bold text-[#F5F5F0]">{agent.name}</h2>
              <p className="mb-6 text-sm text-[#888880]">{agent.description}</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="glass-sm p-3">
                  <p className="text-xs uppercase text-[#888880]">Activations</p>
                  <p className="text-lg font-bold text-[#F5F5F0]">{agent.totalActivations}</p>
                </div>
                <div className="glass-sm p-3">
                  <p className="text-xs uppercase text-[#888880]">Success Rate</p>
                  <p className="text-lg font-bold text-[#F5F5F0]">{agent.successRate}%</p>
                </div>
              </div>
            </div>

            {/* Right Col - Action (Detail config or Run mode) */}
            <div className="glass-sm p-6">
              {mode === "detail" ? (
                <>
                  <div className="mb-6">
                    <p className="text-2xl font-bold text-[#F5F5F0]">{agent.priceSOL} SOL</p>
                    <p className="text-sm text-[#888880]">~${(agent.priceSOL * (solPriceUSD || 178)).toFixed(2)} USD</p>
                  </div>

                  <div className="mb-6 space-y-4">
                    {Object.entries(config).map(([key]) => (
                      <div key={key}>
                        <label className="mb-1 block text-xs font-medium uppercase text-[#888880]">{key}</label>
                        <input
                          className="input"
                          placeholder={`Enter ${key}`}
                          value={config[key]}
                          onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>

                  {txHash ? (
                    <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-center">
                      <p className="text-sm font-semibold text-green-500">Activated Successfully!</p>
                      <button onClick={closeModal} className="btn-golden mt-4 w-full justify-center">Close</button>
                    </div>
                  ) : (
                    <button onClick={handleActivate} disabled={activating} className="btn-golden w-full justify-center">
                      {activating ? "Activating..." : "Activate Agent"}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <h3 className="mb-4 text-lg font-bold text-[#F5F5F0]">Run Agent</h3>
                  <button onClick={handleRun} disabled={running} className="btn-golden mb-4 w-full justify-center">
                    {running ? "Executing..." : "Run Now"}
                  </button>
                  {runResult && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-[#F5F5F0]">
                      {runResult}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
