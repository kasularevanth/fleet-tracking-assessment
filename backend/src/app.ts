import express from 'express';
import cors from 'cors';
import tripsRouter from './routes/tripsRouter';
import eventsRouter from './routes/eventsRouter';
import metricsRouter from './routes/metricsRouter';
import authRouter from './routes/authRouter';
import { authMiddleware } from './middleware/authMiddleware';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Fleet Tracking API is running' });
});

// Public routes
app.use('/api/auth', authRouter);

// Protected routes (require authentication)
app.use('/api/trips', authMiddleware, tripsRouter);
app.use('/api/events', authMiddleware, eventsRouter);
app.use('/api/metrics', authMiddleware, metricsRouter);

export default app;

