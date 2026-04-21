# Deploying EcoLens — complete guide

Everything ships as **one Vercel project**: React static build + FastAPI as a
Python serverless function, sharing the same origin so there is no CORS
plumbing to worry about. MongoDB Atlas stores the stories cache and user
submissions. AI narrative can run on **Anthropic Claude**, **Fireworks AI**,
or **MiniMax** — set whichever keys you have and pick the default with
`AI_PROVIDER`.

End-to-end time from a fresh repo: **≈ 10 minutes**.

| Piece | Where it lives | Why |
|---|---|---|
| Frontend (React / CRA) | Vercel static output (`frontend/build`) | Edge CDN, instant rollbacks. |
| Backend (FastAPI) | Vercel Python serverless function (`api/index.py`) | Same origin as the frontend, zero CORS config, autoscaling. |
| Database | MongoDB Atlas M0 (free tier) | Managed, reachable from Vercel egress. |
| AI | Anthropic / Fireworks / MiniMax | Pick one; add the others later if you want. |

---

## 0 — Prerequisites

- A GitHub account with the repo pushed.
- A Vercel account (free Hobby tier is fine).
- **At least one** of these AI provider accounts:
  - Anthropic — <https://console.anthropic.com>
  - Fireworks AI — <https://fireworks.ai>
  - MiniMax — <https://www.minimaxi.com>
- MongoDB Atlas account — <https://www.mongodb.com/atlas>

---

## 1 — MongoDB Atlas (3 min)

1. Open <https://www.mongodb.com/atlas> → **Build a Database** → **M0 Free**.
2. Pick a region close to Vercel's `iad1` (us-east) or `fra1` (Frankfurt) —
   both keep latency low.
3. **Database Access** → *Add New Database User*. Username `ecolens`,
   generate a strong password, copy it.
4. **Network Access** → *Add IP Address* → `0.0.0.0/0` (Vercel's serverless
   egress IPs rotate; a narrower allowlist will break in production).
5. **Database** (left nav) → **Connect** → *Drivers* → copy the SRV string.
   It looks like:
   ```
   mongodb+srv://ecolens:<PASSWORD>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<PASSWORD>` with the real one, and append the database name:
   ```
   mongodb+srv://ecolens:SUPERsecret@cluster0.xxxxx.mongodb.net/ecolens?retryWrites=true&w=majority
   ```

Keep that string open in a tab — you'll paste it into Vercel.

> **Data is auto-populated.** The first time the backend boots it does
> nothing to Mongo; the first `POST /api/packagings/{id}/story` or
> `POST /api/submissions` creates the collections on the fly.

---

## 2 — Pick an AI provider (1 min)

| Provider | How to get the key | Default model | Ballpark cost per 5-slide story |
|---|---|---|---|
| **Anthropic** | <https://console.anthropic.com> → *API Keys* → *Create Key* | `claude-sonnet-4-5-20250929` | ~$0.008 |
| **Fireworks AI** | <https://fireworks.ai> → *Account* → *API keys* | `accounts/fireworks/models/llama-v3p3-70b-instruct` | ~$0.0003 |
| **MiniMax** | <https://www.minimaxi.com> → *API Keys* | `MiniMax-Text-01` | ~$0.0005 |

You only need **one** key to ship. More can be added later — the backend
picks via the `AI_PROVIDER` env var:

- `AI_PROVIDER=anthropic` → always Claude
- `AI_PROVIDER=fireworks` → always Fireworks
- `AI_PROVIDER=minimax` → always MiniMax
- `AI_PROVIDER=auto` (default) → whichever key is set, preference order
  Anthropic → Fireworks → MiniMax

If the selected provider's key is missing, the backend **transparently falls
back** to the next available one — so nothing breaks if you rotate keys.

> **Which should you use?** For the public demo, pick whichever you have
> credits on. Fireworks is the cheapest; Anthropic writes the best prose;
> MiniMax is strong on IT / DE / PL multilingual output.

