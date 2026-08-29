import express from 'express';
import { investigateException } from '../agent/investigationAgent.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

/**
 * @route   POST /api/ai/investigate/:exceptionId
 * @desc    Execute AI exception investigation using LangChain, Groq LLM, and RAG knowledge retrieval
 * @access  Public
 */
router.post('/ai/investigate/:exceptionId', async (req, res, next) => {
  try {
    const { exceptionId } = req.params;
    if (!exceptionId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_EXCEPTION_ID', message: 'exceptionId parameter is required.' }
      });
    }

    console.log(`⚡ Received request to investigate exception: ${exceptionId}`);
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
