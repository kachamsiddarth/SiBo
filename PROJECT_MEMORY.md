# SiBo — AI Finance Controller: Project Memory & Agent State

> **Purpose:** This document serves as the persistent memory and handoff log across AI Coding Agents (Antigravity, Codex, Nemetron, Trae, etc.).
> Any new agent or developer resuming work should read this file alongside `MASTER_BUILD_SPEC.md` and `PROGRESS_TRACKER.md` to instantly grasp completed work, system configuration, and upcoming tasks.

---

## 1. Project Identity & Current Phase

- **Official Product Name:** **SiBo** (AI Finance Controller)
- **Current Completed Phase:** **Phase 3 — RAG Knowledge Base & Vector Retrieval (Strictly Verified)**
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
Hugging Face Embeddings (1024-dim, Locked Model)
    ↓
Supabase pgvector (rag_documents + rag_chunks)
    ↓
match_rag_chunks() Vector Similarity Retrieval
    ↓
LangChain + Groq LLM (openai/gpt-oss-120b) AI Investigation
```

---

## 3. Work Completed & Verified

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

### Phase 3: RAG Knowledge Base & Ingestion Pipeline [Completed & Strictly Verified]
- **Document Loader & Metadata:** `backend/src/rag/loaders/markdownLoader.js` loaded all 6 official Razorpay Markdown documents into `rag_documents`.
- **Text Chunking:** `backend/src/rag/splitters/textSplitter.js` created 54 chunks with section title & URL metadata.
- **1024d Vector Model Locking:** `backend/src/config/hf.js` locks the active embedding model deterministically, guaranteeing identical model usage across ingestion and query retrieval.
- **Supabase pgvector Vector Store:** `backend/src/rag/ingestion/ingestPipeline.js` stored 54 non-null 1024d vector embeddings in `rag_chunks`.
- **Vector Search Accuracy:** `backend/src/rag/retriever/ragRetriever.js` queries `match_rag_chunks()` with similarity scores up to **0.8422**.
- **Idempotency Verified:** Running ingestion twice created 0 duplicate documents and 0 duplicate chunks (6/6 docs skipped on repeat run).
- **Security Verified:** `HF_TOKEN` is strictly backend-only and never exposed in API endpoints.
- **Automated Verification Suite:** `backend/src/scripts/verify_phase3_strict.js` passed 100% of tests on live Supabase PostgreSQL.

---

## 4. Phase 3 Verification Audit Trail

| Verification Item | Status | Result / Metric |
| :--- | :--- | :--- |
| 1. Six official Razorpay docs loaded in `rag_documents` | `PASSED` | 6 documents present |
| 2. Non-null 1024d embeddings in `rag_chunks` | `PASSED` | 54 chunks with 1024d vectors |
| 3, 4, 5. Model locking & ingestion/retrieval consistency | `PASSED` | Model locked deterministically |
| 6. `match_rag_chunks()` RPC similarity search | `PASSED` | Cosine similarity search verified |
| 7. Domain query relevance | `PASSED` | Top similarity **0.8422** |
| 8. Idempotency test (repeat ingestion) | `PASSED` | 0 duplicate chunks created |
| 9. `HF_TOKEN` private protection | `PASSED` | 0 token leaks in API responses |
| 10. RAG REST API endpoints | `PASSED` | `/api/rag/search` and `/api/rag/documents` operational |
| 11. Error handling for edge cases | `PASSED` | Empty queries & bad requests handled |

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
