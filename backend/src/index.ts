import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { agentRoutes } from './routes/agents';
import { cronRoutes } from './cron/scheduling';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));

// ── Health check (hit this before demo to warm up Cloud Run) ─────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'trovia-backend',
    timestamp: new Date().toISOString(),
    cluster: process.env.SOLANA_CLUSTER || 'devnet',
  });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/agents', agentRoutes);
app.use('/api/cron', cronRoutes);

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
