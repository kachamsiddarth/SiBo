# AI Finance Controller — Master Build Specification & Coding Prompt

## 0. PURPOSE OF THIS FILE

This document is the master implementation specification for building the AI Finance Controller project.

Use this entire Markdown file as the primary prompt/specification for an AI coding agent such as Antigravity, and later use the same document as the project contract when continuing development with other coding agents such as Nemetron, Trae, Codex, or similar tools.

The coding agent must NOT treat this as a request to create a static UI mockup. The application must be a working end-to-end system with a functional frontend, backend, database, reconciliation engine, RAG pipeline, LangChain.js orchestration, Groq LLM integration, error handling, validation, persistence, and usable AI responses.

The primary goal is to build the project correctly and demonstrate the finance-operations workflow. Deployment is NOT the primary focus. Local development, correctness, architecture, reliability, explainability, and a polished working demo are the priorities.

---

# 1. PROJECT / PROBLEM STATEMENT

## 1.1 Project

Build an **AI Finance Controller** that closes one finance-operations loop using payment and settlement reconciliation.

The selected finance loop is:

    PAYMENT RECORD
          +
    SETTLEMENT RECORD
          |
          v
    RECONCILIATION ENGINE
          |
          +-------------------+
          |                   |
          v                   v
       MATCHED            EXCEPTION
                              |
                              v
                       AI INVESTIGATION
                              |
                 +------------+------------+
                 |                         |
                 v                         v
             SUPABASE                 RAG / PGVECTOR
          structured data           official knowledge
                 |                         |
                 +------------+------------+
                              |
                              v
                         LANGCHAIN.JS
                              |
                              v
                            GROQ
                              |
                              v
                    GROUNDED EXPLANATION
                    + RECOMMENDED ACTION

The system must process a synthetic batch containing at least 50 records. Preferably generate and test with 100–200 records so the system has enough realistic variety for demonstration.

The system must report:
- total records
- matched records
- exception records
- match rate
- exception categories
- AI-resolved/explained exceptions
- unresolved exceptions
- recommended manual-review actions

The application must be capable of explicitly saying that an exception is unresolved when the available evidence is insufficient. Never invent a financial explanation merely to produce an answer.

---

# 2. IMPORTANT ARCHITECTURAL DECISION: SUPABASE INSTEAD OF MONGODB

Do NOT introduce MongoDB.

Use **Supabase/PostgreSQL as the primary application database** and **Supabase pgvector as the vector database**.

Supabase will therefore support two distinct data responsibilities:

1. Structured operational data:
   - transactions
   - settlements
   - reconciliation runs
   - reconciliation results
   - exceptions
   - AI investigation records
   - optionally source/document records

2. Semantic knowledge:
   - document chunks
   - embeddings
   - source metadata
   - vector similarity retrieval

Conceptually:

    SUPABASE
       |
       +---------------------------+
       |                           |
       v                           v
   PostgreSQL                   pgvector
       |                           |
       v                           v
 transactions               document chunks
 settlements                embeddings
 exceptions                 metadata
 runs                       source information

Do not vectorize normal transaction records merely because RAG is being used. Transaction and settlement records should remain structured relational data and should be accessed through SQL/backend tools.

---

# 3. TECHNOLOGY STACK

Use JavaScript/TypeScript throughout unless there is a compelling reason otherwise.

## Frontend

- React
- Vite
- React Router
- a modern component/UI approach
- a charting library such as Recharts if charts are needed
- standard fetch or Axios for backend API calls
- responsive design

## Backend

- Node.js
- Express.js
- JavaScript or TypeScript
- REST APIs
- Zod or equivalent request validation
- Multer or equivalent for CSV upload if required
- CSV parsing library such as csv-parse/papaparse
- structured logging/error handling

## AI / Agent

- LangChain.js
- Groq
- a Groq-supported chat model selected from the currently available models
- LangChain tools
- LangChain retriever
- LangChain prompt templates / structured output where appropriate

## RAG

- official/authoritative finance documentation
- Markdown source files under `rag/sources/`
- an embedding model
- Supabase pgvector
- LangChain vector-store/retriever integration

Important: the Groq chat model and embedding model are separate concerns. Groq provides the reasoning/generation model; the embedding provider converts documents and queries into vectors.

## Database

- Supabase
- PostgreSQL
- pgvector
- SQL migrations
- Row Level Security where appropriate

## Do NOT introduce unless specifically justified

- MongoDB
- WebSockets
- microservices
- Kubernetes
- unnecessary queues
- unnecessary deployment infrastructure

The core project should remain understandable and maintainable.

---

# 4. REQUIRED EXTERNAL SERVICES / CREDENTIALS

The application should require as few external secrets as possible.

## Required

### 4.1 Supabase

One Supabase project.

Typical environment variables:

    SUPABASE_URL=
    SUPABASE_ANON_KEY=
    SUPABASE_SERVICE_ROLE_KEY=

Use the service role key ONLY on the trusted backend/server side. Never expose it to React or browser code.

If the frontend directly uses Supabase for authentication or safe public operations, only the anon/public key may be exposed according to Supabase security rules. Prefer keeping sensitive database operations behind Express.

### 4.2 Groq

One Groq API key.

    GROQ_API_KEY=

The selected Groq model must be configurable:

    GROQ_MODEL=

Do not hardcode a model name that may become unavailable. Put it in environment configuration and document where to change it.

## Required embedding provider

Choose an embedding model/provider that is compatible with the selected LangChain.js integration and Supabase pgvector.

Examples may include a supported Hugging Face embedding model or another suitable embedding API. The exact provider must be selected based on current availability, cost, local/runtime requirements, and compatibility.

Environment variables should be added only if the chosen embedding provider needs them, for example:

    HUGGINGFACE_API_KEY=

Do not assume Groq provides the embeddings unless the currently selected Groq service/model explicitly supports the embedding requirement.

## Optional

Razorpay API credentials are NOT required for the initial build if the Buildathon workflow is based on synthetic records and official public documentation.

Do not introduce real merchant/payment credentials just to make the demo look more realistic.

If real Razorpay APIs are added later, isolate them behind a service and make them optional.

---

# 5. AUTHORITATIVE KNOWLEDGE / RAG SOURCES

