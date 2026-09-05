import express from 'express';
import cors from 'cors';
import routes from './routes/retrospectives.routes.js';
import { AppError } from './utils/errors.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', routes);

  app.use((err, _req, res, _next) => {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({
      error: err.message || 'Internal server error',
    });
  });

  return app;
}
