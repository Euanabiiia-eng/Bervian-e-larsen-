import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import logger from './lib/logger';
import { generalLimiter } from './middleware/rateLimit';
import authRouter from './routes/auth';
import patientRouter from './routes/patient';
import clinicRouter from './routes/clinic';
import adminRouter from './routes/admin';
import { startCronJobs } from './jobs/checklist.cron';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(generalLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/patient', patientRouter);
app.use('/api/clinic', clinicRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    logger.error(`Erro não tratado: ${err.message}\n${err.stack ?? ''}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  },
);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`Ápice API running on port ${PORT}`);
  startCronJobs();
});

export default app;
