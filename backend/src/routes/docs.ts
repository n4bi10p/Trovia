import { Router, Request, Response } from 'express';

export const docsRoutes = Router();

docsRoutes.get('/', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Trovia API Docs</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f0f1a; color: #f0f0fc; min-height: 100vh; padding: 32px 24px; }
    h1 { font-size: 28px; font-weight: 700; color: #a78bfa; margin-bottom: 4px; }
    .subtitle { color: #8888aa; font-size: 14px; margin-bottom: 32px; }
    .status-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 32px; background: #1a1a2e; border: 1px solid #2e2e50; border-radius: 8px; padding: 10px 16px; font-size: 13px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
    .section { margin-bottom: 40px; }
    .section-title { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #8888aa; margin-bottom: 12px; border-bottom: 1px solid #2e2e50; padding-bottom: 8px; }
    .endpoint { background: #1a1a2e; border: 1px solid #2e2e50; border-radius: 10px; margin-bottom: 12px; overflow: hidden; }
    .endpoint-header { display: flex; align-items: center; gap: 12px; padding: 14px 16px; cursor: pointer; user-select: none; }
    .endpoint-header:hover { background: #252540; }
    .method { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; letter-spacing: .5px; min-width: 42px; text-align: center; }
    .get  { background: #064e3b; color: #34d399; }
    .post { background: #1e3a5f; color: #60a5fa; }
    .path { font-family: 'Cascadia Code', 'Fira Code', monospace; font-size: 14px; color: #e0e0fc; flex: 1; }
    .desc { font-size: 13px; color: #8888aa; }
    .endpoint-body { padding: 0 16px 16px; display: none; }
    .endpoint-body.open { display: block; }
    .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #a78bfa; margin: 12px 0 6px; }
    pre { background: #0f0f1a; border: 1px solid #2e2e50; border-radius: 6px; padding: 12px; font-family: 'Cascadia Code', 'Fira Code', monospace; font-size: 12px; color: #a5f3fc; overflow-x: auto; white-space: pre-wrap; }
    .try-btn { background: #7c3aed; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; margin-top: 12px; transition: background .2s; }
    .try-btn:hover { background: #6d28d9; }
    .response-box { margin-top: 10px; background: #0f0f1a; border: 1px solid #2e2e50; border-radius: 6px; padding: 12px; font-family: monospace; font-size: 12px; color: #86efac; min-height: 40px; white-space: pre-wrap; display: none; }
    .response-box.visible { display: block; }
    .loading { color: #a78bfa; }
  </style>
</head>
<body>
  <h1>⚡ Trovia API</h1>
  <p class="subtitle">Backend · Solana Devnet · Gemini AI · v1.0 · Running on port 8080</p>

  <div class="status-bar">
    <span class="dot"></span>
    <span>Server is live — <strong>http://localhost:8080</strong></span>
    <span style="margin-left:auto;color:#8888aa">Cluster: devnet</span>
  </div>

  <!-- Health -->
  <div class="section">
    <div class="section-title">System</div>
    <div class="endpoint">
      <div class="endpoint-header" onclick="toggle(this)">
        <span class="method get">GET</span>
        <span class="path">/api/health</span>
        <span class="desc">Server health + cluster info</span>
      </div>
      <div class="endpoint-body">
        <div class="label">Response</div>
        <pre>{ "status": "ok", "service": "trovia-backend", "timestamp": "...", "cluster": "devnet" }</pre>
        <button class="try-btn" onclick="tryIt(this, 'GET', '/api/health')">▶ Try it</button>
        <div class="response-box"></div>
      </div>
    </div>
  </div>

  <!-- Agents -->
  <div class="section">
    <div class="section-title">AI Agents — POST /api/agents/*</div>

    ${makeEndpoint('content', 'Content Reply Agent', 'Returns exactly 3 reply options for any message in the chosen tone.',
      `{ "agentId": "4", "userConfig": { "walletAddress": "YourWallet...", "message": "Just launched my startup!", "tone": "Casual" } }`,
      `{ "replies": [{ "reply": "..." }, { "reply": "..." }, { "reply": "..." }] }`
    )}

    ${makeEndpoint('business', 'Business Assistant Agent', 'Answers business questions with Answer / Key Points / Next Step structure.',
      `{ "agentId": "5", "userConfig": { "walletAddress": "YourWallet...", "businessContext": "SaaS for restaurants", "query": "How should I price my product?" } }`,
      `{ "response": "**Answer:**\\n...\\n**Key Points:**\\n...\\n**Recommended Next Step:**\\n..." }`
    )}

    ${makeEndpoint('trading', 'Trading Agent', 'Fetches live SOL price and triggers Gemini analysis if threshold is breached.',
      `{ "agentId": "0", "userConfig": { "walletAddress": "YourWallet...", "tokenPair": "SOL/USDC", "thresholdPrice": 999, "action": "alert" } }`,
      `{ "currentPrice": 145.2, "thresholdPrice": 999, "thresholdHit": true, "analysis": "SOL is trading at..." }`
    )}

    ${makeEndpoint('farming', 'Farming Agent', 'Returns current APY for a pool and Gemini compound recommendation.',
      `{ "agentId": "1", "userConfig": { "walletAddress": "YourWallet...", "poolAddress": "orca_sol_usdc", "compoundThreshold": 12 } }`,
      `{ "currentAPY": 18.5, "poolName": "SOL-USDC (Orca)", "shouldCompound": true, "recommendation": "...", "note": "Simulated on Devnet" }`
    )}

    ${makeEndpoint('rebalancing', 'Rebalancing Agent', 'Checks portfolio drift vs target allocation and recommends rebalancing.',
      `{ "agentId": "3", "userConfig": { "walletAddress": "YourWallet...", "targetAllocation": { "SOL": 60, "USDC": 40 }, "driftTolerance": 5 } }`,
      `{ "currentAllocation": { "SOL": 75, "USDC": 25 }, "targetAllocation": { "SOL": 60, "USDC": 40 }, "driftDetected": true, "recommendation": "..." }`
    )}

    ${makeEndpoint('scheduling', 'Scheduling Agent', 'Creates a recurring SOL payment job saved to Supabase.',
      `{ "agentId": "2", "userConfig": { "walletAddress": "YourWallet...", "recipientAddress": "RecipientPubkey...", "amountSOL": 0.01, "frequency": "daily", "startDate": "2026-05-01T00:00:00Z" } }`,
      `{ "jobId": "uuid...", "recipientAddress": "...", "amountSOL": 0.01, "frequency": "daily", "nextRunAt": "..." }`
    )}
  </div>

  <!-- Logs -->
  <div class="section">
    <div class="section-title">Logs</div>
    <div class="endpoint">
      <div class="endpoint-header" onclick="toggle(this)">
        <span class="method get">GET</span>
        <span class="path">/api/agents/logs?wallet=&lt;address&gt;</span>
        <span class="desc">Last 20 execution logs for a wallet</span>
      </div>
      <div class="endpoint-body">
        <div class="label">Query Params</div>
        <pre>wallet=YourSolanaPublicKey...</pre>
        <div class="label">Response</div>
        <pre>{ "logs": [{ "agent_id": "4", "action": "content_reply", "executed_at": "...", ... }] }</pre>
        <button class="try-btn" onclick="tryIt(this, 'GET', '/api/agents/logs?wallet=test123')">▶ Try it</button>
        <div class="response-box"></div>
      </div>
    </div>
  </div>

  <script>
    function toggle(header) {
      const body = header.nextElementSibling;
      body.classList.toggle('open');
    }

    async function tryIt(btn, method, path) {
      const box = btn.nextElementSibling;
      box.classList.add('visible');
      box.textContent = 'Loading...';
      box.className = 'response-box visible loading';

      // For POST endpoints, extract sample body from the pre tag above the button
      let body = null;
      if (method === 'POST') {
        const pres = btn.closest('.endpoint-body').querySelectorAll('pre');
        try { body = pres[0].textContent; } catch {}
      }

      try {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) opts.body = body;
        const r = await fetch(path, opts);
        const data = await r.json();
        box.className = 'response-box visible';
        box.textContent = JSON.stringify(data, null, 2);
      } catch (e) {
        box.className = 'response-box visible';
        box.style.color = '#f87171';
        box.textContent = 'Error: ' + e.message;
      }
    }
  </script>
</body>
</html>`);
});

function makeEndpoint(slug: string, name: string, desc: string, reqBody: string, respBody: string): string {
  return `
    <div class="endpoint">
      <div class="endpoint-header" onclick="toggle(this)">
        <span class="method post">POST</span>
        <span class="path">/api/agents/${slug}</span>
        <span class="desc">${desc}</span>
      </div>
      <div class="endpoint-body">
        <div class="label">Request Body</div>
        <pre>${reqBody.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        <div class="label">Response</div>
        <pre>${respBody.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        <button class="try-btn" onclick="tryIt(this, 'POST', '/api/agents/${slug}')">▶ Try it</button>
        <div class="response-box"></div>
      </div>
    </div>`;
}