The initial RAG knowledge base should be based on official Razorpay documentation relevant to the selected Payments settlement/reconciliation workflow.

Initial source topics:

1. About Settlements
2. Settlement Dashboard / Settlement Breakup
3. Settlement APIs
4. Settlement API Reference
5. Settlement FAQs
6. Settlement Details

Use official Razorpay documentation URLs as the source of truth.

Important:
- Do not blindly ingest unrelated documentation.
- Do not mix unrelated Razorpay products such as POS rules into the Payments knowledge base unless the application explicitly models that product.
- Preserve source metadata.
- Where rules differ by product, country, or context, preserve that context.
- Do not make unsupported financial claims.
- Do not create fake rules and label them as Razorpay rules.
- Keep the source URL and section/title metadata for traceability.

The source Markdown files should live under:

    rag/
      sources/
        01-about-settlements.md
        02-settlement-breakup.md
        03-settlement-apis.md
        04-settlement-api-reference.md
        05-settlement-faqs.md
        06-settlement-details.md

These files are curated source representations, not generated vectors.

Do not copy entire copyrighted pages unnecessarily. Keep only the portions needed for the application's knowledge requirements, with source attribution/URL metadata.

---

# 6. RAG CONCEPT — EXACTLY WHAT SHOULD HAPPEN

RAG is an external knowledge retrieval system, not model fine-tuning.

The pipeline must be:

    OFFICIAL DOCUMENTATION
             |
             v
       LOAD DOCUMENT
             |
             v
        CLEAN TEXT
             |
             v
          CHUNK
             |
             v
      EMBEDDING MODEL
             |
             v
     VECTOR EMBEDDING
             |
             v
       SUPABASE PGVECTOR

At query time:

    USER QUESTION / EXCEPTION
             |
             v
       EMBEDDING MODEL
             |
             v
       QUERY VECTOR
             |
             v
       PGVECTOR SEARCH
             |
             v
    RELEVANT DOCUMENT CHUNKS
             |
             v
       LANGCHAIN CONTEXT
             |
             v
          GROQ LLM

The vector database does not permanently teach Groq anything.

Instead, relevant source material is retrieved at runtime and supplied to Groq as context.

---

# 7. DOCUMENT METADATA REQUIREMENTS

Every indexed document chunk must preserve useful metadata.

Recommended metadata:

    {
      source: "Razorpay",
      title: "Settlement Breakup",
      section: "Fees",
      product: "Payments",
      country: "IN",
      sourceUrl: "...",
      documentId: "...",
      chunkIndex: 12,
      retrievedAt: "..."
    }

The exact metadata schema may be adjusted, but source traceability must remain.

The UI should eventually be able to show the source used for an AI explanation.

Example:

    Source used
    Razorpay — Settlement Breakup
    Section: Fees

    [View Source]

Do not show an unsupported source link. The URL should come from stored source metadata.

---

# 8. SYNTHETIC DATASET

The project must use synthetic payment and settlement records.

Target:
- minimum: 50 records
- recommended: 100–200 records

The dataset should be deliberately constructed to contain both normal and problematic cases.

Suggested categories:

1. MATCHED
2. AMOUNT_MISMATCH
3. MISSING_SETTLEMENT
4. DUPLICATE_TRANSACTION
5. COMPONENT_MISMATCH
6. UNEXPLAINED_DIFFERENCE

The dataset should be deterministic/reproducible where possible.

Provide a seed or fixed fixture so the same dataset can be regenerated for demos and evaluation.

Example payment record:

    {
      "transactionId": "TXN042",
      "paymentAmount": 10000,
      "paymentDate": "...",
      "paymentMethod": "UPI",
      "status": "captured"
    }

Example settlement record:

    {
      "settlementId": "STL042",
      "transactionId": "TXN042",
      "paymentAmount": 10000,
      "fee": 200,
      "tax": 50,
      "adjustment": 0,
      "refund": 0,
      "settlementAmount": 9750,
      "settlementDate": "..."
    }

The exact fields must be based on the selected documented concepts and clearly labeled as synthetic.

Do not claim synthetic fields are official Razorpay API fields unless verified.

---

# 9. RECONCILIATION ENGINE

This is a deterministic business-logic component.

The LLM must NOT be responsible for basic financial arithmetic.

The reconciliation engine should:

1. validate input records
2. identify transaction IDs
3. find corresponding settlement records
4. detect duplicates
5. calculate expected settlement according to the application's explicitly defined synthetic reconciliation rules
6. compare expected and actual values
7. classify the result
8. record an evidence trail
9. create exception records when needed

Conceptual flow:

    PAYMENT
       |
       v
    FIND SETTLEMENT
       |
       +---- NOT FOUND ----> MISSING_SETTLEMENT
       |
       v
    CHECK DUPLICATES
       |
       +---- DUPLICATE ----> DUPLICATE_TRANSACTION
       |
       v
    CALCULATE EXPECTED
       |
       v
    COMPARE ACTUAL
       |
       +---- EQUAL -------> MATCHED
       |
       +---- DIFFERENT ---> EXCEPTION
                                  |
                                  v
                         AI INVESTIGATION

The calculation rules must be explicit and deterministic.

If the synthetic model uses:

    expectedSettlement =
        paymentAmount
        - fee
        - tax
        - refund
        + adjustment

then implement that calculation in JavaScript and store the intermediate values.

Do not let the LLM invent the expected settlement amount.

---

# 10. AI AGENT RESPONSIBILITY

The AI agent is NOT the accounting system.

The agent's responsibility is to:

- inspect verified reconciliation results
- retrieve relevant structured records through tools
- retrieve relevant authoritative documentation through RAG
- reason over the available evidence
- explain why an exception occurred when supported
- recommend a next action
- clearly identify uncertainty
- return structured output

The agent must not:
- invent transactions
- invent settlement records
- invent fees
- invent policies
- override deterministic reconciliation results
- claim that an exception is resolved without evidence
- provide unsupported legal/tax advice

---

# 11. LANGCHAIN.JS ORCHESTRATION

Use LangChain.js as the orchestration layer.

