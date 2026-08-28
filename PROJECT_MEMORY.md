# SiBo — AI Finance Controller: Project Memory & Agent State

> **Purpose:** This document serves as the persistent memory and handoff log across AI Coding Agents (Antigravity, Codex, Nemetron, Trae, etc.).
> Any new agent or developer resuming work should read this file alongside `MASTER_BUILD_SPEC.md` and `PROGRESS_TRACKER.md` to instantly grasp completed work, system configuration, and upcoming tasks.

---

## 1. Project Overview & Architecture

- **Project Name:** SiBo — AI Finance Controller (Razorpay Buildathon Track 04)
- **Primary Objective:** Build an autonomous payment & settlement reconciliation engine with RAG-based AI exception investigation.
- **Frontend Stack:** React (v18), Vite, React Router (v7), Recharts, Lucide Icons, Vanilla CSS Design System.
- **Backend Stack:** Node.js (v22), Express.js, Zod validation, Multer, csv-parse.
- **AI & RAG Architecture:**
  - **Orchestration:** LangChain.js
  - **LLM Reasoning:** Groq (`GROQ_MODEL=llama-3.3-70b-versatile`)
  - **Embedding Provider:** Hugging Face Inference API (`@huggingface/inference`)
  - **Embedding Model:** `Qwen/Qwen3-Embedding-0.6B`
  - **Vector Dimension:** **1024** (fixed for Supabase pgvector column matching)
  - **Primary Database:** Supabase PostgreSQL + pgvector (No MongoDB, No WebSockets)

---

## 2. Work Completed so far (Phase 0 & Phase 1)

### Phase 0: Repository Inspection & Requirements Alignment
- Completely analyzed `MASTER_BUILD_SPEC.md`, `PROGRESS_TRACKER.md`, and 6 official Razorpay settlement documentation markdown files in `Rag/sources/`.
- Confirmed project architecture and non-negotiables:
  - Synthetic reconciliation data (50+ records) handled by deterministic engine (LLM does NOT calculate math).
  - Domain knowledge RAG from `Rag/sources/` retrieved dynamically for exception explanation.
  - Hugging Face `Qwen/Qwen3-Embedding-0.6B` outputs **1024-dimensional** vector embeddings.

### Phase 1: Project Foundation & Environment Setup
- **Directory Structure Established:**
  - `backend/`: Express.js ES module backend initialized.
  - `frontend/`: React + Vite frontend SPA initialized.
  - `.gitignore`: Root secret protection for `.env`, `node_modules`, `dist/`.
- **Backend Foundation (`backend/`):**
  - Configured `package.json` with dependencies (`@huggingface/inference`, `langchain`, `@langchain/groq`, `@supabase/supabase-js`, `express`, `zod`, `cors`, `dotenv`).
  - Implemented environment validator (`src/config/env.js`) with Zod schema and placeholder warning system.
  - Implemented centralized error handler (`src/middleware/errorHandler.js`) hiding stack traces in production.
  - Implemented health check endpoint (`src/routes/health.js` -> `GET /api/health`).
  - Implemented Express server (`src/server.js`) listening on port 5000 with CORS & body parser.
  - Created `.env.example` and local `.env`.
- **Frontend Foundation (`frontend/`):**
  - Configured `package.json` with React 18, Vite, React Router, Lucide icons, Recharts.
  - Created `vite.config.js` with proxy pointing `/api` to `http://localhost:5000`.
  - Implemented modern CSS design system in `src/index.css` featuring glassmorphism, responsive grid, status badges, and Inter/JetBrains typography.
  - Implemented header navigation layout in `src/App.jsx` with active tabs and live backend status check.
  - Created `.env.example` (`VITE_API_BASE_URL=http://localhost:5000/api`).

---

## 3. Environment Secrets Required for Next Phase (Phase 2 & Phase 3)

The user will provide real API credentials in the next prompt. The expected key structure is:

```env
# Supabase
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (Server side only)
SUPABASE_ANON_KEY=eyJhbGci...

# Groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

# Hugging Face
HF_TOKEN=hf_...
HF_EMBEDDING_MODEL=Qwen/Qwen3-Embedding-0.6B
```

---

## 4. Immediate Next Step (Phase 2)

Once the user provides API keys in the next prompt:
1. Update `.env` with real credentials.
2. Design and create Supabase database schema & SQL migrations (`pgvector` extension enabled, vector dimension = 1024).
3. Tables required:
   - `reconciliation_runs`
   - `payment_records`
   - `settlement_records`
   - `reconciliation_results`
   - `exceptions`
   - `ai_investigations`
   - `rag_documents` & `rag_chunks` (vector column `embedding vector(1024)`).
4. Update `PROGRESS_TRACKER.md` as tasks are completed.
