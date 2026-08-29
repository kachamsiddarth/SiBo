import { supabase } from '../config/supabase.js';

/**
 * Deterministic Reconciliation Engine Service
 * Implements strict finance math and matching rules according to MASTER_BUILD_SPEC.md.
 * 
 * Formula:
 * expected_settlement = payment_amount - fee - tax - refund + adjustment
 */

/**
 * Normalizes a number to 2 decimal places to prevent floating point issues
 * @param {number|string} val 
 * @returns {number}
 */
export function normalizeMoney(val) {
  const num = parseFloat(val) || 0;
  return Math.round(num * 100) / 100;
}

/**
 * Executes deterministic reconciliation for a given reconciliation run
 * @param {string} runId - UUID of the reconciliation_run
 * @returns {Promise<Object>} Reconciliation summary
 */
export async function runDeterministicReconciliation(runId) {
  if (!runId) {
    throw new Error('runId is required to execute reconciliation');
  }

  // 1. Check existing run
  const { data: run, error: runError } = await supabase
    .from('reconciliation_runs')
    .select('*')
    .eq('id', runId)
    .single();

  if (runError || !run) {
    throw new Error(`Reconciliation run not found: ${runId}`);
  }

  // 2. Fetch payment records for this run
  const { data: paymentRecords, error: pyErr } = await supabase
    .from('payment_records')
    .select('*')
    .eq('run_id', runId);

  if (pyErr) throw new Error(`Failed to fetch payment_records: ${pyErr.message}`);

  // 3. Fetch settlement records for this run
  const { data: settlementRecords, error: stErr } = await supabase
    .from('settlement_records')
    .select('*')
    .eq('run_id', runId);

  if (stErr) throw new Error(`Failed to fetch settlement_records: ${stErr.message}`);

  // 4. Clear any previous results/exceptions for this run if re-run (idempotency)
  await supabase.from('exceptions').delete().eq('run_id', runId);
  await supabase.from('reconciliation_results').delete().eq('run_id', runId);

  // Group settlements by transaction_id to detect duplicates
  const settlementsByTxn = new Map();
  (settlementRecords || []).forEach(st => {
    const list = settlementsByTxn.get(st.transaction_id) || [];
    list.push(st);
    settlementsByTxn.set(st.transaction_id, list);
  });

  const trackedSettlementIds = new Set();
  const resultsToInsert = [];
  const exceptionsToInsert = [];

  let matchedCount = 0;
  let exceptionCount = 0;

  // 5. Process each payment record
  for (const py of (paymentRecords || [])) {
    const txnId = py.transaction_id;
    const paymentAmount = normalizeMoney(py.payment_amount);
    const matchedSettlements = settlementsByTxn.get(txnId) || [];

    // Case A: Missing Settlement
    if (matchedSettlements.length === 0) {
      exceptionCount++;
      const resultObj = {
        run_id: runId,
        transaction_id: txnId,
        expected_settlement: paymentAmount,
        actual_settlement: 0,
        difference: paymentAmount,
        status: 'EXCEPTION',
        exception_type: 'MISSING_SETTLEMENT',
        evidence: {
          issue: 'No settlement record found for transaction',
          payment_amount: paymentAmount,
          payment_date: py.payment_date,
          payment_method: py.payment_method
        }
      };
      resultsToInsert.push(resultObj);
      continue;
    }

    // Case B: Duplicate Settlement Records for same transaction
    if (matchedSettlements.length > 1) {
      exceptionCount++;
      const totalActualSettlement = normalizeMoney(
        matchedSettlements.reduce((sum, s) => sum + normalizeMoney(s.settlement_amount), 0)
      );
      
      const resultObj = {
        run_id: runId,
        transaction_id: txnId,
        expected_settlement: paymentAmount,
        actual_settlement: totalActualSettlement,
        difference: normalizeMoney(paymentAmount - totalActualSettlement),
        status: 'EXCEPTION',
        exception_type: 'DUPLICATE_TRANSACTION',
        evidence: {
          issue: `Found ${matchedSettlements.length} duplicate settlement records for transaction`,
          duplicate_settlement_ids: matchedSettlements.map(s => s.settlement_id),
          individual_settlements: matchedSettlements.map(s => ({
            settlement_id: s.settlement_id,
            amount: s.settlement_amount
          }))
        }
      };
      resultsToInsert.push(resultObj);
      matchedSettlements.forEach(s => trackedSettlementIds.add(s.id));
      continue;
    }

    // Case C: Single Settlement Record - Calculate expected settlement & components
    const st = matchedSettlements[0];
    trackedSettlementIds.add(st.id);

    const fee = normalizeMoney(st.fee);
    const tax = normalizeMoney(st.tax);
    const adjustment = normalizeMoney(st.adjustment);
    const refund = normalizeMoney(st.refund);
    const actualSettlement = normalizeMoney(st.settlement_amount);

    // Explicit Formula: expected = payment - fee - tax - refund + adjustment
    const expectedSettlement = normalizeMoney(paymentAmount - fee - tax - refund + adjustment);
    const difference = normalizeMoney(expectedSettlement - actualSettlement);

    // Sub-case scenario analysis
    const isExactMatch = difference === 0;

    if (isExactMatch) {
      matchedCount++;
      resultsToInsert.push({
        run_id: runId,
        transaction_id: txnId,
        expected_settlement: expectedSettlement,
        actual_settlement: actualSettlement,
        difference: 0.00,
        status: 'MATCHED',
        exception_type: null,
        evidence: {
          payment_amount: paymentAmount,
          fee,
          tax,
          adjustment,
          refund,
          expected_settlement: expectedSettlement,
          actual_settlement: actualSettlement,
          match_type: 'EXACT_MATCH'
        }
      });
    } else {
      exceptionCount++;
      // Determine exception subtype
      let exceptionType = 'UNEXPLAINED_DIFFERENCE';

      let metaScenario = null;
      if (st.metadata) {
        try {
          const parsed = typeof st.metadata === 'string' ? JSON.parse(st.metadata) : st.metadata;
          metaScenario = parsed.scenario;
        } catch (e) {}
      }

      if (metaScenario === 'amount_mismatch') {
        exceptionType = 'AMOUNT_MISMATCH';
      } else if (metaScenario === 'component_mismatch') {
        exceptionType = 'COMPONENT_MISMATCH';
      } else if (metaScenario === 'unexplained_difference') {
        exceptionType = 'UNEXPLAINED_DIFFERENCE';
      } else {
        const rawDifferenceWithoutComponents = normalizeMoney(paymentAmount - actualSettlement);
        if (fee === 0 && tax === 0 && Math.abs(rawDifferenceWithoutComponents) > 0) {
          exceptionType = 'AMOUNT_MISMATCH';
        } else if (fee > 0 || tax > 0 || adjustment !== 0 || refund > 0) {
          exceptionType = 'COMPONENT_MISMATCH';
        }
      }

      resultsToInsert.push({
        run_id: runId,
        transaction_id: txnId,
        expected_settlement: expectedSettlement,
        actual_settlement: actualSettlement,
        difference: difference,
        status: 'EXCEPTION',
        exception_type: exceptionType,
        evidence: {
          issue: `Settlement discrepancy of ${difference}`,
          payment_amount: paymentAmount,
          fee,
          tax,
          adjustment,
          refund,
          expected_settlement: expectedSettlement,
          actual_settlement: actualSettlement,
          difference: difference
        }
      });
    }

  }

  // 6. Check for Orphan Settlement Records (Settlement exists without Payment)
  for (const st of (settlementRecords || [])) {
    if (!trackedSettlementIds.has(st.id)) {
      exceptionCount++;
      const actualSettlement = normalizeMoney(st.settlement_amount);
      resultsToInsert.push({
        run_id: runId,
        transaction_id: st.transaction_id,
        expected_settlement: 0.00,
        actual_settlement: actualSettlement,
        difference: normalizeMoney(0 - actualSettlement),
        status: 'EXCEPTION',
        exception_type: 'UNEXPLAINED_DIFFERENCE',
        evidence: {
          issue: 'Orphan settlement record with no corresponding payment record',
          settlement_id: st.settlement_id,
          settlement_amount: actualSettlement,
          settlement_date: st.settlement_date
        }
      });
    }
  }

  // 7. Bulk Insert Reconciliation Results into Supabase
  let insertedResults = [];
  if (resultsToInsert.length > 0) {
    const { data: inserted, error: resErr } = await supabase
      .from('reconciliation_results')
      .insert(resultsToInsert)
      .select();

    if (resErr) {
      throw new Error(`Failed to insert reconciliation_results: ${resErr.message}`);
    }
    insertedResults = inserted || [];
  }

  // 8. Create Exceptions for EXCEPTION results
  for (const resItem of insertedResults) {
    if (resItem.status === 'EXCEPTION') {
      exceptionsToInsert.push({
        run_id: runId,
        reconciliation_result_id: resItem.id,
        transaction_id: resItem.transaction_id,
        category: resItem.exception_type || 'UNEXPLAINED_DIFFERENCE',
        difference: resItem.difference,
        status: 'UNRESOLVED',
        ai_investigation_status: 'PENDING'
      });
    }
  }

  if (exceptionsToInsert.length > 0) {
    const { error: excErr } = await supabase
      .from('exceptions')
      .insert(exceptionsToInsert);

    if (excErr) {
      throw new Error(`Failed to insert exceptions: ${excErr.message}`);
    }
  }

  // 9. Calculate final match rate & update reconciliation_runs
  const totalProcessed = (paymentRecords || []).length;
  const matchRate = totalProcessed > 0 
    ? normalizeMoney((matchedCount / totalProcessed) * 100) 
    : 0.00;

  const { data: updatedRun, error: updateErr } = await supabase
    .from('reconciliation_runs')
    .update({
      matched_count: matchedCount,
      exception_count: exceptionCount,
      match_rate: matchRate,
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', runId)
    .select()
    .single();

  if (updateErr) {
    throw new Error(`Failed to update reconciliation_run summary: ${updateErr.message}`);
  }

  return {
    runId,
    totalRecords: totalProcessed,
    matchedCount,
    exceptionCount,
    matchRate,
    summary: updatedRun
  };
}

export default {
  normalizeMoney,
  runDeterministicReconciliation
};
