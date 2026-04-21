<div align="center">

<img src="./logo.svg" alt="EcoLens logo" width="160" height="160" />

# EcoLens

### Packaging sustainability, made legible.

**EcoLens turns dense life-cycle assessment data into a 30-second story a shopper can actually understand — without greenwashing the trade-offs.**

[Live demo](#) · [Documentation](./DEPLOYMENT.md) · [API reference](#api-reference) · [Report an issue](#)

<br />

![Hackathon](https://img.shields.io/badge/Built_for-Mento_Hackathon-10B981?style=for-the-badge&labelColor=064E3B)
![License](https://img.shields.io/badge/License-MIT-0F766E?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Live-34D399?style=for-the-badge)

---

*Built on the EU-funded [D4PACK](https://d4pack.eu) methodology. Grounded in [Ecoinvent v3.9](https://ecoinvent.org). Narrated by Claude.*

</div>

---

## The problem

Every yoghurt pot, coffee capsule and takeaway tray carries an environmental footprint measured across five or more dimensions — CO₂, water, energy, recyclability, shelf-life. That data exists. It is rigorous. It is also completely illegible to the person standing in the aisle.

The result is a market failure dressed up as a communications problem: brands compete on vague green claims, shoppers default to heuristics, and genuinely better packaging goes unrewarded.

## The product

EcoLens is the **consumer layer** on top of D4PACK's *Early Guidance Tool*. It compresses a full LCA profile into three artefacts:

- A single **GreenScore** grade, A through E.
- An **animated dashboard** — gauge, normalised impact chart, lifecycle timeline with CO₂-share bars.
- A **5-slide narrative** written by an LLM, grounded in the numbers, prompted to name trade-offs rather than hide them.

Brands can submit their own packaging specs through a 4-step wizard and receive a computed report with reasoning bullets, a shareable 1200×630 PNG card, and an optional listing in the public gallery.

## Core principles

**Numbers are deterministic. Stories are generative. The two never cross.**

| Layer | Source | Role |
|---|---|---|
| LCA figures (CO₂, water, energy, recyclability, shelf-life) | D4PACK methodology · Ecoinvent v3.9 · EU PEF guidance | Ground truth. No AI. |
| Seed catalogue (25 reference packagings) | Hand-curated from public LCA literature, cited in `backend/seed_data.py` | Illustrative, not regulatory. |
| User submissions | Deterministic estimator in `backend/server.py::estimate_report` | Computes GreenScore from material, weight, recycled content, transport, shelf-life. No AI. |
| Narrative slides | Claude Sonnet 4.5 · Fireworks (Llama 3.3 70B / DeepSeek / Qwen) · MiniMax — selectable via `AI_PROVIDER` | Writes the story of the numbers. Cached per (packaging × tone × locale). |
| Share cards (PNG) | Pure Pillow, no browser, no AI | Server-side 1200×630 editorial cards with embedded QR. |

The AI never invents figures. It narrates them.

## Capabilities

- **Catalogue of 25 real-world packagings** across 8 food categories, spanning glass, PET, rPET, PP, aluminium, cardboard, PLA, bagasse, EPS, steel, multi-layer pouches, kraft, bamboo fibre, moulded pulp, coffee capsules, mycelium, and reusable steel systems.
- **Editorial detail pages** with animated GreenScore gauge, normalised impact chart, lifecycle timeline, and an expandable raw technical report for the curious.
- **AI narrative in three tones** — editorial, playful, technical — across four locales: **English, Italian, German, Polish**. Matches D4PACK's Central European programme footprint.
- **Side-by-side comparison** — any two packagings, deltas and winner in one view.
- **Brand submission flow** — a 4-step wizard returns a computed GreenScore with human-readable reasoning and an optional public gallery listing.
- **Server-rendered share cards** — 1200×630 PNGs with QR deep-links, fit for pitch decks, spec sheets, and shelf labels.

## Architecture

**Frontend** — React 19, React Router 7, Tailwind CSS 3, Recharts, Lucide. Typography in Fraunces and Outfit. Built with CRA + CRACO.

**Backend** — FastAPI (async), Motor for MongoDB, Pydantic v2, Pillow for PNG rendering, `qrcode` for QR insets.

**AI layer** — pluggable via `AI_PROVIDER`:
- **Anthropic Claude Sonnet 4.5** — official async SDK. Best editorial prose.
- **Fireworks AI** — OpenAI-compatible REST, running Llama 3.3 70B, DeepSeek v3, or Qwen 72B. Lowest cost per narrative.
- **MiniMax** — OpenAI-compatible REST. Strongest in IT, DE, PL.

**Database** — MongoDB 7, local Docker or Atlas M0.

**Deploy** — a single Vercel project. React as static output, FastAPI as a Python serverless function at `api/index.py`. One origin. No CORS theatre in production.

## Repository layout

```
ecolens/
├── api/
│   └── index.py              # Vercel serverless entry — re-exports FastAPI app
├── backend/
│   ├── server.py             # FastAPI app + all /api routes
│   ├── seed_data.py          # 25 curated packagings with cited LCA values
│   ├── ai.py                 # Provider abstraction: Anthropic · Fireworks · MiniMax
│   ├── i18n.py               # EN / IT / DE / PL UI strings + locale prompts
│   ├── share_card.py         # Pillow PNG card generator with QR
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── lib/api.js        # Axios client — same-origin in prod, explicit URL in dev
│   │   ├── i18n/             # React context, 4 locales
│   │   ├── components/       # Nav, Footer, GreenScoreGauge, ImpactChart,
│   │   │                     # LifecycleTimeline, StorySlides, PackagingCard, LangSwitcher
│   │   └── pages/            # Landing, Catalog, PackagingDetail, Compare,
│   │                         # Submit, Gallery, About
│   ├── public/
│   ├── craco.config.js
│   └── .env.example
├── vercel.json               # Single-project Vercel config
├── requirements.txt          # Root requirements for Vercel serverless
├── DEPLOYMENT.md             # Vercel + MongoDB Atlas walkthrough
├── logo.svg                  # Brand mark
├── LICENSE
└── README.md
```

## Getting started

### Prerequisites

- Node 18+ with **yarn** (lockfile is yarn-based)
- Python 3.11+
- MongoDB 7 — local Docker or a free [Atlas](https://www.mongodb.com/atlas) cluster
- An API key from [Anthropic](https://console.anthropic.com), Fireworks, or MiniMax

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate                    # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env                         # set MONGO_URL, DB_NAME, ANTHROPIC_API_KEY, CORS_ORIGINS

uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

Verify:

```bash
curl http://localhost:8001/api/
# {"service":"EcoLens","version":"1.1.0","ai_configured":true,"locales":["en","it","de","pl"]}
```

### Frontend

```bash
cd frontend
yarn install

cp .env.example .env                         # REACT_APP_BACKEND_URL=http://localhost:8001

yarn start
```

App runs at <http://localhost:3000>.

### Or run both with one command

```bash
npm i -g vercel
vercel dev                                   # frontend + serverless Python backend, same origin
```

## User flows

### For shoppers and evaluators

1. Open the landing page. The *featured four* surfaces the best and worst performers in the catalogue.
2. Select any packaging to see its GreenScore gauge, lifecycle timeline, and full impact chart.
3. Toggle **Editorial**, **Playful**, or **Technical** to generate the AI narrative in any of four languages. First render takes 4–6 seconds; subsequent loads are cached and instant.
4. Use **Compare** to view any two packagings head-to-head with deltas.
5. Tap **Download card** to save the 1200×630 PNG.

### For brands and SMEs

1. Open **Submit**.
2. Enter product name, category, primary material, weight, recycled content, transport distance, and shelf-life.
3. Click **Generate EcoLens report** to receive a computed GreenScore with reasoning bullets.
4. Optionally publish to the community gallery at `/gallery`.
5. Download the share card and drop it into a pitch deck, spec sheet, or shelf QR.

## API reference

All endpoints are prefixed with `/api`.

| Method | Path | Description |
|---|---|---|
| GET  | `/` | Service info, AI status, available locales |
| GET  | `/stats` | Aggregated catalogue statistics |
| GET  | `/i18n/{locale}` | UI translation strings — `en`, `it`, `de`, `pl` |
| GET  | `/packagings` | List all packagings. Supports `?category=` and `?q=` |
| GET  | `/packagings/categories` | Category list |
| GET  | `/packagings/{id}` | Full packaging detail |
| GET  | `/packagings/{id}/card.png` | Editorial 1200×630 PNG |
| POST | `/packagings/compare` | `{ id_a, id_b }` → deltas and winner |
| POST | `/packagings/{id}/story` | `{ tone?, locale? }` → 5-slide AI narrative |
| GET  | `/submissions` | Public gallery — only `is_public=true` |
| POST | `/submissions` | Packaging specs → computed report |
| GET  | `/submissions/{id}` | Retrieve a saved submission |
| GET  | `/submissions/{id}/card.png` | Share card for a user submission |

Two OG-ready HTML share routes sit outside `/api`:

| Method | Path | Description |
|---|---|---|
| GET | `/share/packaging/{id}` | OG meta + redirect to the SPA detail page |
| GET | `/share/submission/{id}` | OG meta + redirect for a user submission |

Interactive Swagger UI: **<http://localhost:8001/docs>**.

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full Vercel + Atlas walkthrough (≈10 minutes).

Short version — one Vercel project, one Atlas cluster, one LLM key:

1. Push the repo to GitHub.
2. Import into Vercel. Root directory is the repo root; framework preset is *Other*.
3. Set `MONGO_URL`, `DB_NAME`, `ANTHROPIC_API_KEY`, `CORS_ORIGINS`, `PUBLIC_SITE_URL`.
4. Deploy. The frontend builds to static output; `/api/*` and `/share/*` route to the FastAPI function.

## Acknowledgements

- **[Mento](#)** — host of the hackathon this was built for.
- **[D4PACK](https://d4pack.eu)** — EU-funded Central Europe programme on sustainable food packaging.
- **[Ecoinvent v3.9](https://ecoinvent.org)** — reference LCA database.
- **Anthropic**, **Fireworks AI**, **MiniMax** — the narrative layer.
- **Fraunces** (Undercase Type) and **Outfit** (Indian Type Foundry) — the typography.

## Licence

MIT — see [LICENSE](./LICENSE).

The D4PACK methodology is credited throughout. The 25 reference LCA values are plausible figures curated from public literature and are **illustrative, not regulatory**.

---

<div align="center">

<img src="./logo.svg" alt="" width="48" height="48" />

**Packaging, honestly.**

Built by [Mohammad Zeeshan](#) for the **Mento Hackathon**.

</div>
