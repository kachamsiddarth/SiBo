/**
 * Phase 10 - Reconciliation Evaluation Suite
 *
 * Purpose: Produce measurable evidence that the reconciliation engine works correctly.
 * Creates a known-answer dataset and measures accuracy against expected outcomes.
 */

import { supabase } from '../config/supabase.js';
import { generateDataset } from './generateSyntheticData.js';
import { reconcile } from '../services/reconciliationEngine.js';
import { v4 as uuidv4 } from 'uuid';

const EVALUATION_DATASET_SIZE = 100;

/**
 * Known-answer test scenarios with expected reconciliation outcomes
 */
const KNOWN_SCENARIOS = {
  MATCHED: {
    count: 60,
    expectedStatus: 'MATCHED',
    expectedExceptionType: null
  },
  AMOUNT_MISMATCH: {
    count: 15,
    expectedStatus: 'EXCEPTION',
    expectedExceptionType: 'AMOUNT_MISMATCH'
  },
  MISSING_SETTLEMENT: {
    count: 10,
    expectedStatus: 'EXCEPTION',
    expectedExceptionType: 'MISSING_SETTLEMENT'
  },
  DUPLICATE_TRANSACTION: {
    count: 5,
    expectedStatus: 'EXCEPTION',
    expectedExceptionType: 'DUPLICATE_TRANSACTION'
  },
  COMPONENT_MISMATCH: {
    count: 5,
    expectedStatus: 'EXCEPTION',
    expectedExceptionType: 'COMPONENT_MISMATCH'
  },
  UNEXPLAINED_DIFFERENCE: {
    count: 5,
    expectedStatus: 'EXCEPTION',
    expectedExceptionType: 'UNEXPLAINED_DIFFERENCE'
  }
};

/**
 * Evaluation metrics tracking
 */
class ReconciliationMetrics {
  constructor() {
    this.totalRecords = 0;
    this.expectedMatches = 0;
    this.expectedExceptions = 0;
    this.correctlyMatched = 0;
    this.correctlyDetectedExceptions = 0;
    this.falseMatches = 0; // Should be exception but marked as matched
    this.missedExceptions = 0; // Should be matched but marked as exception
    this.correctExceptionTypes = 0;
    this.incorrectExceptionTypes = 0;
    this.processingTimeMs = 0;
    this.startTime = null;
    this.endTime = null;
  }

  startTimer() {
    this.startTime = Date.now();
  }

  stopTimer() {
    this.endTime = Date.now();
    this.processingTimeMs = this.endTime - this.startTime;
  }

  calculateAccuracy() {
    const correctPredictions = this.correctlyMatched + this.correctlyDetectedExceptions;
    const totalPredictions = this.totalRecords;
    return totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;
  }

  calculatePrecision() {
    const truePositives = this.correctlyDetectedExceptions;
    const falsePositives = this.falseMatches;
    const total = truePositives + falsePositives;
    return total > 0 ? (truePositives / total) * 100 : 0;
  }

  calculateRecall() {
    const truePositives = this.correctlyDetectedExceptions;
    const falseNegatives = this.missedExceptions;
    const total = truePositives + falseNegatives;
    return total > 0 ? (truePositives / total) * 100 : 0;
  }

  calculateF1Score() {
    const precision = this.calculatePrecision();
    const recall = this.calculateRecall();
    const total = precision + recall;
    return total > 0 ? (2 * precision * recall) / total : 0;
  }

  getThroughput() {
    return this.processingTimeMs > 0
      ? (this.totalRecords / (this.processingTimeMs / 1000)).toFixed(2)
      : 0;
  }

