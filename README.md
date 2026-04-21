# EcoLens

> **Turn dense packaging life-cycle data into a 30-second story.**
> A consumer-facing web app built on top of the D4PACK EU methodology, with an AI narrative layer that names real trade-offs instead of greenwashing them.

---

## What is this?

EcoLens is the **consumer layer** on top of the [D4PACK](https://d4pack.eu) *Early Guidance Tool* — an EU-funded decision-support system for sustainable food packaging in Central Europe. It translates opaque LCA (Life-Cycle Assessment) figures — CO₂, water, energy, recyclability, shelf-life — into a **single GreenScore grade (A–E)**, an **animated dashboard**, and a **5-slide narrative** a shopper can understand in 30 seconds.

The goal is simple: **make the number on the back of your yoghurt pot mean something.**

---

## Are we using AI or D4PACK data?

**Both — but cleanly separated.** The LCA numbers are deterministic, the narrative is AI. Nothing is guessed:

| Layer | Source | Role |
|---|---|---|
| **LCA figures** (CO₂, water, energy, recyclability, shelf-life) | D4PACK methodology + [Ecoinvent v3.9](https://ecoinvent.org) reference values + EU PEF guidance | Ground truth. Deterministic. No AI involved. |
| **Seed packagings** (25 reference products) | Hand-curated from public LCA literature | Each value is plausible and cited in-code (`backend/seed_data.py`). Illustrative, not regulatory. |
| **User submissions** | Deterministic estimator (see `backend/server.py::estimate_report`) | Takes material, weight, recycled content, transport, shelf-life → returns a computed GreenScore + reasoning bullets. No AI. |
| **Narrative slides** | Any of: **Anthropic Claude Sonnet 4.5**, **Fireworks AI** (Llama 3.3 70B / DeepSeek / Qwen), or **MiniMax**. Selected via `AI_PROVIDER`. | AI writes the 5-slide story, **grounded in the numbers above**. Prompted to name trade-offs and avoid greenwashing. Cached per (packaging × tone × locale). |
| **Share cards (PNG)** | Pure Pillow — no AI, no browser rendering | Server-side editorial 1200×630 cards for social/shelf use, with a QR that links back. |

> **The AI never invents numbers. It only tells the story of numbers that came from the LCA layer.**

---

## Features

- **Catalogue** — 25 real packagings across 8 food categories (glass, PET, rPET, PP, aluminium, cardboard, PLA, bagasse, EPS, steel, multi-layer pouch, kraft paper, bamboo fibre, moulded pulp, coffee capsule, mycelium, reusable steel, and more).
- **Editorial detail page** — animated GreenScore gauge, normalised impact chart, lifecycle timeline with CO₂-share bars, expandable raw technical report.
- **AI narrative** — three tones (editorial · playful · technical) × four locales (EN · IT · DE · PL). Structured JSON, cached in MongoDB.
- **Side-by-side compare** — pick any two packagings, see the deltas and a winner.
- **Submit your own packaging** — 4-step wizard, returns a computed GreenScore with human-readable reasoning, optionally published to the community gallery.
- **Shareable PNG cards** — 1200×630 editorial cards with a QR, generated server-side for every packaging and every user submission.
- **Four languages** — EN / IT / DE / PL. Covers the D4PACK programme's core regions.

---

## Tech stack

- **Frontend** — React 19, React Router 7, Tailwind CSS 3, Recharts, Lucide icons, Fraunces + Outfit (Google Fonts). CRA + CRACO build.
- **Backend** — FastAPI (async), Motor (async MongoDB driver), Pydantic v2, Pillow for PNG share cards, qrcode for QR inset.
- **AI** — pluggable provider layer (pick one via `AI_PROVIDER` env var):
  - **Anthropic Claude Sonnet 4.5** — official async SDK. Best editorial prose.
  - **Fireworks AI** — OpenAI-compatible REST. Llama 3.3 70B / DeepSeek-v3 / Qwen-72B. Cheap & fast.
  - **MiniMax** — OpenAI-compatible REST. Strong on IT / DE / PL.
- **Database** — MongoDB 7 (local Docker or Atlas M0).
- **Deploy** — **Single Vercel project**: React static build + FastAPI as a Python serverless function (`api/index.py`).

---

## Project structure

```
ecolens/
├── api/
│   └── index.py            # Vercel serverless entry → re-exports FastAPI app
├── backend/
│   ├── server.py           # FastAPI app + all /api routes
│   ├── seed_data.py        # 25 hand-curated packagings with LCA values
│   ├── ai.py               # AI provider layer — Anthropic / Fireworks / MiniMax
│   ├── i18n.py             # EN/IT/DE/PL UI strings + narrative locale hint
│   ├── share_card.py       # Pillow-based PNG card generator (with QR)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── lib/api.js      # Axios client (same-origin in prod, explicit URL in dev)
│   │   ├── i18n/           # React context, 4 locales
│   │   ├── components/     # Nav, Footer, GreenScoreGauge, ImpactChart,
│   │   │                   # LifecycleTimeline, StorySlides, PackagingCard, LangSwitcher
│   │   └── pages/          # Landing, Catalog, PackagingDetail, Compare,
│   │                       # Submit, Gallery, About
│   ├── public/
│   ├── craco.config.js
│   └── .env.example
├── vercel.json             # Single-project Vercel config
├── requirements.txt        # Root requirements (used by Vercel serverless)
├── DEPLOYMENT.md           # Vercel + MongoDB Atlas walkthrough
├── LICENSE
├── .gitignore
└── README.md
```

---

## Running it locally

### Prerequisites

- Node 18+ & **yarn** (lockfile is yarn-based)
- Python 3.11+
- MongoDB 7 running locally, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- An [Anthropic API key](https://console.anthropic.com) (free tier works for dev)

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# fill in MONGO_URL, DB_NAME, ANTHROPIC_API_KEY, CORS_ORIGINS

uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

Sanity-check:

```bash
curl http://localhost:8001/api/
# {"service":"EcoLens","version":"1.1.0","ai_configured":true,"locales":["en","it","de","pl"]}
```

### 2. Frontend

```bash
cd frontend
yarn install

cp .env.example .env
# REACT_APP_BACKEND_URL=http://localhost:8001

yarn start
```

Open <http://localhost:3000>.

### Or one-shot with the Vercel CLI

```bash
npm i -g vercel
vercel dev    # frontend + serverless Python backend, same origin
```

---

## How to use it

### As a shopper / judge

1. Open the homepage — the "featured four" shows the best and worst of the catalogue.
2. Click any packaging to see its **GreenScore gauge, lifecycle timeline, and full impact chart**.
3. Hit **Editorial / Playful / Technical** to generate the AI narrative in your language of choice (EN/IT/DE/PL). First generation takes ~4-6 s, subsequent loads are cached and instant.
4. Use **Compare** to put any two packagings head-to-head.
5. Use **Download card** on any page to save the 1200×630 PNG.

### As a brand / SME

1. Go to **Submit**.
2. Fill in product name, category, primary material, weight, recycled content, transport distance and shelf life.
3. Hit **Generate EcoLens report**. You'll get a computed GreenScore plus reasoning bullets.
4. Optionally tick *Publish to the community gallery* to appear on `/gallery`.
5. **Download card** → drop the PNG into your pitch deck, spec sheet or shelf QR-code.

---

## API reference

All endpoints are prefixed with `/api`.

| Method | Path | Description |
|---|---|---|
| GET  | `/` | Service info, AI status, available locales |
| GET  | `/stats` | Aggregated catalogue stats |
| GET  | `/i18n/{locale}` | UI translation strings (`en`, `it`, `de`, `pl`) |
| GET  | `/packagings` | List all packagings. Query params: `?category=`, `?q=` |
| GET  | `/packagings/categories` | List of categories |
| GET  | `/packagings/{id}` | Full packaging detail |
| GET  | `/packagings/{id}/card.png` | Editorial 1200×630 PNG card |
| POST | `/packagings/compare` | Body: `{ id_a, id_b }` → returns deltas + winner |
| POST | `/packagings/{id}/story` | Body: `{ tone?, locale? }` → AI narrative (5 slides) |
| GET  | `/submissions` | Public gallery (only submissions flagged `is_public=true`) |
| POST | `/submissions` | Body: packaging specs → computed EcoLens report |
| GET  | `/submissions/{id}` | Retrieve a saved submission |
| GET  | `/submissions/{id}/card.png` | Editorial PNG card for a user submission |

Two HTML share routes (OG-ready, not under `/api`):

| Method | Path | Description |
|---|---|---|
| GET | `/share/packaging/{id}` | OG meta + redirect to the SPA detail page |
| GET | `/share/submission/{id}` | OG meta + redirect for a user submission |

Interactive docs: **<http://localhost:8001/docs>** (FastAPI Swagger UI).

---

## Deploying to production

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full Vercel + MongoDB Atlas walkthrough (≈10 minutes).

TL;DR — one Vercel project, one MongoDB Atlas cluster, one Anthropic key:

1. Push this repo to GitHub.
2. Import it into Vercel (root directory = repo root, framework preset = *Other*).
3. Set env vars: `MONGO_URL`, `DB_NAME`, `ANTHROPIC_API_KEY`, `CORS_ORIGINS`, `PUBLIC_SITE_URL`.
4. Deploy. The frontend ships as static output, and `/api/*` + `/share/*` route to the FastAPI function at `api/index.py`.

---

## Credits

- **D4PACK** — EU-funded Central Europe programme on sustainable food packaging.
- **Ecoinvent v3.9** — reference LCA database.
- **Anthropic Claude Sonnet 4.5** — the narrative engine.
- **Fraunces** (Undercase Type) & **Outfit** (Indian Type Foundry) — the typography.

---

## Licence

MIT — see [LICENSE](./LICENSE). The D4PACK methodology is attributed; the 25 reference LCA values are plausible figures hand-curated from public literature and are **illustrative, not regulatory**.

---

*Packaging, honestly.* — a project by **Mohammad Zeeshan** for the D4PACK Transnational Hackathon.
