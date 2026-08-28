# AI Finance Controller — Phase Progress Tracker

> **Purpose:** This file is the execution checklist for `MASTER_BUILD_SPEC.md`.
> It is NOT a replacement for the master specification. The master specification defines
> what the system should be; this file tracks what has actually been implemented,
> tested, verified, and handed off between coding agents.

---

## How to use this file

1. Keep `MASTER_BUILD_SPEC.md` as the **source of truth for requirements**.
2. Keep this file as the **source of truth for implementation progress**.
3. Before starting a phase, read the corresponding phase in `MASTER_BUILD_SPEC.md`.
4. Change only the status/checklist items that have actually been completed.
5. Do not mark a phase complete merely because code was generated.
6. A phase is complete only when:
   - the implementation exists,
   - it runs,
   - relevant tests pass,
   - errors are handled,
   - no existing working feature was unnecessarily broken,
   - database migrations are safe,
   - and the acceptance criteria are satisfied.
7. After every completed phase, create a Git commit before moving to the next phase.
8. When handing the repository to another coding agent, tell it to read:
   - `MASTER_BUILD_SPEC.md`
   - `PROGRESS_TRACKER.md`
   - the current phase status below
   - the existing source code before modifying anything.

---

# Overall Status

**Project:** AI Finance Controller  
**Primary stack:** React + Express.js + LangChain.js + Groq + Supabase/PostgreSQL/pgvector  
**MongoDB:** Not used  
**WebSockets:** Not required for the initial version  
**Deployment:** Secondary; project correctness is the priority

### Status legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed and verified
- `[!]` Blocked / requires decision
- `[?]` Needs manual verification

---

# Phase 0 — Repository Inspection & Planning

**Status:** [x]

### Goal

Understand the existing repository before changing code.

### Checklist

- [x] Read `MASTER_BUILD_SPEC.md` completely.
- [x] Inspect the existing frontend (Ground zero - initial foundation built).
- [x] Inspect the existing backend (Ground zero - initial foundation built).
- [x] Identify the existing authentication implementation.
- [x] Identify existing Supabase configuration.
- [x] Identify existing API routes/controllers/services.
- [x] Identify existing database schema and migrations.
- [x] Identify existing environment-variable conventions.
- [x] Identify existing error-handling patterns.
- [x] Identify existing UI/dashboard components.
- [x] Do NOT replace working authentication or backend logic without a requirement.
- [x] Document any conflicts between the master specification and existing code.

### Verification

- [x] Application starts locally.
- [x] Existing functionality still works.
- [x] No unnecessary architectural rewrite was performed.

### Git checkpoint

- [x] Commit: `chore: inspect and establish project foundation`

---

# Phase 1 — Project Foundation & Environment

**Status:** [x]

### Goal

Establish a clean full-stack foundation and environment configuration.

### Checklist

- [x] Frontend dependencies are installed.
- [x] Backend dependencies are installed.
- [x] LangChain.js dependencies are installed.
- [x] Groq integration package/configuration is installed.
- [x] Supabase client/server packages are installed.
- [x] File upload/parsing dependencies are installed as required.
- [x] Validation dependencies are installed as required.
- [x] Environment variables are separated from source code.
- [x] `.env` is ignored by Git.
- [x] `.env.example` documents required variables without secrets.
- [x] No API key is hard-coded.
- [x] Backend validates required environment variables at startup.
- [x] Frontend and backend configuration are clearly separated.

### Expected environment categories

- [x] Supabase URL
- [x] Supabase publishable/anon key where required
- [x] Supabase secret/service-role key on trusted backend only
- [x] Groq API key
- [x] Groq model
- [x] Embedding provider/API key
- [x] Embedding model (Qwen/Qwen3-Embedding-0.6B)
- [x] Backend port/configuration

### Verification

- [x] Backend starts with valid environment variables.
- [x] Backend fails clearly when required secrets are missing.
- [x] Secrets are not exposed to the browser.

### Git checkpoint

- [x] Commit: `chore: establish project environment`

---

# Phase 2 — Supabase Database & Safe Migrations