Conceptually:

    USER
      |
      v
    EXPRESS
      |
      v
    LANGCHAIN FINANCE AGENT
      |
      +-------------------+
      |                   |
      v                   v
    TOOLS                RAG
      |                   |
      v                   v
  SUPABASE SQL       PGVECTOR
      |                   |
      +---------+---------+
                |
                v
              GROQ
                |
                v
       STRUCTURED RESPONSE

The agent should have tools such as:

- getTransaction
- getSettlement
- calculateExpectedSettlement
- getReconciliationResult
- getException
- searchFinanceKnowledge

Additional tools can be added only when useful.

The tool definitions must have clear descriptions so the agent understands when to call them.

---

# 12. RECOMMENDED AI INVESTIGATION FLOW

When a user opens an exception:

    Exception ID
         |
         v
    Load exception
         |
         v
    Load transaction
         |
         v
    Load settlement
         |
         v
    Load deterministic reconciliation evidence
         |
         v
    Search relevant settlement documentation
         |
         v
    Provide evidence + retrieved knowledge to Groq
         |
         v
    Generate structured investigation
         |
         v
    Store investigation
         |
         v
    Display explanation + sources + recommendation

Example structured result:

    {
      "status": "UNRESOLVED",
      "summary": "The settlement amount does not reconcile...",
      "evidence": [
        "Expected settlement: 9750",
        "Actual settlement: 9500",
        "No corresponding adjustment was recorded"
      ],
      "reasoning": "The available records do not provide evidence...",
      "recommendedAction": "Review the settlement adjustment details",
      "confidence": "medium",
      "sources": [
        {
          "title": "Settlement Breakup",
          "section": "Adjustments",
          "url": "..."
        }
      ]
    }

The exact structured schema can be improved, but it must be predictable enough for React to render safely.

---

# 13. FRONTEND REQUIREMENTS

The frontend must be functional, not static.

The UI must fetch real data from the backend and react to database/API results.

Do NOT create pages where all metrics and rows are hardcoded.

## Page 1 — Dashboard

Display live values from the backend:

- total records
- matched records
- exceptions
- match rate
- AI-resolved/explained exceptions
- unresolved exceptions
- exception distribution
- recent reconciliation runs

The dashboard for a new user/run with no data must show a genuine empty state rather than fake metrics.

Example:

    No reconciliation runs yet.

    Upload a payment and settlement dataset
    to start your first reconciliation.

The values should update after a successful run.

---

# 14. PAGE 2 — RECONCILIATION / UPLOAD

Provide a working upload workflow.

Example:

    Payment Dataset
    [ Choose CSV ]

    Settlement Dataset
    [ Choose CSV ]

    [ Validate Dataset ]
    [ Start Reconciliation ]

After validation, display:

    Payment records: 100
    Settlement records: 100
    Schema: Valid
    Duplicate IDs: 2
    Missing required fields: 0

Do not allow the run to proceed when validation fails.

Show useful validation errors.

---

# 15. PAGE 3 — RESULTS

Display actual reconciliation results retrieved from the backend.

Columns can include:

- transaction ID
- payment amount
- settlement amount
- expected amount
- difference
- status
- exception type
- timestamp

Support filtering/searching:

    All
    Matched
    Exceptions

Clicking a row should navigate to a meaningful detail view.

---

# 16. PAGE 4 — EXCEPTIONS

Show actual unresolved/exception records.

Example categories:

    Amount mismatch
    Missing settlement
    Duplicate
    Component mismatch
    Unexplained

Each exception should have:

- ID
- transaction ID
- category
- difference
- current status
- AI investigation state

The page must load from the backend, not from static arrays.

---

# 17. PAGE 5 — EXCEPTION DETAIL / AI INVESTIGATION

This should be one of the strongest pages in the application.

Display:

    Transaction details
    Settlement details
    Reconciliation calculation
    Exception reason
    AI investigation
    Recommended action
    Sources used

The user should be able to click something like:

    [ Investigate with AI ]

The backend then executes the LangChain/RAG/Groq workflow.

While waiting, show a loading state such as:

    AI is investigating this exception...

Do not require WebSockets for the initial version.

A normal HTTP request + loading state is sufficient.

If the investigation becomes long-running later, consider SSE or another streaming approach, but do not add it prematurely.

---

# 18. PAGE 6 — KNOWLEDGE BASE

Display actual indexed knowledge information.

Examples:

    Documents: 6
    Chunks: 300+
    Embeddings: indexed

Show source list:

    Razorpay — About Settlements
    Razorpay — Settlement Breakup
    Razorpay — Settlement APIs
    Razorpay — Settlement API Reference
    Razorpay — Settlement FAQs
    Razorpay — Settlement Details

If possible, show:
- section
- number of chunks
- last indexed timestamp
- source URL

Do not fake these values.

---

# 19. PAGE 7 — HISTORY

Display actual previous reconciliation runs:

    Date
    Records
    Match Rate
    Exceptions
    Unresolved

Clicking a run should display its saved results.

This demonstrates that the application is persistent rather than a one-time static demo.

---

# 20. EMPTY STATES

Every data-driven page must handle the zero-data state.

Examples:

Dashboard:

    No reconciliation data yet.

Results:

    No reconciliation results available.
    Run a reconciliation to see results.

Exceptions:

    No exceptions found.

History:

    No reconciliation runs yet.

Knowledge Base:

    Knowledge base has not been indexed yet.

Never populate empty pages with fake numbers.

---

# 21. ERROR HANDLING

Error handling is a major requirement.

Implement errors at:

1. frontend
2. API
3. database
4. CSV parsing
5. validation
6. RAG ingestion
7. embeddings
8. vector search
9. Groq calls
10. LangChain tool calls

The backend should use a centralized error handler.

Errors should have useful messages but must not expose:
- API keys
- service-role credentials
- database secrets
- stack traces in production-like responses

Example API error:

    {
      "success": false,
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "Settlement CSV is missing transactionId"
      }
    }

The frontend should display friendly messages and preserve the user's context where possible.

---

# 22. API DESIGN

Create clean REST endpoints.

Suggested API:

    POST   /api/reconciliation/validate
    POST   /api/reconciliation/run
    GET    /api/reconciliation/runs
    GET    /api/reconciliation/runs/:runId
    GET    /api/reconciliation/results/:runId

    GET    /api/exceptions
    GET    /api/exceptions/:exceptionId

    POST   /api/ai/investigate/:exceptionId

    GET    /api/dashboard/summary

    GET    /api/knowledge/documents
    GET    /api/knowledge/stats

