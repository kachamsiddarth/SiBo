/**
 * Operation Timeout Wrapper for Phase 11 Security Hardening
 *
 * Provides timeout protection for expensive operations (Groq, HuggingFace, reconciliation)
 */

/**
 * Wraps a promise with a timeout
 * @param {Promise} promise - The promise to wrap
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} operationName - Name of the operation for error messages
 * @returns {Promise} Promise that rejects if timeout is exceeded
 */
export function withTimeout(promise, timeoutMs, operationName = 'Operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Default timeout values for different operation types (in milliseconds)
 */
export const TIMEOUTS = {
  GROQ_LLM: 60000, // 60 seconds - Groq API call
  HUGGINGFACE_EMBEDDING: 30000, // 30 seconds - HuggingFace embedding generation
  RAG_SEARCH: 15000, // 15 seconds - RAG vector search
  RECONCILIATION: 120000, // 2 minutes - Deterministic reconciliation engine
  RAG_INGESTION: 300000, // 5 minutes - Full RAG document ingestion
  DATABASE_QUERY: 10000, // 10 seconds - Supabase queries
  UPLOAD_PROCESSING: 60000, // 60 seconds - CSV upload and validation
};

/**
 * Wraps Groq LLM call with timeout
 * @param {Function} groqCallFn - Function that returns a Groq promise
 * @returns {Promise} Timeout-protected promise
 */
export async function withGroqTimeout(groqCallFn) {
  return withTimeout(
    groqCallFn(),
    TIMEOUTS.GROQ_LLM,
    'Groq LLM API call'
  );
}

/**
 * Wraps HuggingFace embedding generation with timeout
 * @param {Function} embeddingFn - Function that returns an embedding promise
 * @returns {Promise} Timeout-protected promise
 */
export async function withEmbeddingTimeout(embeddingFn) {
  return withTimeout(
    embeddingFn(),
    TIMEOUTS.HUGGINGFACE_EMBEDDING,
    'HuggingFace embedding generation'
  );
}

/**
 * Wraps RAG search with timeout
 * @param {Function} searchFn - Function that returns a RAG search promise
 * @returns {Promise} Timeout-protected promise
 */
export async function withRagTimeout(searchFn) {
  return withTimeout(
    searchFn(),
    TIMEOUTS.RAG_SEARCH,
    'RAG semantic search'
  );
}

/**
 * Wraps reconciliation engine execution with timeout
 * @param {Function} reconcileFn - Function that returns a reconciliation promise
 * @returns {Promise} Timeout-protected promise
 */
export async function withReconciliationTimeout(reconcileFn) {
  return withTimeout(
    reconcileFn(),
    TIMEOUTS.RECONCILIATION,
    'Reconciliation engine execution'
  );
}

/**
 * Wraps database operation with timeout
 * @param {Function} dbFn - Function that returns a database promise
 * @returns {Promise} Timeout-protected promise
 */
export async function withDatabaseTimeout(dbFn) {
  return withTimeout(
    dbFn(),
    TIMEOUTS.DATABASE_QUERY,
    'Database query'
  );
}

/**
 * Creates a custom timeout wrapper
 * @param {number} timeoutMs - Custom timeout in milliseconds
 * @param {string} operationName - Name of the operation
 * @returns {Function} Timeout wrapper function
 */
export function createTimeoutWrapper(timeoutMs, operationName) {
  return (fn) => withTimeout(fn(), timeoutMs, operationName);
}

export default {
  withTimeout,
  withGroqTimeout,
  withEmbeddingTimeout,
  withRagTimeout,
  withReconciliationTimeout,
  withDatabaseTimeout,
  createTimeoutWrapper,
  TIMEOUTS,
};
