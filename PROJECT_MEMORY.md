# SiBo — AI Finance Controller: Project Memory & Agent State

> **Purpose:** This document serves as the persistent memory and handoff log across AI Coding Agents (Antigravity, Codex, Nemetron, Trae, etc.).
> Any new agent or developer resuming work should read this file alongside `MASTER_BUILD_SPEC.md` and `PROGRESS_TRACKER.md` to instantly grasp completed work, system configuration, and upcoming tasks.

---

## 1. Project Identity & Architecture

- **Official Product Name:** **SiBo** (AI Finance Controller)
- **Primary Objective:** Build an autonomous payment & settlement reconciliation engine with RAG-based AI exception investigation for Razorpay Buildathon Track 04.
- **Frontend Stack:** React (v18), Vite, React Router (v7), Recharts, Lucide Icons.
- **Visual Design Language:** **NEOBRUTALISM / NEOBRUTALIST** (Dark mode, bold black/dark borders, high contrast, hard-edged corners, zero glassmorphism, zero soft gradients, solid offset shadows `3px 3px 0px #000`).
- **Backend Stack:** Node.js (v22), Express.js, Zod validation, Multer, csv-parse.
- **AI & RAG Architecture:**
  - **Orchestration:** LangChain.js
  - **LLM Reasoning:** Groq (`GROQ_MODEL=openai/gpt-oss-120b`) with 131K reasoning context window.
  - **Embedding Provider:** Hugging Face Inference API (`@huggingface/inference`)
  - **Embedding Model:** `Qwen/Qwen3-Embedding-0.6B`
  - **Vector Dimension:** **1024** (fixed for Supabase pgvector column matching)
  - **Primary Database:** Supabase PostgreSQL + pgvector (No MongoDB, No WebSockets)

---

## 2. Work Completed

### Phase 0: Repository Inspection & Requirements Alignment [Completed]
- Analyzed `MASTER_BUILD_SPEC.md`, `PROGRESS_TRACKER.md`, and 6 official Razorpay settlement documentation markdown files in `Rag/sources/`.

### Phase 1: Project Foundation & Environment Setup [Completed]
- Full-stack directory structure established (`backend/` & `frontend/`).
- Root `.gitignore` and `.env.example` templates created.
- Zod environment validation module (`backend/src/config/env.js`).
- Express server, error handling middleware, and `/api/health` route created.

### Phase 2: Supabase Database, Safe Migrations & Model Upgrade [Completed & Verified Live]
- **Groq LLM Model Updated:** Configured `GROQ_MODEL=openai/gpt-oss-120b` dynamically across `.env`, `.env.example`, `env.js`, and `groq.js`.
- **Hugging Face Client Configured:** `hf.js` configured with `Qwen/Qwen3-Embedding-0.6B` outputting 1024 dimensions.
- **Supabase CLI Linked:** Project ref `woxlkibjxoaczispngeq` linked.
- **Migrations Executed & Pushed to Remote Database**:
  - `supabase/migrations/20260828000000_initial_schema.sql` pushed to remote Supabase via `npx supabase db push`.
  - `supabase/migrations/20260828000001_grant_permissions.sql` pushed to grant permissions to `service_role` and API clients.
- **Live Database Tables Verified on Supabase PostgreSQL**:
  1. `pgvector` & `pgcrypto` extensions enabled.
  2. `reconciliation_runs` table created & verified.
  3. `payment_records` table created & verified.
  4. `settlement_records` table created & verified.
  5. `reconciliation_results` table created & verified.
  6. `exceptions` table created & verified.
  7. `ai_investigations` table created & verified.
  8. `rag_documents` table created & verified.
  9. `rag_chunks` table (`embedding vector(1024)`) created & verified.
  10. `match_rag_chunks` PL/pgSQL similarity search function created.
- **Application CRUD Verification Passed**: Executed `backend/src/scripts/test_db_crud.js` against live Supabase PostgreSQL — verified record insertion, foreign key linking, cascade deletion, and vector store schema.
- **Neobrutalism Design System Applied:** Updated `frontend/src/index.css` and `frontend/src/App.jsx` with dark Neobrutalist components, sharp borders, high contrast badges, and solid shadows.

---

## 3. Active Credentials Configuration (`.env`)

Backend `.env` is populated with active credentials:
- `SUPABASE_URL=https://woxlkibjxoaczispngeq.supabase.co`
- `GROQ_MODEL=openai/gpt-oss-120b`
- `HF_EMBEDDING_MODEL=Qwen/Qwen3-Embedding-0.6B`

---

## 4. Immediate Next Recommended Step (Phase 3)

The next step is **Phase 3 — RAG Knowledge Base & Ingestion**:
1. Build document loader for `Rag/sources/` (01-about-settlements.md to 06-settlement-details.md).
2. Clean text, split into meaningful chunks while preserving title, section, and source URL metadata.
3. Generate embeddings via Hugging Face (`Qwen/Qwen3-Embedding-0.6B`, 1024-dim).
4. Store chunks and embeddings in Supabase `rag_documents` and `rag_chunks` tables.
5. Implement top-k similarity retrieval service in backend.