Health:

    GET    /api/health

The exact route organization may change, but keep the API coherent and RESTful.

---

# 23. DATABASE SCHEMA

Use Supabase/PostgreSQL.

Recommended tables:

## users

Only if authentication is actually implemented.

## transactions

Suggested columns:

    id
    transaction_id
    amount
    payment_method
    status
    transaction_date
    metadata
    created_at

## settlements

Suggested columns:

    id
    settlement_id
    transaction_id
    payment_amount
    fee
    tax
    adjustment
    refund
    settlement_amount
    settlement_date
    metadata
    created_at

## reconciliation_runs

Suggested columns:

    id
    status
    total_records
    matched_count
    exception_count
    match_rate
    started_at
    completed_at
    error_message
    created_at

## reconciliation_results

Suggested columns:

    id
    run_id
    transaction_id
    expected_amount
    actual_amount
    difference
    status
    exception_type
    evidence
    created_at

## exceptions

Suggested columns:

    id
    run_id
    transaction_id
    exception_type
    severity
    status
    difference
    evidence
    created_at
    resolved_at

## ai_investigations

Suggested columns:

    id
    exception_id
    status
    summary
    reasoning
    recommended_action
    confidence
    sources
    model
    created_at

## rag_documents / documents

Store document metadata if useful.

## document_chunks

Suggested:

    id
    document_id
    content
    embedding
    metadata
    chunk_index
    created_at

The exact vector dimension depends on the selected embedding model. Do NOT hardcode the dimension until the embedding model is chosen.

---

# 24. SUPABASE PGVECTOR

Enable the pgvector extension using a migration.

Do not manually edit production-like database state in an uncontrolled way.

The migration should create the extension and vector table/indexes in a repeatable manner.

Use similarity search through a PostgreSQL function/RPC or a supported LangChain Supabase vector-store integration.

The vector search function should accept:
- query embedding
- match count
- optional similarity threshold
- optional metadata filtering if implemented

Do not mix structured SQL queries and vector similarity queries into one confusing abstraction.

---

# 25. MIGRATION SAFETY

Migration discipline is mandatory.

Before creating or changing tables:

1. inspect the existing Supabase schema
2. do not delete existing tables
3. do not drop columns without explicit justification
4. create additive migrations where possible
5. keep migrations numbered
6. make migrations safe to run in order
7. avoid destructive reset commands against the real development database
8. document any required manual Supabase steps
9. verify foreign keys and indexes
10. verify RLS policies

If the project already contains Supabase migrations, preserve them.

Do NOT run a reset merely to make the new code work.

If a schema conflict exists:
- inspect it
- explain it
- create a compatible migration
- preserve existing data unless the user explicitly approves destructive behavior

---

# 26. SECURITY

Never commit:

    .env
    API keys
    Supabase service-role key
    Groq API key

Use:

    .env.example

Example:

    SUPABASE_URL=
    SUPABASE_ANON_KEY=
    SUPABASE_SERVICE_ROLE_KEY=
    GROQ_API_KEY=
    GROQ_MODEL=
    EMBEDDING_PROVIDER=
    EMBEDDING_API_KEY=
    PORT=5000

The frontend must never receive secret backend credentials.

---

# 27. PROJECT FOLDER STRUCTURE

Use this as the target structure, adjusting only when implementation needs justify a change:

    ai-finance-controller/
    |
    +-- frontend/
    |   +-- public/
    |   +-- src/
    |       +-- assets/
    |       +-- components/
    |       |   +-- dashboard/
    |       |   +-- reconciliation/
    |       |   +-- exceptions/
    |       |   +-- ai-investigation/
    |       |   +-- common/
    |       +-- pages/
    |       |   +-- Dashboard.jsx
    |       |   +-- Reconciliation.jsx
    |       |   +-- Results.jsx
    |       |   +-- Exceptions.jsx
    |       |   +-- ExceptionDetails.jsx
    |       |   +-- KnowledgeBase.jsx
    |       |   +-- History.jsx
    |       +-- services/
    |       |   +-- api.js
    |       +-- hooks/
    |       +-- context/
    |       +-- utils/
    |       +-- App.jsx
    |       +-- main.jsx
    |   +-- package.json
    |   +-- .env.example
    |
    +-- backend/
    |   +-- src/
    |       +-- config/
    |       |   +-- supabase.js
    |       |   +-- env.js
    |       +-- routes/
    |       |   +-- reconciliation.routes.js
    |       |   +-- exception.routes.js
    |       |   +-- ai.routes.js
    |       |   +-- knowledge.routes.js
    |       |   +-- dashboard.routes.js
    |       +-- controllers/
    |       +-- services/
    |       +-- reconciliation/
    |       |   +-- matcher.js
    |       |   +-- rules.js
    |       |   +-- calculator.js
    |       |   +-- exceptionDetector.js
    |       +-- agents/
    |       |   +-- financeAgent.js
    |       |   +-- agentPrompt.js
    |       |   +-- agentState.js
    |       +-- tools/
    |       |   +-- transactionTool.js
    |       |   +-- settlementTool.js
    |       |   +-- reconciliationTool.js
    |       |   +-- exceptionTool.js
    |       |   +-- financeKnowledgeTool.js
    |       +-- rag/
    |       |   +-- embeddings.js
    |       |   +-- vectorStore.js
    |       |   +-- retriever.js
    |       |   +-- documentLoader.js
    |       |   +-- ragChain.js
    |       +-- middleware/
    |       |   +-- errorHandler.js
    |       |   +-- validation.js
    |       +-- utils/
    |       +-- app.js
    |       +-- server.js
    |   +-- package.json
    |   +-- .env.example
    |
    +-- rag/
    |   +-- sources/
    |       +-- 01-about-settlements.md
    |       +-- 02-settlement-breakup.md
    |       +-- 03-settlement-apis.md
    |       +-- 04-settlement-api-reference.md
    |       +-- 05-settlement-faqs.md
    |       +-- 06-settlement-details.md
    |   +-- ingest/
    |       +-- loadDocuments.js
    |       +-- splitDocuments.js
    |       +-- generateEmbeddings.js
    |       +-- ingest.js
    |   +-- README.md
    |
    +-- data/
    |   +-- synthetic/
    |       +-- payments.csv
    |       +-- settlements.csv
    |       +-- expected-results.json
    |   +-- schemas/
    |       +-- payment.schema.json
    |       +-- settlement.schema.json
    |
    +-- supabase/
    |   +-- migrations/
    |       +-- 001_initial_schema.sql
    |       +-- 002_vector_store.sql
    |       +-- 003_rls.sql
    |   +-- seed/
    |       +-- seed.sql
    |   +-- config.toml
    |
    +-- docs/
    |   +-- architecture.md
    |   +-- rag.md
    |   +-- reconciliation.md
    |   +-- api.md
    |   +-- evaluation.md
    |
    +-- .gitignore
    +-- .env.example
    +-- README.md

