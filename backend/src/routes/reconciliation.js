import express from 'express';
import { runDeterministicReconciliation } from '../services/reconciliationEngine.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

/**
 * @route   POST /api/reconciliation/run/:runId
 * @desc    Execute deterministic reconciliation engine for a specific run ID
 * @access  Public
 */
router.post('/reconciliation/run/:runId', async (req, res, next) => {
  try {
    const { runId } = req.params;
    if (!runId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_RUN_ID', message: 'runId parameter is required.' }
      });
    }

    console.log(`⚡ Executing deterministic reconciliation engine for run: ${runId}...`);
    const summary = await runDeterministicReconciliation(runId);

    return res.json({
      success: true,
      message: 'Deterministic reconciliation executed successfully.',
      data: summary
    });
  } catch (error) {
    console.error('❌ Reconciliation execution error:', error);
    next(error);
  }
});

/**
 * @route   GET /api/reconciliation/results/:runId
 * @desc    Get reconciliation results for a specific run ID
 * @access  Public
 */
router.get('/reconciliation/results/:runId', async (req, res, next) => {
  try {
    const { runId } = req.params;
    const { status, exception_type } = req.query;

    let query = supabase
      .from('reconciliation_results')
      .select('*')
      .eq('run_id', runId);

    if (status) query = query.eq('status', status);
    if (exception_type) query = query.eq('exception_type', exception_type);

    const { data: results, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      data: results || []
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/exceptions
 * @desc    Get list of all reconciliation exceptions
 * @access  Public
 */
router.get('/exceptions', async (req, res, next) => {
  try {
    const { runId, status, category } = req.query;

    let query = supabase
      .from('exceptions')
      .select('*, reconciliation_results(*)');

    if (runId) query = query.eq('run_id', runId);
    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);

    const { data: exceptions, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      data: exceptions || []
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/exceptions/:exceptionId
 * @desc    Get details for a specific exception record
 * @access  Public
 */
router.get('/exceptions/:exceptionId', async (req, res, next) => {
  try {
    const { exceptionId } = req.params;

    const { data: exception, error } = await supabase
      .from('exceptions')
      .select('*, reconciliation_results(*)')
      .eq('id', exceptionId)
      .single();

    if (error) throw error;
    if (!exception) {
      return res.status(404).json({
        success: false,
        error: { code: 'EXCEPTION_NOT_FOUND', message: `Exception ${exceptionId} not found.` }
      });
    }

    return res.json({
      success: true,
      data: exception
    });
  } catch (error) {
    next(error);
  }
});

export default router;
