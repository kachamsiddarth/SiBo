-- Grant permissions for SiBo tables to service_role, authenticated, and anon roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role, postgres, authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role, postgres, authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role, postgres, authenticated, anon;

-- Alter default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role, postgres, authenticated, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role, postgres, authenticated, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role, postgres, authenticated, anon;

-- Disable RLS or enable open read/write policy for operational tables
ALTER TABLE reconciliation_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE exceptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_investigations DISABLE ROW LEVEL SECURITY;
ALTER TABLE rag_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE rag_chunks DISABLE ROW LEVEL SECURITY;
