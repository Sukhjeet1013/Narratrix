# Narratrix

> **AI-Powered Political Narrative Intelligence**

Narratrix is a cross-source political narrative intelligence platform. It clusters the same political story across different media organizations and uses AI to compare framing, political leaning, narrative style, and semantic similarity.

This is not a generic news aggregator — it is an intelligence tool designed to surface media bias and narrative alignment in real-time.

---

## Features

- **Cross-Source Story Clustering:** Automatically groups articles covering the same real-world event into unified stories using agglomerative clustering and sentence embeddings.
- **Narrative Match Analysis:** Measures how closely different outlets align in their coverage using cosine similarity of document embeddings.
- **Automated Story Naming:** Intelligently extracts the most descriptive titles from clusters to generate natural, human-readable story names (e.g., "Supreme Court Pollution Hearing").
- **Political Leaning & Framing:** Tracks metadata for political leaning and extracts framing styles.
- **Modern Dashboard:** Dark-themed, responsive intelligence command center built with React, Vite, and Recharts.

---

## Screenshots

### Dashboard
![Dashboard](screenshots/dashboard.png)

### Stories
![Stories](screenshots/stories.png)

### Source Intelligence
![Source Intelligence](screenshots/sources.png)

### Analytics
![Analytics](screenshots/analytics.png)

---

## System Architecture

The pipeline runs end-to-end from raw article ingestion to narrative divergence visualization:

1. **News Ingestion** — Articles are fetched from multiple Indian and international political outlets via scrapers/RSS feeds and stored in PostgreSQL.
2. **Embedding Generation** — Each article's title and body are encoded into dense vector representations using `sentence-transformers` (MiniLM / paraphrase models).
3. **Agglomerative Clustering** — Embeddings are clustered using scikit-learn's agglomerative clustering with a cosine distance threshold, grouping semantically related articles into unified story clusters.
4. **Narrative Similarity Scoring** — Within each cluster, pairwise cosine similarity between outlet embeddings is computed to generate a cross-outlet coverage match percentage.
5. **Story Name Extraction** — The most semantically central headline in each cluster is selected as the canonical story name.
6. **FastAPI Backend** — Exposes REST endpoints for articles, clusters, sources, and analytics aggregations.
7. **React Dashboard** — Visualizes trending stories, outlet framing comparisons, political leaning distributions, and narrative agreement metrics.

```
Outlets / RSS Feeds
        │
        ▼
  Ingestion Pipeline
        │
        ▼
  Sentence Embeddings (sentence-transformers)
        │
        ▼
  Agglomerative Clustering (scikit-learn)
        │
        ▼
  Cosine Similarity Scoring
        │
        ▼
  FastAPI REST Layer
        │
        ▼
  React Dashboard (Vite + Recharts)
```

---

## Tech Stack

**Backend**
- Python 3.10+
- FastAPI
- PostgreSQL + SQLAlchemy
- scikit-learn (Agglomerative Clustering)
- sentence-transformers (Document Embeddings)

**Frontend**
- React 18
- Vite
- Tailwind CSS
- Recharts (Data Visualization)
- Lucide React (Icons)

---

## Project Structure

```
narratrix/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── models.py            # SQLAlchemy ORM models
│   │   ├── database.py          # DB session management
│   │   └── routers/             # Route handlers (articles, clusters, sources)
│   ├── ingestion/               # Article fetching and parsing
│   ├── clustering/              # Embedding + agglomerative clustering pipeline
│   └── analytics/               # Similarity scoring and framing analysis
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Dashboard, Stories, Sources, Analytics
│   │   └── charts/              # Recharts wrappers
│   └── public/
├── screenshots/                 # UI screenshots for documentation
└── README.md
```

---

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Set up your `.env` file in the `backend` directory:
```env
DATABASE_URL=postgresql://user:password@localhost/narratrix
CORS_ORIGINS=http://localhost:5173
```

Run the backend:
```bash
uvicorn app.main:app --reload
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Set up your `.env` file in the `frontend` directory:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Run the frontend:
```bash
npm run dev
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | API health check |
| `GET` | `/articles` | Fetch ingested articles |
| `GET` | `/articles/{id}` | Fetch article details and similar articles |
| `GET` | `/clusters` | Fetch story clusters |
| `GET` | `/clusters/{id}` | Fetch full narrative analysis for a story |
| `GET` | `/sources` | Fetch source intelligence metrics |

---

## Deployment Hardening (AWS Ready)

This project is prepared for production deployment:
- **Frontend Build:** Optimized via Vite (`npm run build`). No TypeScript errors.
- **Backend CORS:** Supports dynamic `CORS_ORIGINS` parsing, including wildcard (`*`) fallback if required.
- **Uvicorn:** Ready for deployment via Gunicorn/Uvicorn on EC2 or Docker.
- **PostgreSQL:** Production-ready schema via SQLAlchemy.

---

## Future Improvements

| Area | Description |
|------|-------------|
| **Ingestion Scheduler** | Replace manual ingestion with a cron-based or Celery-driven RSS polling scheduler for continuous article ingestion |
| **Deduplication** | Implement embedding-based near-duplicate detection to prevent redundant articles inflating cluster sizes |
| **WebSocket Live Updates** | Push real-time story and ingestion events to the dashboard without full page refresh |
| **Framing Classification** | Fine-tune a transformer classifier to detect specific narrative frames (conflict, human interest, economic consequence) beyond political leaning labels |
| **Multi-language Support** | Extend ingestion and embedding pipeline to support Hindi and regional-language outlets using multilingual sentence models |
| **Docker + CI/CD** | Containerize backend and frontend with Docker Compose; add GitHub Actions pipeline for lint, test, and deploy |
| **AWS Deployment** | Deploy backend on EC2/ECS behind an ALB; serve frontend via S3 + CloudFront; use RDS for managed PostgreSQL |

---

## License

MIT License