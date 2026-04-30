"use client";

import { useState } from "react";
import { publishAgent, AGENT_TYPE_LABELS } from "@/lib/contracts";
import { useWallet } from "@/context/WalletContext";
import { useSolPrice } from "@/context/SolPriceContext";
import AgentIcon from "@/components/AgentIcon";

const AGENT_TYPE_OPTIONS = ["trading", "farming", "scheduling", "rebalancing", "content", "business"];

const SCHEMA_PLACEHOLDER = `{
  "recipientAddress": "string",
  "amountSOL": "number",
  "frequency": "string"
}`;

export default function PublishSection() {
  const { connected, connect } = useWallet();
  const { solPriceUSD } = useSolPrice();

  const [name, setName] = useState("");
  const [agentType, setAgentType] = useState("trading");
  const [description, setDescription] = useState("");
  const [priceSOL, setPriceSOL] = useState("");
  const [configSchema, setConfigSchema] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const usdEstimate = priceSOL && solPriceUSD ? (parseFloat(priceSOL) * solPriceUSD).toFixed(2) : null;

  const handlePublish = async () => {
    if (!connected) {
      connect();
      return;
    }

    if (!name || !description || !priceSOL || parseFloat(priceSOL) <= 0) {
      setError("All fields are required and price must be greater than 0");
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      const result = await publishAgent({
        name,
        agentType,
        description,
        priceSOL: parseFloat(priceSOL),
        configSchema: configSchema || "{}",
      });
      setTxHash(result.txHash);
    } catch {
      setError("Transaction failed. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <section id="publish" className="relative min-h-screen px-4 py-24">
      <div className="relative mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-2 text-4xl font-bold tracking-tight" style={{ color: "#F5F5F0" }}>
            Publish New Agent
          </h2>
          <p className="text-sm" style={{ color: "#888880" }}>
            Deploy your AI agent to the Trovia marketplace on Solana
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="glass glow-golden p-8">
              {txHash ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-xl font-bold" style={{ color: "#F5F5F0" }}>
                    Agent Published!
                  </h3>
                  <p className="mb-4 text-sm" style={{ color: "#888880", fontFamily: "monospace" }}>
                    Tx: {txHash}
                  </p>
                  <a href="#marketplace" className="btn-golden">
                    View on Marketplace →
                  </a>
                </div>
              ) : (
                <>
                  <div className="space-y-6">
                    {/* Agent Name */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider" style={{ color: "#D4A853" }}>
                        Agent Name <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <input
                        className="input"
                        placeholder="e.g. Alpha Trading Agent"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    {/* Agent Type */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider" style={{ color: "#D4A853" }}>
                        Agent Type <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <select
                        className="input"
                        value={agentType}
                        onChange={(e) => setAgentType(e.target.value)}
                        style={{ cursor: "pointer" }}
                      >
                        {AGENT_TYPE_OPTIONS.map((t) => (
                          <option key={t} value={t} style={{ background: "#141412" }}>
                            {AGENT_TYPE_LABELS[t]}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider" style={{ color: "#D4A853" }}>
                        Description <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <textarea
                        className="input"
                        rows={4}
                        placeholder="Describe what your agent does..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{ resize: "vertical" }}
                      />
                    </div>

                    {/* Price */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider" style={{ color: "#D4A853" }}>
                        Price (SOL) <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <input
                        className="input"
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="e.g. 0.002"
                        value={priceSOL}
                        onChange={(e) => setPriceSOL(e.target.value)}
                      />
                      {usdEstimate && (
                        <p className="mt-1 text-xs" style={{ color: "#888880" }}>
                          ~${usdEstimate} USD
                        </p>
                      )}
                    </div>

                    {/* Config Schema */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider" style={{ color: "#D4A853" }}>
                        Configuration Schema
                      </label>
                      <textarea
                        className="input input-code"
                        rows={6}
                        placeholder={SCHEMA_PLACEHOLDER}
                        value={configSchema}
                        onChange={(e) => setConfigSchema(e.target.value)}
                        style={{ resize: "vertical" }}
                      />
                      <p className="mt-1 text-xs" style={{ color: "#555550" }}>
                        JSON object defining config fields users fill in when activating
                      </p>
                    </div>
                  </div>

                  <hr style={{ borderColor: "rgba(255,255,255,0.06)", margin: "24px 0" }} />

                  <div className="flex items-center justify-between">
                    <p className="text-sm" style={{ color: "#888880" }}>
                      Publishing fee: <span style={{ color: "#F5F5F0", fontFamily: "monospace" }}>0.001 SOL</span>
                    </p>
                    <button
                      onClick={handlePublish}
                      disabled={publishing}
                      className="btn-golden"
                      style={{ opacity: publishing ? 0.7 : 1 }}
                    >
                      {publishing ? "Publishing..." : connected ? "Publish Agent →" : "Connect Wallet"}
                    </button>
                  </div>

                  <p className="mt-3 text-center text-xs" style={{ color: "#555550" }}>
                    Transaction will be confirmed via Phantom on Devnet
                  </p>

                  {error && (
                    <p className="mt-3 text-center text-xs" style={{ color: "#EF4444" }}>
                      {error}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-2">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#D4A853" }}>
              Preview
            </p>
            <div className="glass p-6">
              <div className="mb-4">
                <span className={`badge badge-${agentType}`}>
                  {AGENT_TYPE_LABELS[agentType]}
                </span>
              </div>

              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(212, 168, 83, 0.1)" }}>
                  <AgentIcon type={agentType} size={20} />
                </div>
                <h3 className="text-base font-bold" style={{ color: "#F5F5F0" }}>
                  {name || "Agent Name"}
                </h3>
              </div>

              <p className="mb-4 text-sm leading-relaxed" style={{ color: "#888880" }}>
                {description || "Agent description will appear here..."}
              </p>

              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold" style={{ color: "#F5F5F0", fontFamily: "monospace" }}>
                  {priceSOL || "0.000"} SOL
                </span>
                {usdEstimate && (
                  <span className="text-xs" style={{ color: "#666660", fontFamily: "monospace" }}>
                    · ~${usdEstimate}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
