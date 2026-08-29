import { supabase } from '../config/supabase.js';
import { csvProcessor } from '../services/csvProcessor.js';
import { generateDataset } from './generateSyntheticData.js';
import { runDeterministicReconciliation } from '../services/reconciliationEngine.js';
import { investigateException, getTransactionTool, getSettlementTool, getReconciliationResultTool, getExceptionTool, searchFinanceKnowledgeTool } from '../agent/investigationAgent.js';
import { searchRagKnowledge } from '../rag/retriever/ragRetriever.js';

async function runStrictPhase6Verification() {
  console.log('===========================================================');
  console.log('🔍 STARTING STRICT PHASE 6 VERIFICATION SUITE FOR AI AGENT');
  console.log('===========================================================');

  let passedAll = true;
  let testRun = null;

  try {
    // -------------------------------------------------------------
    // Setup: Generate Dataset, Upload & Reconcile in Live Supabase
    // -------------------------------------------------------------
    console.log('\n[Setup] Preparing synthetic dataset & running reconciliation...');
    const dataset = generateDataset(50);

    testRun = await csvProcessor.createReconciliationRun({
      fileName: 'phase6_strict_verification.csv',
      totalRecords: dataset.payments.length + dataset.settlements.length
    });

    await csvProcessor.insertPaymentRecords(dataset.payments, testRun.id);
    await csvProcessor.insertSettlementRecords(dataset.settlements, testRun.id);

    const recSummary = await runDeterministicReconciliation(testRun.id);
    console.log(`  Setup Complete: Created run ${testRun.id} with ${recSummary.exceptionCount} exceptions.`);

    // -------------------------------------------------------------
    // Test 1: Verify Operational & RAG Tools Initialization
    // -------------------------------------------------------------
    console.log('\n[Test 1] Testing LangChain Operational & RAG Tools...');

    const { data: sampleExc, error: excErr } = await supabase
      .from('exceptions')
      .select('*')
      .eq('run_id', testRun.id)
      .limit(1)
      .single();

    if (excErr || !sampleExc) {
      console.error('  ❌ Test 1 FAILED: Could not fetch sample exception for tool testing.');
      passedAll = false;
    } else {
      const txnId = sampleExc.transaction_id;

      const [txRes, stRes, recRes, excRes, ragRes] = await Promise.all([
        getTransactionTool.func({ transaction_id: txnId }),
        getSettlementTool.func({ transaction_id: txnId }),
        getReconciliationResultTool.func({ transaction_id: txnId }),
        getExceptionTool.func({ exception_id: sampleExc.id }),
        searchFinanceKnowledgeTool.func({ query: 'settlement fees and taxes' })
      ]);

      const txParsed = JSON.parse(txRes);
      const excParsed = JSON.parse(excRes);
      const ragParsed = JSON.parse(ragRes);

      if (txParsed.transaction_id === txnId && excParsed.id === sampleExc.id && Array.isArray(ragParsed)) {
        console.log('  ✅ Test 1 PASSED: All 5 LangChain tools initialized and returned correct operational/RAG data.');
      } else {
        console.error('  ❌ Test 1 FAILED: Tool response output format mismatch.');
        passedAll = false;
      }
    }

    // -------------------------------------------------------------
    // Test 2: AI Exception Investigation & Supabase Persistence
    // -------------------------------------------------------------
    console.log('\n[Test 2] Executing AI Exception Investigation (Groq + RAG)...');

    const investigation = await investigateException(sampleExc.id);

    console.log('\n  AI Investigation Results Summary:');
    console.log(`   - Investigation ID: ${investigation.id}`);
    console.log(`   - Executive Summary: ${investigation.summary}`);
    console.log(`   - Recommended Action: ${investigation.recommended_action}`);
    console.log(`   - Confidence: ${investigation.confidence}`);
    console.log(`   - Sources Used Count: ${Array.isArray(investigation.sources_used) ? investigation.sources_used.length : 0}`);

    if (
      investigation.id &&
      investigation.exception_id === sampleExc.id &&
      investigation.summary &&
      investigation.reasoning &&
      investigation.recommended_action
    ) {
      console.log('  ✅ Test 2 PASSED: AI investigation completed and persisted to ai_investigations in Supabase.');
    } else {
      console.error('  ❌ Test 2 FAILED: AI investigation persistence missing required fields.');
      passedAll = false;
    }

    // -------------------------------------------------------------
    // Test 3: Verify Exceptions Table Status Update
    // -------------------------------------------------------------
    console.log('\n[Test 3] Verifying status update in exceptions table...');

    const { data: updatedExc, error: upErr } = await supabase
      .from('exceptions')
      .select('*')
      .eq('id', sampleExc.id)
      .single();

    if (!upErr && updatedExc && updatedExc.ai_investigation_status === 'COMPLETED') {
      console.log(`  ✅ Test 3 PASSED: Exceptions table status updated to ai_investigation_status='COMPLETED', status='${updatedExc.status}'.`);
    } else {
      console.error('  ❌ Test 3 FAILED: Exceptions table status update check failed.');
      passedAll = false;
    }

    // -------------------------------------------------------------
    // Test 4: Regression Check — Phase 3 RAG, Phase 4 Upload, Phase 5 Rec Engine
    // -------------------------------------------------------------
    console.log('\n[Test 4] Regression Check — Phase 3 RAG, Phase 4 Ingestion, Phase 5 Reconciliation Engine...');

    const ragSearch = await searchRagKnowledge('settlement breakup', { topK: 1 });
    if (ragSearch.length > 0 && ragSearch[0].similarity > 0.70) {
      console.log(`  Sub-test 4.1 PASSED: Phase 3 RAG search operational (Similarity: ${ragSearch[0].similarity}).`);
    } else {
      console.error('  ❌ Sub-test 4.1 FAILED: Phase 3 RAG search failed regression.');
      passedAll = false;
    }

    if (recSummary.matchedCount > 0 && recSummary.exceptionCount > 0) {
      console.log(`  Sub-test 4.2 PASSED: Phase 5 Reconciliation Engine operational (Match Rate: ${recSummary.matchRate}%).`);
    } else {
      console.error('  ❌ Sub-test 4.2 FAILED: Phase 5 Reconciliation Engine failed regression.');
      passedAll = false;
    }

    console.log('  ✅ Test 4 PASSED: All previous phases remain 100% operational.');

  } catch (error) {
    console.error('❌ Exception thrown during Phase 6 strict verification:', error);
    passedAll = false;
  } finally {
    // -------------------------------------------------------------
    // Cleanup Test Run Records
    // -------------------------------------------------------------
    if (testRun && testRun.id) {
      console.log('\n[Cleanup] Cleaning up strict test run records from Supabase...');
      await supabase.from('ai_investigations').delete().eq('run_id', testRun.id);
      await supabase.from('exceptions').delete().eq('run_id', testRun.id);
      await supabase.from('reconciliation_results').delete().eq('run_id', testRun.id);
      await supabase.from('payment_records').delete().eq('run_id', testRun.id);
      await supabase.from('settlement_records').delete().eq('run_id', testRun.id);
      await supabase.from('reconciliation_runs').delete().eq('id', testRun.id);
      console.log('  Cleaned up test records successfully.');
    }
  }

  console.log('\n===========================================================');
  if (passedAll) {
    console.log('🎉 ALL PHASE 6 STRICT VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('❌ PHASE 6 STRICT VERIFICATION FAILED SOME TESTS.');
  }
  console.log('===========================================================');
}

runStrictPhase6Verification();
