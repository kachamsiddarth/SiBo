import { HfInference } from '@huggingface/inference';
import { env } from './env.js';

let hfInstance = null;

export function getHfClient() {
  if (hfInstance) return hfInstance;
  hfInstance = new HfInference(env.HF_TOKEN);
  return hfInstance;
}

export const HF_EMBEDDING_DIMENSION = 1024; // Fixed dimension for Qwen/Qwen3-Embedding-0.6B

/**
 * Generates vector embedding for a given input text using Hugging Face Inference API.
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input text provided for embedding generation.');
  }

  const hf = getHfClient();

  try {
    const result = await hf.featureExtraction({
      model: env.HF_EMBEDDING_MODEL,
      inputs: text,
    });

    // Handle single or batch output array format
    let embeddingArray = Array.isArray(result[0]) ? result[0] : result;
    
    // Ensure array elements are numbers
    embeddingArray = Array.from(embeddingArray).map(Number);

    if (embeddingArray.length !== HF_EMBEDDING_DIMENSION) {
      console.warn(`⚠️ Embedding dimension warning: Received ${embeddingArray.length} dimensions, expected ${HF_EMBEDDING_DIMENSION}.`);
    }

    return embeddingArray;
  } catch (error) {
    console.error(`❌ Error generating Hugging Face embedding (${env.HF_EMBEDDING_MODEL}):`, error.message || error);
    throw error;
  }
}