Do not create every folder blindly. Create files as their implementation becomes necessary while preserving the architectural boundaries.

---

# 28. PACKAGE / DEPENDENCY REQUIREMENTS

The coding agent must install only dependencies actually required.

Typical backend dependencies:

    express
    cors
    dotenv
    zod
    @supabase/supabase-js
    langchain
    @langchain/core
    @langchain/groq
    @langchain/community
    a compatible embedding package
    csv-parse or equivalent
    multer if using multipart CSV upload

Potential frontend:

    react
    react-dom
    react-router-dom
    axios or native fetch
    recharts if charts are used

Development:

    nodemon
    eslint
    prettier
    testing framework if appropriate

Important:
- Verify current package names before installation.
- Do not install obsolete LangChain packages just because an old tutorial uses them.
- Keep LangChain imports compatible with the currently installed versions.
- Avoid installing multiple overlapping packages for the same job.

---

# 29. ENVIRONMENT SETUP

Create:

    backend/.env.example
    frontend/.env.example

Backend example:

    PORT=5000
    SUPABASE_URL=
    SUPABASE_ANON_KEY=
    SUPABASE_SERVICE_ROLE_KEY=
    GROQ_API_KEY=
    GROQ_MODEL=
    EMBEDDING_PROVIDER=
    EMBEDDING_API_KEY=

Frontend should contain only values safe for browser exposure, if any.

Never put GROQ_API_KEY or SUPABASE_SERVICE_ROLE_KEY in frontend environment variables.

---

# 30. DEVELOPMENT PHASES

The implementation must be performed in phases.

Do NOT attempt to build everything in one uncontrolled generation.

## PHASE 1 — Inspect Existing Project

Before changing code:

- inspect the repository
- identify existing frontend/backend
- identify current package versions
- inspect existing Supabase setup
- inspect existing authentication if present
- inspect existing routes/components
- inspect existing migrations
- identify what already works

Do not overwrite working code unnecessarily.

If authentication already exists, preserve it.

Do not alter backend/authentication logic unless required for integration.

---

## PHASE 2 — Establish Project Architecture

Create the clean frontend/backend structure.

Set up:
- Express
- React/Vite if not already present
- environment handling
- API base URL
- centralized error handling
- basic health endpoint

Verify:

    GET /api/health

returns a real success response.

---

## PHASE 3 — Supabase Database

Create migrations carefully.

Implement:
- transactions
- settlements
- reconciliation_runs
- reconciliation_results
- exceptions
- ai_investigations

Then implement pgvector/document tables.

Run migrations safely.

Verify inserts, reads, foreign keys, and indexes.

Do not proceed until the database works.

---

## PHASE 4 — Synthetic Dataset

Generate 100–200 deterministic synthetic records.

Include realistic categories:
- matched
- missing settlement
- amount mismatch
- duplicate
- component mismatch
- unexplained difference

Create an expected-results fixture for testing.

Seed/import the data into Supabase.

Verify that the backend can query it.

---

## PHASE 5 — Deterministic Reconciliation Engine

Implement and test reconciliation independently of AI.

Input:

    payments + settlements

Output:

    reconciliation run
    results
    exceptions
    metrics

Unit test:
- normal match
- missing settlement
- duplicate
- fee/tax/component difference
- unexplained difference
- malformed records

The engine must be correct before adding the LLM.

---

## PHASE 6 — RAG INGESTION

Add the six curated official source Markdown files under:

    rag/sources/

Implement:

    loadDocuments.js
    splitDocuments.js
    generateEmbeddings.js
    ingest.js

The ingestion pipeline must:
- load Markdown
- preserve metadata
- split into meaningful chunks
- create embeddings
- store chunks + embeddings in Supabase pgvector
- be safely re-runnable

Avoid duplicate ingestion.

Use a stable document/chunk identity or an upsert strategy.

Log:

    documents loaded
    chunks created
    embeddings generated
    rows inserted/updated

---

## PHASE 7 — RAG RETRIEVAL

Implement a retriever.

Test with questions such as:

    What is a settlement?

    What can affect settlement amount?

    What information is present in a settlement breakup?

    What is settlement reconciliation?

The retriever must return relevant chunks.

For debugging, provide a development-only way to inspect:
- retrieved chunk text
- source
- section
- similarity score if available

---

## PHASE 8 — LangChain + Groq

Connect Groq through LangChain.js.

Create:
- system prompt
- finance agent
- tools
- retriever
- structured response schema

Test simple questions first.

Then test exception investigation.

Do not start with a complicated autonomous agent if a simple tool-using workflow is sufficient.

---

## PHASE 9 — AI INVESTIGATION

Implement:

    POST /api/ai/investigate/:exceptionId

The backend should:
1. load exception
2. load transaction
3. load settlement
4. load reconciliation evidence
5. retrieve relevant official knowledge
6. provide all verified context to Groq
7. generate structured investigation
8. validate the response
9. save it
10. return it to frontend

If the model fails:
- return a controlled error
- do not lose the original exception
- do not mark the exception resolved

---

## PHASE 10 — Functional Frontend

Connect all pages to actual APIs.

Do not use hardcoded data for:
- dashboard numbers
- transaction rows
- exceptions
- history
- AI responses
- knowledge-base counts

Use loading, error, and empty states.

Make the UI responsive.