  getReport() {
    return {
      overview: {
        totalRecords: this.totalRecords,
        expectedMatches: this.expectedMatches,
        expectedExceptions: this.expectedExceptions,
        processingTimeMs: this.processingTimeMs,
        throughputRecordsPerSecond: parseFloat(this.getThroughput())
      },
      accuracy: {
        correctlyMatched: this.correctlyMatched,
        correctlyDetectedExceptions: this.correctlyDetectedExceptions,
        falseMatches: this.falseMatches,
        missedExceptions: this.missedExceptions,
        overallAccuracy: this.calculateAccuracy().toFixed(2) + '%',
        precision: this.calculatePrecision().toFixed(2) + '%',
        recall: this.calculateRecall().toFixed(2) + '%',
        f1Score: this.calculateF1Score().toFixed(2) + '%'
      },
      exceptionTypeAccuracy: {
        correctExceptionTypes: this.correctExceptionTypes,
        incorrectExceptionTypes: this.incorrectExceptionTypes,
        typeAccuracy: this.expectedExceptions > 0
          ? ((this.correctExceptionTypes / this.expectedExceptions) * 100).toFixed(2) + '%'
          : 'N/A'
      }
    };
  }
}

/**
 * Generate evaluation dataset with known expected outcomes
 */
async function generateEvaluationDataset() {
  console.log('\n📊 Generating evaluation dataset with known outcomes...');

  // Generate synthetic dataset with specific scenario distribution
  const dataset = generateDataset(EVALUATION_DATASET_SIZE);

  // Create expected outcomes map
  const expectedOutcomes = new Map();

  dataset.payments.forEach((payment, index) => {
    const settlement = dataset.settlements.find(s => s.transaction_id === payment.transaction_id);

    // Determine expected outcome based on scenario
    let expectedStatus = 'MATCHED';
    let expectedExceptionType = null;

    if (!settlement) {
      expectedStatus = 'EXCEPTION';
      expectedExceptionType = 'MISSING_SETTLEMENT';
    } else {
      // Calculate expected settlement using parseFloat for all numeric values
      const paymentAmount = parseFloat(payment.payment_amount) || 0;
      const fee = parseFloat(settlement.fee) || 0;
      const tax = parseFloat(settlement.tax) || 0;
      const refund = parseFloat(settlement.refund) || 0;
      const adjustment = parseFloat(settlement.adjustment) || 0;
      const settlementAmount = parseFloat(settlement.settlement_amount) || 0;

      const expected = paymentAmount - fee - tax - refund + adjustment;

      if (Math.abs(expected - settlementAmount) > 0.01) {
        expectedStatus = 'EXCEPTION';

        // Determine exception type from settlement metadata (authoritative source)
        let metaScenario = null;
        if (settlement.metadata) {
          try {
            const parsed = typeof settlement.metadata === 'string' ? JSON.parse(settlement.metadata) : settlement.metadata;
            metaScenario = parsed.scenario;
          } catch (e) {}
        }

        if (metaScenario === 'amount_mismatch') {
          expectedExceptionType = 'AMOUNT_MISMATCH';
        } else if (metaScenario === 'component_mismatch') {
          expectedExceptionType = 'COMPONENT_MISMATCH';
        } else if (metaScenario === 'unexplained_difference') {
          expectedExceptionType = 'UNEXPLAINED_DIFFERENCE';
        } else {
          // Fallback to heuristic if no metadata (should not happen in synthetic data)
          if (Math.abs(expected - settlementAmount) > 100) {
            expectedExceptionType = 'UNEXPLAINED_DIFFERENCE';
          } else if (fee === 0 && tax === 0) {
            expectedExceptionType = 'COMPONENT_MISMATCH';
          } else {
            expectedExceptionType = 'AMOUNT_MISMATCH';
          }
        }
      }
    }

    // Check for duplicate settlements (matching reconciliation engine logic)
    const settlementsForTxn = dataset.settlements.filter(s => s.transaction_id === payment.transaction_id);
    if (settlementsForTxn.length > 1) {
      expectedStatus = 'EXCEPTION';
      expectedExceptionType = 'DUPLICATE_TRANSACTION';
    }

    expectedOutcomes.set(payment.transaction_id, {
      expectedStatus,
      expectedExceptionType
    });
  });

  console.log(`✅ Generated ${dataset.payments.length} payment records`);
  console.log(`✅ Generated ${dataset.settlements.length} settlement records`);
  console.log(`✅ Created ${expectedOutcomes.size} expected outcome mappings`);

  return { dataset, expectedOutcomes };
}

