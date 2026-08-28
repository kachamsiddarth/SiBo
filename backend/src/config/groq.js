import { ChatGroq } from '@langchain/groq';
import { env } from './env.js';

let groqModelInstance = null;

/**
 * Initializes and returns the ChatGroq model instance.
 * Model name is loaded strictly from environment configuration (env.GROQ_MODEL).
 */
export function getGroqModel(options = {}) {
  if (groqModelInstance && !Object.keys(options).length) {
    return groqModelInstance;
  }

  const modelName = env.GROQ_MODEL;

  const instance = new ChatGroq({
    apiKey: env.GROQ_API_KEY,
    modelName: modelName,
    temperature: options.temperature ?? 0.1,
    maxTokens: options.maxTokens ?? 4096,
  });

  if (!groqModelInstance) {
    groqModelInstance = instance;
  }

  return instance;
}

export function logGroqConfiguration() {
  console.log(`🤖 Groq LLM initialized with model: ${env.GROQ_MODEL}`);
}