---

## PHASE 11 — Evaluation

Run the full 100–200 record dataset.

Report:

    Total records
    Matched
    Exceptions
    Match rate
    Exception categories
    AI explained/resolved
    Unresolved

Keep deterministic reconciliation metrics separate from AI investigation metrics.

Do not inflate the match rate by letting the LLM override reconciliation results.

Create an evaluation document describing:
- test dataset
- expected outcomes
- actual outcomes
- known limitations

---

## PHASE 12 — Polish

Only after correctness:

- improve UI
- add charts
- add source citations
- improve error messages
- improve loading states
- improve AI response formatting
- improve empty states
- add audit trail
- add tests
- clean logs
- improve README

Deployment is secondary.

---

# 31. TESTING REQUIREMENTS

The project should have tests for critical logic.

At minimum test:

### Reconciliation

    matched record
    missing settlement
    duplicate transaction
    amount mismatch
    component mismatch
    malformed data

### RAG

    documents load
    chunks created
    embeddings generated
    vector search returns relevant source

### API

    successful reconciliation
    invalid upload
    nonexistent exception
    AI investigation failure

### AI

The AI should be tested for:
- grounded answers
- source inclusion
- uncertainty handling
- refusal to invent evidence

---

# 32. AI RESPONSE SAFETY / GROUNDING

The system prompt should strongly instruct the model:

- Use only supplied transaction/settlement evidence.
- Use retrieved official documentation for policy/domain claims.
- Never invent a fee, tax, adjustment, refund, settlement state, or transaction.
- Never fabricate a source.
- If evidence is insufficient, return UNRESOLVED.
- Distinguish documented facts from inference.
- Do not override deterministic reconciliation calculations.
- Do not provide legal/tax advice beyond the retrieved source.
- Mention when additional records are required.

The response should distinguish:

    VERIFIED FACTS
    RETRIEVED KNOWLEDGE
    INFERENCE
    RECOMMENDED ACTION
    UNRESOLVED ITEMS

This is especially important because the domain is finance.

---

# 33. SOURCE CITATIONS IN AI RESPONSES

The AI investigation should preserve source references.

Example:

    Sources:
    - Razorpay — Settlement Breakup
      Section: Settlement Amount
      URL: official Razorpay documentation URL

The source must be retrieved from metadata, not invented by the model.

The model should ideally return source IDs/references rather than arbitrary URLs, and the backend can map them to stored metadata.

---

# 34. NO STATIC BEHAVIOR

This instruction is critical.

Do NOT:

- hardcode dashboard metrics
- hardcode transaction rows
- hardcode exception explanations
- hardcode an AI answer
- create buttons that do nothing
- make "Investigate with AI" only change UI text
- show fake RAG counts
- show fake source documents
- use static arrays where an API/database query is required

Every major interaction must cause a real operation.

Examples:

    Upload CSV
        -> backend receives file
        -> validates
        -> parses
        -> stores/uses records
        -> reconciliation runs
        -> database is updated
        -> dashboard reflects actual results

    Investigate
        -> backend loads exception
        -> tools retrieve data
        -> RAG retrieves sources
        -> Groq generates result
        -> result is persisted
        -> UI renders returned result

---

# 35. NO WEBSOCKETS FOR INITIAL VERSION

Use standard HTTP REST requests.

The application does not require real-time client updates for the core workflow.

Use loading states for:
- reconciliation
- AI investigation
- RAG indexing

Only introduce SSE/WebSockets later if a real UX requirement appears.

Do not add WebSockets merely to make the architecture look advanced.

---

# 36. AUTHENTICATION

If the existing project already contains authentication:
- preserve it
- do not replace it
- do not break it
- scope user-specific data appropriately

If authentication does not exist, do not make it the first priority unless required by the existing project/Buildathon.

The core finance workflow is more important.

If user-specific persistence is added, use Supabase auth/RLS appropriately.

---

# 37. LOGGING / DEBUGGING

Implement structured development logging around:

- reconciliation run ID
- exception ID
- AI investigation ID
- RAG retrieval count
- source names
- tool calls
- Groq failures
- database failures

Never log secrets.

Useful development log:

    [RAG] query="settlement breakup"
    [RAG] retrieved=4
    [RAG] sources=Settlement Breakup, About Settlements

Do not log entire sensitive payloads unnecessarily.

---

# 38. API RESPONSE CONVENTION

Use a consistent structure.

Success:

    {
      "success": true,
      "data": { ... }
    }

Failure:

    {
      "success": false,
      "error": {
        "code": "...",
        "message": "..."
      }
    }

Keep this consistent across endpoints.

---

# 39. DASHBOARD METRICS

Dashboard calculations should be derived from stored reconciliation results.

Example:

    total = 100
    matched = 78
    exceptions = 22

    matchRate = matched / total * 100

Store the run summary for history, but avoid inconsistent duplicate calculations.

If the backend is the source of truth, frontend should display backend-provided metrics.

---

# 40. USER EXPERIENCE FLOW

The intended user flow is:

    LOGIN / LANDING
          |
          v
      DASHBOARD
          |
          v
      RECONCILE
          |
          v
   Upload payment CSV
   Upload settlement CSV
          |
          v
      VALIDATION
          |
          v
   START RECONCILIATION
          |
          v
      RESULTS
          |
          +----------------+
          |                |
          v                v
       MATCHED         EXCEPTIONS
                            |
                            v
                    OPEN EXCEPTION
                            |
                            v
                     INVESTIGATE
                            |
                            v
                     LANGCHAIN AGENT
                            |
                +-----------+-----------+
                |                       |
                v                       v
             SUPABASE                 RAG
             TOOLS                 PGVECTOR
                |                       |
                +-----------+-----------+
                            |
                            v
                          GROQ
                            |
                            v
                   AI INVESTIGATION
                            |
                +-----------+-----------+
                |                       |
                v                       v
             RESOLVED              UNRESOLVED
                |                       |
                v                       v
          Recommendation          Manual Review

The user should always be able to understand:
- what happened
- why it happened
- what evidence was used
- what the AI knows
- what remains uncertain
- what action is recommended

---

