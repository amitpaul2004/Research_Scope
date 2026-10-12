import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import contextRouter from './server/routes/context';
import papersRouter from './server/routes/papers';
import gapsRouter from './server/routes/gaps';
import comparisonRouter from './server/routes/comparison';
import academicRouter from './server/routes/academic';
import automationRouter from './server/routes/automation';
import writingRouter from './server/routes/writing';
import systemRouter from './server/routes/system';

dotenv.config();

const app = express();
const PORT = 3000;
const isProd = process.env.NODE_ENV === 'production';

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads directory exists and is statically served
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API Routes (versioned under /api/v1)
app.use('/api/v1/research/context', contextRouter);
app.use('/api/v1/papers', papersRouter);
app.use('/api/v1/research/gaps', gapsRouter);
app.use('/api/v1/research/compare', comparisonRouter);
app.use('/api/v1/research/academic', academicRouter);
app.use('/api/v1/automation', automationRouter);
app.use('/api/v1/n8n', automationRouter); // alias for n8n webhooks
app.use('/api/v1/writing', writingRouter);
app.use('/api/v1', systemRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'ResearchLens Intelligence Server',
  });
});

async function startServer() {
  if (!isProd) {
    // Mount Vite middleware in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production serve dist
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ResearchLens] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal startup error in ResearchLens:', err);
  process.exit(1);
});
