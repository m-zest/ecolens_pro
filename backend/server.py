"""
EcoLens backend — FastAPI + MongoDB.

Routes (all prefixed with /api):
  GET  /                               service info
  GET  /stats                          aggregated stats
  GET  /i18n/{locale}                  UI translation strings (en/it/de/pl)
  GET  /packagings                     list with optional category filter & search
  GET  /packagings/categories          list of categories
  GET  /packagings/{id}                detail
  GET  /packagings/{id}/card.png       shareable OG/report card PNG
  POST /packagings/compare             compare two by id
  POST /packagings/{id}/story          AI-generated 5-slide narrative (Claude Sonnet 4.5)
                                       body: {tone, locale}
  POST /submissions                    user-submitted packaging → computed EcoLens report
  GET  /submissions/{id}               retrieve submission
  GET  /submissions/{id}/card.png      shareable submission card PNG

AI layer: Anthropic Claude (direct `anthropic` SDK). See ai.py.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Response, Request
from fastapi.responses import HTMLResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import html
import logging
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional, Literal

from pydantic import BaseModel, Field, ConfigDict

import seed_data
import ai
import i18n as i18n_module
import share_card

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
# Public site URL (used to build QR codes + OG links). Falls back to the request host.
PUBLIC_SITE_URL = os.environ.get("PUBLIC_SITE_URL", "").rstrip("/")

client = AsyncIOMotorClient(
    MONGO_URL,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000,
    socketTimeoutMS=15000,
)
db = client[DB_NAME]

app = FastAPI(title="EcoLens API", version="1.1.0")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("ecolens")


# ---------- Models ----------
class LifecycleStage(BaseModel):
    stage: str
    co2_share: float
    note: str


class Packaging(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    category: str
    material: str
    format: str
    image: str
    co2_kg: float
    baseline_co2_kg: float
    water_l: float
    energy_mj: float
    recyclability_pct: int
    shelf_life_days: int
    cost_eur: float
    weight_g: float
    score_grade: Literal["A", "B", "C", "D", "E"]
    score_value: int
    highlights: List[str]
    lifecycle: List[LifecycleStage]


class CompareRequest(BaseModel):
    id_a: str
    id_b: str


class StoryRequest(BaseModel):
    tone: Optional[Literal["editorial", "playful", "technical"]] = "editorial"
    locale: Optional[str] = "en"


class StorySlide(BaseModel):
    title: str
    body: str
    icon_hint: str


class StoryResponse(BaseModel):
    packaging_id: str
    tone: str
    locale: str
    slides: List[StorySlide]


class SubmissionCreate(BaseModel):
    name: str
    category: str
    material: str
    format: str
    weight_g: float = Field(gt=0)
    recycled_content_pct: float = Field(ge=0, le=100)
    recyclable: bool
    compostable: bool
    transport_km: float = Field(ge=0)
    shelf_life_days: int = Field(ge=0)
    contact_email: Optional[str] = None
    is_public: bool = False


class SubmissionReport(BaseModel):
    id: str
    created_at: datetime
    input: SubmissionCreate
    co2_kg: float
    water_l: float
    energy_mj: float
    recyclability_pct: int
    score_grade: str
    score_value: int
    reasoning: List[str]
    is_public: bool = False


class PublicSubmission(BaseModel):
    """Lightweight public projection for the gallery."""
    id: str
    created_at: datetime
    name: str
    category: str
    material: str
    format: str
    co2_kg: float
    recyclability_pct: int
    score_grade: str
    score_value: int
    reasoning: List[str]


# ---------- Scoring / LCA estimator ----------
MATERIAL_INTENSITY = {
    "glass": {"co2": 0.85, "water": 4.0, "energy": 10.0},
    "pet": {"co2": 2.15, "water": 17.0, "energy": 45.0},
    "rpet": {"co2": 0.90, "water": 7.0, "energy": 18.0},
    "pp": {"co2": 1.95, "water": 3.0, "energy": 40.0},
    "hdpe": {"co2": 1.80, "water": 3.5, "energy": 38.0},
    "aluminium": {"co2": 8.20, "water": 18.0, "energy": 110.0},
    "aluminium_recycled": {"co2": 1.10, "water": 4.0, "energy": 20.0},
    "steel": {"co2": 1.85, "water": 8.0, "energy": 22.0},
    "paper": {"co2": 1.10, "water": 12.0, "energy": 18.0},
    "cardboard": {"co2": 0.95, "water": 9.0, "energy": 15.0},
    "pla": {"co2": 1.25, "water": 25.0, "energy": 28.0},
    "bagasse": {"co2": 0.80, "water": 14.0, "energy": 12.0},
    "bamboo": {"co2": 0.70, "water": 20.0, "energy": 15.0},
    "eps": {"co2": 3.40, "water": 4.0, "energy": 65.0},
    "multilayer": {"co2": 2.80, "water": 10.0, "energy": 55.0},
}


def _match_material(raw: str) -> str:
    r = raw.lower()
    if "rpet" in r or "recycled pet" in r:
        return "rpet"
    if "pet" in r:
        return "pet"
    if "glass" in r:
        return "glass"
    if "alumin" in r and ("recyc" in r or "secondary" in r):
        return "aluminium_recycled"
    if "alumin" in r:
        return "aluminium"
    if "steel" in r or "tin" in r:
        return "steel"
    if "hdpe" in r:
        return "hdpe"
    if "polypropylene" in r or r.strip() == "pp" or " pp" in r:
        return "pp"
    if "pla" in r:
        return "pla"
    if "bagasse" in r or "sugarcane" in r:
        return "bagasse"
    if "bamboo" in r:
        return "bamboo"
    if "eps" in r or "polystyrene" in r or "styrofoam" in r:
        return "eps"
    if "laminate" in r or "multi-layer" in r or "pouch" in r:
        return "multilayer"
    if "cardboard" in r or "kraft" in r:
        return "cardboard"
    if "paper" in r or "pulp" in r:
        return "paper"
    return "pp"


def estimate_report(s: SubmissionCreate) -> SubmissionReport:
    m = _match_material(s.material)
    intens = MATERIAL_INTENSITY[m]
    mass_kg = s.weight_g / 1000.0

    recycled_share = s.recycled_content_pct / 100.0
    co2 = mass_kg * intens["co2"] * (1 - 0.45 * recycled_share)
    water = mass_kg * intens["water"]
    energy = mass_kg * intens["energy"] * (1 - 0.35 * recycled_share)

    # Freight: 62 g CO2 per tonne.km (EU truck avg).
    co2 += (mass_kg / 1000.0) * s.transport_km * 0.062
    co2 = round(co2, 4)
    water = round(water, 3)
    energy = round(energy, 3)

    recyclability_pct = 0
    if s.recyclable:
        recyclability_pct = {
            "glass": 90, "aluminium": 76, "aluminium_recycled": 78, "steel": 82,
            "pet": 58, "rpet": 62, "paper": 85, "cardboard": 85, "pp": 38,
            "hdpe": 40, "pla": 18, "bagasse": 70, "bamboo": 60, "eps": 7, "multilayer": 5,
        }.get(m, 35)
    elif s.compostable:
        recyclability_pct = 60

    co2_score = max(0, 100 - (co2 / 0.002))
    recy_score = recyclability_pct
    rec_content_score = s.recycled_content_pct
    compost_bonus = 15 if s.compostable else 0
    transport_penalty = min(25, s.transport_km / 200.0)
    score_value = int(max(0, min(100, (
        0.45 * co2_score + 0.30 * recy_score + 0.15 * rec_content_score + 0.10 * 80
    ) + compost_bonus - transport_penalty)))

    grade = "A" if score_value >= 80 else "B" if score_value >= 65 else "C" if score_value >= 50 else "D" if score_value >= 35 else "E"

    reasoning = []
    if recycled_share > 0:
        reasoning.append(f"{int(recycled_share*100)}% recycled content cuts embodied CO₂ by ~{int(45*recycled_share)}%.")
    if s.compostable:
        reasoning.append("Industrial compostability opens an organics end-of-life route.")
    if s.recyclable and recyclability_pct >= 70:
        reasoning.append(f"Strong kerbside recycling infrastructure ({recyclability_pct}% EU rate).")
    if s.transport_km > 3000:
        reasoning.append(f"Long-haul transport ({int(s.transport_km)} km) adds measurable freight CO₂.")
    if m in ("eps", "multilayer"):
        reasoning.append("Material format is difficult to recover in EU MRFs.")
    if not reasoning:
        reasoning.append("Balanced profile — no single factor dominates the footprint.")

    return SubmissionReport(
        id=str(uuid.uuid4()),
        created_at=datetime.now(timezone.utc),
        input=s,
        co2_kg=co2,
        water_l=water,
        energy_mj=energy,
        recyclability_pct=recyclability_pct,
        score_grade=grade,
        score_value=score_value,
        reasoning=reasoning,
        is_public=s.is_public,
    )


def _site_url(request: Request) -> str:
    """Resolve the public site URL for QR codes + OG tags."""
    if PUBLIC_SITE_URL:
        return PUBLIC_SITE_URL
    # Fallback: derive from the incoming request.
    return f"{request.url.scheme}://{request.url.netloc}"


# ---------- Meta ----------
@api.get("/")
async def root():
    return {
        "service": "EcoLens",
        "version": "1.1.0",
        "ai_configured": ai.is_configured(),
        "locales": i18n_module.SUPPORTED,
    }


@api.get("/stats")
async def stats():
    all_p = seed_data.get_all()
    return {
        "packaging_count": len(all_p),
        "categories": len(seed_data.categories()),
        "avg_co2_kg": round(sum(p["co2_kg"] for p in all_p) / len(all_p), 3),
        "avg_recyclability_pct": round(sum(p["recyclability_pct"] for p in all_p) / len(all_p), 1),
        "data_source": "D4PACK methodology + Ecoinvent v3.9 reference values",
    }


@api.get("/i18n/{locale}")
async def get_i18n(locale: str):
    if locale not in i18n_module.SUPPORTED:
        raise HTTPException(404, f"Unsupported locale: {locale}")
    return {"locale": locale, "strings": i18n_module.get_ui(locale)}


# ---------- Packaging routes ----------
@api.get("/packagings/categories")
async def list_categories():
    return {"categories": seed_data.categories()}


@api.get("/packagings", response_model=List[Packaging])
async def list_packagings(category: Optional[str] = None, q: Optional[str] = None):
    items = seed_data.get_all()
    if category and category.lower() != "all":
        items = [p for p in items if p["category"].lower() == category.lower()]
    if q:
        t = q.lower()
        items = [p for p in items if t in p["name"].lower() or t in p["material"].lower() or t in p["category"].lower()]
    return items


@api.get("/packagings/{pid}", response_model=Packaging)
async def get_packaging(pid: str):
    p = seed_data.get_by_id(pid)
    if not p:
        raise HTTPException(404, "Packaging not found")
    return p


@api.get("/packagings/{pid}/card.png")
async def packaging_card(pid: str, request: Request):
    p = seed_data.get_by_id(pid)
    if not p:
        raise HTTPException(404, "Packaging not found")
    share_url = f"{_site_url(request)}/packaging/{pid}"
    png = share_card.render_packaging_card(p, share_url=share_url)
    return Response(
        content=png,
        media_type="image/png",
        headers={
            "Cache-Control": "public, max-age=86400",
            "Content-Disposition": f'inline; filename="ecolens-{pid}.png"',
        },
    )


@api.post("/packagings/compare")
async def compare(req: CompareRequest):
    a = seed_data.get_by_id(req.id_a)
    b = seed_data.get_by_id(req.id_b)
    if not a or not b:
        raise HTTPException(404, "One or both packagings not found")
    deltas = {
        "co2_kg": round(a["co2_kg"] - b["co2_kg"], 4),
        "water_l": round(a["water_l"] - b["water_l"], 3),
        "energy_mj": round(a["energy_mj"] - b["energy_mj"], 3),
        "recyclability_pct": a["recyclability_pct"] - b["recyclability_pct"],
        "shelf_life_days": a["shelf_life_days"] - b["shelf_life_days"],
        "score_value": a["score_value"] - b["score_value"],
    }
    winner = a["id"] if a["score_value"] >= b["score_value"] else b["id"]
    return {"a": a, "b": b, "deltas": deltas, "winner": winner}


# ---------- AI narrative ----------
STORY_SYSTEM = (
    "You are the editorial voice of EcoLens, a consumer-facing sustainability publication "
    "funded under the EU D4PACK programme. Your job: turn dry LCA packaging data into a "
    "short, honest, concrete narrative a shopper can grasp in 30 seconds. "
    "Avoid jargon, greenwashing, vague claims, and generic filler. "
    "Name real trade-offs where they exist. Always reference the concrete numbers you are given. "
    "Return STRICT JSON matching the schema provided — no prose, no markdown, no code fences."
)


@api.post("/packagings/{pid}/story", response_model=StoryResponse)
async def generate_story(pid: str, req: StoryRequest):
    p = seed_data.get_by_id(pid)
    if not p:
        raise HTTPException(404, "Packaging not found")
    if not ai.is_configured():
        raise HTTPException(
            503,
            "AI layer not configured. Set ANTHROPIC_API_KEY, FIREWORKS_API_KEY, or MINIMAX_API_KEY.",
        )

    locale = req.locale or "en"
    tone = req.tone or "editorial"

    # Mongo cache read — never block the whole request on a Mongo hiccup.
    cached = None
    try:
        cached = await db.stories.find_one(
            {"packaging_id": pid, "tone": tone, "locale": locale}, {"_id": 0}
        )
    except Exception as e:
        logger.warning("story cache read failed, falling through to AI: %s", e)
    if cached:
        return StoryResponse(**cached)

    delta = p["baseline_co2_kg"] - p["co2_kg"]
    delta_pct = (delta / p["baseline_co2_kg"]) * 100 if p["baseline_co2_kg"] else 0
    locale_line = i18n_module.narrative_locale_line(locale)

    user_prompt = f"""
