/**
 * Phase 10 - AI Investigation Evaluation Suite
 *
 * Purpose: Verify that AI investigations are grounded, accurate, and appropriately handle uncertainty.
 * Tests correct classification, evidence handling, RAG usage, hallucination prevention, and UNRESOLVED behavior.
 */

import { supabase } from '../config/supabase.js';
import { investigateException } from '../agent/investigationAgent.js';
import { generateDataset } from './generateSyntheticData.js';
import { reconcile } from '../services/reconciliationEngine.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Known exception scenarios with expected investigation outcomes
 */

const EXCEPTION_SCENARIOS = [
  {
    name: 'Simple Amount Mismatch',
    exceptionType: 'AMOUNT_MISMATCH',
    description: 'Settlement amount differs by small fee miscalculation',
    expectedBehavior: 'Should explain fee calculation error clearly',
    expectedConfidence: 'high',
    shouldBeUnresolved: false
  },
  {
    name: 'Missing Settlement',
    exceptionType: 'MISSING_SETTLEMENT',
    description: 'No settlement record found for transaction',
    expectedBehavior: 'Should identify missing settlement and recommend verification',
    expectedConfidence: 'high',
    shouldBeUnresolved: false
  },
  {
    name: 'Component Mismatch - Fees',
    exceptionType: 'COMPONENT_MISMATCH',
    description: 'Fee components do not add up correctly',
    expectedBehavior: 'Should analyze fee structure and identify discrepancy source',
    expectedConfidence: 'medium',
    shouldBeUnresolved: false
  },
  {
    name: 'Unexplained Large Difference',
    exceptionType: 'UNEXPLAINED_DIFFERENCE',
    description: 'Large unexplained difference without clear cause',
    expectedBehavior: 'Should return UNRESOLVED when evidence is insufficient',
    expectedConfidence: 'low',
    shouldBeUnresolved: true
  }
];

/**
 * AI investigation evaluation metrics
 */
class AIInvestigationMetrics {
  constructor() {
    this.totalInvestigations = 0;
    this.successfulInvestigations = 0;
    this.failedInvestigations = 0;
    this.correctClassificationChecks = 0;
    this.correctEvidenceChecks = 0;
    this.correctRAGUsageChecks = 0;
    this.hallucinationFreeChecks = 0;
    this.appropriateConfidenceChecks = 0;
    this.appropriateRecommendationChecks = 0;
    this.correctUnresolvedBehaviorChecks = 0;
    this.investigationResults = [];
    this.failureDetails = [];
  }

  addInvestigationResult(scenario, exception, investigation, errors = null) {
    this.totalInvestigations++;
    this.investigationResults.push({
      scenario: scenario.name,
      exceptionType: scenario.expectedExceptionType,
      exception,
      investigation
    });

    if (errors) {
      this.failedInvestigations++;
      this.failureDetails.push({
        scenario: scenario.name,
        exception: exception?.id,
        errors
      });
      return;
    }

    this.successfulInvestigations++;

    // Track individual check results
    const checks = this.evaluateInvestigation(scenario, exception, investigation);

    if (checks.correctClassification) this.correctClassificationChecks++;
    if (checks.correctEvidence) this.correctEvidenceChecks++;
    if (checks.correctRAGUsage) this.correctRAGUsageChecks++;
    if (checks.hallucinationFree) this.hallucinationFreeChecks++;
    if (checks.appropriateConfidence) this.appropriateConfidenceChecks++;
    if (checks.appropriateRecommendation) this.appropriateRecommendationChecks++;
    if (checks.correctUnresolvedBehavior) this.correctUnresolvedBehaviorChecks++;
  }

