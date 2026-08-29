import { parse } from 'csv-parse/sync';
import { supabase } from '../config/supabase.js';
import { randomUUID } from 'crypto';

/**
 * Expected column schemas for payment and settlement CSV files
 */
export const PAYMENT_REQUIRED_COLUMNS = [
  'transaction_id',
  'payment_amount',
  'payment_date',
  'payment_method',
  'status'
];

export const SETTLEMENT_REQUIRED_COLUMNS = [
  'settlement_id',
  'transaction_id',
  'payment_amount',
  'fee',
  'tax',
  'adjustment',
  'refund',
  'settlement_amount',
  'settlement_date'
];

export const PAYMENT_OPTIONAL_COLUMNS = ['metadata'];
export const SETTLEMENT_OPTIONAL_COLUMNS = ['metadata'];

/**
 * Validates that a CSV record has all required columns
 * @param {Object} record - Parsed CSV row
 * @param {string[]} requiredColumns - Array of required column names
 * @returns {Object} Validation result with isValid and missingColumns
 */
export function validateRequiredColumns(record, requiredColumns) {
  const missingColumns = requiredColumns.filter(col => {
    const value = record[col];
    return value === undefined || value === null || value === '';
  });
  return {
    isValid: missingColumns.length === 0,
    missingColumns
  };
}

/**
 * Validates and normalizes a payment record
 * @param {Object} record - Raw CSV row
 * @param {number} rowIndex - Row index for error reporting
 * @returns {Object} Validation result with normalized record or errors
 */
export function validatePaymentRecord(record, rowIndex) {
  const errors = [];
  const warnings = [];

  // Validate required columns
  const columnValidation = validateRequiredColumns(record, PAYMENT_REQUIRED_COLUMNS);
  if (!columnValidation.isValid) {
    errors.push(`Row ${rowIndex}: Missing required columns: ${columnValidation.missingColumns.join(', ')}`);
    return { isValid: false, errors, warnings, normalized: null };
  }

  const normalized = {};

  // transaction_id: required, non-empty string
  const transactionId = String(record.transaction_id).trim();
  if (!transactionId) {
    errors.push(`Row ${rowIndex}: transaction_id is required and cannot be empty`);
  }
  normalized.transaction_id = transactionId;

  // payment_amount: required, positive number
  const paymentAmount = parseFloat(record.payment_amount);
  if (isNaN(paymentAmount)) {
    errors.push(`Row ${rowIndex}: payment_amount must be a valid number`);
  } else if (paymentAmount <= 0) {
    errors.push(`Row ${rowIndex}: payment_amount must be positive`);
  }
  normalized.payment_amount = paymentAmount;

  // payment_date: required, valid ISO date
  let paymentDate = null;
  if (record.payment_date) {
    const parsed = new Date(record.payment_date);
    if (isNaN(parsed.getTime())) {
      errors.push(`Row ${rowIndex}: payment_date must be a valid ISO 8601 date`);
    } else {
      paymentDate = parsed.toISOString();
    }
  } else {
    errors.push(`Row ${rowIndex}: payment_date is required`);
  }
  normalized.payment_date = paymentDate;

  // payment_method: optional, default 'UPI'
  const paymentMethod = record.payment_method ? String(record.payment_method).trim().toUpperCase() : 'UPI';
  normalized.payment_method = paymentMethod;

  // status: optional, default 'captured'
  const status = record.status ? String(record.status).trim().toLowerCase() : 'captured';
  const validStatuses = ['captured', 'authorized', 'failed', 'refunded', 'pending'];
  if (!validStatuses.includes(status)) {
    warnings.push(`Row ${rowIndex}: status "${status}" is not a standard status, using as-is`);
  }
  normalized.status = status;

  // metadata: optional JSON
  let metadata = {};
  if (record.metadata) {
    try {
      metadata = typeof record.metadata === 'string' ? JSON.parse(record.metadata) : record.metadata;
    } catch (e) {
      warnings.push(`Row ${rowIndex}: metadata is not valid JSON, using empty object`);
      metadata = {};
    }
  }
  normalized.metadata = metadata;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    normalized: errors.length === 0 ? normalized : null
  };
}