**Status:** [ ]

### Goal

Build the persistent relational data layer and pgvector foundation safely.

### Checklist

- [ ] Inspect existing schema before creating new migrations.
- [ ] Create only necessary tables.
- [ ] Define primary keys.
- [ ] Define foreign keys.
- [ ] Define indexes for frequently queried fields.
- [ ] Add appropriate constraints.
- [ ] Add timestamps where useful.
- [ ] Enable/configure pgvector as required.
- [ ] Create the document/chunk/vector storage required for RAG.
- [ ] Ensure vector dimension matches the selected embedding model.
- [ ] Create reconciliation tables.
- [ ] Create exception tables.
- [ ] Create AI investigation/audit storage.
- [ ] Apply migrations incrementally.
- [ ] Never overwrite production/existing data casually.
- [ ] Never delete an existing migration just to make a new migration work.
- [ ] Verify migration ordering.
- [ ] Verify rollback/recovery strategy where applicable.
- [ ] Verify Row Level Security/policies where applicable.

### Suggested logical data areas

- [ ] reconciliation runs
- [ ] uploaded files / file metadata
- [ ] payment records
- [ ] settlement records
- [ ] reconciliation results
- [ ] exceptions
- [ ] AI investigations
- [ ] RAG documents/chunks/metadata

### Verification

- [ ] Fresh database can be migrated successfully.
- [ ] Existing database can be migrated without destructive changes.
- [ ] CRUD operations work.
- [ ] pgvector similarity search can be executed.

### Git checkpoint

- [ ] Commit: `feat: establish supabase data layer`

---

# Phase 3 — RAG Knowledge Base & Ingestion

**Status:** [ ]

### Goal

Turn the curated official Razorpay documentation into a searchable vector knowledge base.

### Source directory

```text
Rag/
└── sources/
    ├── 01-about-settlements.md
    ├── 02-settlement-breakup.md
    ├── 03-settlement-api.md
    ├── 04-settlement-api-reference.md
    ├── 05-settlement-faqs.md
    └── 06-settlement-details.md
```

> Keep source URLs and useful metadata in each Markdown document.
> Do not claim that API-reference material is reconciliation logic.
> Domain rules and settlement concepts are the primary RAG knowledge.

### Checklist

- [ ] Verify each source is an official Razorpay source.
- [ ] Keep source URL in metadata/content.
- [ ] Curate relevant content instead of blindly copying entire websites.
- [ ] Build document loader.
- [ ] Normalize Markdown/text.
- [ ] Split documents into meaningful chunks.
- [ ] Preserve document title.
- [ ] Preserve section/heading metadata.
- [ ] Preserve source URL metadata.
- [ ] Generate embeddings.
- [ ] Store embeddings in Supabase pgvector.
- [ ] Store chunk metadata.
- [ ] Prevent accidental duplicate ingestion.
- [ ] Make ingestion repeatable/idempotent.
- [ ] Implement ingestion error handling.
- [ ] Log failed documents/chunks.
- [ ] Implement retrieval.
- [ ] Implement top-k similarity search.
- [ ] Return source metadata with retrieved chunks.

### Verification

- [ ] All intended source documents ingest successfully.
- [ ] No duplicate chunks appear after a repeated ingestion.
- [ ] A known settlement question retrieves the expected source.
- [ ] Retrieved chunks contain enough context to be useful.
- [ ] Source attribution survives retrieval.

### Git checkpoint

- [ ] Commit: `feat: implement rag ingestion and retrieval`

---

# Phase 4 — Synthetic Finance Dataset & File Upload

**Status:** [ ]

### Goal

Allow the user to upload a 50+ record batch of synthetic finance data and validate it safely.

### Checklist

- [ ] Implement upload UI.
- [ ] Implement backend upload endpoint.
- [ ] Validate file type.
- [ ] Validate file size.
- [ ] Parse CSV/required supported format.
- [ ] Validate required columns.
- [ ] Validate data types.
- [ ] Validate transaction identifiers.
- [ ] Detect duplicate records.
- [ ] Detect missing values.
- [ ] Detect malformed amounts.
- [ ] Detect invalid dates.
- [ ] Return clear validation errors.
- [ ] Store file/run metadata.
- [ ] Store normalized records in Supabase.
- [ ] Do not trust client-side validation alone.
- [ ] Handle partial/invalid uploads safely.
- [ ] Ensure one failed upload does not corrupt previous runs.

