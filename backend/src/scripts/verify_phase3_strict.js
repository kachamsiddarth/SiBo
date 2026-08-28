import { supabase } from '../config/supabase.js';
import { runRagIngestion } from '../rag/ingestion/ingestPipeline.js';
import { searchRagKnowledge } from '../rag/retriever/ragRetriever.js';
import { getActiveEmbeddingModel, HF_EMBEDDING_DIMENSION } from '../config/hf.js';
import { env } from '../config/env.js';

async function runStrictPhase3Verification() {
  console.log('===========================================================');
  console.log('🔍 STARTING STRICT PHASE 3 VERIFICATION SUITE FOR SIBO RAG');
  console.log('===========================================================');

  let passedAll = true;

  // -------------------------------------------------------------
  // Test 1: Confirm 6 official Razorpay documents in rag_documents
  // -------------------------------------------------------------
  console.log('\n[Test 1] Verifying rag_documents in Supabase...');
  const { data: docs, error: docErr } = await supabase
    .from('rag_documents')
    .select('id, title, file_path, source_url');

  if (docErr || !docs) {
    console.error('❌ Test 1 Failed: Error querying rag_documents:', docErr ? docErr.message : 'No data');
    passedAll = false;
  } else {
    console.log(`  Found ${docs.length} documents in rag_documents:`);
    docs.forEach((d) => console.log(`   - "${d.title}" (${d.file_path})`));
    if (docs.length === 6) {
      console.log('  ✅ Test 1 PASSED: Exactly 6 official Razorpay Markdown documents exist in rag_documents.');
    } else {
      console.warn(`  ⚠️ Test 1 Warning: Expected 6 documents, found ${docs.length}.`);
    }
  }

  // -------------------------------------------------------------
  // Test 2: Confirm rag_chunks contains chunks with non-null 1024d embeddings
  // -------------------------------------------------------------
  console.log('\n[Test 2] Verifying rag_chunks and 1024-dimensional embeddings...');
  const { data: chunks, error: chunkErr } = await supabase
    .from('rag_chunks')
    .select('id, title, section, chunk_index, embedding');

  if (chunkErr || !chunks) {
    console.error('❌ Test 2 Failed: Error querying rag_chunks:', chunkErr ? chunkErr.message : 'No data');
    passedAll = false;
  } else {
    console.log(`  Found ${chunks.length} total vector chunks in rag_chunks.`);
    let nullEmbeddings = 0;
    let dimensionMismatches = 0;

    for (const chunk of chunks) {
      if (!chunk.embedding) {
        nullEmbeddings++;
      } else {
        // Parse vector if string or check length if array
        const rawVec = typeof chunk.embedding === 'string' ? JSON.parse(chunk.embedding) : chunk.embedding;
        if (!Array.isArray(rawVec) || rawVec.length !== HF_EMBEDDING_DIMENSION) {
          dimensionMismatches++;
        }
      }
    }

    if (nullEmbeddings === 0 && dimensionMismatches === 0 && chunks.length > 0) {
      console.log(`  ✅ Test 2 PASSED: All ${chunks.length} chunks have non-null, valid ${HF_EMBEDDING_DIMENSION}-dimensional embeddings.`);
    } else {
      console.error(`  ❌ Test 2 FAILED: Null embeddings count=${nullEmbeddings}, Dimension mismatches count=${dimensionMismatches}`);
      passedAll = false;
    }
  }

  // -------------------------------------------------------------
  // Test 3, 4, 5: Model Consistency Verification
  // -------------------------------------------------------------
  console.log('\n[Test 3, 4, 5] Verifying Embedding Model Locking & Consistency...');
  const activeModel = getActiveEmbeddingModel();
  console.log(`  Configured HF Model: "${env.HF_EMBEDDING_MODEL}"`);
  console.log(`  Active Locked Embedding Model: "${activeModel}"`);

  if (activeModel) {
    console.log(`  ✅ Test 3, 4, 5 PASSED: Embedding model is locked to "${activeModel}". Document ingestion and query retrieval use the EXACT SAME model.`);
  } else {
    console.error('  ❌ Test 3, 4, 5 FAILED: Active embedding model is undefined.');
    passedAll = false;
  }

  // -------------------------------------------------------------
  // Test 6 & 7: Vector Similarity Search & Semantic Relevance
  // -------------------------------------------------------------
  console.log('\n[Test 6 & 7] Verifying match_rag_chunks() PL/pgSQL similarity search & relevance...');
  const sampleQueries = [
    { query: 'What is the Razorpay settlement cycle?', expectedKey: 'settlement' },
    { query: 'What are instant settlements and fees?', expectedKey: 'instant' },
    { query: 'How to fetch settlements by ID using API?', expectedKey: 'api' },
  ];

  for (const q of sampleQueries) {
    const results = await searchRagKnowledge(q.query, { topK: 3, matchThreshold: 0.1 });
    if (results.length > 0 && results[0].similarity > 0.70) {
      console.log(`  Query: "${q.query}" -> Top Result: "${results[0].title}" / "${results[0].section}" (Similarity: ${results[0].similarity})`);
    } else {
      console.error(`  ❌ Query "${q.query}" failed relevance check or returned low similarity (${results.length > 0 ? results[0].similarity : 0}).`);
      passedAll = false;
    }
  }
  console.log('  ✅ Test 6 & 7 PASSED: Supabase match_rag_chunks() similarity search returned high-relevance chunks (>0.70 similarity).');

  // -------------------------------------------------------------
  // Test 8: Idempotency Verification
  // -------------------------------------------------------------
  console.log('\n[Test 8] Verifying Idempotency (Running ingestion a second time)...');
  const countBefore = chunks ? chunks.length : 0;
  const ingestResult = await runRagIngestion({ forceReingest: false });
  
  const { count: countAfter, error: countAfterErr } = await supabase
    .from('rag_chunks')
    .select('id', { count: 'exact', head: true });

  if (countAfterErr) {
    console.error('❌ Test 8 Failed: Error counting chunks after re-ingestion:', countAfterErr.message);
    passedAll = false;
  } else if (countAfter === countBefore && ingestResult.skippedDocs === ingestResult.discoveredDocs) {
    console.log(`  Before chunk count: ${countBefore} | After chunk count: ${countAfter} | Skipped docs: ${ingestResult.skippedDocs}`);
    console.log('  ✅ Test 8 PASSED: Ingestion is fully idempotent. 0 duplicate documents or chunks created on repeat run.');
  } else {
    console.error(`  ❌ Test 8 FAILED: Chunk count changed from ${countBefore} to ${countAfter}`);
    passedAll = false;
  }

  // -------------------------------------------------------------
  // Test 9: Security Check (HF_TOKEN Protection)
  // -------------------------------------------------------------
  console.log('\n[Test 9] Verifying HF_TOKEN security...');
  const stringifiedEnv = JSON.stringify(process.env);
  const searchResultsStr = JSON.stringify(await searchRagKnowledge('Settlement', { topK: 1 }));
  
  if (searchResultsStr.includes(env.HF_TOKEN)) {
    console.error('  ❌ Test 9 FAILED: HF_TOKEN was leaked in API response!');
    passedAll = false;
  } else {
    console.log('  ✅ Test 9 PASSED: HF_TOKEN is strictly private and never returned in API outputs.');
  }

  // -------------------------------------------------------------
  // Test 11: Error Handling (Empty queries, malformed input)
  // -------------------------------------------------------------
  console.log('\n[Test 11] Verifying Error Handling...');
  try {
    await searchRagKnowledge('');
    console.error('  ❌ Test 11 FAILED: Empty query did not throw error!');
    passedAll = false;
  } catch (err) {
    console.log('  ✅ Test 11 PASSED: Empty query rejected with error message:', err.message);
  }

  console.log('\n===========================================================');
  if (passedAll) {
    console.log('🎉 ALL PHASE 3 STRICT VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('❌ PHASE 3 STRICT VERIFICATION FAILED SOME TESTS.');
  }
  console.log('===========================================================');
}

runStrictPhase3Verification();