/**
 * Validates and normalizes a settlement record
 * @param {Object} record - Raw CSV row
 * @param {number} rowIndex - Row index for error reporting
 * @returns {Object} Validation result with normalized record or errors
 */
export function validateSettlementRecord(record, rowIndex) {
  const errors = [];
  const warnings = [];

  // Validate required columns
  const columnValidation = validateRequiredColumns(record, SETTLEMENT_REQUIRED_COLUMNS);
  if (!columnValidation.isValid) {
    errors.push(`Row ${rowIndex}: Missing required columns: ${columnValidation.missingColumns.join(', ')}`);
    return { isValid: false, errors, warnings, normalized: null };
  }

  const normalized = {};

  // settlement_id: required, non-empty string
  const settlementId = String(record.settlement_id).trim();
  if (!settlementId) {
    errors.push(`Row ${rowIndex}: settlement_id is required and cannot be empty`);
  }
  normalized.settlement_id = settlementId;

  // transaction_id: required, non-empty string
  const transactionId = String(record.transaction_id).trim();
  if (!transactionId) {
    errors.push(`Row ${rowIndex}: transaction_id is required and cannot be empty`);
  }
  normalized.transaction_id = transactionId;

  // payment_amount: required, positive number
  const paymentAmount = parseFloat(record.payment_amount);
  if (isNaN(paymentAmount)) {
    errors.push(`Row ${rowIndex}: payment_amount must be a valid number`);
  } else if (paymentAmount <= 0) {
    errors.push(`Row ${rowIndex}: payment_amount must be positive`);
  }
  normalized.payment_amount = paymentAmount;

  // fee: optional, default 0
  const fee = parseFloat(record.fee) || 0;
  if (fee < 0) {
    warnings.push(`Row ${rowIndex}: fee is negative, using absolute value`);
  }
  normalized.fee = Math.abs(fee);

  // tax: optional, default 0
  const tax = parseFloat(record.tax) || 0;
  if (tax < 0) {
    warnings.push(`Row ${rowIndex}: tax is negative, using absolute value`);
  }
  normalized.tax = Math.abs(tax);

  // adjustment: optional, default 0
  const adjustment = parseFloat(record.adjustment) || 0;
  normalized.adjustment = adjustment;

  // refund: optional, default 0
  const refund = parseFloat(record.refund) || 0;
  if (refund < 0) {
    warnings.push(`Row ${rowIndex}: refund is negative, using absolute value`);
  }
  normalized.refund = Math.abs(refund);

  // settlement_amount: required, number
  const settlementAmount = parseFloat(record.settlement_amount);
  if (isNaN(settlementAmount)) {
    errors.push(`Row ${rowIndex}: settlement_amount must be a valid number`);
  }
  normalized.settlement_amount = settlementAmount;

  // settlement_date: required, valid ISO date
  let settlementDate = null;
  if (record.settlement_date) {
    const parsed = new Date(record.settlement_date);
    if (isNaN(parsed.getTime())) {
      errors.push(`Row ${rowIndex}: settlement_date must be a valid ISO 8601 date`);
    } else {
      settlementDate = parsed.toISOString();
    }
  } else {
    errors.push(`Row ${rowIndex}: settlement_date is required`);
  }
  normalized.settlement_date = settlementDate;

  // metadata: optional JSON
  let metadata = {};
  if (record.metadata) {
    try {
      metadata = typeof record.metadata === 'string' ? JSON.parse(record.metadata) : record.metadata;
    } catch (e) {
      warnings.push(`Row ${rowIndex}: metadata is not valid JSON, using empty object`);
      metadata = {};
    }
  }
  normalized.metadata = metadata;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    normalized: errors.length === 0 ? normalized : null
  };
}

/**
 * Parses and validates a CSV file buffer
 * @param {Buffer} fileBuffer - CSV file buffer
 * @param {string} fileType - 'payment' or 'settlement'
 * @returns {Object} Parsing result with valid records, errors, warnings
 */