### Minimum dataset expectation

- [ ] 50+ records supported.
- [ ] Matched cases included.
- [ ] Amount mismatch cases included.
- [ ] Missing settlement cases included.
- [ ] Duplicate/anomalous cases included where useful.
- [ ] At least some cases should intentionally require AI investigation.

### Verification

- [ ] Valid dataset uploads successfully.
- [ ] Invalid dataset produces actionable errors.
- [ ] 50+ records are processed correctly.
- [ ] Uploaded data can be queried from Supabase.

### Git checkpoint

- [ ] Commit: `feat: add finance dataset ingestion`

---

# Phase 5 — Deterministic Reconciliation Engine

**Status:** [ ]

### Goal

Implement the actual finance-ops reconciliation loop without relying on the LLM for arithmetic or core matching.

### Critical rule

**The LLM must NOT be the source of truth for reconciliation calculations.**

### Checklist

- [ ] Match payment and settlement records deterministically.
- [ ] Normalize monetary values safely.
- [ ] Calculate expected settlement using explicit application rules.
- [ ] Compare expected vs actual settlement.
- [ ] Calculate difference.
- [ ] Classify result.
- [ ] Persist result.
- [ ] Generate exception records for unresolved mismatches.
- [ ] Track matched records.
- [ ] Track unmatched records.
- [ ] Track malformed records.
- [ ] Track missing data.
- [ ] Handle rounding consistently.
- [ ] Avoid floating-point money bugs.
- [ ] Make reconciliation repeatable/idempotent.

### Suggested output classifications

- [ ] `MATCHED`
- [ ] `AMOUNT_MISMATCH`
- [ ] `MISSING_SETTLEMENT`
- [ ] `MISSING_PAYMENT`
- [ ] `DATA_ERROR`
- [ ] `UNRESOLVED`

### Verification

- [ ] Known matching records match.
- [ ] Known mismatch records are detected.
- [ ] Expected/actual/difference values are correct.
- [ ] Results are persisted.
- [ ] Error cases do not crash the whole batch.
- [ ] Match rate can be calculated.

### Git checkpoint

- [ ] Commit: `feat: implement deterministic reconciliation engine`

---

# Phase 6 — LangChain.js Agent / Orchestration

**Status:** [ ]

### Goal

Use LangChain.js to orchestrate tools, retrieval, structured data, and Groq.

### Checklist

- [ ] Configure Groq through environment variables.
- [ ] Select and configure the intended Groq model.
- [ ] Configure LangChain.js.
- [ ] Build tools for retrieving structured transaction data.
- [ ] Build tools for retrieving settlement data.
- [ ] Build tools for retrieving reconciliation results.
- [ ] Build RAG retriever.
- [ ] Define system instructions.
- [ ] Require evidence-grounded answers.
- [ ] Require explicit uncertainty.
- [ ] Prevent fabricated transaction facts.
- [ ] Prevent the LLM from overriding deterministic reconciliation results.
- [ ] Define structured AI output schema.
- [ ] Validate model output.
- [ ] Handle malformed model output.
- [ ] Handle model/API failures.
- [ ] Handle retrieval failures.
- [ ] Log investigation/audit information safely.

### Expected orchestration

```text
Exception
   ↓
LangChain
   ├── Structured-data tools
   ├── RAG retriever
   └── Prompt / reasoning
           ↓
         Groq
           ↓
Structured investigation
```

### Verification

- [ ] Agent can investigate a known exception.
- [ ] Agent retrieves relevant official documentation.
- [ ] Agent uses actual database evidence.
- [ ] Agent does not invent missing values.
- [ ] Agent can return `UNRESOLVED`.
- [ ] Output passes schema validation.
- [ ] API/model failures are handled gracefully.

### Git checkpoint

