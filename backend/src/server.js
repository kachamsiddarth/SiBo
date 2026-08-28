import express from 'express';
import cors from 'cors';
import { env, validateSecretsForProduction } from './config/env.js';
import healthRouter from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health and Inspection API
app.use('/api', healthRouter);

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
