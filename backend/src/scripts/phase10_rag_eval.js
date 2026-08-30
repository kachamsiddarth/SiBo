/**
 * Phase 10 - RAG Evaluation Suite
 *
 * Purpose: Measure the quality and correctness of the RAG retrieval system.
 * Creates test questions with expected sources and measures Recall@k, source relevance, etc.
 */

import { supabase } from '../config/supabase.js';
import { searchRagKnowledge } from '../rag/retriever/ragRetriever.js';

const RAG_EVALUATION_QUESTIONS = [
  {
    question: "What is a settlement in the context of payment processing?",
    expectedSource: "01-about-settlements.md",
    expectedSection: "About Settlements",
    expectedConcepts: ["settlement", "payment processing", "transaction batch"]
  },
  {
    question: "What components make up a settlement amount?",
    expectedSource: "02-settlement-breakup.md",
    expectedSection: "Settlement Breakup",
    expectedConcepts: ["payment amount", "fee", "tax", "adjustment", "refund", "settlement amount"]
  },
  {
    question: "How can settlement data be retrieved programmatically?",
    expectedSource: "03-settlement-apis.md",
    expectedSection: "Settlement APIs",
    expectedConcepts: ["API", "endpoint", "HTTP", "GET", "settlement data"]
  },
  {
    question: "What are the key fields in the settlement API response?",
    expectedSource: "04-settlement-api-reference.md",
    expectedSection: "API Reference",
    expectedConcepts: ["settlement_id", "transaction_id", "payment_amount", "fee", "tax", "settlement_amount"]
  },
  {
    question: "What happens when a settlement fails to process?",
    expectedSource: "05-settlement-faqs.md",
    expectedSection: "FAQs",
    expectedConcepts: ["failed settlement", "retry", "error handling", "settlement failure"]
  },
  {
    question: "What details are included in a settlement details report?",
    expectedSource: "06-settlement-details.md",
    expectedSection: "Settlement Details",
    expectedConcepts: ["detailed breakdown", "component fees", "taxes", "net amount", "processing date"]
  },
  {
    question: "How are fees calculated in Razorpay settlements?",
    expectedSource: "02-settlement-breakup.md",
    expectedSection: "Fees",
    expectedConcepts: ["fee calculation", "transaction volume", "percentage", "fixed fee"]
  },
  {
    question: "What tax components are included in settlements?",
    expectedSource: "02-settlement-breakup.md",
    expectedSection: "Taxes",
    expectedConcepts: ["GST", "tax components", "tax calculation", "government taxes"]
  },
  {
    question: "What adjustments can affect settlement amounts?",
    expectedSource: "02-settlement-breakup.md",
    expectedSection: "Adjustments",
    expectedConcepts: ["adjustments", "refunds", "chargebacks", "disputes", "settlement amount"]
  },
  {
    question: "How long does it take for settlements to be processed?",
    expectedSource: "01-about-settlements.md",
    expectedSection: "Settlement Cycle",
    expectedConcepts: ["T+2", "settlement cycle", "processing time", "business days"]
  }
];

/**
 * RAG evaluation metrics tracking
 */
class RAGEvaluationMetrics {
  constructor() {
    this.totalQuestions = 0;
    this.questionsWithResults = 0;
    this.relevantSourcesFound = 0;
    this.exactSourceMatches = 0;
    this.sectionMatches = 0;
    this.conceptMatches = 0;
    this.recallAt1 = 0;
    this.recallAt3 = 0;
    this.recallAt5 = 0;
    this.meanReciprocalRank = 0;
    this.questions = [];
    this.failedQuestions = [];
  }