- [ ] Commit: `feat: add langchain finance investigation agent`

---

# Phase 7 — AI Investigation API

**Status:** [ ]

### Goal

Expose the investigation workflow through clean Express.js APIs.

### Checklist

- [ ] Create reconciliation-run endpoint.
- [ ] Create exception-list endpoint.
- [ ] Create exception-detail endpoint.
- [ ] Create AI investigation endpoint.
- [ ] Validate request parameters.
- [ ] Authenticate/authorize appropriately.
- [ ] Validate ownership/access to records.
- [ ] Return consistent response structures.
- [ ] Return useful HTTP status codes.
- [ ] Handle service errors.
- [ ] Handle validation errors.
- [ ] Handle not-found errors.
- [ ] Avoid leaking API secrets.
- [ ] Avoid leaking internal stack traces to clients.

### Verification

- [ ] API can start a reconciliation run.
- [ ] API returns run results.
- [ ] API returns exceptions.
- [ ] API investigates an exception.
- [ ] API returns grounded structured AI output.

### Git checkpoint

- [ ] Commit: `feat: expose reconciliation and ai investigation APIs`

---

# Phase 8 — Dynamic Frontend / Dashboard

**Status:** [ ]

### Goal

Turn the dashboard into a real application rather than a static mockup.

### Critical requirement

**Do not hard-code dashboard metrics or fake AI responses.**

### Checklist

- [ ] Empty state for a new user.
- [ ] Upload state.
- [ ] Processing state.
- [ ] Results state.
- [ ] Error state.
- [ ] Reconciliation summary fetched from backend.
- [ ] Match rate displayed dynamically.
- [ ] Exception count displayed dynamically.
- [ ] Run history displayed dynamically.
- [ ] Exception list displayed dynamically.
- [ ] Exception details displayed dynamically.
- [ ] AI investigation action triggers backend.
- [ ] AI response displayed from actual API.
- [ ] RAG source citations displayed where available.
- [ ] Loading states implemented.
- [ ] Retry states implemented.
- [ ] API errors displayed clearly.
- [ ] Empty states are meaningful.
- [ ] Existing authentication UI remains intact unless explicitly required otherwise.

### Verification

- [ ] Fresh account shows empty dashboard.
- [ ] Uploading a dataset changes dashboard state.
- [ ] Reconciliation results appear from Supabase/API data.
- [ ] Exceptions are real records.
- [ ] Clicking investigation triggers real AI workflow.
- [ ] AI response is not hard-coded.
- [ ] Refreshing the page preserves persisted results.

### Git checkpoint

- [ ] Commit: `feat: connect dynamic finance dashboard`

---

# Phase 9 — End-to-End Integration

**Status:** [ ]

### Goal

Verify the complete system from upload to AI investigation.

### Full workflow

```text
User
 ↓
Login
 ↓
Dashboard
 ↓
Upload 50+ record dataset
 ↓
Express validation
 ↓
Supabase persistence
 ↓
Deterministic reconciliation
 ↓
Results + exceptions
 ↓
User selects exception
 ↓
LangChain investigation
 ↓
Structured DB tools
 +
RAG retrieval
 ↓
Groq
 ↓
Validated structured response
 ↓
Supabase audit record
 ↓
Frontend displays investigation + sources
```

### Checklist

- [ ] Authentication works.
- [ ] Upload works.
- [ ] Validation works.
- [ ] Database persistence works.
- [ ] Reconciliation works.
- [ ] Exceptions work.
- [ ] RAG retrieval works.
- [ ] LangChain orchestration works.
- [ ] Groq response works.
- [ ] Structured output validation works.
- [ ] Investigation is persisted.
- [ ] Dashboard updates from real data.
- [ ] Error paths work.

### Verification

- [ ] Complete happy path tested.
- [ ] Invalid file tested.
- [ ] Empty dataset tested.
- [ ] Duplicate records tested.
- [ ] Missing settlement tested.
- [ ] API failure tested.
- [ ] Embedding/retrieval failure tested.
- [ ] Groq failure tested.
- [ ] Database failure tested.
- [ ] Refresh/reload tested.

