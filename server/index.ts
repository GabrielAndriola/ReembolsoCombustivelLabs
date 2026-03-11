import express from 'express';
import cors from 'cors';
import authRouter from '../api/auth';
import meRouter from '../api/me';
import employeesRouter from '../api/employees';
import reportsRouter from '../api/reports';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler';
import { env } from '../lib/env';

const app = express();
const allowedOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok'
  });
});

app.use('/api/auth', authRouter);
app.use('/api/me', meRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/reports', reportsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Reembolso Combustivel Labs API running on port ${env.PORT}`);
});
