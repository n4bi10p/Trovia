// ═══════════════════════════════════════════
// TROVIA — Mock Agent Data & Contract Stubs
// Replace with real Anchor calls after Nabil deploys
// ═══════════════════════════════════════════

export interface Agent {
  id: string;
  name: string;
  agentType: "trading" | "farming" | "scheduling" | "rebalancing" | "content" | "business";
  description: string;
  priceSOL: number;
  creator: string;
  configSchema: string;
  totalActivations: number;
  successRate: number;
}

export const AGENT_TYPES = [
  "All",
  "Trading",
  "Farming",
  "Scheduling",
  "Rebalancing",
  "Content Reply",
  "Business Assistant",
] as const;

export const AGENT_TYPE_LABELS: Record<string, string> = {
  trading: "Trading",
  farming: "Farming",
  scheduling: "Scheduling",
  rebalancing: "Rebalancing",
  content: "Content Reply",
  business: "Business Assistant",
};

const MOCK_AGENTS: Agent[] = [
  {
    id: "1",
    name: "Alpha Trading Agent",
    agentType: "trading",
    description: "Gets alerted and acts when your token hits your price target.",
    priceSOL: 0.002,
    creator: "7znV8...4kF2",
    configSchema: JSON.stringify({
      tokenPair: "string",
      thresholdPrice: "number",
      alertType: "string",
    }),
    totalActivations: 1247,
    successRate: 98.2,
  },
  {
    id: "2",
    name: "Yield Farming Agent",
    agentType: "farming",
    description: "Monitors your LP yield and tells you exactly when to compound.",
    priceSOL: 0.003,
    creator: "9xkP3...8mN1",
    configSchema: JSON.stringify({
      poolAddress: "string",
      apyThreshold: "number",
    }),
    totalActivations: 834,
    successRate: 96.5,
  },
  {
    id: "3",
    name: "Auto Scheduler",
    agentType: "scheduling",
    description: "Sends recurring SOL payments automatically — set it and forget it.",
    priceSOL: 0.001,
    creator: "4mBv7...2jK9",
    configSchema: JSON.stringify({
      recipientAddress: "string",
      amountSOL: "number",
      frequency: "string",
    }),
    totalActivations: 2103,
    successRate: 99.1,
  },
  {
    id: "4",
    name: "Portfolio Rebalancer",
    agentType: "rebalancing",
    description: "Watches your portfolio drift and tells you how to rebalance.",
    priceSOL: 0.004,
    creator: "6hTw2...5pQ3",
    configSchema: JSON.stringify({
      targetAllocation: "string",
      driftTolerance: "number",
    }),
    totalActivations: 561,
    successRate: 94.8,
  },
  {
    id: "5",
    name: "Content Reply Agent",
    agentType: "content",
    description: "Generates 3 ready-to-send replies for any message in your tone.",
    priceSOL: 0.002,
    creator: "3nRx1...7wL4",
    configSchema: JSON.stringify({
      tone: "string",
      style: "string",
    }),
    totalActivations: 1892,
    successRate: 97.3,
  },
  {
    id: "6",
    name: "Business Assistant",
    agentType: "business",
    description: "Answers any business question, drafts emails, and writes proposals.",
    priceSOL: 0.005,
    creator: "8vCd4...1nB6",
    configSchema: JSON.stringify({
      businessContext: "string",
      responseFormat: "string",
    }),
    totalActivations: 723,
    successRate: 95.9,
  },
];

// ── Public API (mock) ──────────────────────
export async function getAllAgents(): Promise<Agent[]> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 300));
  return MOCK_AGENTS;
}

export async function getAgentById(id: string): Promise<Agent | null> {
  await new Promise((r) => setTimeout(r, 200));
  return MOCK_AGENTS.find((a) => a.id === id) || null;
}

export async function publishAgent(args: {
  name: string;
  agentType: string;
  description: string;
  priceSOL: number;
  configSchema: string;
}): Promise<{ txHash: string }> {
  // TODO: Replace with real Anchor publishAgent instruction
  await new Promise((r) => setTimeout(r, 1500));
  return { txHash: "5Kz7...mock...txHash" };
}

export async function activateAgent(
  agentId: string,
  config: string
): Promise<{ txHash: string }> {
  // TODO: Replace with real Anchor activateAgent instruction
  await new Promise((r) => setTimeout(r, 2000));
  return { txHash: "3xR9...mock...txHash" };
}

export async function getUserActivations(walletAddress: string): Promise<
  { agentId: string; agent: Agent; status: "running" | "idle"; activatedAt: string }[]
> {
  await new Promise((r) => setTimeout(r, 400));
  if (!walletAddress) return [];
  return [
    { agentId: "1", agent: MOCK_AGENTS[0], status: "running", activatedAt: "2026-04-30T08:00:00Z" },
    { agentId: "3", agent: MOCK_AGENTS[2], status: "running", activatedAt: "2026-04-29T14:30:00Z" },
    { agentId: "5", agent: MOCK_AGENTS[4], status: "idle", activatedAt: "2026-04-28T10:15:00Z" },
  ];
}

export interface ExecutionLog {
  id: string;
  agentId: string;
  agentType: string;
  action: string;
  timestamp: string;
  txHash: string;
}

export async function getExecutionLogs(walletAddress: string): Promise<ExecutionLog[]> {
  await new Promise((r) => setTimeout(r, 300));
  if (!walletAddress) return [];
  return [
    { id: "1", agentId: "1", agentType: "trading", action: "Trading alert triggered — SOL crossed $178", timestamp: "2 min ago", txHash: "5Kz7...8xN2" },
    { id: "2", agentId: "3", agentType: "scheduling", action: "Scheduled payment sent — 0.01 SOL", timestamp: "1 hour ago", txHash: "3xR9...4mB1" },
    { id: "3", agentId: "5", agentType: "content", action: "Generated 3 replies for message", timestamp: "3 hours ago", txHash: "7wL4...2jK9" },
    { id: "4", agentId: "1", agentType: "trading", action: "Trading analysis completed", timestamp: "5 hours ago", txHash: "9xkP...5pQ3" },
  ];
}