  evaluateInvestigation(scenario, exception, investigation) {
    const checks = {
      correctClassification: false,
      correctEvidence: false,
      correctRAGUsage: false,
      hallucinationFree: false,
      appropriateConfidence: false,
      appropriateRecommendation: false,
      correctUnresolvedBehavior: false
    };

    if (!investigation) {
      return checks;
    }

    // Check 1: Correct classification
    // Investigation should correctly identify the exception type
    if (investigation.exceptionType === exception.exception_type ||
        investigation.summary?.toLowerCase().includes(exception.exception_type.toLowerCase()) ||
        investigation.reasoning?.toLowerCase().includes(exception.exception_type.toLowerCase())) {
      checks.correctClassification = true;
    }

    // Check 2: Correct evidence
    // Investigation should reference actual amounts and calculations
    if (investigation.summary && investigation.reasoning) {
      const summaryLower = investigation.summary.toLowerCase();
      const reasoningLower = investigation.reasoning.toLowerCase();

      // Should mention transaction ID or amounts
      if (summaryLower.includes(exception.transaction_id?.toLowerCase() || '') ||
          summaryLower.includes('amount') ||
          summaryLower.includes('expected') ||
          summaryLower.includes('actual')) {
        checks.correctEvidence = true;
      }
    }

    // Check 3: Correct RAG usage
    // Investigation should reference documentation when relevant
    if (investigation.sources_used && investigation.sources_used.length > 0) {
      // Has sources cited - good RAG usage
      checks.correctRAGUsage = true;
    } else if (scenario.exceptionType === 'MISSING_SETTLEMENT') {
      // For missing settlements, RAG may not be as important
      // Check if reasoning mentions verification/system checks
      if (investigation.recommended_action?.toLowerCase().includes('verify') ||
          investigation.recommended_action?.toLowerCase().includes('check')) {
        checks.correctRAGUsage = true;
      }
    }

    // Check 4: Hallucination-free
    // Investigation should not invent amounts not in the database
    if (investigation.summary && investigation.reasoning) {
      // Check that investigation doesn't claim amounts that don't match the actual data
      const hasRealAmounts = exception.difference !== null && exception.difference !== undefined;
      if (hasRealAmounts) {
        // Check that mentioned amounts are close to actual (within tolerance)
        const summaryLower = investigation.summary.toLowerCase();
        const actualDifference = Math.abs(exception.difference);

        // Look for amount mentions in the summary/reasoning
        const amountPattern = /\$?\d+(?:,\d+)*(?:\.\d+)?/g;
        const mentionedAmounts = (investigation.summary + ' ' + investigation.reasoning).match(amountPattern);

        if (!mentionedAmounts || mentionedAmounts.length === 0) {
          // No amounts mentioned - might be okay if it's a qualitative explanation
          checks.hallucinationFree = true;
        } else {
          // Check if mentioned amounts include the actual difference
          const hasCorrectAmount = mentionedAmounts.some(amt => {
            const parsedAmt = parseFloat(amt.replace(/[$,]/g, ''));
            return Math.abs(parsedAmt - actualDifference) < 0.01 || actualDifference === 0;
          });

          // Or check if it's not inventing fees/taxes not in the record
          if (hasCorrectAmount || investigation.reasoning.toLowerCase().includes('fee') ||
              investigation.reasoning.toLowerCase().includes('tax')) {
            checks.hallucinationFree = true;
          }
        }
      } else {
        checks.hallucinationFree = true; // No difference to hallucinate about
      }
    }

    // Check 5: Appropriate confidence
    // Investigation confidence should match scenario expectations
    if (investigation.confidence) {
      const confidence = investigation.confidence.toLowerCase();
      const expectedConfidence = scenario.expectedConfidence;

      if (confidence === expectedConfidence) {
        checks.appropriateConfidence = true;
      } else if (
        (expectedConfidence === 'high' && (confidence === 'high' || confidence === 'medium')) ||
        (expectedConfidence === 'medium' && confidence === 'medium') ||
        (expectedConfidence === 'low' && (confidence === 'low' || confidence === 'medium'))
      ) {
        checks.appropriateConfidence = true; // Allow some flexibility
      }
    }

    // Check 6: Appropriate recommendation
    // Investigation should provide actionable next steps
    if (investigation.recommended_action && investigation.recommended_action.length > 10) {
      const recommendationLower = investigation.recommended_action.toLowerCase();

      // Should contain action-oriented language
      if (recommendationLower.includes('review') ||
          recommendationLower.includes('verify') ||
          recommendationLower.includes('check') ||
          recommendationLower.includes('contact') ||
          recommendationLower.includes('investigate') ||
          recommendationLower.includes('resolve') ||
          recommendationLower.includes('adjust')) {
        checks.appropriateRecommendation = true;
      }
    }

    // Check 7: Correct UNRESOLVED behavior
    // When evidence is insufficient, should return UNRESOLVED or similar
    if (scenario.shouldBeUnresolved) {
      // Expected to be unresolved - check if investigation handles uncertainty
      const status = investigation.status?.toUpperCase();
      if (status === 'UNRESOLVED' ||
          status === 'INCOMPLETE' ||
          investigation.summary?.toLowerCase().includes('insufficient') ||
          investigation.summary?.toLowerCase().includes('unable to determine') ||
          investigation.reasoning?.toLowerCase().includes('insufficient evidence')) {
        checks.correctUnresolvedBehavior = true;
      }
    } else {
      // Expected to be resolved/explained - should provide explanation
      const status = investigation.status?.toUpperCase();
      if (status === 'EXPLAINED' ||
          status === 'RESOLVED' ||
          investigation.summary?.length > 20) {
        checks.correctUnresolvedBehavior = true;
      }
    }

    return checks;
  }