export function parseAndValidateCSV(fileBuffer, fileType) {
  const content = fileBuffer.toString('utf-8');

  let records;
  try {
    records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true
    });
  } catch (error) {
    return {
      success: false,
      validRecords: [],
      errors: [`CSV parsing failed: ${error.message}`],
      warnings: [],
      totalRows: 0
    };
  }

  if (!records || records.length === 0) {
    return {
      success: false,
      validRecords: [],
      errors: ['CSV file is empty or contains no data rows'],
      warnings: [],
      totalRows: 0
    };
  }

  const validator = fileType === 'payment' ? validatePaymentRecord : validateSettlementRecord;
  const validRecords = [];
  const allErrors = [];
  const allWarnings = [];

  records.forEach((record, index) => {
    const result = validator(record, index + 2); // +2 for header row and 1-based indexing
    if (result.isValid) {
      validRecords.push(result.normalized);
    } else {
      allErrors.push(...result.errors);
    }
    allWarnings.push(...result.warnings);
  });

  return {
    success: true,
    validRecords,
    errors: allErrors,
    warnings: allWarnings,
    totalRows: records.length
  };
}

/**
 * Checks for duplicate transaction IDs within a batch
 * @param {Array} records - Array of validated records
 * @param {string} idField - Field name to check for duplicates ('transaction_id' or 'settlement_id')
 * @returns {Object} Duplicate check result
 */
export function checkDuplicates(records, idField) {
  const seen = new Set();
  const duplicates = [];

  records.forEach((record, index) => {
    const id = record[idField];
    if (seen.has(id)) {
      duplicates.push({ index, id, record });
    } else {
      seen.add(id);
    }
  });

  return {
    hasDuplicates: duplicates.length > 0,
    duplicateCount: duplicates.length,
    duplicates
  };
}

/**
 * Creates a new reconciliation run record
 * @param {Object} options - Run options
 * @returns {Promise<Object>} Created run record
 */
export async function createReconciliationRun(options = {}) {
  const { fileName, totalRecords = 0 } = options;

  const { data, error } = await supabase
    .from('reconciliation_runs')
    .insert({
      file_name: fileName,
      total_records: totalRecords,
      status: 'uploaded',
      matched_count: 0,
      exception_count: 0,
      match_rate: 0.00
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create reconciliation run: ${error.message}`);
  }

  return data;
}

/**
 * Bulk inserts payment records
 * @param {Array} records - Validated payment records
 * @param {string} runId - Reconciliation run ID
 * @returns {Promise<Object>} Insert result
 */
export async function insertPaymentRecords(records, runId) {
  if (!records || records.length === 0) {
    return { inserted: 0, errors: [] };
  }

  const recordsWithRunId = records.map(record => ({
    ...record,
    run_id: runId
  }));

  const { data, error } = await supabase
    .from('payment_records')
    .insert(recordsWithRunId)
    .select('id, transaction_id');

  if (error) {
    throw new Error(`Failed to insert payment records: ${error.message}`);
  }

  return { inserted: data?.length || 0, errors: [] };
}

/**
 * Bulk inserts settlement records
 * @param {Array} records - Validated settlement records
 * @param {string} runId - Reconciliation run ID
 * @returns {Promise<Object>} Insert result
 */
export async function insertSettlementRecords(records, runId) {
  if (!records || records.length === 0) {
    return { inserted: 0, errors: [] };
  }

  const recordsWithRunId = records.map(record => ({
    ...record,
    run_id: runId
  }));

  const { data, error } = await supabase
    .from('settlement_records')
    .insert(recordsWithRunId)
    .select('id, transaction_id, settlement_id');

  if (error) {
    throw new Error(`Failed to insert settlement records: ${error.message}`);
  }

  return { inserted: data?.length || 0, errors: [] };
}

/**
 * Updates reconciliation run with final counts
 * @param {string} runId - Run ID
 * @param {Object} counts - Count updates
 * @returns {Promise<Object>} Updated run
 */
export async function updateReconciliationRun(runId, counts) {
  const { data, error } = await supabase
    .from('reconciliation_runs')
    .update({
      ...counts,
      updated_at: new Date().toISOString()
    })
    .eq('id', runId)
    .select()
  if (error) {
    throw new Error(`Failed to update reconciliation run: ${error.message}`);
  }

  return data;
}

export const csvProcessor = {
  validateRequiredColumns,
  validatePaymentRecord,
  validateSettlementRecord,
  parseAndValidateCSV,
  checkDuplicates,
  createReconciliationRun,
  insertPaymentRecords,
  insertSettlementRecords,
  updateReconciliationRun
};

export default csvProcessor;