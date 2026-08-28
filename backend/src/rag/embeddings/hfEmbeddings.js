import { generateEmbedding, HF_EMBEDDING_DIMENSION } from '../../config/hf.js';
import { env } from '../../config/env.js';

/**
 * Generates vector embeddings for a chunk or query, validating 1024 vector dimensions.
 */
export async function getEmbeddingForText(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text input is required to generate vector embedding.');
  }

  const cleanText = text.replace(/\n+/g, ' ').trim();
  const vector = await generateEmbedding(cleanText);

  if (!Array.isArray(vector) || vector.length !== HF_EMBEDDING_DIMENSION) {
    throw new Error(
      `Embedding dimension mismatch: Model ${env.HF_EMBEDDING_MODEL} returned ${vector ? vector.length : 0} dimensions, expected ${HF_EMBEDDING_DIMENSION}`
    );
  }

  return vector;
}

/**
 * Generates embeddings for a batch of text chunks sequentially or in controlled parallel batches.
 */
export async function getEmbeddingsForChunks(chunks) {
  console.log(`🤖 Generating embeddings for ${chunks.length} chunks via Hugging Face (${env.HF_EMBEDDING_MODEL})...`);

  const embeddedChunks = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    try {
      const vector = await getEmbeddingForText(chunk.content);
      embeddedChunks.push({
        ...chunk,
        embedding: vector,
      });

      // Brief delay to avoid HF rate limits if processing large batch
      if (i > 0 && i % 5 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (err) {
      console.error(`❌ Failed to embed chunk ${i} (${chunk.title}):`, err.message);
      throw err;
    }
  }

  return embeddedChunks;
}
