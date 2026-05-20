# Analyzer

An AI-powered market and competitor analysis platform. Upload documents for your organization and competitors, extract and embed content with background workers, run GPT-4o analysis, and explore side-by-side comparisons, strategic recommendations, and project chat backed by RAG.

**Repository:** [github.com/subramaniyam22/Analyzer](https://github.com/subramaniyam22/Analyzer)

## Features

- **Project wizard** — Define a base organization and multiple competitors per analysis project (industry, region).
- **Document ingestion** — Upload PDF, Word, Excel, and images; Celery workers extract text (including OCR via Tesseract), chunk content, and store OpenAI embeddings in PostgreSQL with pgvector.
- **AI analysis** — GPT-4o generates structured JSON: feature comparisons, actionable recommendations (steps, tools, evidence, confidence/impact), and overall confidence scores.
- **RAG chat** — Ask questions about a project using vector search over uploaded documents plus the latest analysis snapshot.
- **Auth & RBAC** — JWT login, registration (first user becomes `super_admin`), password reset flow, and roles: `super_admin`, `admin`, `user`.
- **Admin** — User management for admins and super admins.

## Tech Stack

| Layer | Technologies |
|-------|----------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI, Axios |
| Backend API | FastAPI, SQLAlchemy, Pydantic, python-jose, passlib/bcrypt |
| Workers | Celery, Redis, LangChain text splitter |
| Data | PostgreSQL + pgvector, MinIO (S3-compatible storage) |
| AI | OpenAI GPT-4o, `text-embedding-3-small` |
| Deployment | Docker, Docker Compose, [Render](https://render.com) (`render.yaml`) |

## Architecture

Analyzer is a **three-tier application**: a Next.js client, a synchronous FastAPI API, and an asynchronous Celery worker tier. Shared infrastructure consists of PostgreSQL (with pgvector), Redis (Celery broker/result backend), MinIO or any S3-compatible store, and the OpenAI API.

### System topology

```mermaid
flowchart TB
  subgraph users [Users]
    Browser[Web Browser]
  end

  subgraph presentation [Presentation Layer]
    FE["Next.js 16 Frontend<br/>React · Tailwind · Axios"]
  end

  subgraph application [Application Layer]
    API["FastAPI Backend<br/>Auth · Projects · Uploads · Analysis · Chat"]
    Worker["Celery Worker<br/>process_document task"]
  end

  subgraph messaging [Message Broker]
    Redis[(Redis)]
  end

  subgraph persistence [Persistence Layer]
    PG[(PostgreSQL + pgvector)]
    S3[("MinIO / S3<br/>Raw uploads")]
  end

  subgraph external [External Services]
    OpenAI[OpenAI API<br/>GPT-4o · text-embedding-3-small]
  end

  Browser -->|"HTTPS"| FE
  FE -->|"/api/* rewrite or NEXT_PUBLIC_BACKEND_URL"| API
  API -->|"SQLAlchemy"| PG
  API -->|"boto3 S3 client"| S3
  API -->|"process_document.delay()"| Redis
  Redis -->|"task queue"| Worker
  Worker -->|"read/write chunks & uploads"| PG
  Worker -->|"download file bytes"| S3
  API -->|"analysis & chat completions"| OpenAI
  Worker -->|"embeddings"| OpenAI
```

| Component | Role |
|-----------|------|
| **Frontend** | UI for auth, project wizard, uploads, comparison tables, recommendations, and chat. Proxies API calls via `/api/*` (local) or `NEXT_PUBLIC_BACKEND_URL` (production). |
| **FastAPI backend** | REST API, JWT auth, RBAC, file upload to object storage, enqueues Celery jobs, runs synchronous GPT-4o analysis, RAG chat with pgvector similarity search. |
| **Celery worker** | Background `process_document`: download from S3 → extract text (PyMuPDF, python-docx, pandas, Tesseract) → chunk (LangChain) → embed → store `ExtractedChunk` rows. |
| **PostgreSQL** | Users, projects, organizations, uploads, analysis results, chat history, password-reset tokens. **pgvector** stores 1536-dim embeddings on `extracted_chunks`. |
| **Redis** | Celery broker and result backend (`REDIS_URL`). |
| **MinIO / S3** | Raw files at keys `{project_id}/{org_id}/{uuid}_{filename}`. |
| **OpenAI** | `gpt-4o` for analysis and chat; `text-embedding-3-small` for chunk and query embeddings. |

### Data model

```mermaid
erDiagram
  User ||--o{ Project : owns
  Project ||--|{ Organization : contains
  Project ||--o{ Upload : has
  Project ||--o{ AnalysisResult : has
  Project ||--o{ ChatMessage : has
  Organization ||--o{ Upload : "scoped to"
  Upload ||--o{ ExtractedChunk : produces
  AnalysisResult ||--o{ Feedback : receives

  User {
    int id PK
    string email
    string role
  }
  Project {
    int id PK
    string name
    string industry
    int owner_id FK
  }
  Organization {
    int id PK
    string name
    bool is_base
    int project_id FK
  }
  Upload {
    int id PK
    string s3_key
    string status
  }
  ExtractedChunk {
    int id PK
    text content
    vector embedding
  }
  AnalysisResult {
    int id PK
    json results_json
    int version
  }
```

### Request flows

#### 1. Document upload and indexing (async)

Triggered when the user uploads files in the project wizard or project UI. The API responds immediately; processing runs in the worker.

```mermaid
sequenceDiagram
  actor User
  participant FE as Frontend
  participant API as FastAPI
  participant S3 as MinIO/S3
  participant Redis as Redis
  participant W as Celery Worker
  participant DB as PostgreSQL
  participant OAI as OpenAI

  User->>FE: Select files per org
  FE->>API: POST /uploads/{project_id}/{org_id}
  API->>S3: upload_fileobj (s3_key)
  API->>DB: Insert Upload (status=pending)
  API->>Redis: process_document.delay(upload_id)
  API-->>FE: Upload record

  Redis->>W: process_document task
  W->>DB: status=processing
  W->>S3: get_object (file bytes)
  W->>W: extract_content (PDF/DOCX/XLSX/OCR)
  W->>W: RecursiveCharacterTextSplitter
  loop Each chunk
    W->>OAI: embeddings.create
    OAI-->>W: vector[1536]
    W->>DB: Insert ExtractedChunk
  end
  W->>DB: status=completed
```

#### 2. Market analysis (sync)

Runs in the API process when the user clicks **Run Analysis** or **Refine Analysis**. Reads all chunks for the project’s organizations and calls GPT-4o once.

```mermaid
sequenceDiagram
  actor User
  participant FE as Frontend
  participant API as FastAPI
  participant DB as PostgreSQL
  participant OAI as OpenAI

  User->>FE: Run / Refine analysis
  FE->>API: POST /projects/{id}/run-analysis
  API->>DB: Load Project, Organizations, Uploads, Chunks
  API->>API: Build context string (base + competitors)
  API->>OAI: chat.completions (gpt-4o, JSON mode)
  OAI-->>API: comparison + recommendations JSON
  API->>DB: Insert AnalysisResult (version++)
  API-->>FE: results_json
  FE->>FE: ComparisonTable · Recommendations
```

#### 3. Project chat with RAG (sync)

Each message embeds the query, retrieves the top 5 similar chunks via pgvector L2 distance, and includes the latest `AnalysisResult` in the system prompt.

```mermaid
sequenceDiagram
  actor User
  participant FE as Frontend
  participant API as FastAPI
  participant DB as PostgreSQL
  participant OAI as OpenAI

  User->>FE: Send chat message
  FE->>API: POST /projects/{id}/chat
  API->>OAI: Embed user message
  API->>DB: Vector search ExtractedChunk (top 5)
  API->>DB: Load latest AnalysisResult + ChatMessage history
  API->>OAI: chat.completions (gpt-4o + RAG context)
  OAI-->>API: Assistant reply
  API->>DB: Save user + assistant ChatMessage
  API-->>FE: answer
```

### Deployment layouts

**Local (Docker Compose)** — single network; all services on one host:

```
frontend:3000 → backend:8000 → db:5432, redis:6379, minio:9000
                              ↘ worker (Celery) → same db, redis, minio, OpenAI
```

**Production (Render)** — services defined in `render.yaml`:

| Render service | Type | Connects to |
|----------------|------|-------------|
| `analyzer-frontend` | Web (Node) | `analyzer-backend` via `BACKEND_URL` / `NEXT_PUBLIC_BACKEND_URL` |
| `analyzer-backend` | Web (Docker) | `analyzer-db`, `analyzer-redis`, S3 (`MINIO_*`), OpenAI |
| `analyzer-worker` | Worker (Docker) | Same as backend (isolated process, starter plan, memory-tuned) |
| `analyzer-redis` | Redis | Internal broker for worker |
| `analyzer-db` | PostgreSQL | pgvector extension for embeddings |

The worker container uses `--pool=solo --concurrency=1` and `worker_max_tasks_per_child=5` to stay within **512MB** memory limits on Render.

## Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose (recommended for local development)
- [OpenAI API key](https://platform.openai.com/api-keys) (required for embeddings and analysis)
- For manual setup: Python 3.11+, Node.js 20+, PostgreSQL with pgvector, Redis, and S3-compatible storage

## Quick Start (Docker Compose)

1. **Clone the repository**

   ```bash
   git clone https://github.com/subramaniyam22/Analyzer.git
   cd Analyzer
   ```

2. **Set your OpenAI API key**

   Create a `.env` file in the project root (or export the variable):

   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```

3. **Start all services**

   ```bash
   docker compose up --build
   ```

4. **Open the app**

   | Service | URL |
   |---------|-----|
   | Frontend | http://localhost:3000 |
   | Backend API | http://localhost:8000 |
   | API docs (Swagger) | http://localhost:8000/docs |
   | MinIO console | http://localhost:9001 |

5. **Register** — The first account created becomes `super_admin`. Upload competitor documents, run analysis from a project page, and use chat to refine insights.

### Docker services

| Service | Host port | Purpose |
|---------|-----------|---------|
| `frontend` | 3000 | Next.js dev server |
| `backend` | 8000 | FastAPI API |
| `worker` | — | Celery document processing |
| `db` | 5433 | PostgreSQL (pgvector image) |
| `redis` | 6380 | Celery broker |
| `minio` | 9000 / 9001 | Object storage API / console |

Default credentials are defined in `docker-compose.yml` (e.g. Postgres user `analyzer`, MinIO user `analyzer_minio`). Data persists under `./data/postgres` and `./data/minio`.

## Environment Variables

### Backend & worker

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis URL for Celery (e.g. `redis://redis:6379/0`) |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `SECRET_KEY` | Yes (prod) | JWT signing secret; auto-generated on Render |
| `MINIO_URL` | Yes | S3 endpoint (e.g. `http://minio:9000` or cloud provider URL) |
| `MINIO_ACCESS_KEY` | Yes | S3 access key |
| `MINIO_SECRET_KEY` | Yes | S3 secret key |
| `MINIO_BUCKET_NAME` | Yes | Upload bucket name (e.g. `analyzer-uploads`) |
| `PORT` | No | API port (default `8000`; set by Render) |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Local Docker | Direct backend URL (`http://localhost:8000`) in compose |
| `NEXT_PUBLIC_BACKEND_URL` | Production | Full backend URL for Axios (e.g. `https://analyzer-backend-xxx.onrender.com`) |
| `BACKEND_URL` | Production | Host only for Next.js rewrites (e.g. `analyzer-backend.onrender.com`) |

The frontend proxies API calls through `/api/*` → backend (`next.config.ts`). In production, set `NEXT_PUBLIC_BACKEND_URL` to your deployed backend URL.

## Local Development (without full Compose)

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://analyzer:analyzer_pass@localhost:5433/analyzer_db
export REDIS_URL=redis://localhost:6380/0
export OPENAI_API_KEY=sk-...
# Set MINIO_* variables to match your MinIO instance
uvicorn app.main:app --reload --port 8000
```

### Celery worker

```bash
cd backend
celery -A worker.celery_app worker --loglevel=info
```

The production worker image uses `--pool=solo --concurrency=1` for low-memory hosts (512MB).

### Frontend

```bash
cd frontend
npm install
# Optional: NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

### Initialize database manually

```bash
cd backend
python init_db.py
```

## Supported Upload Formats

| Format | Extensions | Notes |
|--------|------------|-------|
| PDF | `.pdf` | Text extraction; OCR fallback for scanned pages |
| Word | `.docx`, `.doc` | Paragraph text |
| Excel | `.xlsx`, `.xls` | All sheets as text |
| Images | `.png`, `.jpg`, `.jpeg`, `.webp` | Tesseract OCR |

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/auth/register` | POST | Create account |
| `/auth/login` | POST | Obtain JWT |
| `/auth/me` | GET | Current user |
| `/projects` | GET, POST | List / create projects |
| `/uploads/{project_id}/{org_id}` | POST | Upload document (triggers worker) |
| `/projects/{project_id}/run-analysis` | POST | Run GPT-4o analysis |
| `/projects/{project_id}/results` | GET | Latest analysis JSON |
| `/projects/{project_id}/chat` | POST | RAG + analysis-aware chat |

Interactive documentation: `http://localhost:8000/docs` when the backend is running.

## Project Structure

```
Analyzer/
├── backend/
│   ├── app/              # FastAPI routes, models, auth, analysis
│   ├── worker/           # Celery tasks, document extraction
│   ├── common/           # S3/MinIO utilities
│   ├── init_db.py        # DB + pgvector setup script
│   ├── Dockerfile        # API container
│   └── Dockerfile.worker # Celery container (memory-optimized)
├── frontend/
│   └── src/
│       ├── app/          # Next.js pages (dashboard, projects, auth, admin)
│       ├── components/   # UI (wizard, chat, comparisons, recommendations)
│       └── lib/          # API client, utilities
├── docker-compose.yml    # Local full stack
├── render.yaml           # Render Blueprint (backend, worker, frontend, Redis, DB)
├── CompetitorA.txt       # Sample competitor data
├── CompetitorB.txt       # Sample competitor data
└── RENDER_TROUBLESHOOTING.md
```

## Deploy to Render

The repo includes a [Render Blueprint](https://render.com/docs/blueprint-spec) (`render.yaml`) with:

- **analyzer-backend** — FastAPI (Docker)
- **analyzer-worker** — Celery (Docker, starter plan)
- **analyzer-frontend** — Next.js (Node 20)
- **analyzer-redis** — Redis starter
- **analyzer-db** — PostgreSQL (Basic-1gb)

After deploying:

1. Set `OPENAI_API_KEY` on backend and worker services.
2. Configure S3-compatible storage (`MINIO_*`) or your object store credentials.
3. Set `NEXT_PUBLIC_BACKEND_URL` on the frontend to your backend’s public HTTPS URL.
4. Verify health: `https://<your-backend>/health`

For registration errors, CORS, or database issues, see **[RENDER_TROUBLESHOOTING.md](./RENDER_TROUBLESHOOTING.md)**.

## Sample Data

`CompetitorA.txt` and `CompetitorB.txt` in the repo root contain example competitor descriptions you can use when testing uploads or manual review flows.

## Recent Updates

- Celery worker tuned for **512MB memory** limits (`--pool=solo`, `--concurrency=1`)
- Docker-based backend/worker images with **Tesseract OCR** and system dependencies
- Lazy database initialization with **pgvector** extension and graceful fallback
- Frontend **`NEXT_PUBLIC_BACKEND_URL`** support for production API routing

## License

This project is open source. See the repository for license and contribution details.
