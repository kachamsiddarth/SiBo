import express from 'express';
import cors from 'cors';
import { env, validateSecretsForProduction } from './config/env.js';
import healthRouter from './routes/health.js';
import ragRouter from './routes/rag.js';
import uploadRouter from './routes/upload.js';
import reconciliationRouter from './routes/reconciliation.js';
import aiRouter from './routes/ai.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api', healthRouter);
app.use('/api', ragRouter);
app.use('/api', uploadRouter);
app.use('/api', reconciliationRouter);
app.use('/api', aiRouter);



// Root Route
app.get('/', (req, res) => {
  res.json({
    name: 'SiBo AI Finance Controller API',
    description: 'Razorpay Buildathon Track 04 Backend System',
    status: 'running',
    healthCheck: '/api/health'
  });
});

// Central Error Handler
app.use(errorHandler);

// Validate environment secrets status at startup
validateSecretsForProduction();

// Start Server
const server = app.listen(env.PORT, () => {
  console.log(`🚀 SiBo Backend running on http://localhost:${env.PORT}`);
  console.log(`📊 Health check available at http://localhost:${env.PORT}/api/health`);
});

export default app;
