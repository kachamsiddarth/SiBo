import express from 'express';
import { runDeterministicReconciliation } from '../services/reconciliationEngine.js';
import { supabase } from '../config/supabase.js';
import { reconciliationLimiter } from '../middleware/rateLimiter.js';
import { validateRunId, validateExceptionId } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   POST /api/reconciliation/run/:runId
 * @desc    Execute deterministic reconciliation engine for a specific run ID
 * @access  Public
 * @ratelimit 3 requests per 15 minutes per run
 */
router.post('/reconciliation/run/:runId', reconciliationLimiter, validateRunId, async (req, res, next) => {
  try {
    const { runId } = req.params;

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
router.get('/reconciliation/results/:runId', validateRunId, async (req, res, next) => {
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
router.get('/exceptions/:exceptionId', validateExceptionId, async (req, res, next) => {
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

/**
 * @route   GET /api/dashboard/summary
 * @desc    Aggregate operational summary across all reconciliation runs for the dashboard
 * @access  Public
 */
router.get('/dashboard/summary', async (req, res, next) => {
  try {
    // Total runs
    const { data: runs, error: runsErr } = await supabase
      .from('reconciliation_runs')
      .select('id, total_records, matched_count, exception_count, match_rate, status, file_name, created_at')
      .order('created_at', { ascending: false });
    if (runsErr) throw runsErr;

    // All exceptions
    const { data: exceptions, error: excErr } = await supabase
      .from('exceptions')
      .select('id, category, ai_investigation_status, status');
    if (excErr) throw excErr;

    // All ai_investigations
    const { count: aiCount, error: aiErr } = await supabase
      .from('ai_investigations')
      .select('id', { count: 'exact', head: true });
    if (aiErr) throw aiErr;

    const totalRuns = runs?.length || 0;
    const totalRecords = runs?.reduce((acc, r) => acc + (r.total_records || 0), 0) || 0;
    const totalMatched = runs?.reduce((acc, r) => acc + (r.matched_count || 0), 0) || 0;
    const totalExceptions = exceptions?.length || 0;

    const exceptionsByCategory = (exceptions || []).reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {});

    const aiExplained = (exceptions || []).filter(e => e.ai_investigation_status === 'COMPLETED').length;
    const unresolved = (exceptions || []).filter(e => e.status === 'UNRESOLVED').length;

    const latestRun = runs?.[0] || null;

    return res.json({
      success: true,
      data: {
        totalRuns,
        totalRecords,
        totalMatched,
        totalExceptions,
        aiExplained,
        unresolved,
        aiInvestigationsCount: aiCount || 0,
        overallMatchRate: totalRecords > 0
          ? Math.round((totalMatched / totalRecords) * 100)
          : 0,
        exceptionsByCategory,
        latestRun,
        recentRuns: (runs || []).slice(0, 5)
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

