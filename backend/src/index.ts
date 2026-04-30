import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { agentRoutes } from './routes/agents';
import { cronRoutes } from './cron/scheduling';
import { docsRoutes } from './routes/docs';
import { messagingRoutes } from './routes/messaging';
import { voiceRoutes } from './routes/voice';
import { analyticsRoutes } from './routes/analytics';
import { reviewsRoutes } from './routes/reviews';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.static('.'));  // serves api-tester.html at http://localhost:8080/api-tester.html


// ── Health check (hit this before demo to warm up Cloud Run) ─────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'trovia-backend',
    timestamp: new Date().toISOString(),
    cluster: process.env.SOLANA_CLUSTER || 'devnet',
  });
});

// ── Route inspector — GET /api/routes ─────────────────────────────────────────
// Lists every registered Express route with its HTTP method and full path.
// Useful during development to confirm routes are mounted correctly.
app.get('/api/routes', (_req, res) => {
  type RouteEntry = { method: string; path: string };
  const routes: RouteEntry[] = [];

  function extractRoutes(stack: any[], prefix = '') {
    for (const layer of stack) {
      if (layer.route) {
        // Direct route (app.get / app.post etc.)
        const methods = Object.keys(layer.route.methods)
          .filter((m) => layer.route.methods[m])
          .map((m) => m.toUpperCase());
        for (const method of methods) {
          routes.push({ method, path: prefix + layer.route.path });
        }
      } else if (layer.name === 'router' && layer.handle?.stack) {
        // Mounted sub-router — resolve the prefix from its regexp
        const match = layer.regexp?.source?.match(/^\\\/([^\\?]*)\\\//);
        const subPrefix = match
          ? '/' + match[1].replace(/\\\//g, '/')
          : prefix;
        extractRoutes(layer.handle.stack, subPrefix);
      }
    }
  }

  extractRoutes((app as any)._router.stack);

  // Sort: by path then method
  routes.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

  res.json({
    total: routes.length,
    routes,
  });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/agents', agentRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/docs', docsRoutes);

// ── Feature 1: Telegram & WhatsApp messaging ──────────────────────────────────
app.use('/api', messagingRoutes); // mounts /api/telegram/webhook, /api/whatsapp/webhook, /api/messaging/*

// ── Feature 2: Voice I/O ──────────────────────────────────────────────────────
app.use('/api/voice', voiceRoutes); // /api/voice/transcribe, /api/voice/parse

// ── Feature 3: Analytics Dashboard ───────────────────────────────────────────
app.use('/api/analytics', analyticsRoutes); // /api/analytics/summary, /agent/:id, /protocol, /trending

// ── Feature 4: Reputation & Reviews ──────────────────────────────────────────
app.use('/api/reviews', reviewsRoutes); // /api/reviews/:agentId, /report, /helpful, /badges/:id

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Trovia backend running on port ${PORT}`);
  console.log(`   Cluster: ${process.env.SOLANA_CLUSTER}`);
  console.log(`   Health:  http://localhost:${PORT}/api/health`);
});

export default app;
