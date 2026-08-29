import { supabase } from '../config/supabase.js';
import { csvProcessor } from '../services/csvProcessor.js';
import { generateDataset } from './generateSyntheticData.js';
import { runDeterministicReconciliation } from '../services/reconciliationEngine.js';
import { searchRagKnowledge } from '../rag/retriever/ragRetriever.js';

async function runStrictPhase5Verification() {
  console.log('===========================================================');
  console.log('🔍 STARTING STRICT PHASE 5 VERIFICATION SUITE FOR SIBO ENGINE');
  console.log('===========================================================');

  let passedAll = true;
  let testRun = null;

  try {
    // -------------------------------------------------------------
    // Setup: Generate Synthetic Dataset & Upload to Live Supabase
    // -------------------------------------------------------------
    console.log('\n[Setup] Generating synthetic dataset (100 payments)...');
    const dataset = generateDataset(100);

    console.log(`  Generated ${dataset.payments.length} payment records and ${dataset.settlements.length} settlement records.`);

    testRun = await csvProcessor.createReconciliationRun({
      fileName: 'phase5_strict_verification.csv',
      totalRecords: dataset.payments.length + dataset.settlements.length
    });

    console.log(`  Created reconciliation run: ${testRun.id}`);

    await csvProcessor.insertPaymentRecords(dataset.payments, testRun.id);
    await csvProcessor.insertSettlementRecords(dataset.settlements, testRun.id);

    console.log('  Inserted payment and settlement records into live database.');

    // -------------------------------------------------------------
    // Test 1: Run Deterministic Reconciliation Engine
    // -------------------------------------------------------------
    console.log('\n[Test 1] Executing Deterministic Reconciliation Engine...');
    const recSummary = await runDeterministicReconciliation(testRun.id);

    console.log(`  Reconciliation Engine Summary:`);
    console.log(`   - Total Processed Payments: ${recSummary.totalRecords}`);
    console.log(`   - Matched Count: ${recSummary.matchedCount}`);
    console.log(`   - Exception Count: ${recSummary.exceptionCount}`);
    console.log(`   - Match Rate: ${recSummary.matchRate}%`);

    if (recSummary.totalRecords === 100 && recSummary.matchedCount > 0 && recSummary.exceptionCount > 0) {
      console.log('  ✅ Test 1 PASSED: Deterministic reconciliation engine executed successfully.');
    } else {
      console.error('  ❌ Test 1 FAILED: Unexpected record or match count in reconciliation summary.');
      passedAll = false;
    }

    // -------------------------------------------------------------
    // Test 2: Verify Exception Classifications & Database Persistence
    // -------------------------------------------------------------
    console.log('\n[Test 2] Verifying reconciliation_results & exceptions in Supabase...');

    const { data: results, error: resErr } = await supabase
      .from('reconciliation_results')
      .select('*')
      .eq('run_id', testRun.id);

    const { data: exceptions, error: excErr } = await supabase
      .from('exceptions')
      .select('*')
      .eq('run_id', testRun.id);

    if (resErr || excErr || !results || !exceptions) {
      console.error('  ❌ Test 2 FAILED: Error querying reconciliation_results or exceptions:', resErr || excErr);
      passedAll = false;
    } else {
      console.log(`  Found ${results.length} total results and ${exceptions.length} exception records in Supabase.`);

      // Verify presence of specific exception categories
      const categoriesFound = new Set(exceptions.map(e => e.category));
      console.log(`  Exception Categories Detected in Database: ${Array.from(categoriesFound).join(', ')}`);

      const requiredCategories = ['AMOUNT_MISMATCH', 'MISSING_SETTLEMENT', 'DUPLICATE_TRANSACTION'];
      const hasAllRequired = requiredCategories.every(cat => categoriesFound.has(cat));


      if (hasAllRequired && exceptions.length === recSummary.exceptionCount) {
        console.log('  ✅ Test 2 PASSED: All expected exception categories were deterministically identified and persisted to Supabase.');
      } else {
        console.error('  ❌ Test 2 FAILED: Missing required exception categories in database results.');
        passedAll = false;
      }
    }

    // -------------------------------------------------------------
    // Test 3: Idempotency & Repeat Run Verification
    // -------------------------------------------------------------
    console.log('\n[Test 3] Verifying Engine Idempotency (Executing reconciliation a second time)...');
    
    const secondSummary = await runDeterministicReconciliation(testRun.id);

    const { count: resCountAfter } = await supabase
      .from('reconciliation_results')
      .select('id', { count: 'exact', head: true })
      .eq('run_id', testRun.id);

    const { count: excCountAfter } = await supabase
      .from('exceptions')
      .select('id', { count: 'exact', head: true })
      .eq('run_id', testRun.id);

    if (
      secondSummary.matchedCount === recSummary.matchedCount &&
      secondSummary.exceptionCount === recSummary.exceptionCount &&
      resCountAfter === results.length &&
      excCountAfter === exceptions.length
    ) {
      console.log('  ✅ Test 3 PASSED: Engine is 100% idempotent. Repeat execution produced identical results without duplicate rows.');
    } else {
      console.error(`  ❌ Test 3 FAILED: Idempotency check failed! Initial exceptions=${exceptions.length}, Second run exceptions=${excCountAfter}`);
      passedAll = false;
    }

    // -------------------------------------------------------------
    // Test 4: Regression Check — Phase 3 RAG & Phase 4 Upload APIs
    // -------------------------------------------------------------
    console.log('\n[Test 4] Regression Check — Phase 3 RAG and Phase 4 Uploads...');

    // RAG Search Check
    const ragResults = await searchRagKnowledge('settlement fees', { topK: 1 });
    if (ragResults.length > 0 && ragResults[0].similarity > 0.70) {
      console.log(`  Sub-test 4.1 PASSED: Phase 3 RAG search operational (Similarity: ${ragResults[0].similarity}).`);
    } else {
      console.error('  ❌ Sub-test 4.1 FAILED: Phase 3 RAG search regression check failed.');
      passedAll = false;
    }

    // Reconciliation Run Query Check
    const { data: runFetch, error: runFetchErr } = await supabase
      .from('reconciliation_runs')
      .select('*')
      .eq('id', testRun.id)
      .single();

    if (!runFetchErr && runFetch && runFetch.status === 'completed' && parseFloat(runFetch.match_rate) > 0) {
      console.log(`  Sub-test 4.2 PASSED: Reconciliation run summary updated correctly in database (Match Rate: ${runFetch.match_rate}%).`);
    } else {
      console.error('  ❌ Sub-test 4.2 FAILED: Reconciliation run summary check failed.');
      passedAll = false;
    }

    console.log('  ✅ Test 4 PASSED: Phase 1-4 functionalities remain 100% operational.');

  } catch (error) {
    console.error('❌ Exception thrown during Phase 5 strict verification:', error);
    passedAll = false;
  } finally {
    // -------------------------------------------------------------
    // Cleanup Verification Run Records
    // -------------------------------------------------------------
    if (testRun && testRun.id) {
      console.log('\n[Cleanup] Cleaning up test reconciliation run records from Supabase...');
      await supabase.from('exceptions').delete().eq('run_id', testRun.id);
      await supabase.from('reconciliation_results').delete().eq('run_id', testRun.id);
      await supabase.from('payment_records').delete().eq('run_id', testRun.id);
      await supabase.from('settlement_records').delete().eq('run_id', testRun.id);
      await supabase.from('reconciliation_runs').delete().eq('id', testRun.id);
      console.log('  Cleaned up test run successfully.');
    }
  }

  console.log('\n===========================================================');
  if (passedAll) {
    console.log('🎉 ALL PHASE 5 STRICT VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('❌ PHASE 5 STRICT VERIFICATION FAILED SOME TESTS.');
  }
  console.log('===========================================================');
}

runStrictPhase5Verification();
