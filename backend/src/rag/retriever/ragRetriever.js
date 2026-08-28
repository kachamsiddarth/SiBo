import { getEmbeddingForText } from '../embeddings/hfEmbeddings.js';
import { supabase } from '../../config/supabase.js';

/**
 * Performs semantic similarity search against Supabase pgvector using match_rag_chunks PL/pgSQL function.
 * 
 * @param {string} query - Search query text
 * @param {Object} options - Search configuration options (topK, matchThreshold)
 * @returns {Promise<Array>} Array of relevant chunk results with similarity scores
 */
export async function searchRagKnowledge(query, options = {}) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new Error('Query string is required for RAG semantic search.');
  }

  const topK = options.topK || options.match_count || 5;
  const matchThreshold = options.matchThreshold || options.match_threshold || 0.15;

  const cleanQuery = query.trim();
  console.log(`🔎 Executing RAG semantic vector search for query: "${cleanQuery}" (topK=${topK}, threshold=${matchThreshold})`);

  // 1. Generate 1024-dimensional query vector embedding
  const queryEmbedding = await getEmbeddingForText(cleanQuery);

  // 2. Call Supabase RPC match_rag_chunks PL/pgSQL function
  const { data: matches, error } = await supabase.rpc('match_rag_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: topK,
  });

  if (error) {
    console.error('❌ Supabase pgvector RPC search error:', error.message);
    throw new Error(`Vector similarity search failed: ${error.message}`);
  }

  if (!matches || matches.length === 0) {
    console.log(`ℹ️ Vector search returned 0 matches for query: "${cleanQuery}" above threshold ${matchThreshold}`);
    return [];
  }

  console.log(`✅ Vector search found ${matches.length} relevant chunk match(es).`);

  return matches.map((match) => ({
    id: match.id,
    documentId: match.document_id,
    title: match.title,
    section: match.section,
    content: match.content,
    chunkIndex: match.chunk_index,
    similarity: parseFloat(match.similarity.toFixed(4)),
    metadata: match.metadata || {},
  }));
}
