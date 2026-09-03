import express from 'express';
import multer from 'multer';
import { csvProcessor } from '../services/csvProcessor.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { validateRunId } from '../middleware/validation.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 2 // Max 2 files (payment + settlement)
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel',
      'text/plain'
    ];
    const allowedExtensions = ['.csv', '.txt'];

    const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);
    const hasValidExtension = allowedExtensions.some(ext =>
      file.originalname.toLowerCase().endsWith(ext)
    );

    if (hasValidMimeType || hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV files are allowed.'), false);
    }
  }
});

/**
 * @route   POST /api/upload
 * @desc    Upload and validate payment/settlement CSV files
 * @access  Public
 * @ratelimit 5 uploads per 15 minutes
 */
router.post('/upload', uploadLimiter, upload.fields([
  { name: 'paymentFile', maxCount: 1 },
  { name: 'settlementFile', maxCount: 1 }
]), async (req, res, next) => {
  try {
    const files = req.files;

    if (!files || (!files.paymentFile && !files.settlementFile)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILES_UPLOADED',
          message: 'At least one CSV file (paymentFile or settlementFile) must be uploaded.'
        }
      });
    }

    const results = {
      paymentFile: null,
      settlementFile: null,
      runId: null,
      summary: {
        totalFiles: 0,
        totalRecordsProcessed: 0,
        totalRecordsAccepted: 0,
        totalRecordsRejected: 0,
        totalWarnings: 0
      }
    };

    let paymentRecords = [];
    let settlementRecords = [];
    let paymentFileName = null;
    let settlementFileName = null;
    let allWarnings = [];

    // Process payment file if provided
    if (files.paymentFile && files.paymentFile[0]) {
      const file = files.paymentFile[0];
      paymentFileName = file.originalname;
      results.summary.totalFiles++;

      console.log(`📂 Processing payment file: ${paymentFileName} (${file.size} bytes)`);

      const parseResult = csvProcessor.parseAndValidateCSV(file.buffer, 'payment');

      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PAYMENT_CSV_PARSE_ERROR',
            message: 'Failed to parse payment CSV file.',
            details: parseResult.errors
          }
        });
      }

      // Check for duplicates
      const duplicateCheck = csvProcessor.checkDuplicates(parseResult.validRecords, 'transaction_id');
      if (duplicateCheck.hasDuplicates) {
        allWarnings.push({
          file: 'payment',
          type: 'DUPLICATE_TRANSACTION_IDS',
          message: `Found ${duplicateCheck.duplicateCount} duplicate transaction_id(s) in payment file`,
          duplicates: duplicateCheck.duplicates.map(d => d.id)
        });
      }

      paymentRecords = parseResult.validRecords;
      results.paymentFile = {
        fileName: paymentFileName,
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRecords.length,
        rejectedRows: parseResult.totalRows - parseResult.validRecords.length,
        errors: parseResult.errors,
        warnings: parseResult.warnings,
        duplicateCheck: {
          hasDuplicates: duplicateCheck.hasDuplicates,
          duplicateCount: duplicateCheck.duplicateCount
        }
      };

      results.summary.totalRecordsProcessed += parseResult.totalRows;
      results.summary.totalRecordsAccepted += parseResult.validRecords.length;
      results.summary.totalRecordsRejected += parseResult.totalRows - parseResult.validRecords.length;
      results.summary.totalWarnings += parseResult.warnings.length;
      allWarnings.push(...parseResult.warnings.map(w => ({ file: 'payment', message: w })));
    }

    // Process settlement file if provided
    if (files.settlementFile && files.settlementFile[0]) {
      const file = files.settlementFile[0];
      settlementFileName = file.originalname;
      results.summary.totalFiles++;

      console.log(`📂 Processing settlement file: ${settlementFileName} (${file.size} bytes)`);

      const parseResult = csvProcessor.parseAndValidateCSV(file.buffer, 'settlement');

      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'SETTLEMENT_CSV_PARSE_ERROR',
            message: 'Failed to parse settlement CSV file.',
            details: parseResult.errors
          }
        });
      }

      // Check for duplicates
      const duplicateCheck = csvProcessor.checkDuplicates(parseResult.validRecords, 'settlement_id');
      if (duplicateCheck.hasDuplicates) {
        allWarnings.push({
          file: 'settlement',
          type: 'DUPLICATE_SETTLEMENT_IDS',
          message: `Found ${duplicateCheck.duplicateCount} duplicate settlement_id(s) in settlement file`,
          duplicates: duplicateCheck.duplicates.map(d => d.id)
        });
      }

      settlementRecords = parseResult.validRecords;
      results.settlementFile = {
        fileName: settlementFileName,
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRecords.length,
        rejectedRows: parseResult.totalRows - parseResult.validRecords.length,
        errors: parseResult.errors,
        warnings: parseResult.warnings,
        duplicateCheck: {
          hasDuplicates: duplicateCheck.hasDuplicates,
          duplicateCount: duplicateCheck.duplicateCount
        }
      };

      results.summary.totalRecordsProcessed += parseResult.totalRows;
      results.summary.totalRecordsAccepted += parseResult.validRecords.length;
      results.summary.totalRecordsRejected += parseResult.totalRows - parseResult.validRecords.length;
      results.summary.totalWarnings += parseResult.warnings.length;
      allWarnings.push(...parseResult.warnings.map(w => ({ file: 'settlement', message: w })));
    }

    // Create reconciliation run
    const fileName = paymentFileName || settlementFileName;
    const totalValidRecords = paymentRecords.length + settlementRecords.length;

    if (totalValidRecords === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_VALID_RECORDS',
          message: 'No valid records found in uploaded files.'
        }
      });
    }

    console.log(`📝 Creating reconciliation run for ${totalValidRecords} valid records...`);

    const run = await csvProcessor.createReconciliationRun({
      fileName,
      totalRecords: totalValidRecords
    });

    results.runId = run.id;

    // Insert payment records
    if (paymentRecords.length > 0) {
      console.log(`💾 Inserting ${paymentRecords.length} payment records...`);
      const paymentResult = await csvProcessor.insertPaymentRecords(paymentRecords, run.id);
      console.log(`✅ Inserted ${paymentResult.inserted} payment records`);
    }

    // Insert settlement records
    if (settlementRecords.length > 0) {
      console.log(`💾 Inserting ${settlementRecords.length} settlement records...`);
      const settlementResult = await csvProcessor.insertSettlementRecords(settlementRecords, run.id);
      console.log(`✅ Inserted ${settlementResult.inserted} settlement records`);
    }

    // Update run with final counts
    await csvProcessor.updateReconciliationRun(run.id, {
      total_records: totalValidRecords,
      status: 'validated'
    });

    results.warnings = allWarnings;

    console.log(`🎉 Upload completed successfully. Run ID: ${run.id}`);

    return res.json({
      success: true,
      message: 'Files uploaded and validated successfully.',
      data: results
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    next(error);
  }
});