# 41. ARCHITECTURE MAP

    +------------------------------------------------------------+
    |                        REACT FRONTEND                      |
    |                                                            |
    | Dashboard | Reconciliation | Results | Exceptions         |
    | AI Investigation | Knowledge Base | History              |
    +-----------------------------+------------------------------+
                                  |
                                  | REST/HTTP
                                  v
    +------------------------------------------------------------+
    |                      EXPRESS.JS BACKEND                   |
    |                                                            |
    | Routes -> Controllers -> Services                          |
    |                                                            |
    | Reconciliation Engine                                      |
    | LangChain Finance Agent                                    |
    | RAG Retriever                                              |
    | AI Investigation                                           |
    +-------------------+-------------------+--------------------+
                        |                   |
                        |                   |
                        v                   v
              +----------------+     +----------------+
              | SUPABASE       |     | GROQ           |
              | PostgreSQL     |     | LLM            |
              | + pgvector     |     +----------------+
              +--------+-------+
                       |
            +----------+----------+
            |                     |
            v                     v
      Structured Data       Vector Knowledge
      transactions          document chunks
      settlements           embeddings
      exceptions            metadata
      runs

---

# 42. DATA FLOW MAP

    Synthetic CSV
        |
        v
    Validation
        |
        v
    Parser
        |
        v
    Supabase
        |
        v
    Reconciliation Engine
        |
        +--------------------+
        |                    |
        v                    v
    MATCHED              EXCEPTION
                             |
                             v
                       AI Investigation
                             |
                +------------+------------+
                |                         |
                v                         v
          Structured Tools              RAG
                |                         |
                v                         v
           Supabase SQL              pgvector
                |                         |
                +------------+------------+
                             |
                             v
                           Groq
                             |
                             v
                    Structured AI Result
                             |
                             v
                         Supabase
                             |
                             v
                          React

---

# 43. RAG DATA FLOW MAP

    Official Razorpay Docs
              |
              v
       Curated Markdown
              |
              v
       LangChain Loader
              |
              v
       Text Splitter
              |
              v
       Embedding Model
              |
              v
        Vector Embedding
              |
              v
       Supabase pgvector
              |
              |
      USER / AGENT QUERY
              |
              v
       Query Embedding
              |
              v
       Similarity Search
              |
              v
      Top Relevant Chunks
              |
              v
        LangChain Agent
              |
              v
             Groq

---

# 44. WHY THIS ARCHITECTURE

This architecture deliberately separates responsibilities.

### React
Responsible for presentation and user interaction.

### Express
Responsible for API boundaries, security, validation, and orchestration of application services.

### Supabase PostgreSQL
Responsible for structured financial/application records.

### pgvector
Responsible for semantic retrieval of external/domain knowledge.

### Reconciliation Engine
Responsible for deterministic financial calculations and classification.

### LangChain.js
Responsible for AI orchestration, tool calling, retrieval, and prompt/context management.

### Groq
Responsible for language-model reasoning/generation.

### RAG
Provides current/retrieved domain knowledge without modifying model weights.

This separation makes the system easier to test and explain.

---

# 45. IMPORTANT: RAG IS NOT FINE-TUNING

Do not describe this system as fine-tuning Groq.

Correct description:

    Groq = LLM
    LangChain = orchestration
    RAG = retrieval
    pgvector = vector storage/search
    Embedding model = converts text to vectors
    Supabase PostgreSQL = structured application data
    Reconciliation engine = deterministic financial logic

The model is not retrained by adding documents to the vector database.

---

# 46. WHAT TO ASK THE CODING AGENT TO DO FIRST

When using Antigravity for the first implementation, do NOT ask it to generate the entire project blindly in one pass.

Start with this instruction:

"Read the attached/master project specification completely. First inspect the existing repository and report:
1. current folder structure
2. current frontend stack
3. current backend stack
4. existing Supabase setup
5. existing migrations
6. existing authentication
7. existing API routes
8. existing environment variables (names only, never values)
9. reusable components/services
10. conflicts with this specification.

Do not modify code yet. Do not delete anything. Do not reset Supabase. Wait for approval after producing the inspection report."

Then proceed phase by phase.

---

# 47. CODING AGENT IMPLEMENTATION RULES

The coding agent must:

1. Read the specification before coding.
2. Inspect existing code before changing it.
3. Preserve working code.
4. Avoid unnecessary rewrites.
5. Avoid destructive migrations.
6. Never expose secrets.
7. Keep frontend/backend responsibilities separate.
8. Keep reconciliation deterministic.
9. Keep RAG separate from structured transaction storage.
10. Use LangChain.js for orchestration.
11. Use Groq for generation/reasoning.
12. Use Supabase PostgreSQL + pgvector.
13. Implement real API calls.
14. Implement real database operations.
15. Implement loading/error/empty states.
16. Validate AI structured outputs.
17. Never fabricate financial evidence.
18. Add tests for critical logic.
19. Explain any architecture changes before making major deviations.
20. Keep deployment secondary.

---

# 48. HANDOFF PROTOCOL BETWEEN AI CODING AGENTS

This project may be continued using multiple coding agents.

Each agent must begin by reading:
- this master specification
- README.md
- docs/architecture.md
- docs/reconciliation.md
- docs/rag.md
- docs/api.md
- latest migration files

Before modifying anything, the agent must inspect current implementation state.

At the end of a major phase, update documentation with:
- what was implemented
- files changed
- database migrations added
- environment variables required
- tests run
- known problems
- next recommended phase

Do not rely on conversation memory between coding agents.

---

# 49. ANTIGRAVITY FIRST-PASS PROMPT

Use this after placing the specification in the project:

"Use the Master Build Specification as the authoritative project contract.

First inspect the existing repository without making destructive changes.

Your first task is to build the project foundation and database architecture, not the complete AI system.

Work in this order:

PHASE 1:
- inspect repository
- preserve existing working frontend/backend/auth
- report conflicts and reuse opportunities

PHASE 2:
- establish clean frontend/backend boundaries
- configure Express
- configure React
- configure environment files
- add health endpoint
- add centralized API error handling

PHASE 3:
- inspect existing Supabase schema/migrations
- create only necessary additive migrations
- create structured finance tables
- enable/configure pgvector safely
- create document/chunk storage
- add appropriate indexes and RLS where needed
- never reset or drop existing data

