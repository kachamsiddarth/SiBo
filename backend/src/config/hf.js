import { HfInference } from '@huggingface/inference';
import { env } from './env.js';

let hfInstance = null;
let activeModel = null;

export function getHfClient() {
  if (hfInstance) return hfInstance;
  hfInstance = new HfInference(env.HF_TOKEN);
  return hfInstance;
}

export const HF_EMBEDDING_DIMENSION = 1024; // Fixed 1024-dimension requirement for Supabase vector(1024)

/**
 * Returns the active embedding model being used deterministically across ingestion and retrieval.
 */
export function getActiveEmbeddingModel() {
  return activeModel || env.HF_EMBEDDING_MODEL;
}

/**
 * Generates 1024-dimensional vector embedding for a given input text using Hugging Face Inference API.
 * Guarantees that the EXACT SAME model is used deterministically across both document ingestion and query retrieval.
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('Invalid input text provided for embedding generation.');
  }

  const hf = getHfClient();
  const cleanText = text.replace(/\n+/g, ' ').trim();

  // Determine model to use (lock activeModel once resolved to prevent model mismatch)
  if (!activeModel) {
    const candidateModels = [env.HF_EMBEDDING_MODEL, 'BAAI/bge-large-en-v1.5'];
    for (const modelCandidate of candidateModels) {
      try {
        const testRes = await hf.featureExtraction({
          model: modelCandidate,
          inputs: 'test connection string',
        });
        if (testRes) {
          activeModel = modelCandidate;
          console.log(`🔒 Embedding model locked deterministically to: "${activeModel}" (1024 dimensions)`);
          break;
        }
      } catch (err) {
        console.warn(`⚠️ Model "${modelCandidate}" unavailable on HF Inference (${err.message}). Testing next candidate...`);
      }
    }
    if (!activeModel) {
      throw new Error(`Failed to resolve a working 1024-dimensional Hugging Face embedding model.`);
    }
  }

  try {
    const result = await hf.featureExtraction({
      model: activeModel,
      inputs: cleanText,
    });

    // Handle single or batch output array format
    let embeddingArray = Array.isArray(result[0]) ? result[0] : result;

    // Flatten if double-nested array returned
    if (Array.isArray(embeddingArray[0])) {
      embeddingArray = embeddingArray[0];
    }

    // Ensure array elements are numbers
    embeddingArray = Array.from(embeddingArray).map(Number);

    if (embeddingArray.length !== HF_EMBEDDING_DIMENSION) {
      throw new Error(`Embedding dimension mismatch: Model "${activeModel}" returned ${embeddingArray.length} dimensions, expected ${HF_EMBEDDING_DIMENSION}.`);
    }

    return embeddingArray;
  } catch (error) {
    console.error(`❌ Error generating Hugging Face embedding with model "${activeModel}":`, error.message || error);
    throw error;
  }
}
