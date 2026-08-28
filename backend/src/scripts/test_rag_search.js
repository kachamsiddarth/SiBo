import { searchRagKnowledge } from '../rag/retriever/ragRetriever.js';

async function testRagRetrieval() {
  console.log('🧪 Testing RAG Semantic Vector Retrieval against Supabase pgvector...');

  const testQueries = [
    'What is a Razorpay settlement cycle?',
    'What information is available in settlement break-up and fees?',
    'What settlement states exist in Razorpay?',
    'How do instant settlements work?',
    'What are settlement APIs and reports?',
  ];

  for (const query of testQueries) {
    console.log(`\n==================================================`);
    console.log(`❓ Query: "${query}"`);
    console.log(`==================================================`);

    try {
      const results = await searchRagKnowledge(query, { topK: 3, matchThreshold: 0.1 });
      console.log(`FOUND ${results.length} relevant chunk(s):`);

      results.forEach((res, i) => {
        console.log(`\n  [Result #${i + 1}] Similarity: ${res.similarity}`);
        console.log(`  Title: "${res.title}" | Section: "${res.section}"`);
        console.log(`  Snippet: ${res.content.slice(0, 150).replace(/\n/g, ' ')}...`);
      });
    } catch (err) {
      console.error(`❌ Retrieval error for query "${query}":`, err.message);
    }
  }
}

testRagRetrieval();
