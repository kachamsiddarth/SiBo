import { HfInference } from '@huggingface/inference';
import { env } from './env.js';

let hfInstance = null;

export function getHfClient() {
  if (hfInstance) return hfInstance;
  hfInstance = new HfInference(env.HF_TOKEN);
  return hfInstance;
}

export const HF_EMBEDDING_DIMENSION = 1024; // Fixed 1024-dimension for Supabase vector(1024)

/**
 * Generates 1024-dimensional vector embedding for a given input text using Hugging Face Inference API.
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input text provided for embedding generation.');
  }

  const hf = getHfClient();
  const cleanText = text.replace(/\n+/g, ' ').trim();

  let result;
  // Primary model from env (Qwen/Qwen3-Embedding-0.6B), fallback to BAAI/bge-large-en-v1.5 (1024d)
  const modelsToTry = [env.HF_EMBEDDING_MODEL, 'BAAI/bge-large-en-v1.5'];

  let lastError = null;
  for (const modelName of modelsToTry) {
    try {
      result = await hf.featureExtraction({
        model: modelName,
        inputs: cleanText,
      });

      if (result) break;
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ Feature extraction for model ${modelName} failed (${err.message}). Trying fallback model if available...`);
    }
  }

  if (!result) {
    throw new Error(`Embedding generation failed for text: ${lastError ? lastError.message : 'Unknown error'}`);
  }

  // Handle single or batch output array format
  let embeddingArray = Array.isArray(result[0]) ? result[0] : result;

  // Flatten if double-nested array returned
  if (Array.isArray(embeddingArray[0])) {
    embeddingArray = embeddingArray[0];
  }

  // Ensure array elements are numbers
  embeddingArray = Array.from(embeddingArray).map(Number);

  if (embeddingArray.length !== HF_EMBEDDING_DIMENSION) {
    console.warn(`⚠️ Embedding dimension mismatch: Received ${embeddingArray.length} dimensions, expected ${HF_EMBEDDING_DIMENSION}.`);
  }

  return embeddingArray;
}
