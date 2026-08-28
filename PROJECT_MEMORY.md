# SiBo — AI Finance Controller: Project Memory & Agent State

> **Purpose:** This document serves as the persistent memory and handoff log across AI Coding Agents (Antigravity, Codex, Nemetron, Trae, etc.).
> Any new agent or developer resuming work should read this file alongside `MASTER_BUILD_SPEC.md` and `PROGRESS_TRACKER.md` to instantly grasp completed work, system configuration, and upcoming tasks.

---

## 1. Project Identity & Current Phase

- **Official Product Name:** **SiBo** (AI Finance Controller)
- **Current Completed Phase:** **Phase 3 — RAG Knowledge Base & Vector Retrieval**
- **Primary Objective:** Autonomous payment settlement reconciliation & AI exception investigation engine for Razorpay Buildathon Track 04.
- **Frontend Stack:** React (v18), Vite, React Router (v7), Recharts, Lucide Icons.
- **Visual Design Language:** **NEOBRUTALISM / NEOBRUTALIST** (Dark mode, bold black/dark borders, high contrast, hard-edged corners, solid offset shadows `3px 3px 0px #000`).
- **Backend Stack:** Node.js (v22), Express.js, Zod validation, Multer, csv-parse.

---

## 2. Architecture & Data Flow

```
Frontend SPA
    ↓
Express.js Backend API
    ↓
LangChain.js Document Splitters & Loaders
    ↓
Hugging Face Embeddings (1024-dim)
    ↓
Supabase pgvector (rag_documents + rag_chunks)
    ↓
match_rag_chunks() Vector Similarity Retrieval
    ↓
LangChain + Groq LLM (openai/gpt-oss-120b) AI Investigation
```

---

## 3. Work Completed so far

### Phase 0: Repository Inspection & Requirements Alignment [Completed]
- Analyzed `MASTER_BUILD_SPEC.md`, `PROGRESS_TRACKER.md`, and 6 official Razorpay settlement documentation markdown files in `Rag/`.

### Phase 1: Project Foundation & Environment Setup [Completed]
- Full-stack directory structure established (`backend/` & `frontend/`).
- Zod environment validation (`backend/src/config/env.js`).
- Express server, error handling middleware, and `/api/health` route created.

### Phase 2: Supabase Database, Safe Migrations & Model Upgrade [Completed & Verified Live]
- `GROQ_MODEL=openai/gpt-oss-120b` configured across backend.
- Supabase migrations pushed via CLI (`20260828000000_initial_schema.sql` and `20260828000001_grant_permissions.sql`).
- All 8 tables, foreign keys, RLS grants, `pgvector` extension, and `match_rag_chunks()` function verified live on Supabase PostgreSQL.

### Phase 3: RAG Knowledge Base & Ingestion Pipeline [Completed & Verified]
- **Document Discovery & Loader:** `backend/src/rag/loaders/markdownLoader.js` discovers 6 official Razorpay Markdown documents:
  1. `01-about-settlements.md` ("About Settlements")
  2. `02-settlement-breakup.md` ("Settlement Breakup & Fees")
  3. `03-settlement-apis.md` ("Settlement APIs Workflow")
  4. `04-settlement-api-reference.md` ("Settlement API Specification")
  5. `05-settlement-faqs.md` ("Settlement FAQs")
  6. `06-settlement-details.md` ("Settlement Details & Reports")
- **Chunking & Header Preservation:** `backend/src/rag/splitters/textSplitter.js` splits documents into 54 contextual chunks using `RecursiveCharacterTextSplitter` while preserving section headers, document titles, and metadata.
- **1024-Dimension Vector Embeddings:** `backend/src/rag/embeddings/hfEmbeddings.js` generates 1024-dimensional embeddings via Hugging Face (`Qwen/Qwen3-Embedding-0.6B` with `BAAI/bge-large-en-v1.5` fallback).
- **Idempotent Ingestion Pipeline:** `backend/src/rag/ingestion/ingestPipeline.js` populates `rag_documents` and `rag_chunks` tables without creating duplicates on repeated runs.
- **Semantic Vector Retriever:** `backend/src/rag/retriever/ragRetriever.js` queries `match_rag_chunks()` in Supabase pgvector and returns top-k matching chunks with similarity scores (e.g. 0.8337 matching accuracy).
- **RAG REST API Endpoints:** `backend/src/routes/rag.js` exposes:
  - `POST /api/rag/search`: Semantic vector query execution.
  - `POST /api/rag/ingest`: Programmatic trigger for document ingestion.
  - `GET /api/rag/documents`: RAG knowledge base statistics.

---

## 4. Database Schema Summary

- `reconciliation_runs`: Track reconciliation runs.
- `payment_records`: Uploaded/synthetic payment records.
- `settlement_records`: Uploaded/synthetic settlement records.
- `reconciliation_results`: Deterministic calculation results.
- `exceptions`: Unresolved discrepancy records.
- `ai_investigations`: AI reasoning & evidence audit trail.
- `rag_documents`: RAG source document metadata.
- `rag_chunks`: Chunks and `embedding vector(1024)` column.
- PL/pgSQL function: `match_rag_chunks(query_embedding vector(1024), match_threshold float, match_count int)`.

---

## 5. Environment Variables Configuration

Variable names configured:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `GROQ_API_KEY`
- `GROQ_MODEL=openai/gpt-oss-120b`
- `HF_TOKEN`
- `HF_EMBEDDING_MODEL=Qwen/Qwen3-Embedding-0.6B`

---

## 6. Important Non-Negotiable Rules for Future Agents

1. **Deterministic Finance Math:** Do NOT use LLMs or RAG for calculating transaction math. The deterministic reconciliation engine handles calculations in Phase 5.
2. **RAG Purpose:** RAG is strictly for retrieving domain rules, settlement fees, cycles, and Razorpay API semantics for AI exception investigation.
3. **No MongoDB / No WebSockets:** Continue using Supabase PostgreSQL + pgvector and HTTP REST APIs.
4. **Neobrutalism UI:** Maintain the Neobrutalist design system in React UI.
5. **No Static Data:** Do not invent static transaction totals or fake AI responses in UI.

---

## 7. Immediate Next Recommended Step (Phase 4)

The next step is **Phase 4 — Synthetic Finance Dataset & File Upload**:
1. Implement synthetic Razorpay dataset generator producing 50+ payment and settlement CSV records with realistic discrepancies (amount mismatch, missing settlement, component mismatch, fee variances).
2. Build CSV parser and file upload endpoint in `backend/src/routes/upload.js` storing records in `payment_records` and `settlement_records`.
