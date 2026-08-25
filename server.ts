import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { OpportunityAgentOrchestrator } from './src/agent/orchestrator.ts';
import { DEFAULT_PROFILES } from './src/data/defaultProfiles.ts';
import { SAMPLE_RFPS } from './src/data/sampleRFPs.ts';
import { ConsultantProfile } from './src/types/agent.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  const orchestrator = new OpportunityAgentOrchestrator();

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Consultant-in-a-Box Opportunity Evaluator',
      geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Fetch Sample RFPs
  app.get('/api/sample-rfps', (req, res) => {
    res.json(SAMPLE_RFPS);
  });

  // 3. Fetch Default Consultant Profiles
  app.get('/api/profiles', (req, res) => {
    res.json(DEFAULT_PROFILES);
  });

  // 4. Standard Synchronous Evaluation Endpoint
  app.post('/api/evaluate', async (req, res) => {
    try {
      const { text, profile } = req.body;
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Opportunity document text is required.' });
      }

      const activeProfile: ConsultantProfile = profile || DEFAULT_PROFILES[0];
      const report = await orchestrator.evaluateOpportunity(text, activeProfile);
      res.json(report);
    } catch (err: any) {
      console.error('[API /api/evaluate] Error:', err);
      res.status(500).json({ error: err.message || 'Internal evaluation failure' });
    }
  });

  // 5. Real-Time SSE Stream Endpoint for Live Agent Activity
  app.post('/api/evaluate/stream', async (req, res) => {
    const { text, profile } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Opportunity document text is required.' });
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const activeProfile: ConsultantProfile = profile || DEFAULT_PROFILES[0];

    try {
      sendEvent('start', { message: 'Agent pipeline initialized', profileName: activeProfile.name });

      const report = await orchestrator.evaluateOpportunity(text, activeProfile, {
        onActivity: (activity) => {
          sendEvent('activity', activity);
        },
        onProgress: (phase, percent) => {
          sendEvent('progress', { phase, percent });
        },
      });

      sendEvent('complete', report);
      res.write('event: end\ndata: {}\n\n');
      res.end();
    } catch (err: any) {
      console.error('[API /api/evaluate/stream] Error:', err);
      sendEvent('error', { message: err.message || 'Evaluation error occurred' });
      res.end();
    }
  });

  // Vite middleware setup for React frontend
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Consultant-in-a-Box] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
