import { supabase } from '../config/supabase.js';
import { csvProcessor } from '../services/csvProcessor.js';
import { generateDataset } from './generateSyntheticData.js';
import { runDeterministicReconciliation } from '../services/reconciliationEngine.js';
import { investigateException } from '../agent/investigationAgent.js';
import fetch from 'node-fetch';

/**
 * Phase 8 - End-to-End Integration Verification
 *
 * Tests the complete workflow from upload to AI investigation
 * according to MASTER_BUILD_SPEC.md Phase 9 checklist.
 */

const API_BASE = 'http://localhost:5000/api';

async function runPhase8EndToEndVerification() {
  console.log('=============================================================');
  console.log('🔍 PHASE 8 - END-TO-END INTEGRATION VERIFICATION');
  console.log('=============================================================');
  console.log('Testing complete workflow: Upload → Reconciliation → AI Investigation');
  console.log('=============================================================\n');

  let passedTests = 0;
  let failedTests = 0;
  let testRun = null;

  try {
    // ================================================================
    // TEST 1: Health Check & Backend Connectivity
    // ================================================================
    console.log('[Test 1] Backend Health Check & Service Connectivity...');
    try {
      const healthRes = await fetch(`${API_BASE}/health`);
      const health = await healthRes.json();

      if (health.status === 'ok' &&
          health.services?.supabase === 'connected' &&
          health.services?.groq === 'configured' &&
          health.services?.hf === 'configured') {
        console.log('  ✅ Test 1 PASSED: Backend services healthy and connected');
        passedTests++;
      } else {
        throw new Error('Health check returned unexpected status');
      }
    } catch (error) {
      console.error(`  ❌ Test 1 FAILED: ${error.message}`);
      failedTests++;
    }

    // ================================================================
    // TEST 2: Synthetic Dataset Generation
    // ================================================================
    console.log('\n[Test 2] Synthetic Dataset Generation (50+ records)...');
    try {
      const dataset = generateDataset(60);

      if (dataset && dataset.payments && dataset.settlements &&
          dataset.payments.length >= 50) {
        console.log(`  ✅ Test 2 PASSED: Generated ${dataset.payments.length} payments + ${dataset.settlements.length} settlements`);
        console.log(`     Scenarios included: ${dataset.scenarios ? dataset.scenarios.length : 'N/A'}`);
        passedTests++;

        // Store for next tests
        global.testDataset = dataset;
      } else {
        throw new Error(`Dataset generation produced insufficient records: ${dataset?.payments?.length || 0} payments`);
      }
    } catch (error) {
      console.error(`  ❌ Test 2 FAILED: ${error.message}`);
      failedTests++;
      throw new Error('Cannot continue without valid dataset');
    }

    // ================================================================
    // TEST 3: Create Reconciliation Run
    // ================================================================
    console.log('\n[Test 3] Create Reconciliation Run via csvProcessor...');
    try {
      testRun = await csvProcessor.createReconciliationRun({
        fileName: 'phase8_e2e_verification.csv',
        totalRecords: global.testDataset.payments.length + global.testDataset.settlements.length
      });

      if (testRun && testRun.id) {
        console.log(`  ✅ Test 3 PASSED: Created run ${testRun.id}`);
        passedTests++;
      } else {
        throw new Error('Run creation returned no ID');
      }
    } catch (error) {
      console.error(`  ❌ Test 3 FAILED: ${error.message}`);
      failedTests++;
      throw new Error('Cannot continue without valid run');
    }

    // ================================================================
    // TEST 4: Upload & Validate Payment Records
    // ================================================================
    console.log('\n[Test 4] Upload & Validate Payment Records...');
    try {
      const paymentCount = await csvProcessor.insertPaymentRecords(
        global.testDataset.payments,
        testRun.id
      );

      const { data: verifyPayments } = await supabase
        .from('payment_records')
        .select('*')
        .eq('run_id', testRun.id);

      if (verifyPayments && verifyPayments.length === global.testDataset.payments.length) {
        console.log(`  ✅ Test 4 PASSED: ${verifyPayments.length} payment records persisted to Supabase`);
        passedTests++;
      } else {
        throw new Error(`Expected ${global.testDataset.payments.length} records, got ${verifyPayments?.length || 0}`);
      }
    } catch (error) {
      console.error(`  ❌ Test 4 FAILED: ${error.message}`);
      failedTests++;
    }

    // ================================================================
    // TEST 5: Upload & Validate Settlement Records
    // ================================================================
    console.log('\n[Test 5] Upload & Validate Settlement Records...');
    try {
      const settlementCount = await csvProcessor.insertSettlementRecords(
        global.testDataset.settlements,
        testRun.id
      );

      const { data: verifySettlements } = await supabase
        .from('settlement_records')
        .select('*')
        .eq('run_id', testRun.id);

      if (verifySettlements && verifySettlements.length === global.testDataset.settlements.length) {
        console.log(`  ✅ Test 5 PASSED: ${verifySettlements.length} settlement records persisted to Supabase`);
        passedTests++;
      } else {
        throw new Error(`Expected ${global.testDataset.settlements.length} records, got ${verifySettlements?.length || 0}`);
      }
    } catch (error) {
      console.error(`  ❌ Test 5 FAILED: ${error.message}`);
      failedTests++;
    }

    // ================================================================
    // TEST 6: Deterministic Reconciliation Engine Execution
    // ================================================================
    console.log('\n[Test 6] Execute Deterministic Reconciliation Engine...');
    try {
      const recSummary = await runDeterministicReconciliation(testRun.id);

      if (recSummary &&
          typeof recSummary.totalRecords === 'number' &&
          typeof recSummary.matchedCount === 'number' &&
          typeof recSummary.exceptionCount === 'number' &&
          recSummary.totalRecords === recSummary.matchedCount + recSummary.exceptionCount) {
        console.log(`  ✅ Test 6 PASSED: Reconciliation completed`);
        console.log(`     Total: ${recSummary.totalRecords}, Matched: ${recSummary.matchedCount}, Exceptions: ${recSummary.exceptionCount}`);
        console.log(`     Match Rate: ${recSummary.matchRate.toFixed(2)}%`);
        passedTests++;

        global.recSummary = recSummary;
      } else {
        throw new Error('Reconciliation returned invalid summary');
      }
    } catch (error) {
      console.error(`  ❌ Test 6 FAILED: ${error.message}`);
      failedTests++;
    }

    // ================================================================
    // TEST 7: Reconciliation Results Persistence
    // ================================================================
    console.log('\n[Test 7] Verify Reconciliation Results in Supabase...');
    try {
      const { data: results } = await supabase
        .from('reconciliation_results')
        .select('*')
        .eq('run_id', testRun.id);

      if (results && results.length === global.recSummary.totalRecords) {
        const matched = results.filter(r => r.status === 'MATCHED').length;
        const exceptions = results.filter(r => r.status === 'EXCEPTION').length;

        if (matched === global.recSummary.matchedCount && exceptions === global.recSummary.exceptionCount) {
          console.log(`  ✅ Test 7 PASSED: ${results.length} results persisted correctly`);
          passedTests++;
        } else {
          throw new Error('Result counts mismatch');
        }
      } else {
        throw new Error(`Expected ${global.recSummary.totalRecords} results, got ${results?.length || 0}`);
      }
    } catch (error) {
      console.error(`  ❌ Test 7 FAILED: ${error.message}`);
      failedTests++;
    }

    // ================================================================
    // TEST 8: Exceptions Generation & Classification
    // ================================================================
    console.log('\n[Test 8] Verify Exception Records Created...');
    try {
      const { data: exceptions } = await supabase
        .from('exceptions')
        .select('*')
        .eq('run_id', testRun.id);

      if (exceptions && exceptions.length === global.recSummary.exceptionCount && exceptions.length > 0) {
        const exceptionTypes = [...new Set(exceptions.map(e => e.exception_type))];
        console.log(`  ✅ Test 8 PASSED: ${exceptions.length} exceptions created`);
        console.log(`     Exception Types: ${exceptionTypes.join(', ')}`);
        passedTests++;

        global.testException = exceptions[0];
      } else {
        throw new Error(`Expected ${global.recSummary.exceptionCount} exceptions, got ${exceptions?.length || 0}`);
      }
    } catch (error) {
      console.error(`  ❌ Test 8 FAILED: ${error.message}`);
      failedTests++;
    }

    // ================================================================
    // TEST 9: RAG Knowledge Retrieval
    // ================================================================
    console.log('\n[Test 9] RAG Knowledge Base Search...');
    try {
      const ragRes = await fetch(`${API_BASE}/rag/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'settlement fees and tax calculation',
          matchCount: 5
        })
      });

      const ragData = await ragRes.json();

      if (ragData.success && Array.isArray(ragData.data) && ragData.data.length > 0) {
        console.log(`  ✅ Test 9 PASSED: RAG retrieved ${ragData.data.length} relevant chunks`);
        console.log(`     Top similarity: ${ragData.data[0].similarity?.toFixed(4) || 'N/A'}`);
        passedTests++;
      } else {
        throw new Error('RAG search returned no results');
      }
    } catch (error) {
      console.error(`  ❌ Test 9 FAILED: ${error.message}`);
      failedTests++;
    }

    // ================================================================
    // TEST 10: AI Exception Investigation (Full Workflow)
    // ================================================================
    console.log('\n[Test 10] AI Exception Investigation (LangChain + Groq + RAG)...');
    console.log('  This test may take 10-30 seconds depending on Groq API response time...');
    try {
      if (!global.testException) {
        throw new Error('No exception available for investigation');
      }

      const investigation = await investigateException(global.testException.id);

      if (investigation &&
          investigation.id &&
          investigation.exception_id === global.testException.id &&
          investigation.status &&
          investigation.summary &&
          investigation.reasoning) {
        console.log(`  ✅ Test 10 PASSED: AI investigation completed`);
        console.log(`     Investigation ID: ${investigation.id}`);
        console.log(`     Status: ${investigation.status}`);
        console.log(`     Confidence: ${investigation.confidence || 'N/A'}`);
        console.log(`     Sources Used: ${investigation.sources_used?.length || 0}`);
        passedTests++;

        global.testInvestigation = investigation;
      } else {
        throw new Error('Investigation returned incomplete data');
      }
    } catch (error) {
      console.error(`  ❌ Test 10 FAILED: ${error.message}`);
      failedTests++;
    }

    // ================================================================
    // TEST 11: AI Investigation Persistence
    // ================================================================
    console.log('\n[Test 11] Verify AI Investigation Persisted to Supabase...');
    try {
      const { data: investigation } = await supabase
        .from('ai_investigations')
        .select('*')
        .eq('exception_id', global.testException.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (investigation && investigation.id === global.testInvestigation.id) {
        console.log(`  ✅ Test 11 PASSED: Investigation persisted correctly`);
        passedTests++;
      } else {
        throw new Error('Investigation not found in database');
      }
    } catch (error) {
      console.error(`  ❌ Test 11 FAILED: ${error.message}`);
      failedTests++;
    }

    // ================================================================
    // TEST 12: Exception Status Update After Investigation
    // ================================================================
    console.log('\n[Test 12] Verify Exception Status Updated...');
    try {
      const { data: updatedException } = await supabase
        .from('exceptions')
        .select('*')
        .eq('id', global.testException.id)
        .single();

      if (updatedException &&
          (updatedException.ai_investigation_status === 'COMPLETED' ||
           updatedException.status === 'EXPLAINED')) {
        console.log(`  ✅ Test 12 PASSED: Exception updated with AI investigation status`);
        passedTests++;
      } else {
        throw new Error('Exception status not updated correctly');
      }
    } catch (error) {
      console.error(`  ❌ Test 12 FAILED: ${error.message}`);
      failedTests++;
    }

    // ================================================================
    // TEST 13: API Endpoint - Get Results
    // ================================================================
    console.log('\n[Test 13] API Endpoint - GET /api/reconciliation/results/:runId...');
    try {
      const res = await fetch(`${API_BASE}/reconciliation/results/${testRun.id}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        console.log(`  ✅ Test 13 PASSED: Results API returned ${data.data.length} records`);
        passedTests++;
      } else {
        throw new Error('Results API returned unexpected format');
      }
    } catch (error) {
      console.error(`  ❌ Test 13 FAILED: ${error.message}`);
      failedTests++;
    }

    // ================================================================
    // TEST 14: API Endpoint - Get Exceptions
    // ================================================================
    console.log('\n[Test 14] API Endpoint - GET /api/exceptions...');
    try {
      const res = await fetch(`${API_BASE}/exceptions?run_id=${testRun.id}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        console.log(`  ✅ Test 14 PASSED: Exceptions API returned ${data.data.length} exceptions`);
        passedTests++;
      } else {
        throw new Error('Exceptions API returned unexpected format');
      }
    } catch (error) {
      console.error(`  ❌ Test 14 FAILED: ${error.message}`);
      failedTests++;
    }

    // ================================================================
    // TEST 15: API Endpoint - Get Investigation
    // ================================================================
    console.log('\n[Test 15] API Endpoint - GET /api/ai/investigations/:exceptionId...');
    try {
      const res = await fetch(`${API_BASE}/ai/investigations/${global.testException.id}`);
      const data = await res.json();

      if (data.success && data.data && data.data.exception_id === global.testException.id) {
        console.log(`  ✅ Test 15 PASSED: Investigation API returned correct data`);
        passedTests++;
      } else {
        throw new Error('Investigation API returned unexpected format');
      }
    } catch (error) {
      console.error(`  ❌ Test 15 FAILED: ${error.message}`);
      failedTests++;
    }

    // ================================================================
    // TEST 16: Idempotency - Re-run Reconciliation
    // ================================================================
    console.log('\n[Test 16] Idempotency - Re-run Reconciliation on Same Dataset...');
    try {
      const recSummary2 = await runDeterministicReconciliation(testRun.id);

      if (recSummary2.totalRecords === global.recSummary.totalRecords &&
          recSummary2.matchedCount === global.recSummary.matchedCount &&
          recSummary2.exceptionCount === global.recSummary.exceptionCount) {
        console.log(`  ✅ Test 16 PASSED: Re-run produced identical results (idempotent)`);
        passedTests++;
      } else {
        throw new Error('Re-run produced different results');
      }
    } catch (error) {
      console.error(`  ❌ Test 16 FAILED: ${error.message}`);
      failedTests++;
    }

    // ================================================================
    // FINAL SUMMARY
    // ================================================================
    console.log('\n=============================================================');
    console.log('📊 PHASE 8 END-TO-END VERIFICATION SUMMARY');
    console.log('=============================================================');
    console.log(`✅ Passed: ${passedTests}/16 tests`);
    console.log(`❌ Failed: ${failedTests}/16 tests`);

    if (testRun) {
      console.log(`\n🔍 Test Run Details:`);
      console.log(`   Run ID: ${testRun.id}`);
      console.log(`   Total Records: ${global.recSummary?.totalRecords || 'N/A'}`);
      console.log(`   Matched: ${global.recSummary?.matchedCount || 'N/A'}`);
      console.log(`   Exceptions: ${global.recSummary?.exceptionCount || 'N/A'}`);
      console.log(`   Match Rate: ${global.recSummary?.matchRate?.toFixed(2) || 'N/A'}%`);
    }

    console.log('\n=============================================================');

    if (failedTests === 0) {
      console.log('🎉 ALL TESTS PASSED - Phase 8 End-to-End Integration Complete!');
      console.log('=============================================================\n');
      return { success: true, passed: passedTests, failed: failedTests };
    } else {
      console.log('⚠️  SOME TESTS FAILED - Review errors above');
      console.log('=============================================================\n');
      return { success: false, passed: passedTests, failed: failedTests };
    }

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    console.error('Stack:', error.stack);
    console.log('\n=============================================================');
    console.log(`📊 Tests Completed Before Error: ${passedTests} passed, ${failedTests} failed`);
    console.log('=============================================================\n');
    return { success: false, passed: passedTests, failed: failedTests, error: error.message };
  }
}

// Execute verification
runPhase8EndToEndVerification()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