  addQuestionResult(questionIndex, question, results, expectedSource, expectedSection, expectedConcepts) {
    this.totalQuestions++;
    this.questions.push({
      index: questionIndex,
      question,
      expectedSource,
      expectedSection,
      expectedConcepts
    });

    if (!results || results.length === 0) {
      this.failedQuestions.push({
        index: questionIndex,
        question,
        reason: 'No results returned'
      });
      return;
    }

    this.questionsWithResults++;

    // Check if expected source is in results (using metadata.fileName)
    const sourceMatches = results
      .map(r => r.metadata.fileName || r.metadata.source)
      .filter(source => source && source.includes(expectedSource));

    if (sourceMatches.length > 0) {
      this.relevantSourcesFound++;

      // Check for exact source match at position 1 (for Recall@1)
      const topSource = results[0]?.metadata?.fileName || results[0]?.metadata?.source;
      if (topSource && topSource.includes(expectedSource)) {
        this.exactSourceMatches++;
        this.recallAt1++;
        this.meanReciprocalRank += 1 / 1; // Rank 1
      } else {
        // Find the rank of the expected source
        const rank = results.findIndex(r => {
          const src = r.metadata?.fileName || r.metadata?.source;
          return src && src.includes(expectedSource);
        }) + 1; // 1-based index

        if (rank > 0) {
          this.meanReciprocalRank += 1 / rank;

          // Check for Recall@3 and Recall@5
          if (rank <= 3) this.recallAt3++;
          if (rank <= 5) this.recallAt5++;
        }
      }

      // Check section match
      const sectionMatches = results
        .filter(r => {
          const src = r.metadata?.fileName || r.metadata?.source;
          return src && src.includes(expectedSource);
        })
        .filter(r => r.metadata?.section?.includes(expectedSection));

      if (sectionMatches.length > 0) {
        this.sectionMatches++;
      }

      // Check concept presence
      const conceptMatches = results
        .filter(r => {
          const src = r.metadata?.fileName || r.metadata?.source;
          return src && src.includes(expectedSource);
        })
        .filter(r => {
          const content = (r.content || '').toLowerCase();
          return expectedConcepts.some(concept =>
            content.includes(concept.toLowerCase())
          );
        });

      if (conceptMatches.length > 0) {
        this.conceptMatches++;
      }
    } else {
      this.failedQuestions.push({
        index: questionIndex,
        question,
        reason: `Expected source '${expectedSource}' not found in results`,
        results: results.map(r => ({
          source: r.metadata?.fileName || r.metadata?.source,
          section: r.metadata?.section,
          similarity: r.similarity
        }))
      });
    }
  }

  calculateMetrics() {
    const total = this.totalQuestions;
    const withResults = this.questionsWithResults;

    return {
      totalQuestions: total,
      questionsWithResults: withResults,
      successRate: total > 0 ? ((withResults / total) * 100).toFixed(2) + '%' : '0%',

      // Recall metrics
      recallAt1: withResults > 0 ? ((this.recallAt1 / withResults) * 100).toFixed(2) + '%' : '0%',
      recallAt3: withResults > 0 ? ((this.recallAt3 / withResults) * 100).toFixed(2) + '%' : '0%',
      recallAt5: withResults > 0 ? ((this.recallAt5 / withResults) * 100).toFixed(2) + '%' : '0%',

      // Mean Reciprocal Rank
      mrr: withResults > 0 ? (this.meanReciprocalRank / withResults).toFixed(4) : '0',

      // Source accuracy
      sourceRelevance: withResults > 0 ? ((this.relevantSourcesFound / withResults) * 100).toFixed(2) + '%' : '0%',
      exactSourceMatch: withResults > 0 ? ((this.exactSourceMatches / withResults) * 100).toFixed(2) + '%' : '0%',

      // Section and concept accuracy
      sectionAccuracy: withResults > 0 ? ((this.sectionMatches / withResults) * 100).toFixed(2) + '%' : '0%',
      conceptAccuracy: withResults > 0 ? ((this.conceptMatches / withResults) * 100).toFixed(2) + '%' : '0%',

      // Failed questions
      failedQuestions: this.failedQuestions.length,
      failedQuestionDetails: this.failedQuestions
    };
  }

  getReport() {
    const metrics = this.calculateMetrics();

    return {
      overview: {
        totalQuestions: metrics.totalQuestions,
        questionsWithResults: metrics.questionsWithResults,
        successRate: metrics.successRate
      },
      retrievalQuality: {
        recallAt1: metrics.recallAt1,
        recallAt3: metrics.recallAt3,
        recallAt5: metrics.recallAt5,
        meanReciprocalRank: metrics.mrr
      },
      sourceAccuracy: {
        sourceRelevance: metrics.sourceRelevance,
        exactSourceMatch: metrics.exactSourceMatch
      },
      contentRelevance: {
        sectionAccuracy: metrics.sectionAccuracy,
        conceptAccuracy: metrics.conceptAccuracy
      },
      failureAnalysis: {
        failedQuestions: metrics.failedQuestions,
        failedQuestionDetails: metrics.failedQuestionDetails
      }
    };
  }
}

/**
 * Run RAG evaluation
 */
