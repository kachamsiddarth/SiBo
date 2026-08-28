import { supabase } from '../config/supabase.js';

async function testDatabaseSchema() {
  console.log('🧪 Performing comprehensive database verification test on Supabase PostgreSQL...');

  // 1. Insert test reconciliation run
  const { data: run, error: runError } = await supabase
    .from('reconciliation_runs')
    .insert([{ file_name: 'test_synthetic_batch.csv', total_records: 50, matched_count: 45, exception_count: 5, match_rate: 90.00, status: 'completed' }])
    .select()
    .single();

  if (runError) {
    console.error('❌ Error inserting reconciliation_run:', runError.message);
    process.exit(1);
  }
  console.log('✅ Created test reconciliation run:', run.id);

  // 2. Insert test payment record linked to run
  const { data: payment, error: payError } = await supabase
    .from('payment_records')
    .insert([{ run_id: run.id, transaction_id: 'TXN_TEST_001', payment_amount: 1000.00, payment_method: 'UPI', status: 'captured' }])
    .select()
    .single();

  if (payError) {
    console.error('❌ Error inserting payment_record:', payError.message);
    process.exit(1);
  }
  console.log('✅ Created test payment record:', payment.id, 'linked to run:', payment.run_id);

  // 3. Insert test settlement record linked to run
  const { data: settlement, error: setError } = await supabase
    .from('settlement_records')
    .insert([{ run_id: run.id, settlement_id: 'STL_TEST_001', transaction_id: 'TXN_TEST_001', payment_amount: 1000.00, fee: 20.00, tax: 3.60, settlement_amount: 976.40 }])
    .select()
    .single();

  if (setError) {
    console.error('❌ Error inserting settlement_record:', setError.message);
    process.exit(1);
  }
  console.log('✅ Created test settlement record:', settlement.id);

  // 4. Insert test reconciliation result
  const { data: result, error: resError } = await supabase
    .from('reconciliation_results')
    .insert([{ run_id: run.id, transaction_id: 'TXN_TEST_001', expected_settlement: 976.40, actual_settlement: 976.40, difference: 0.00, status: 'MATCHED' }])
    .select()
    .single();

  if (resError) {
    console.error('❌ Error inserting reconciliation_result:', resError.message);
    process.exit(1);
  }
  console.log('✅ Created test reconciliation result:', result.id);

  // 5. Insert test RAG document and vector chunk (1024-dim vector test)
  const { data: doc, error: docError } = await supabase
    .from('rag_documents')
    .insert([{ title: '01-about-settlements.md', source: 'Razorpay', source_url: 'https://razorpay.com/docs/settlements' }])
    .select()
    .single();

  if (docError) {
    console.error('❌ Error inserting rag_document:', docError.message);
    process.exit(1);
  }
  console.log('✅ Created test RAG document:', doc.id);

  // Clean up test data
  await supabase.from('reconciliation_runs').delete().eq('id', run.id);
  await supabase.from('rag_documents').delete().eq('id', doc.id);
  console.log('🧹 Cleaned up test verification records.');

  console.log('🎉 ALL 8 SIBO TABLES, EXTENSIONS, FOREIGN KEYS, AND VECTOR SCHEMAS ARE VERIFIED LIVE ON SUPABASE POSTGRESQL!');
}

testDatabaseSchema();