### Git checkpoint

- [ ] Commit: `feat: complete end to end finance controller flow`

---

# Phase 10 — Evaluation & Benchmarking

**Status:** [ ]

### Goal

Produce measurable evidence that the system works.

## A. Reconciliation evaluation

Create a known-answer dataset.

Track:

- [ ] total records
- [ ] expected matches
- [ ] expected exceptions
- [ ] correctly matched
- [ ] correctly detected exceptions
- [ ] false matches
- [ ] missed exceptions
- [ ] overall reconciliation accuracy
- [ ] processing time / throughput

## B. RAG evaluation

Create a dedicated evaluation file, for example:

```text
rag/
└── evaluation/
    └── rag-evaluation-set.md
```

Include 10–20+ questions with:

- [ ] question
- [ ] expected relevant source
- [ ] expected relevant section
- [ ] optional expected concepts
- [ ] retrieved top-k results
- [ ] pass/fail

Measure:

- [ ] Recall@k
- [ ] source relevance
- [ ] citation/source correctness
- [ ] retrieval failure cases

## C. AI investigation evaluation

Create known exception scenarios.

For each scenario verify:

- [ ] correct exception classification
- [ ] correct evidence
- [ ] correct use of RAG
- [ ] no hallucinated financial facts
- [ ] appropriate confidence
- [ ] appropriate recommendation
- [ ] correct `UNRESOLVED` behavior when evidence is insufficient

### Verification

- [ ] Evaluation results are reproducible.
- [ ] Results are documented.
- [ ] Weak cases are identified instead of hidden.

### Git checkpoint

- [ ] Commit: `test: add reconciliation rag and ai evaluation`

---

# Phase 11 — Error Handling, Security & Hardening

**Status:** [ ]

### Goal

Make the application robust enough for demonstration and real testing.

### Checklist

- [ ] Centralized backend error handling.
- [ ] Request validation.
- [ ] Upload validation.
- [ ] Authentication checks.
- [ ] Authorization checks.
- [ ] Secret protection.
- [ ] Rate-limit or abuse protection where appropriate.
- [ ] Safe logging.
- [ ] No sensitive secrets in logs.
- [ ] No secrets in frontend bundle.
- [ ] SQL/data access is constrained appropriately.
- [ ] RAG ingestion is protected from arbitrary untrusted content where applicable.
- [ ] Prompt injection considerations documented for RAG.
- [ ] LLM output is schema validated.
- [ ] External API failures have graceful fallbacks.
- [ ] Database failures have useful error messages.
- [ ] Long-running operations have appropriate handling.
- [ ] Duplicate submissions are handled safely.

### Verification

- [ ] Security review completed.
- [ ] Failure-path testing completed.
- [ ] No known critical secret exposure.

### Git checkpoint

- [ ] Commit: `chore: harden finance controller`

---

# Phase 12 — Final Demo & Documentation

**Status:** [ ]

### Goal

Prepare the project for an internship/buildathon-quality demonstration.

### Checklist

- [ ] README is complete.
- [ ] Architecture diagram is documented.
- [ ] Workflow is documented.
- [ ] RAG architecture is documented.
- [ ] Database schema is documented.
- [ ] API endpoints are documented.
- [ ] Environment variables are documented.
- [ ] Local setup instructions are complete.
- [ ] RAG ingestion instructions are complete.
- [ ] Dataset format is documented.
- [ ] Evaluation results are documented.
- [ ] Known limitations are documented.
- [ ] Demo dataset is prepared.
- [ ] Demo scenario is reproducible.
- [ ] No fake/static dashboard data remains.
- [ ] No fake AI response remains.
- [ ] No unnecessary development/debug UI remains.

### Demo sequence

```text
1. Login
2. Show empty dashboard
3. Upload 50+ record dataset
4. Start reconciliation
5. Show processing/result state
6. Show match rate
7. Show exceptions
8. Open a real exception
9. Trigger AI investigation
10. Show evidence from structured records
11. Show retrieved official Razorpay source
12. Show grounded AI explanation
13. Show unresolved behavior if applicable
14. Show audit/investigation history
```