/**
 * @route   GET /api/upload/runs
 * @desc    Get list of reconciliation runs
 * @access  Public
 */
router.get('/upload/runs', async (req, res, next) => {
  try {
    const { supabase } = await import('../config/supabase.js');

    const { data: runs, error } = await supabase
      .from('reconciliation_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return res.json({
      success: true,
      data: runs || []
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/upload/runs/:runId
 * @desc    Get details of a specific reconciliation run
 * @access  Public
 */
router.get('/upload/runs/:runId', validateRunId, async (req, res, next) => {
  try {
    const { runId } = req.params;
    const { supabase } = await import('../config/supabase.js');

    const { data: run, error: runError } = await supabase
      .from('reconciliation_runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (runError) throw runError;
    if (!run) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RUN_NOT_FOUND',
          message: `Reconciliation run ${runId} not found.`
        }
      });
    }

    // Get payment records count
    const { count: paymentCount } = await supabase
      .from('payment_records')
      .select('id', { count: 'exact', head: true })
      .eq('run_id', runId);

    // Get settlement records count
    const { count: settlementCount } = await supabase
      .from('settlement_records')
      .select('id', { count: 'exact', head: true })
      .eq('run_id', runId);

    return res.json({
      success: true,
      data: {
        ...run,
        paymentRecordCount: paymentCount || 0,
        settlementRecordCount: settlementCount || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;