  getReport() {
    const successful = this.successfulInvestigations;
    const total = this.totalInvestigations;

    return {
      overview: {
        totalInvestigations: total,
        successfulInvestigations: successful,
        failedInvestigations: this.failedInvestigations,
        successRate: total > 0 ? ((successful / total) * 100).toFixed(2) + '%' : '0%'
      },
      qualityMetrics: {
        correctClassification: successful > 0 ? ((this.correctClassificationChecks / successful) * 100).toFixed(2) + '%' : '0%',
        correctEvidence: successful > 0 ? ((this.correctEvidenceChecks / successful) * 100).toFixed(2) + '%' : '0%',
        correctRAGUsage: successful > 0 ? ((this.correctRAGUsageChecks / successful) * 100).toFixed(2) + '%' : '0%',
        hallucinationFree: successful > 0 ? ((this.hallucinationFreeChecks / successful) * 100).toFixed(2) + '%' : '0%',
        appropriateConfidence: successful > 0 ? ((this.appropriateConfidenceChecks / successful) * 100).toFixed(2) + '%' : '0%',
        appropriateRecommendation: successful > 0 ? ((this.appropriateRecommendationChecks / successful) * 100).toFixed(2) + '%' : '0%',
        correctUnresolvedBehavior: successful > 0 ? ((this.correctUnresolvedBehaviorChecks / successful) * 100).toFixed(2) + '%' : '0%'
      },
      detailedResults: this.investigationResults,
      failures: this.failureDetails
    };
  }
}

/**
 * Create test dataset and generate exceptions for investigation testing
 */
async function createTestExceptions() {
  console.log('\n📊 Creating test dataset with known exception scenarios...');

  // Generate dataset
  const dataset = generateDataset(50);
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

  console.log(`✅ Created test dataset with ${dataset.payments.length} payments and ${dataset.settlements.length} settlements`);

  // Run reconciliation
  console.log('\n⚙️  Running reconciliation to generate exceptions...');
  await reconcile(runId);

  // Fetch generated exceptions
  const { data: exceptions, error: exceptionsError } = await supabase
    .from('exceptions')
    .select('*')
    .eq('run_id', runId)
    .limit(10);

  if (exceptionsError) {
    throw new Error(`Failed to fetch exceptions: ${exceptionsError.message}`);
  }

  console.log(`✅ Generated ${exceptions.length} exceptions for testing`);

  return { runId, exceptions, dataset };
}

/**
 * Run AI investigation evaluation
 */
