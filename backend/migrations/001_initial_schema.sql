-- SiBo AI Finance Controller Database Schema Migration
-- Database: Supabase PostgreSQL + pgvector
-- Embedding Model: Qwen/Qwen3-Embedding-0.6B (1024 dimensions)

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Reconciliation Runs Table
CREATE TABLE IF NOT EXISTS reconciliation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT,
    total_records INTEGER DEFAULT 0,
    matched_count INTEGER DEFAULT 0,
    exception_count INTEGER DEFAULT 0,
    match_rate NUMERIC(5,2) DEFAULT 0.00,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Synthetic/Uploaded Payment Records Table
CREATE TABLE IF NOT EXISTS payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES reconciliation_runs(id) ON DELETE CASCADE,
    transaction_id TEXT NOT NULL,
    payment_amount NUMERIC(12,2) NOT NULL,
    payment_date TIMESTAMPTZ,
    payment_method TEXT DEFAULT 'UPI',
    status TEXT DEFAULT 'captured',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Synthetic/Uploaded Settlement Records Table
CREATE TABLE IF NOT EXISTS settlement_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES reconciliation_runs(id) ON DELETE CASCADE,
    settlement_id TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    payment_amount NUMERIC(12,2) NOT NULL,
    fee NUMERIC(12,2) DEFAULT 0.00,
    tax NUMERIC(12,2) DEFAULT 0.00,
    adjustment NUMERIC(12,2) DEFAULT 0.00,
    refund NUMERIC(12,2) DEFAULT 0.00,
    settlement_amount NUMERIC(12,2) NOT NULL,
    settlement_date TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Deterministic Reconciliation Results Table
CREATE TABLE IF NOT EXISTS reconciliation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES reconciliation_runs(id) ON DELETE CASCADE,
    transaction_id TEXT NOT NULL,
    expected_settlement NUMERIC(12,2) NOT NULL,
    actual_settlement NUMERIC(12,2),
    difference NUMERIC(12,2) DEFAULT 0.00,
    status TEXT NOT NULL, -- 'MATCHED', 'EXCEPTION', 'DATA_ERROR'
    exception_type TEXT, -- 'AMOUNT_MISMATCH', 'MISSING_SETTLEMENT', 'DUPLICATE_TRANSACTION', 'COMPONENT_MISMATCH', 'UNEXPLAINED'
    evidence JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Unresolved/Exception Records Table
CREATE TABLE IF NOT EXISTS exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES reconciliation_runs(id) ON DELETE CASCADE,
    reconciliation_result_id UUID REFERENCES reconciliation_results(id) ON DELETE CASCADE,
    transaction_id TEXT NOT NULL,
    category TEXT NOT NULL,
    difference NUMERIC(12,2) DEFAULT 0.00,
    status TEXT DEFAULT 'UNRESOLVED', -- 'UNRESOLVED', 'EXPLAINED', 'RESOLVED', 'MANUAL_REVIEW'
    ai_investigation_status TEXT DEFAULT 'PENDING', -- 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AI Investigation Audit Log Table
CREATE TABLE IF NOT EXISTS ai_investigations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exception_id UUID REFERENCES exceptions(id) ON DELETE CASCADE,
    run_id UUID REFERENCES reconciliation_runs(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    evidence JSONB DEFAULT '[]'::jsonb,
    reasoning TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    confidence TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'UNRESOLVED',
    sources_used JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. RAG Source Documents Metadata Table
CREATE TABLE IF NOT EXISTS rag_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    source TEXT DEFAULT 'Razorpay Official Documentation',
    source_url TEXT,
    file_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. RAG Document Chunks & Vector Store Table (1024-dim matching Qwen3-Embedding-0.6B)
CREATE TABLE IF NOT EXISTS rag_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES rag_documents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    section TEXT,
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding vector(1024),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Performance & Search Indexes
CREATE INDEX IF NOT EXISTS idx_payment_records_run_id ON payment_records(run_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_txn_id ON payment_records(transaction_id);

CREATE INDEX IF NOT EXISTS idx_settlement_records_run_id ON settlement_records(run_id);
CREATE INDEX IF NOT EXISTS idx_settlement_records_txn_id ON settlement_records(transaction_id);

CREATE INDEX IF NOT EXISTS idx_reconciliation_results_run_id ON reconciliation_results(run_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_results_txn_id ON reconciliation_results(transaction_id);

CREATE INDEX IF NOT EXISTS idx_exceptions_run_id ON exceptions(run_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_status ON exceptions(status);

CREATE INDEX IF NOT EXISTS idx_ai_investigations_exception_id ON ai_investigations(exception_id);

CREATE INDEX IF NOT EXISTS idx_rag_chunks_document_id ON rag_chunks(document_id);

-- Vector similarity search match function for RAG retrieval
CREATE OR REPLACE FUNCTION match_rag_chunks (
    query_embedding vector(1024),
    match_threshold float DEFAULT 0.2,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    title TEXT,
    section TEXT,
    content TEXT,
    chunk_index INTEGER,
    metadata JSONB,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        rag_chunks.id,
        rag_chunks.document_id,
        rag_chunks.title,
        rag_chunks.section,
        rag_chunks.content,
        rag_chunks.chunk_index,
        rag_chunks.metadata,
        1 - (rag_chunks.embedding <=> query_embedding) AS similarity
    FROM rag_chunks
    WHERE rag_chunks.embedding IS NOT NULL
      AND 1 - (rag_chunks.embedding <=> query_embedding) > match_threshold
    ORDER BY rag_chunks.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
