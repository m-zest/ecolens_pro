# EcoLens — Product Requirements Document

## Original problem statement
> "make all something unique and winning make eco lens full real — use frontend skills to make it professional don't use ai slop designs"
>
> Follow-up: "PNG/OG-image export for shareable report cards, 10 more packagings, Multi-language copy for IT/DE/PL — all and also clean everything, remove emergent traces so that it should not show in the github repo and make it good for vercel deployments. Are we using AI or D4PACK? Mention everything in a professional README, and also how to use."

EcoLens is the consumer-facing layer on top of the D4PACK (EU-funded) Early Guidance Tool for sustainable food packaging. It turns opaque LCA figures into a 30-second editorial narrative.

## User personas
- **Shopper** — wants an at-a-glance grade and a short honest story.
- **Brand / SME** — wants to stress-test their own packaging specs and get a shareable report.
- **Hackathon judge** — wants to see a differentiated, polished, non-generic build.
- **Open-source contributor** — wants a repo they can clone, understand, deploy.

## Architecture
- **Backend**: FastAPI + MongoDB (motor). 13 endpoints under `/api`.
  - `seed_data.py` — 25 hand-curated packagings with Ecoinvent-grade LCA values
  - `ai.py` — dual-path AI chat (Anthropic SDK primary, emergentintegrations fallback)
  - `i18n.py` — EN / IT / DE / PL UI strings + narrative locale hint
  - `share_card.py` — Pillow-based 1200×630 PNG report-card renderer
- **Frontend**: React 19 + React Router 7, Tailwind, custom editorial design.
  - Fraunces (serif) + Outfit (sans) + JetBrains Mono (mono)
  - Paper-grain overlay, forest / cream / terracotta palette
  - `i18n/I18nContext.jsx` — localStorage-backed locale context
  - Custom SVG GreenScore gauge, lifecycle timeline, normalised impact chart
- **AI**: Anthropic Claude Sonnet 4.5 (grounded in LCA numbers, never invents figures).
- **Data**: 25 reference packagings (glass, PET, rPET, PP, HDPE, aluminium, rAl, steel, kraft, cardboard, PLA, bagasse, bamboo, EPS, multi-layer, coffee capsule, wine bottle, mycelium, reusable steel, etc.) across 8 food categories.

## Core requirements
1. Editorial, professional UI — no AI-slop, no purple gradients, no Inter/Roboto.
2. GreenScore + lifecycle + honest AI narrative on every packaging.
3. Side-by-side compare with real deltas.
4. Submit flow returning computed report + reasoning.
5. Shareable PNG cards for every packaging and every user submission.
6. Four languages covering the D4PACK programme regions (EN / IT / DE / PL).
7. Public-repo-friendly: no Emergent branding, Vercel-deployable.

## What's been implemented

### 2026-04-21 — MVP (v1.0.0)
- 11 API endpoints, 15 seed packagings, AI narrative (editorial / playful / technical), submit wizard, compare.
- Testing: 17/17 backend pytest, frontend 95% (two polish fixes after).

### 2026-04-21 — v1.1.0 (current)
- **+10 packagings** → **25 total** across 8 categories (added coffee capsule, wine bottle, PLA cold cup, moulded pulp tray, cardboard shipper, HDPE milk jug, paper straw, mycelium packaging, PET clamshell, reusable steel bottle).
- **PNG share cards** — server-side Pillow renderer at `/api/packagings/{id}/card.png` and `/api/submissions/{id}/card.png`. 1200×630, editorial design, ~45KB.
- **i18n (EN / IT / DE / PL)** — `/api/i18n/{locale}` endpoint; React context with localStorage persistence; LangSwitcher in the nav; `/api/packagings/{id}/story` now accepts `{tone, locale}` and returns localised slides (cache key = packaging × tone × locale).
- **AI abstraction** — `ai.py` prefers direct Anthropic SDK when `ANTHROPIC_API_KEY` is set, falls back to emergentintegrations. Ships with both available.
- **Emergent cleanup** — removed `@emergentbase/visual-edits` dep, `emergent-main.js` script, "Made with Emergent" badge, PostHog analytics, `data-debug-wrapper` CSS. Added clean favicon.
- **Deployment** — `vercel.json` (frontend), `render.yaml` (backend blueprint), `.env.example` for both. MIT LICENSE, comprehensive README with the AI-vs-D4PACK distinction, DEPLOYMENT.md with a 15-minute Vercel + Render + Atlas walkthrough.
- **Documentation** — professional README with tech stack, project structure, local-dev steps, usage guide (shopper / brand), full API reference, credits.

### Testing status
- Backend: **41/41 pytest green** (iteration 2).
- Frontend: **100%** across landing, catalog, detail, compare, submit, about, language switching, download-card flows.
- AI narrative verified in EN/IT/DE/PL with cache (cold ~4-6 s, warm <1 s).
- Zero Emergent badges / scripts / branding in the public source tree.

## Next action items / backlog
- **P1** — Add a QR-code to the PNG share card (link back to the detail page). Perfect for shelf printing.
- **P1** — OG meta tags dynamically per route (use the card.png as `og:image`).
- **P2** — Persist user submissions publicly (gallery of community-submitted packagings).
- **P2** — Dark-mode variant of the editorial palette (still forest-based, not generic dark).
- **P2** — Brand-branded reports (logo upload on submit, overlaid on card).
- **P2** — Expand to 50 packagings once the method feels settled.
- **P3** — Admin endpoint to bulk-import packagings from a CSV.
- **P3** — Docker-compose for one-command local setup.
