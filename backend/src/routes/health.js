import express from 'express';
import { env } from '../config/env.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check & Phase 2 Database/AI service configuration status
 * @access  Public
 */
router.get('/health', async (req, res) => {
  let dbStatus = 'unconfigured';
  
  if (!env.SUPABASE_URL.includes('placeholder')) {
    try {
      const { error } = await supabase.from('reconciliation_runs').select('id').limit(1);
      if (!error) {
        dbStatus = 'connected';
      } else if (error.code === '42P01') {
        dbStatus = 'migration_required';
      } else {
        dbStatus = 'error: ' + error.message;
      }
    } catch (e) {
      dbStatus = 'error: ' + e.message;
    }
  }

  res.json({
    status: 'ok',
    app: 'SiBo — AI Finance Controller',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    services: {
      supabase: dbStatus,
      groq: env.GROQ_API_KEY.includes('placeholder') ? 'unconfigured' : 'configured',
      hf: env.HF_TOKEN.includes('placeholder') ? 'unconfigured' : 'configured',
    },
    llmModel: env.GROQ_MODEL, // openai/gpt-oss-120b
    embeddingModel: env.HF_EMBEDDING_MODEL,
    embeddingDimension: 1024 // Qwen/Qwen3-Embedding-0.6B output dimension
  });
});

export default router;
