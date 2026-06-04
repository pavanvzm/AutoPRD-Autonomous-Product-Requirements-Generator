# AutoPRD: Autonomous Product Requirements Generator

[![Build Status](https://img.shields.io/github/workflow/status/your-org/autoprds/CI?style=flat-square)](https://github.com/your-org/autoprds/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg?style=flat-square)](https://www.python.org/downloads/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)

**AutoPRD** is an AI-native SaaS platform that transforms raw, unstructured inputs (voice memos, rough notes, competitor URLs) into comprehensive, industry-standard Product Requirements Documents (PRDs) through an autonomous, multi-agent workflow.

## ✨ Core Capabilities

AutoPRD distinguishes itself with three pillars of autonomous product management:

1.  **🔍 Interactive Discovery**: Unlike static generators, our AI actively engages users. It analyzes initial inputs, identifies critical information gaps, and asks targeted clarifying questions *before* drafting begins, ensuring high-fidelity requirements.
2.  **📑 Standardized Templates**: Automatically structures outputs into mandatory industry-standard sections: Product Overview, User Personas, Technical Constraints, Success Metrics, and more.
3.  **🗺️ Actionable Roadmaps**: Generates testable user stories and specific, unambiguous acceptance criteria in **Given/When/Then** format, ready for immediate ingestion by engineering teams or ticketing systems.

## 🛠️ Tech Stack (2026 Standards)

| Component | Technology | Justification |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 19 | Server Components for SEO/Performance, Streaming UI for AI responses. |
| **Styling** | Tailwind CSS, Shadcn/UI | Rapid, accessible, and consistent design system. |
| **Backend API** | Python 3.12, FastAPI | High-performance async API, native Pydantic validation. |
| **AI Orchestrator** | LangGraph, LangChain | Stateful multi-agent workflows (Ingestion, Discovery, Drafting, Review). |
| **Database** | PostgreSQL 16 + pgvector | Relational data + native vector embeddings for RAG in a single store. |
| **ORM** | SQLAlchemy 2.0+ | Async support, robust type safety. |
| **Task Queue** | Redis + Celery | Handling long-running LLM generation tasks asynchronously. |
| **Auth** | Clerk / Auth0 | Secure, managed identity with RBAC support. |
| **Observability** | LangSmith, OpenTelemetry | Tracing agent steps, monitoring token usage and latency. |

## 📋 Prerequisites

Before running locally, ensure you have:
- **Node.js**: v20+ (LTS recommended)
- **Python**: v3.11 or v3.12
- **Docker & Docker Compose**: For running Postgres and Redis locally.
- **API Keys**: OpenAI (or Anthropic) key, and a database URL.

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/autoprds.git
cd autoprds
```

### 2. Backend Setup (Python/FastAPI)
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Copy environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys and DB URL

# Run migrations (if using Alembic)
alembic upgrade head

# Start the backend server
uvicorn backend.main:app --reload --port 8000
```

### 3. Frontend Setup (Next.js)
```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys and Auth config

# Start the development server
npm run dev
```

### 4. Infrastructure (Docker)
To run the required services (PostgreSQL with pgvector, Redis):
```bash
docker-compose up -d
```
The application expects the DB at `postgresql://user:password@localhost:5432/autoprds` and Redis at `redis://localhost:6379/0` by default.

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory and `.env.local` in `frontend/`.

### Backend (.env.example)
```ini
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/autoprds

# Redis (Celery Broker)
REDIS_URL=redis://localhost:6379/0

# LLM Configuration
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxx
MODEL_NAME=gpt-4o
TEMPERATURE=0.7

# Auth (Clerk/Auth0)
AUTH_SECRET_KEY=your_super_secret_key
CLERK_JWT_ISSUER=https://your-domain.clerk.accounts.dev

# Observability
LANGSMITH_API_KEY=lsv2_sk_xxxxxxxxxxxxxx
LANGSMITH_TRACING=true
LOG_LEVEL=INFO
```

### Frontend (.env.local.example)
```ini
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxx
```

## 🏗️ Architecture Overview

AutoPRD utilizes a **Multi-Agent Agentic Workflow** orchestrated by LangGraph.

```mermaid
graph TD
    User[User Input] --> Gateway[API Gateway / FastAPI]
    Gateway --> Queue[Celery Task Queue]
    
    subgraph "AI Agent Orchestrator (LangGraph)"
        Ingestion[Ingestion Agent<br/>Cleans & Structures]
        Discovery[Discovery Agent<br/>Identifies Gaps & Questions]
        Drafting[Drafting Agent<br/>Writes PRD & Stories]
        Reviewer[Reviewer Agent<br/>Critiques & Refines]
        
        Ingestion --> Discovery
        Discovery -->|Ask User| User
        User -->|Answers| Discovery
        Discovery -->|Ready| Drafting
        Drafting --> Reviewer
        Reviewer -->|Refine| Drafting
        Reviewer -->|Approved| DB
    end
    
    Queue --> Ingestion
    DB[(PostgreSQL + pgvector)]
    Drafting -.->|RAG| DB
    Reviewer -.->|RAG| DB
```

1.  **Ingestion Agent**: Parses raw text/audio transcripts, removes noise, and extracts initial entities.
2.  **Discovery Agent**: Compares extracted info against a "PRD Completeness Schema." If gaps exist, it pauses generation and prompts the user via the chat interface.
3.  **Drafting Agent**: Once approved, it generates the full PRD using standardized templates and writes user stories with Gherkin (Given/When/Then) syntax.
4.  **Reviewer Agent**: Acts as a critic, checking for hallucinations, logical inconsistencies, and ambiguity before finalizing.

## 🧪 Testing

We use `pytest` for backend and `Jest/React Testing Library` for frontend.

```bash
# Backend Tests
pytest backend/tests -v --cov=backend

# Frontend Tests
npm run test
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the repo.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

Please ensure your code passes linting (`ruff`, `eslint`) and includes tests.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ by the AutoPRD Team*