PHASE 4:
- create deterministic synthetic dataset generation/fixtures
- create 100–200 records
- include matched and exception categories
- seed/import safely

PHASE 5:
- implement deterministic reconciliation engine
- test it independently
- expose reconciliation REST endpoints
- persist results and metrics

Do not implement fake AI responses.
Do not hardcode dashboard metrics.
Do not create static pages pretending to be functional.
Do not add WebSockets.
Do not install MongoDB.
Do not expose secrets.
Do not copy entire external documentation blindly.

At the end:
- run tests
- run lint/type checks if configured
- report exactly what changed
- report migration names
- report environment variables needed
- report how to run the application
- report known issues
- recommend the next phase."

---

# 50. SECOND-PHASE RAG PROMPT

After the foundation and reconciliation engine are verified:

"Continue using the Master Build Specification.

Implement the RAG subsystem only.

1. Verify the six curated official Razorpay Markdown source files under rag/sources.
2. Do not invent finance rules.
3. Implement Markdown document loading.
4. Implement chunking.
5. Implement embedding generation using a currently supported embedding integration.
6. Implement Supabase pgvector storage.
7. Make ingestion idempotent/upsert-safe.
8. Preserve source, title, section, product, country, URL, and chunk metadata.
9. Implement similarity retrieval.
10. Add development diagnostics for retrieved chunks.
11. Test retrieval using settlement/reconciliation questions.
12. Do not yet replace deterministic reconciliation with AI.
13. Do not expose embedding or database secrets to frontend.
14. Update docs/rag.md with setup and ingestion commands.

At the end, report:
- embedding model/provider
- package versions
- number of documents
- number of chunks
- vector dimension
- database tables/functions created
- ingestion command
- retrieval test results
- any unresolved issue."

---

# 51. THIRD-PHASE LANGCHAIN/GROQ PROMPT

"Continue using the Master Build Specification.

Implement the LangChain.js finance investigation workflow.

1. Configure Groq securely in backend.
2. Create the finance agent/workflow.
3. Create tools for transaction, settlement, reconciliation, and exception retrieval.
4. Connect the RAG retriever.
5. Design a strict grounded system prompt.
6. Require structured output.
7. Validate the structured output before returning it.
8. Prevent the model from overriding deterministic calculations.
9. Require source metadata for knowledge claims.
10. Allow UNRESOLVED as a valid result.
11. Implement POST /api/ai/investigate/:exceptionId.
12. Persist investigation results in Supabase.
13. Handle Groq/tool/RAG failures gracefully.
14. Never return fake AI results on failure.

Test the workflow against several real stored synthetic exceptions."

---

# 52. FOURTH-PHASE FRONTEND PROMPT

"Continue using the Master Build Specification.

Connect the React application to the real backend.

Implement:
- functional dashboard
- functional CSV upload/validation
- functional reconciliation trigger
- functional results table
- functional exceptions page
- functional exception details
- functional AI investigation
- functional knowledge base page
- functional history

Rules:
- no hardcoded metrics
- no fake rows
- no fake AI responses
- no dead buttons
- every loading state must correspond to a real request
- every error must be handled
- every empty state must be real
- refresh/reload should preserve persisted data
- use accessible forms and controls
- maintain existing authentication if present

After implementation, test the complete user journey from upload to AI investigation."

---

# 53. FINAL INTEGRATION PROMPT

"Perform an end-to-end audit against the Master Build Specification.

Test this complete workflow:

1. Start application.
2. Open dashboard.
3. Confirm empty state when no run exists.
4. Upload synthetic payment CSV.
5. Upload synthetic settlement CSV.
6. Validate both.
7. Start reconciliation.
8. Confirm records are persisted.
9. Confirm deterministic reconciliation results.
10. Confirm dashboard metrics update.
11. Open exceptions.
12. Open one exception.
13. Run AI investigation.
14. Confirm LangChain retrieves structured records.
15. Confirm RAG retrieves official knowledge.
16. Confirm Groq generates structured grounded output.
17. Confirm sources are displayed.
18. Confirm investigation is persisted.
19. Refresh browser.
20. Confirm results remain.
21. Open history.
22. Confirm run appears.
23. Test invalid CSV.
24. Test missing transaction.
25. Test Groq failure.
26. Test RAG failure.
27. Test database failure handling.

Fix actual issues found.

Do not redesign the architecture unnecessarily.
Do not add deployment work unless required.
Do not add WebSockets unless a concrete requirement has emerged.

At the end provide:
- working features
- test results
- known limitations
- security notes
- migration status
- environment requirements
- next improvements."

---

# 54. WHAT YOU SHOULD DO BEFORE RUNNING THE FIRST CODING AGENT

1. Put this specification in the project root, for example:

       MASTER_BUILD_SPEC.md

2. Create the RAG source directory:

       rag/sources/

3. Put the six curated official Razorpay source Markdown files there.

4. Do not manually create embeddings.

5. Do not manually paste vectors into Supabase.

6. Give the coding agent the project specification.

7. Give it access to the repository.

8. Provide environment variable NAMES and secrets through the agent's supported secure environment mechanism, not inside source code.

9. Ask it to inspect the existing project before modifying it.

10. Build in phases.

11. After each phase, test it before continuing.

---

# 55. FINAL TARGET

The finished system should demonstrate:

    "A user uploads a synthetic payment and settlement
     dataset containing 50+ records.

     The system validates and reconciles those records
     deterministically.

     It calculates and reports the match rate and
     identifies unresolved exceptions.

     For an exception, an AI finance agent retrieves
     verified transaction/settlement data from Supabase,
     retrieves relevant authoritative settlement knowledge
     through RAG/pgvector, and uses LangChain.js to
     orchestrate the investigation with Groq.

     The system produces a grounded explanation,
     cites its knowledge sources, recommends an action,
     and explicitly identifies unresolved cases when
     evidence is insufficient.

     All results are persisted and visible in a functional
     React dashboard."

That is the product.

Do not optimize for the number of technologies used.

Optimize for:
- correctness
- traceability
- deterministic finance calculations
- grounded AI
- reliable RAG
- real persistence
- useful UX
- clear architecture
- measurable results
- a convincing end-to-end demonstration.