async function runRAGEvaluation() {
  console.log('='.repeat(80));
  console.log('PHASE 10 - RAG EVALUATION SUITE');
  console.log('='.repeat(80));

  try {
    console.log('\n🔍 Evaluating RAG retrieval quality...');

    const metrics = new RAGEvaluationMetrics();

    // Test each question
    for (let i = 0; i < RAG_EVALUATION_QUESTIONS.length; i++) {
      const questionObj = RAG_EVALUATION_QUESTIONS[i];

      console.log(`\n${i + 1}/${RAG_EVALUATION_QUESTIONS.length} Testing: "${questionObj.question}"`);

      try {
        // Search RAG for the question
        const results = await searchRagKnowledge(questionObj.question, 5);

        metrics.addQuestionResult(
          i,
          questionObj.question,
          results,
          questionObj.expectedSource,
          questionObj.expectedSection,
          questionObj.expectedConcepts
        );

        if (results.length > 0) {
          console.log(`   ✅ Found ${results.length} results`);
          console.log(`   📄 Top result: ${results[0]?.metadata?.source} - ${results[0]?.metadata?.section}`);
        } else {
          console.log(`   ❌ No results found`);
        }
      } catch (error) {
        console.log(`   ❌ Error during search: ${error.message}`);
        metrics.addQuestionResult(
          i,
          questionObj.question,
          [],
          questionObj.expectedSource,
          questionObj.expectedSection,
          questionObj.expectedConcepts
        );
      }
    }

    // Generate report
    const report = metrics.getReport();

    console.log('\n' + '='.repeat(80));
    console.log('RAG EVALUATION REPORT');
    console.log('='.repeat(80));

    console.log('\n📊 OVERVIEW:');
    console.log(`   Total Questions: ${report.overview.totalQuestions}`);
    console.log(`   Questions with Results: ${report.overview.questionsWithResults}`);
    console.log(`   Success Rate: ${report.overview.successRate}`);

    console.log('\n🎯 RETRIEVAL QUALITY:');
    console.log(`   Recall@1: ${report.retrievalQuality.recallAt1}`);
    console.log(`   Recall@3: ${report.retrievalQuality.recallAt3}`);
    console.log(`   Recall@5: ${report.retrievalQuality.recallAt5}`);
    console.log(`   Mean Reciprocal Rank (MRR): ${report.retrievalQuality.meanReciprocalRank}`);

    console.log('\n🏷️  SOURCE ACCURACY:');
    console.log(`   Source Relevance: ${report.sourceAccuracy.sourceRelevance}`);
    console.log(`   Exact Source Match (Position 1): ${report.sourceAccuracy.exactSourceMatch}`);

    console.log('\n📖 CONTENT RELEVANCE:');
    console.log(`   Section Accuracy: ${report.contentRelevance.sectionAccuracy}`);
    console.log(`   Concept Accuracy: ${report.contentRelevance.conceptAccuracy}`);

    console.log('\n❌ FAILURE ANALYSIS:');
    console.log(`   Failed Questions: ${report.failureAnalysis.failedQuestions}/${report.overview.totalQuestions}`);

    if (report.failureAnalysis.failedQuestionDetails.length > 0) {
      console.log('\n   Failed Question Details:');
      report.failureAnalysis.failedQuestionDetails.forEach((failure, index) => {
        console.log(`   ${index + 1}. "${failure.question}"`);
        console.log(`      Reason: ${failure.reason}`);
        if (failure.results && failure.results.length > 0) {
          console.log(`      Got results: ${failure.results.length} items`);
          failure.results.slice(0, 3).forEach((r, idx) => {
            console.log(`        ${idx + 1}. ${r.source || 'Unknown'} - ${r.section || 'Unknown'} (sim: ${r.similarity?.toFixed(3) || 'N/A'})`);
          });
        }
      });
    }

    console.log('\n' + '='.repeat(80));

    // Save report to file
    const fs = await import('fs/promises');
    const reportPath = 'evaluation-reports/rag-evaluation.json';
    await fs.mkdir('evaluation-reports', { recursive: true });
    await fs.writeFile(
      reportPath,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        evaluationQuestions: RAG_EVALUATION_QUESTIONS,
        metrics: report
      }, null, 2)
    );

    console.log(`\n💾 Evaluation report saved to: ${reportPath}`);

    // Determine if evaluation passed (threshold: 80% success rate)
    const successRateNum = parseFloat(report.overview.successRate);
    const passed = successRateNum >= 80.0;

    return {
      success: true,
      report,
      passed
    };

  } catch (error) {
    console.error('\n❌ RAG evaluation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run evaluation if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runRAGEvaluation()
    .then(result => {
      process.exit(result.success && result.passed ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runRAGEvaluation, RAGEvaluationMetrics };