---

## 3 — Deploy to Vercel (3 min)

1. Push this repo to GitHub.
2. <https://vercel.com/new> → **Import Git Repository** → pick `ecolens_pro`.
3. **Root Directory** → leave as `.` (repo root). Framework preset:
   **Other**. The `vercel.json` at the root already declares:
   - `buildCommand`: `cd frontend && yarn install --frozen-lockfile && yarn build`
   - `outputDirectory`: `frontend/build`
   - function: `api/index.py` with `includeFiles: "backend/**"` and
     `maxDuration: 30`
   - rewrites: `/api/*` and `/share/*` → FastAPI function, everything else
     → `index.html` (SPA fallback).
4. **Environment Variables** (paste each one before clicking Deploy):

   | Name | Value | Required? |
   |---|---|---|
   | `MONGO_URL` | the Atlas SRV string from step 1 | ✅ |
   | `DB_NAME` | `ecolens` | ✅ |
   | `CORS_ORIGINS` | your Vercel URL, e.g. `https://ecolens.vercel.app` | ✅ |
   | `PUBLIC_SITE_URL` | same URL (used for QR + OG links) | ✅ |
   | `AI_PROVIDER` | `anthropic`, `fireworks`, `minimax`, or `auto` | ✅ |
   | `ANTHROPIC_API_KEY` | `sk-ant-…` | if you're using Anthropic |
   | `AI_MODEL` | `claude-sonnet-4-5-20250929` | optional |
   | `FIREWORKS_API_KEY` | `fw_…` | if you're using Fireworks |
   | `FIREWORKS_MODEL` | e.g. `accounts/fireworks/models/llama-v3p3-70b-instruct` | optional |
   | `MINIMAX_API_KEY` | your MiniMax key | if you're using MiniMax |
   | `MINIMAX_MODEL` | e.g. `MiniMax-Text-01` | optional |

5. Click **Deploy**. First build ≈ 90 s (mostly `yarn install`). Subsequent
   deploys are cached and take ~30 s.

### Sanity check after deploy

```bash
curl https://<your-project>.vercel.app/api/
# {"service":"EcoLens","version":"1.1.0","ai_configured":true,"locales":["en","it","de","pl"]}
```

```bash
curl -s -X POST https://<your>.vercel.app/api/packagings/glass-milk-bottle/story \
  -H "content-type: application/json" \
  -d '{"tone":"editorial","locale":"en"}' | jq '.slides | length'
# 5
```

Each `(packaging, tone, locale)` tuple is cached in Mongo, so the second
call returns instantly.

---

## 4 — Using the Fireworks key you already have

Two env vars in Vercel:

```
AI_PROVIDER=fireworks
FIREWORKS_API_KEY=fw_xxxxxxxxxxxxxxxxxxxxxxxx
```

Optional:

```
FIREWORKS_MODEL=accounts/fireworks/models/llama-v3p3-70b-instruct
```

That's it — redeploy, and every story endpoint routes through Fireworks.
Swap `AI_PROVIDER` to `auto` if you want Anthropic to take over whenever
you add `ANTHROPIC_API_KEY` later.

### Good default models on Fireworks

| Model ID | Strengths | Price |
|---|---|---|
| `accounts/fireworks/models/llama-v3p3-70b-instruct` | Solid JSON, stable. | $0.90 / 1M tok |
| `accounts/fireworks/models/deepseek-v3` | Best reasoning, slightly slower. | $0.90 / 1M tok |
| `accounts/fireworks/models/qwen2p5-72b-instruct` | Best multilingual (IT/DE/PL). | $0.90 / 1M tok |
| `accounts/fireworks/models/llama-v3p1-8b-instruct` | Cheapest. Good for `technical` tone. | $0.20 / 1M tok |

Fireworks' OpenAI-compatible endpoint accepts
`response_format: { "type": "json_object" }`, which this backend always
requests — Llama 3.3 70B honours it reliably.

