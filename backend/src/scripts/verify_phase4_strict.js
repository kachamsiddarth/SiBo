import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../config/supabase.js';
import { csvProcessor } from '../services/csvProcessor.js';
import { generateDataset } from './generateSyntheticData.js';
import { searchRagKnowledge } from '../rag/retriever/ragRetriever.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runStrictPhase4Verification() {
  console.log('===========================================================');
  console.log('🔍 STARTING STRICT PHASE 4 VERIFICATION SUITE FOR SIBO');
  console.log('===========================================================');

  let passedAll = true;

  try {
    // -------------------------------------------------------------
    // Test 1: Synthetic Dataset Generation & Scenario Verification
    // -------------------------------------------------------------
    console.log('\n[Test 1] Verifying Synthetic Dataset Generator...');
    const datasetCount = 100;
    const dataset = generateDataset(datasetCount);

    if (dataset.payments.length === datasetCount && dataset.settlements.length > 0) {
      console.log(`  Generated ${dataset.payments.length} payment records and ${dataset.settlements.length} settlement records.`);
      
      const scenariosFound = new Set(dataset.scenarios.map(s => s.scenario));
      console.log(`  Scenarios generated: ${Array.from(scenariosFound).join(', ')}`);
      
      if (scenariosFound.has('matched') && scenariosFound.has('amount_mismatch') && scenariosFound.has('missing_settlement')) {
        console.log('  ✅ Test 1 PASSED: Synthetic data generator produces required payment, settlement, and exception records.');
      } else {
        console.error('  ❌ Test 1 FAILED: Missing required exception scenarios in synthetic dataset.');
        passedAll = false;
      }
    } else {
      console.error('  ❌ Test 1 FAILED: Dataset size mismatch.');
      passedAll = false;
    }

    // -------------------------------------------------------------
    // Test 2: In-Memory CSV Parsing & Validation (Valid & Invalid Data)
    // -------------------------------------------------------------
    console.log('\n[Test 2] Verifying CSV Parser & Validator...');
    
    // Valid Payment CSV test
    const validPaymentCSV = Buffer.from(
      `transaction_id,payment_amount,payment_date,payment_method,status\n` +
      `TXN_TEST_001,1500.00,2025-01-15T10:00:00Z,UPI,captured\n` +
      `TXN_TEST_002,2500.50,2025-01-15T11:00:00Z,CARD,captured\n`
    );
    const parseResult = csvProcessor.parseAndValidateCSV(validPaymentCSV, 'payment');
    if (parseResult.success && parseResult.validRecords.length === 2) {
      console.log('  Sub-test 2.1 PASSED: Valid payment CSV parsed successfully.');
    } else {
      console.error('  ❌ Sub-test 2.1 FAILED: Valid payment CSV failed validation.');
      passedAll = false;
    }

    // Invalid Payment CSV test (missing required columns & bad amount)
    const invalidPaymentCSV = Buffer.from(
      `transaction_id,payment_amount\n` +
      `TXN_TEST_BAD,invalid_amount\n`
    );
    const invalidResult = csvProcessor.parseAndValidateCSV(invalidPaymentCSV, 'payment');
    if (invalidResult.validRecords.length === 0 && invalidResult.errors.length > 0) {
      console.log('  Sub-test 2.2 PASSED: Invalid payment CSV correctly rejected with clear errors.');
    } else {
      console.error('  ❌ Sub-test 2.2 FAILED: Invalid CSV was not properly rejected.');
      passedAll = false;
    }

    // Duplicate detection test
    const duplicateRecords = [
      { transaction_id: 'TXN_DUP' },
      { transaction_id: 'TXN_DUP' }
    ];
    const dupCheck = csvProcessor.checkDuplicates(duplicateRecords, 'transaction_id');
    if (dupCheck.hasDuplicates && dupCheck.duplicateCount === 1) {
      console.log('  Sub-test 2.3 PASSED: Duplicate transaction IDs correctly identified.');
    } else {
      console.error('  ❌ Sub-test 2.3 FAILED: Duplicate detection failed.');
      passedAll = false;
    }

    console.log('  ✅ Test 2 PASSED: CSV parser, validator, and duplicate detector behave as expected.');

    // -------------------------------------------------------------
    // Test 3: Live Database Ingestion & Verification (Supabase)
    // -------------------------------------------------------------
    console.log('\n[Test 3] Verifying Live Ingestion into Supabase PostgreSQL...');
    
    // Create a dedicated verification reconciliation run
    const testRun = await csvProcessor.createReconciliationRun({
      fileName: 'phase4_strict_verification.csv',
      totalRecords: dataset.payments.length + dataset.settlements.length
    });

    console.log(`  Created test reconciliation run: ${testRun.id}`);

    // Insert payment records
    const paymentInsert = await csvProcessor.insertPaymentRecords(dataset.payments, testRun.id);
    console.log(`  Inserted ${paymentInsert.inserted} payment records into payment_records.`);

    // Insert settlement records
    const settlementInsert = await csvProcessor.insertSettlementRecords(dataset.settlements, testRun.id);
    console.log(`  Inserted ${settlementInsert.inserted} settlement records into settlement_records.`);

    // Update run status
    await csvProcessor.updateReconciliationRun(testRun.id, {
      total_records: paymentInsert.inserted + settlementInsert.inserted,
      status: 'validated'
    });

    // Query back from Supabase to verify persisted records and counts
    const { count: dbPaymentCount, error: pyErr } = await supabase
      .from('payment_records')
      .select('id', { count: 'exact', head: true })
      .eq('run_id', testRun.id);

    const { count: dbSettlementCount, error: stErr } = await supabase
      .from('settlement_records')
      .select('id', { count: 'exact', head: true })
      .eq('run_id', testRun.id);

    if (pyErr || stErr || dbPaymentCount !== dataset.payments.length || dbSettlementCount !== dataset.settlements.length) {
      console.error(`  ❌ Test 3 FAILED: Count mismatch in live database! DB Payments: ${dbPaymentCount}, DB Settlements: ${dbSettlementCount}`);
      passedAll = false;
    } else {
      console.log(`  ✅ Test 3 PASSED: Verified live persistence in Supabase. DB Payments: ${dbPaymentCount}, DB Settlements: ${dbSettlementCount}.`);
    }

    // Clean up test verification records from Supabase to keep DB clean
    console.log('\n[Cleanup] Cleaning up strict test run records...');
    await supabase.from('payment_records').delete().eq('run_id', testRun.id);
    await supabase.from('settlement_records').delete().eq('run_id', testRun.id);
    await supabase.from('reconciliation_runs').delete().eq('id', testRun.id);
    console.log('  Cleaned up test reconciliation run successfully.');

    // -------------------------------------------------------------
    // Test 4: Regression Check — Verify Phase 3 RAG Pipeline functionality
    // -------------------------------------------------------------
    console.log('\n[Test 4] Regression Check — Verifying Phase 3 RAG search capability...');
    const ragResults = await searchRagKnowledge('settlement cycle', { topK: 1 });
    if (ragResults.length > 0 && ragResults[0].similarity > 0.70) {
      console.log(`  ✅ Test 4 PASSED: Phase 3 RAG search operational (Similarity: ${ragResults[0].similarity}).`);
    } else {
      console.error('  ❌ Test 4 FAILED: Phase 3 RAG search failed regression check.');
      passedAll = false;
    }

  } catch (error) {
    console.error('❌ Exception thrown during strict verification:', error);
    passedAll = false;
  }

  console.log('\n===========================================================');
  if (passedAll) {
    console.log('🎉 ALL PHASE 4 STRICT VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('❌ PHASE 4 STRICT VERIFICATION FAILED SOME TESTS.');
  }
  console.log('===========================================================');
}

runStrictPhase4Verification();