/**
 * Upload evaluation dataset to Supabase
 */
async function uploadEvaluationDataset(dataset) {
  console.log('\n📤 Uploading evaluation dataset to Supabase...');

  const runId = uuidv4();

  // Create reconciliation run
  const { data: run, error: runError } = await supabase
    .from('reconciliation_runs')
    .insert({
      id: runId,
      status: 'pending',
      total_records: dataset.payments.length
    })
    .select()
    .single();

  if (runError) {
    throw new Error(`Failed to create reconciliation run: ${runError.message}`);
  }

  // Insert payment records
  const paymentRecords = dataset.payments.map(p => ({
    ...p,
    run_id: runId
  }));

  const { error: paymentError } = await supabase
    .from('payment_records')
    .insert(paymentRecords);

  if (paymentError) {
    throw new Error(`Failed to insert payment records: ${paymentError.message}`);
  }

  // Insert settlement records
  const settlementRecords = dataset.settlements.map(s => ({
    ...s,
    run_id: runId
  }));

  const { error: settlementError } = await supabase
    .from('settlement_records')
    .insert(settlementRecords);

  if (settlementError) {
    throw new Error(`Failed to insert settlement records: ${settlementError.message}`);
  }

  console.log(`✅ Uploaded evaluation dataset to run ${runId}`);

  return { runId, run };
}

/**
 * Run reconciliation and evaluate against expected outcomes
 */
async function evaluateReconciliation(runId, expectedOutcomes) {
  console.log('\n⚙️  Running reconciliation engine on evaluation dataset...');

  const metrics = new ReconciliationMetrics();
  metrics.startTimer();

  // Run reconciliation
  const reconciliationResult = await reconcile(runId);

  metrics.stopTimer();

  console.log(`✅ Reconciliation completed in ${metrics.processingTimeMs}ms`);

  // Fetch reconciliation results from database
  const { data: results, error: resultsError } = await supabase
    .from('reconciliation_results')
    .select('*')
    .eq('run_id', runId);

  if (resultsError) {
    throw new Error(`Failed to fetch reconciliation results: ${resultsError.message}`);
  }

  console.log(`\n📊 Evaluating ${results.length} reconciliation results...`);

  metrics.totalRecords = results.length;

  // Count expected outcomes
  expectedOutcomes.forEach((outcome) => {
    if (outcome.expectedStatus === 'MATCHED') {
      metrics.expectedMatches++;
    } else {
      metrics.expectedExceptions++;
    }
  });

  // Evaluate each result against expected outcome
  results.forEach((result) => {
    const expected = expectedOutcomes.get(result.transaction_id);

    if (!expected) {
      console.warn(`⚠️  No expected outcome for transaction ${result.transaction_id}`);
      return;
    }

    const actualStatus = result.status;
    const actualExceptionType = result.exception_type;

    // Check status accuracy
    if (actualStatus === expected.expectedStatus) {
      if (actualStatus === 'MATCHED') {
        metrics.correctlyMatched++;
      } else {
        metrics.correctlyDetectedExceptions++;

        // Check exception type accuracy for exceptions
        if (actualExceptionType === expected.expectedExceptionType) {
          metrics.correctExceptionTypes++;
        } else {
          metrics.incorrectExceptionTypes++;
          console.log(`⚠️  Wrong exception type for ${result.transaction_id}: expected ${expected.expectedExceptionType}, got ${actualExceptionType}`);
        }
      }
    } else {
      // Status mismatch
      if (actualStatus === 'MATCHED' && expected.expectedStatus === 'EXCEPTION') {
        metrics.falseMatches++;
        console.log(`❌ False match: ${result.transaction_id} should be ${expected.expectedExceptionType}`);
      } else if (actualStatus === 'EXCEPTION' && expected.expectedStatus === 'MATCHED') {
        metrics.missedExceptions++;
        console.log(`❌ Missed exception: ${result.transaction_id} incorrectly marked as ${actualExceptionType}`);
      }
    }
  });

  return metrics;
}