### Git checkpoint

- [ ] Commit: `docs: prepare final project demonstration`

---

# Final Acceptance Checklist

The project should NOT be considered complete until these are true:

## Core finance workflow

- [ ] User can upload a valid 50+ record dataset.
- [ ] Records are validated.
- [ ] Records are persisted.
- [ ] Reconciliation runs automatically.
- [ ] Match rate is calculated.
- [ ] Exceptions are generated.
- [ ] Exceptions are persisted.
- [ ] User can inspect exceptions.

## RAG

- [ ] Official Razorpay sources are indexed.
- [ ] Embeddings are stored in pgvector.
- [ ] Retrieval works.
- [ ] Relevant sources are returned.
- [ ] Source metadata is preserved.
- [ ] RAG evaluation exists.

## AI

- [ ] LangChain.js orchestrates the investigation.
- [ ] Groq is used as the LLM.
- [ ] Structured database evidence is provided to the agent.
- [ ] RAG evidence is provided to the agent.
- [ ] AI output is schema validated.
- [ ] AI can explicitly return unresolved.
- [ ] AI cannot silently override deterministic reconciliation.

## Frontend

- [ ] Dashboard is dynamic.
- [ ] New users see an empty state.
- [ ] Results come from APIs/database.
- [ ] AI investigation comes from the real backend.
- [ ] Loading/error/empty states work.

## Engineering

- [ ] Secrets are protected.
- [ ] Migrations are safe.
- [ ] Errors are handled.
- [ ] Tests exist.
- [ ] Evaluation is measurable.
- [ ] Git history contains phase checkpoints.
- [ ] Deployment is not blocking local correctness.

---

# Coding-Agent Handoff Template

Use this whenever switching from Antigravity to another coding agent:

```text
Read these files first:

1. MASTER_BUILD_SPEC.md
2. PROGRESS_TRACKER.md

Do not start coding immediately.

First inspect the existing repository and identify:
- what is already implemented,
- what the current phase requires,
- what is already working,
- what database migrations already exist,
- what authentication/backend logic already exists.

Continue only from the current progress state.

Do not:
- rewrite working authentication,
- replace working backend logic unnecessarily,
- hard-code dashboard data,
- fake AI responses,
- bypass deterministic reconciliation,
- invent RAG sources,
- create destructive migrations,
- expose API secrets,
- add WebSockets unless a real requirement appears.

Before declaring the phase complete:
1. run the application,
2. run relevant tests,
3. test the error paths,
4. verify database changes,
5. verify the frontend uses real backend data,
6. update PROGRESS_TRACKER.md,
7. report exactly what was changed and what remains.
```

---

# Current Phase

**Active phase:** Phase 0 — Repository Inspection & Planning

**Next action:** Inspect the existing repository against `MASTER_BUILD_SPEC.md` before implementing anything.

**Last completed phase:** None

**Current blockers:** None recorded

**Last verified commit:** None

**Next coding agent:** Antigravity

---

# Change Log

| Date | Phase | Change | Agent | Status |
|---|---|---|---|---|
| 2026-08-28 | Initial | Created project phase tracker | — | [x] |

---

# Important Project Rules

1. **Master spec = requirements.**
2. **This tracker = implementation state.**
3. **Existing working code must be preserved unless a change is required.**
4. **Deterministic finance calculations must remain deterministic.**
5. **RAG provides domain knowledge; it is not the reconciliation engine.**
6. **Groq provides language reasoning; it is not being fine-tuned.**
7. **LangChain.js orchestrates tools, retrieval, prompts, and the model.**
8. **Supabase stores relational data and pgvector embeddings.**
9. **MongoDB is not part of the intended architecture.**
10. **WebSockets are not required for the initial workflow.**
11. **Never hard-code dashboard results.**
12. **Never fabricate AI output for a demo.**
13. **Never claim an exception is resolved without sufficient evidence.**
14. **When evidence is insufficient, return `UNRESOLVED`.**
15. **Every completed phase must be tested and committed.**
16. **Every coding agent must read this file before modifying the project.**
