import express from 'express';
import { investigateException } from '../agent/investigationAgent.js';
import { supabase } from '../config/supabase.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @route   POST /api/ai/investigate/:exceptionId
 * @desc    Execute AI exception investigation using LangChain, Groq LLM, and RAG knowledge retrieval
 * @access  Public
 * @ratelimit 5 requests per 15 minutes per exception
 */
router.post('/ai/investigate/:exceptionId', aiLimiter, async (req, res, next) => {
  try {
    const { exceptionId } = req.params;
    if (!exceptionId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_EXCEPTION_ID', message: 'exceptionId parameter is required.' }
      });
    }

    console.log(`⚡ Received request to investigate exception: ${exceptionId}`);

    // Check if investigation already exists to prevent duplicates
    const { data: existingInvestigation, error: checkError } = await supabase
      .from('ai_investigations')
      .select('id, status, created_at')
      .eq('exception_id', exceptionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    // If investigation exists and was created recently (within last hour), return it instead
    if (existingInvestigation) {
      const createdAt = new Date(existingInvestigation.created_at);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      if (createdAt > oneHourAgo) {
        console.log(`✨ Returning existing investigation (created ${Math.round((Date.now() - createdAt.getTime()) / 1000 / 60)} minutes ago)`);
        return res.json({
          success: true,
          message: 'AI investigation already exists for this exception.',
          data: existingInvestigation,
          cached: true
        });
      }
    }

    const investigation = await investigateException(exceptionId);

    return res.json({
      success: true,
      message: 'AI exception investigation completed successfully.',
      data: investigation
    });
  } catch (error) {
    console.error('❌ AI Investigation endpoint error:', error);
    next(error);
  }
});

/**
 * @route   GET /api/ai/investigations/:exceptionId
 * @desc    Retrieve existing AI investigation for a given exceptionId
 * @access  Public
 */
router.get('/ai/investigations/:exceptionId', async (req, res, next) => {
  try {
    const { exceptionId } = req.params;

    const { data: investigation, error } = await supabase
      .from('ai_investigations')
      .select('*')
      .eq('exception_id', exceptionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!investigation) {
      return res.status(404).json({
        success: false,
        error: { code: 'INVESTIGATION_NOT_FOUND', message: `No AI investigation found for exception ${exceptionId}` }
      });
    }

    return res.json({
      success: true,
      data: investigation
    });
  } catch (error) {
    next(error);
  }
});

export default router;
