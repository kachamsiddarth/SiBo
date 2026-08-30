/**
 * Phase 10 - Master Evaluation Runner
 *
 * Purpose: Orchestrate all three evaluation suites (Reconciliation, RAG, AI Investigation)
 * and produce a comprehensive Phase 10 evaluation report.
 */

import { runReconciliationEvaluation } from './phase10_reconciliation_eval.js';
import { runRAGEvaluation } from './phase10_rag_eval.js';
import { runAIInvestigationEvaluation } from './phase10_ai_eval.js';

/**
 * Master evaluation orchestrator
 */
async function runPhase10Evaluation() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 10 - COMPLETE SYSTEM EVALUATION');
  console.log('='.repeat(80));
  console.log(`\nStarted: ${new Date().toISOString()}`);

  const evaluationStart = Date.now();
  const results = {
    phase: 'Phase 10 - Evaluation & Benchmarking',
    timestamp: new Date().toISOString(),
    suites: {}
  };

  // Run Reconciliation Evaluation
  console.log('\n' + '-'.repeat(80));
  console.log('SUITE 1: RECONCILIATION EVALUATION');
  console.log('-'.repeat(80));

  try {
    console.log('\n⏱️  Running reconciliation evaluation suite...');
    const reconResults = await runReconciliationEvaluation();

    results.suites.reconciliation = {
      success: reconResults.success,
      passed: reconResults.passed,
      runId: reconResults.runId,
      report: reconResults.report,
      error: reconResults.error
    };

    console.log(`\n✅ Reconciliation evaluation ${reconResults.passed ? 'PASSED' : 'NEEDS REVIEW'}`);
  } catch (error) {
    console.error(`\n❌ Reconciliation evaluation error: ${error.message}`);
    results.suites.reconciliation = {
      success: false,
      error: error.message
    };
  }

  // Run RAG Evaluation
  console.log('\n' + '-'.repeat(80));
  console.log('SUITE 2: RAG EVALUATION');
  console.log('-'.repeat(80));

  try {
    console.log('\n⏱️  Running RAG evaluation suite...');
    const ragResults = await runRAGEvaluation();

    results.suites.rag = {
      success: ragResults.success,
      passed: ragResults.passed,
      report: ragResults.report,
      error: ragResults.error
    };

    console.log(`\n✅ RAG evaluation ${ragResults.passed ? 'PASSED' : 'NEEDS REVIEW'}`);
  } catch (error) {
    console.error(`\n❌ RAG evaluation error: ${error.message}`);
    results.suites.rag = {
      success: false,
      error: error.message
    };
  }

  // Run AI Investigation Evaluation
  console.log('\n' + '-'.repeat(80));
  console.log('SUITE 3: AI INVESTIGATION EVALUATION');
  console.log('-'.repeat(80));

  try {
    console.log('\n⏱️  Running AI investigation evaluation suite...');
    const aiResults = await runAIInvestigationEvaluation();

    results.suites.ai = {
      success: aiResults.success,
      passed: aiResults.passed,
      runId: aiResults.runId,
      report: aiResults.report,
      error: aiResults.error
    };

    console.log(`\n✅ AI investigation evaluation ${aiResults.passed ? 'PASSED' : 'NEEDS REVIEW'}`);
  } catch (error) {
    console.error(`\n❌ AI investigation evaluation error: ${error.message}`);
    results.suites.ai = {
      success: false,
      error: error.message
    };
  }

  // Generate summary
  const evaluationEnd = Date.now();
  const totalTime = (evaluationEnd - evaluationStart) / 1000;

  const passedCount = Object.values(results.suites).filter(s => s.passed).length;
  const successCount = Object.values(results.suites).filter(s => s.success).length;

  results.summary = {
    totalTime: `${totalTime.toFixed(2)}s`,
    suitesPassed: `${passedCount}/3`,
    suitesSuccessful: `${successCount}/3`,
    overallStatus: passedCount === 3 ? '✅ PHASE 10 COMPLETE' : '⚠️ PHASE 10 NEEDS REVIEW'
  };

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 10 EVALUATION SUMMARY');
  console.log('='.repeat(80));

  console.log('\n📊 OVERALL RESULTS:');
  console.log(`   Suites Passed: ${results.summary.suitesPassed}`);
  console.log(`   Suites Successful: ${results.summary.suitesSuccessful}`);
  console.log(`   Total Time: ${results.summary.totalTime}`);
  console.log(`   Status: ${results.summary.overallStatus}`);

  console.log('\n🔍 SUITE DETAILS:');
  console.log(`   1. Reconciliation: ${results.suites.reconciliation.success ? '✅ Success' : '❌ Failed'} ${results.suites.reconciliation.passed ? '(PASSED)' : '(needs review)'}`);
  console.log(`   2. RAG: ${results.suites.rag.success ? '✅ Success' : '❌ Failed'} ${results.suites.rag.passed ? '(PASSED)' : '(needs review)'}`);
  console.log(`   3. AI Investigation: ${results.suites.ai.success ? '✅ Success' : '❌ Failed'} ${results.suites.ai.passed ? '(PASSED)' : '(needs review)'}`);

  console.log('\n' + '='.repeat(80));
  console.log('📂 Evaluation reports saved to: evaluation-reports/');
  console.log('   - reconciliation-evaluation.json');
  console.log('   - rag-evaluation.json');
  console.log('   - ai-evaluation.json');
  console.log('='.repeat(80));

  console.log('\nCompleted: ' + new Date().toISOString());

  // Save master report
  const fs = await import('fs/promises');
  await fs.mkdir('evaluation-reports', { recursive: true });
  await fs.writeFile(
    'evaluation-reports/phase10-master-report.json',
    JSON.stringify(results, null, 2)
  );

  console.log('\n💾 Master report saved to: evaluation-reports/phase10-master-report.json');

  return results;
}

// Run if executed directly
runPhase10Evaluation()
  .then(results => {
    const allPassed = results.suites.reconciliation.passed &&
                      results.suites.rag.passed &&
                      results.suites.ai.passed;
    process.exit(allPassed ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

export { runPhase10Evaluation };