Produce FIVE narrative slides telling the story of this packaging. Return JSON:
{{"slides":[{{"title":"...","body":"...","icon_hint":"..."}}, ... 5 items]}}

Rules:
- title: ≤ 6 words, Title Case, editorial.
- body: 1-2 sentences, ≤ 45 words, concrete, reference the numbers.
- icon_hint: one of leaf, factory, truck, recycle, compost, drop, bolt, clock, shield, coin, warning, sprout.
- Tone: {tone}.
{locale_line}
- Slide 1: the headline claim (carbon delta vs baseline).
- Slide 2: how it's made (material + process).
- Slide 3: what it protects (shelf life + food waste angle).
- Slide 4: end-of-life honesty (recyclability/compostability, including any limitations).
- Slide 5: the trade-off the shopper should actually know.

Data:
- Name: {p['name']} ({p['format']})
- Category: {p['category']}
- Material: {p['material']}
- Weight: {p['weight_g']} g
- CO₂: {p['co2_kg']} kg vs category baseline {p['baseline_co2_kg']} kg (Δ {delta:+.3f} kg, {delta_pct:+.0f}%)
- Water: {p['water_l']} L  | Energy: {p['energy_mj']} MJ
- Recyclability: {p['recyclability_pct']}% | Shelf life: {p['shelf_life_days']} days
- Grade: {p['score_grade']} ({p['score_value']}/100)
- Highlights: {p['highlights']}
"""

    try:
        data = await ai.generate_json(
            prompt=user_prompt,
            system=STORY_SYSTEM,
            session_id=f"ecolens-story-{pid}-{tone}-{locale}",
        )
        slides = [StorySlide(**s) for s in data["slides"]][:5]
    except Exception as e:
        logger.error(f"Story generation failed for {pid}: {e}")
        raise HTTPException(502, f"AI story generation failed: {e}")

    response = StoryResponse(packaging_id=pid, tone=tone, locale=locale, slides=slides)
    # Mongo cache write — best effort. If it fails, still return the story.
    try:
        await db.stories.update_one(
            {"packaging_id": pid, "tone": tone, "locale": locale},
            {"$set": response.model_dump()},
            upsert=True,
        )
    except Exception as e:
        logger.warning("story cache write failed (non-fatal): %s", e)
    return response


# ---------- Submissions ----------
# A handful of plausible brand submissions we insert on first call so the
# gallery isn't empty for the demo. Runs once — guarded by a marker doc.
GALLERY_SEED: List[dict] = [
    {
        "name": "Verde Valley Oat Milk 1L",
        "category": "Dairy",
        "material": "Recycled PET",
        "format": "1 L bottle",
        "weight_g": 28.0,
        "recycled_content_pct": 100.0,
        "recyclable": True, "compostable": False,
        "transport_km": 240, "shelf_life_days": 90,
    },
    {
        "name": "Nordic Roast Coffee 250 g",
        "category": "Pantry",
        "material": "Multi-layer laminate pouch",
        "format": "250 g valve pouch",
        "weight_g": 12.0,
        "recycled_content_pct": 15.0,
        "recyclable": False, "compostable": False,
        "transport_km": 1800, "shelf_life_days": 365,
    },
    {
        "name": "Alpine Yoghurt 500 g",
        "category": "Dairy",
        "material": "Glass",
        "format": "500 g returnable jar",
        "weight_g": 260.0,
        "recycled_content_pct": 65.0,
        "recyclable": True, "compostable": False,
        "transport_km": 180, "shelf_life_days": 21,
    },
    {
        "name": "Terra Mushrooms Tray",
        "category": "Produce",
        "material": "Moulded pulp",
        "format": "250 g tray",
        "weight_g": 8.0,
        "recycled_content_pct": 95.0,
        "recyclable": True, "compostable": True,
        "transport_km": 120, "shelf_life_days": 10,
    },
    {
        "name": "Sunrise Granola 450 g",
        "category": "Pantry",
        "material": "Kraft Paper",
        "format": "450 g gusseted bag",
        "weight_g": 18.0,
        "recycled_content_pct": 40.0,
        "recyclable": True, "compostable": False,
        "transport_km": 600, "shelf_life_days": 240,
    },
    {
        "name": "Lago Sparkling Water 330 ml",
        "category": "Beverages",
        "material": "Recycled Aluminium",
        "format": "330 ml can",
        "weight_g": 14.0,
        "recycled_content_pct": 75.0,
        "recyclable": True, "compostable": False,
        "transport_km": 420, "shelf_life_days": 540,
    },
    {
        "name": "Cedar Grove Salad Bowl",
        "category": "Food Service",
        "material": "Sugarcane Bagasse",
        "format": "750 ml bowl + lid",
        "weight_g": 22.0,
        "recycled_content_pct": 100.0,
        "recyclable": False, "compostable": True,
        "transport_km": 350, "shelf_life_days": 0,
    },
    {
        "name": "Harvest Pasta 500 g",
        "category": "Pantry",
        "material": "Cardboard",
        "format": "500 g rigid box",
        "weight_g": 32.0,
        "recycled_content_pct": 85.0,
        "recyclable": True, "compostable": False,
        "transport_km": 900, "shelf_life_days": 720,
    },
]


async def _maybe_seed_gallery() -> None:
    """Insert a handful of sample public submissions once, if the gallery is
    empty. Guarded by a marker doc so cold starts don't race."""
    try:
        already = await db.submissions.find_one({"_marker": "gallery_seed"})
        if already:
            return
        has_public = await db.submissions.find_one({"is_public": True})
        if has_public:
            await db.submissions.update_one(
                {"_marker": "gallery_seed"},
                {"$set": {"_marker": "gallery_seed", "seeded_at": datetime.now(timezone.utc).isoformat()}},
                upsert=True,
            )
            return
        for sample in GALLERY_SEED:
            payload = SubmissionCreate(**sample, is_public=True)
            report = estimate_report(payload)
            doc = report.model_dump()
            doc["created_at"] = report.created_at.isoformat()
            doc["input"] = payload.model_dump()
            doc["is_public"] = True
            await db.submissions.insert_one(doc)
        await db.submissions.update_one(
            {"_marker": "gallery_seed"},
            {"$set": {"_marker": "gallery_seed", "seeded_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )
        logger.info("Gallery seeded with %d sample submissions", len(GALLERY_SEED))
    except Exception as e:
        logger.error("Gallery seed failed: %s", e)


@api.get("/submissions", response_model=List[PublicSubmission])
async def list_public_submissions(limit: int = 48):
    """Public gallery: only returns submissions explicitly flagged is_public=True.

    Never 500s — if Mongo is unreachable, returns an empty list so the
    frontend can render the empty-state card instead of spinning forever.
    """
    try:
        await _maybe_seed_gallery()
        cursor = db.submissions.find({"is_public": True}, {"_id": 0}).sort("created_at", -1).limit(min(limit, 100))
        out = []
        async for d in cursor:
            created = d["created_at"]
            if isinstance(created, str):
                created = datetime.fromisoformat(created)
            out.append(PublicSubmission(
                id=d["id"],
                created_at=created,
                name=d["input"].get("name") or "Untitled",
                category=d["input"].get("category", "—"),
                material=d["input"].get("material", "—"),
                format=d["input"].get("format", ""),
                co2_kg=d["co2_kg"],
                recyclability_pct=d["recyclability_pct"],
                score_grade=d["score_grade"],
                score_value=d["score_value"],
                reasoning=d.get("reasoning", [])[:2],
            ))
        return out
    except Exception as e:
        logger.error("list_public_submissions failed (returning empty): %s", e)
        return []


@api.post("/submissions", response_model=SubmissionReport)
async def create_submission(payload: SubmissionCreate):
    report = estimate_report(payload)
    doc = report.model_dump()
    doc["created_at"] = report.created_at.isoformat()
    doc["input"] = payload.model_dump()
    doc["is_public"] = bool(payload.is_public)
    await db.submissions.insert_one(doc.copy())
    return report


@api.get("/submissions/{sid}", response_model=SubmissionReport)
async def get_submission(sid: str):
    doc = await db.submissions.find_one({"id": sid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Submission not found")
    if isinstance(doc["created_at"], str):
        doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    return SubmissionReport(**doc)


@api.get("/submissions/{sid}/card.png")
async def submission_card(sid: str, request: Request):
    doc = await db.submissions.find_one({"id": sid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Submission not found")
    share_url = f"{_site_url(request)}/submission/{sid}"
    png = share_card.render_submission_card(doc, doc["input"].get("name", ""), share_url=share_url)
    return Response(
        content=png,
        media_type="image/png",
        headers={
            "Cache-Control": "public, max-age=86400",
            "Content-Disposition": f'inline; filename="ecolens-report-{sid}.png"',
        },
    )


# ---------- Share pages with OG meta tags (social crawlers) ----------
SHARE_HTML = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>{title}</title>
<meta name="description" content="{description}"/>
<meta property="og:type" content="article"/>
<meta property="og:title" content="{title}"/>
<meta property="og:description" content="{description}"/>
<meta property="og:image" content="{image}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:url" content="{canonical}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="{title}"/>
<meta name="twitter:description" content="{description}"/>
<meta name="twitter:image" content="{image}"/>
<link rel="canonical" href="{canonical}"/>
<meta http-equiv="refresh" content="0; url={canonical}"/>
<style>
  body {{ font-family: -apple-system, system-ui, sans-serif; background: #F4F1EA; color: #1A362D;
         display: grid; place-items: center; min-height: 100vh; margin: 0; text-align: center; padding: 2rem; }}
  a {{ color: #C25934; }}
</style>
</head>
<body>
  <div>
    <h1 style="font-weight: 300; font-size: 2rem;">Redirecting to EcoLens…</h1>
    <p>If you aren't redirected, <a href="{canonical}">open the report</a>.</p>
  </div>
</body>
</html>
"""


@app.get("/share/packaging/{pid}", response_class=HTMLResponse)
async def share_packaging(pid: str, request: Request):
    p = seed_data.get_by_id(pid)
    if not p:
        raise HTTPException(404, "Packaging not found")
    site = _site_url(request)
    api_host = f"{request.url.scheme}://{request.url.netloc}"
    delta = p["baseline_co2_kg"] - p["co2_kg"]
    delta_pct = int((delta / p["baseline_co2_kg"]) * 100) if p["baseline_co2_kg"] else 0
    description = (
        f"GreenScore {p['score_grade']} ({p['score_value']}/100) · "
        f"{p['co2_kg']} kg CO₂ · {delta_pct:+d}% vs category baseline · "
        f"{p['recyclability_pct']}% recyclable. Read the full 30-second story on EcoLens."
    )
    return HTMLResponse(content=SHARE_HTML.format(
        title=html.escape(f"{p['name']} — EcoLens"),
        description=html.escape(description),
        image=f"{api_host}/api/packagings/{pid}/card.png",
        canonical=f"{site}/packaging/{pid}",
    ))


@app.get("/share/submission/{sid}", response_class=HTMLResponse)
async def share_submission(sid: str, request: Request):
    doc = await db.submissions.find_one({"id": sid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Submission not found")
    site = _site_url(request)
    api_host = f"{request.url.scheme}://{request.url.netloc}"
    name = doc["input"].get("name") or "Your packaging"
    description = (
        f"GreenScore {doc['score_grade']} ({doc['score_value']}/100) · "
        f"{doc['co2_kg']} kg CO₂ · {doc['recyclability_pct']}% recyclable. "
        "Scored with the EcoLens submission tool."
    )
    canonical = f"{site}/submission/{sid}" if doc.get("is_public") else f"{site}/"
    return HTMLResponse(content=SHARE_HTML.format(
        title=html.escape(f"{name} — EcoLens report"),
        description=html.escape(description),
        image=f"{api_host}/api/submissions/{sid}/card.png",
        canonical=canonical,
    ))


# ---------- Mount ----------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db():
    client.close()