async function runAIInvestigationEvaluation() {
  console.log('='.repeat(80));
  console.log('PHASE 10 - AI INVESTIGATION EVALUATION SUITE');
  console.log('='.repeat(80));

  try {
    // Step 1: Create test exceptions
    const { runId, exceptions } = await createTestExceptions();

    if (exceptions.length === 0) {
      console.log('\n⚠️  No exceptions generated - creating synthetic exception scenarios...');

      // If no exceptions generated, we can still test with what we have
      // But for now, let's just use whatever we have and test AI behavior
      console.log('⚠️  Skipping AI evaluation - no exceptions available');
      return {
        success: true,
        runId,
        report: {
          overview: {
            totalInvestigations: 0,
            successfulInvestigations: 0,
            failedInvestigations: 0,
            successRate: 'N/A - No exceptions generated'
          }
        },
        passed: false
      };
    }

    console.log(`\n🤖 Evaluating AI investigations on ${exceptions.length} exceptions...`);

    const metrics = new AIInvestigationMetrics();

    // Test each exception
    for (let i = 0; i < Math.min(exceptions.length, EXCEPTION_SCENARIOS.length); i++) {
      const exception = exceptions[i];
      const scenario = EXCEPTION_SCENARIOS[i % EXCEPTION_SCENARIOS.length];

      console.log(`\n${i + 1}/${Math.min(exceptions.length, EXCEPTION_SCENARIOS.length)} Testing: ${scenario.name}`);
      console.log(`   Exception: ${exception.id} (${exception.exception_type})`);
      console.log(`   Transaction: ${exception.transaction_id}`);

      try {
        // Run AI investigation
        const investigation = await investigateException(exception.id);

        if (!investigation) {
          throw new Error('Investigation returned null');
        }

        // Add to metrics
        metrics.addInvestigationResult(scenario, exception, investigation);

        console.log(`   ✅ Investigation completed`);
        console.log(`   📝 Status: ${investigation.status || 'Unknown'}`);
        console.log(`   🎯 Confidence: ${investigation.confidence || 'N/A'}`);
        console.log(`   💡 Summary: ${(investigation.summary || '').substring(0, 80)}...`);

      } catch (error) {
        console.log(`   ❌ Investigation failed: ${error.message}`);
        metrics.addInvestigationResult(
          scenario,
          exception,
          null,
          { error: error.message }
        );
      }
    }

    // Generate report
    const report = metrics.getReport();

    console.log('\n' + '='.repeat(80));
    console.log('AI INVESTIGATION EVALUATION REPORT');
    console.log('='.repeat(80));

    console.log('\n📊 OVERVIEW:');
    console.log(`   Total Investigations: ${report.overview.totalInvestigations}`);
    console.log(`   Successful Investigations: ${report.overview.successfulInvestigations}`);
    console.log(`   Failed Investigations: ${report.overview.failedInvestigations}`);
    console.log(`   Success Rate: ${report.overview.successRate}`);

    console.log('\n✅ QUALITY METRICS:');
    console.log(`   Correct Classification: ${report.qualityMetrics.correctClassification}`);
    console.log(`   Correct Evidence: ${report.qualityMetrics.correctEvidence}`);
    console.log(`   Correct RAG Usage: ${report.qualityMetrics.correctRAGUsage}`);
    console.log(`   Hallucination-Free: ${report.qualityMetrics.hallucinationFree}`);
    console.log(`   Appropriate Confidence: ${report.qualityMetrics.appropriateConfidence}`);
    console.log(`   Appropriate Recommendations: ${report.qualityMetrics.appropriateRecommendation}`);
    console.log(`   Correct UNRESOLVED Behavior: ${report.qualityMetrics.correctUnresolvedBehavior}`);

    if (report.failures.length > 0) {
      console.log('\n❌ FAILURE ANALYSIS:');
      report.failures.forEach((failure, index) => {
        console.log(`   ${index + 1}. Scenario: ${failure.scenario}`);
        console.log(`      Exception: ${failure.exception}`);
        console.log(`      Error: ${failure.errors.error}`);
      });
    }

    console.log('\n' + '='.repeat(80));

    // Save report to file
    const fs = await import('fs/promises');
    const reportPath = 'evaluation-reports/ai-evaluation.json';
    await fs.mkdir('evaluation-reports', { recursive: true });
    await fs.writeFile(
      reportPath,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        runId,
        scenarios: EXCEPTION_SCENARIOS,
        metrics: report
      }, null, 2)
    );

    console.log(`\n💾 Evaluation report saved to: ${reportPath}`);

    // Calculate overall score
    const metricsToCheck = [
      'correctClassification',
      'correctEvidence',
      'hallucinationFree',
      'appropriateRecommendation'
    ];

    const scores = metricsToCheck.map(metric => {
      const value = report.qualityMetrics[metric];
      return parseFloat(value) || 0;
    });

    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const passed = averageScore >= 75.0;

    console.log(`\n📈 Overall Quality Score: ${averageScore.toFixed(2)}%`);
    console.log(`   Status: ${passed ? '✅ PASSED' : '❌ FAILED (threshold: 75%)'}`);

    return {
      success: true,
      runId,
      report,
      passed
    };

  } catch (error) {
    console.error('\n❌ AI investigation evaluation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run evaluation if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAIInvestigationEvaluation()
    .then(result => {
      process.exit(result.success && result.passed ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runAIInvestigationEvaluation, AIInvestigationMetrics };
