import express from 'express';
import { env } from '../config/env.js';

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check & environment configuration status
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'SiBo AI Finance Controller',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    services: {
      supabase: env.SUPABASE_URL.includes('placeholder') ? 'unconfigured' : 'configured',
      groq: env.GROQ_API_KEY.includes('placeholder') ? 'unconfigured' : 'configured',
      hf: env.HF_TOKEN.includes('placeholder') ? 'unconfigured' : 'configured',
    },
    embeddingModel: env.HF_EMBEDDING_MODEL,
    embeddingDimension: 1024 // Qwen/Qwen3-Embedding-0.6B output dimension
  });
});

export default router;