/**
 * Main evaluation function
 */
async function runReconciliationEvaluation() {
  console.log('='.repeat(80));
  console.log('PHASE 10 - RECONCILIATION EVALUATION SUITE');
  console.log('='.repeat(80));

  try {
    // Step 1: Generate evaluation dataset with known outcomes
    const { dataset, expectedOutcomes } = await generateEvaluationDataset();

    // Step 2: Upload dataset to Supabase
    const { runId } = await uploadEvaluationDataset(dataset);

    // Step 3: Run reconciliation and evaluate
    const metrics = await evaluateReconciliation(runId, expectedOutcomes);

    // Step 4: Generate evaluation report
    const report = metrics.getReport();

    console.log('\n' + '='.repeat(80));
    console.log('RECONCILIATION EVALUATION REPORT');
    console.log('='.repeat(80));

    console.log('\n📊 OVERVIEW:');
    console.log(`   Total Records: ${report.overview.totalRecords}`);
    console.log(`   Expected Matches: ${report.overview.expectedMatches}`);
    console.log(`   Expected Exceptions: ${report.overview.expectedExceptions}`);
    console.log(`   Processing Time: ${report.overview.processingTimeMs}ms`);
    console.log(`   Throughput: ${report.overview.throughputRecordsPerSecond} records/sec`);

    console.log('\n✅ ACCURACY METRICS:');
    console.log(`   Correctly Matched: ${report.accuracy.correctlyMatched}/${metrics.expectedMatches}`);
    console.log(`   Correctly Detected Exceptions: ${report.accuracy.correctlyDetectedExceptions}/${metrics.expectedExceptions}`);
    console.log(`   False Matches: ${report.accuracy.falseMatches}`);
    console.log(`   Missed Exceptions: ${report.accuracy.missedExceptions}`);
    console.log(`   Overall Accuracy: ${report.accuracy.overallAccuracy}`);
    console.log(`   Precision: ${report.accuracy.precision}`);
    console.log(`   Recall: ${report.accuracy.recall}`);
    console.log(`   F1 Score: ${report.accuracy.f1Score}`);

    console.log('\n🏷️  EXCEPTION TYPE ACCURACY:');
    console.log(`   Correct Exception Types: ${report.exceptionTypeAccuracy.correctExceptionTypes}/${metrics.expectedExceptions}`);
    console.log(`   Incorrect Exception Types: ${report.exceptionTypeAccuracy.incorrectExceptionTypes}`);
    console.log(`   Type Classification Accuracy: ${report.exceptionTypeAccuracy.typeAccuracy}`);

    console.log('\n' + '='.repeat(80));

    // Save report to file
    const fs = await import('fs/promises');
    const reportPath = 'evaluation-reports/reconciliation-evaluation.json';
    await fs.mkdir('evaluation-reports', { recursive: true });
    await fs.writeFile(
      reportPath,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        runId,
        datasetSize: EVALUATION_DATASET_SIZE,
        scenarios: KNOWN_SCENARIOS,
        metrics: report
      }, null, 2)
    );

    console.log(`\n💾 Evaluation report saved to: ${reportPath}`);

    // Return results
    return {
      success: true,
      runId,
      report,
      passed: parseFloat(report.accuracy.overallAccuracy) >= 95.0
    };

  } catch (error) {
    console.error('\n❌ Reconciliation evaluation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run evaluation if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runReconciliationEvaluation()
    .then(result => {
      process.exit(result.success && result.passed ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runReconciliationEvaluation, ReconciliationMetrics };