---

## 5 — Using MiniMax

```
AI_PROVIDER=minimax
MINIMAX_API_KEY=<your minimax key>
MINIMAX_MODEL=MiniMax-Text-01
```

Override the endpoint if MiniMax sends you to a different base URL
(some accounts use `api.minimax.chat`, others `api.minimaxi.chat`):

```
MINIMAX_BASE_URL=https://api.minimaxi.chat/v1/chat/completions
```

MiniMax is particularly strong on Italian / German / Polish output, which
matters for the D4PACK locale set.

---

## 6 — Custom domain (2 min, optional)

1. Vercel → *Project* → **Domains** → *Add* → `ecolens.yourdomain.com`.
2. Add the CNAME Vercel shows at your DNS provider.
3. Update `CORS_ORIGINS` and `PUBLIC_SITE_URL` in Vercel env vars to match.
4. Redeploy (click *Redeploy* on the latest deployment).

---

## 7 — Vercel limits you should know about

| Item | Default | Notes |
|---|---|---|
| Function `maxDuration` | 30 s (set in `vercel.json`) | Hobby supports up to 60 s on the new runtime. |
| Function memory | 1024 MB | Enough for Pillow + the AI SDKs. |
| Cold start | ~500–900 ms | First hit after idle is a touch slower. |
| Read-only filesystem | — | All PNG rendering is in-memory (Pillow → `io.BytesIO`). |
| Body size | 4.5 MB | None of our routes upload files. |

---

## 8 — Local development

Two terminals:

```bash
# Terminal 1 — backend (FastAPI + local Mongo)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in MONGO_URL + at least one AI key
uvicorn server:app --reload --port 8001
```

```bash
# Terminal 2 — frontend (CRA dev server)
cd frontend
cp .env.example .env        # REACT_APP_BACKEND_URL=http://localhost:8001
yarn install
yarn start
```

Open <http://localhost:3000>.

### Or one command with the Vercel CLI

Runs the serverless Python function *and* the CRA dev server together,
exactly like production (same origin):

```bash
npm i -g vercel
vercel link              # pick your project
vercel env pull .env     # downloads prod env vars (Mongo, AI keys) to .env
vercel dev               # starts both on http://localhost:3000
```

With `vercel dev` you can leave `REACT_APP_BACKEND_URL` blank — frontend
hits relative `/api` paths exactly as in production.

---

## 9 — Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `ai_configured: false` in `/api/` | No AI key set | Add one of `ANTHROPIC_API_KEY` / `FIREWORKS_API_KEY` / `MINIMAX_API_KEY` in Vercel env vars, redeploy. |
| CORS errors in browser console | `CORS_ORIGINS` wrong | Must match the Vercel URL **exactly**: `https://`, no trailing slash. |
| 502 from `/api/packagings/{id}/story` | AI provider rejected the request | Check the function logs in Vercel (*Deployments* → *latest* → *Functions*). Usually a bad API key or a model string. |
| `MongoDB connection refused` | Atlas user wasn't added, or IP allowlist is too narrow | *Database Access* has the right password; *Network Access* set to `0.0.0.0/0`. |
| Stories look off in IT/DE/PL | Weak model for the locale | Switch `FIREWORKS_MODEL` to `qwen2p5-72b-instruct`, or point `AI_PROVIDER` at `minimax` / `anthropic`. |
| Long function cold start | AI SDKs + Pillow are heavy | Normal; warm start is < 50 ms. |

---

## 10 — One-liner summary

```
MongoDB Atlas M0
        │
        ▼
Vercel project (frontend build + api/index.py)
        │
        ├── Anthropic Claude Sonnet 4.5   ┐
        ├── Fireworks (Llama / DeepSeek)  ├─ pick one, AI_PROVIDER selects
        └── MiniMax (multilingual)        ┘
```

That's the whole stack.
