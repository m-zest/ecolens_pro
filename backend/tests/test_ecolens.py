"""EcoLens backend API tests — covers packagings, compare, story, submissions, stats."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ---------- Service health ----------
def test_root(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    d = r.json()
    assert d["service"] == "EcoLens"


def test_stats(s):
    r = s.get(f"{API}/stats")
    assert r.status_code == 200
    d = r.json()
    assert d["packaging_count"] == 25
    assert isinstance(d["categories"], int)
    assert isinstance(d["avg_co2_kg"], (int, float))
    assert isinstance(d["avg_recyclability_pct"], (int, float))


# ---------- Packaging list ----------
def test_list_all(s):
    r = s.get(f"{API}/packagings")
    assert r.status_code == 200
    d = r.json()
    assert len(d) == 25
    p = d[0]
    for k in ("id", "name", "category", "material", "image", "co2_kg",
              "score_grade", "lifecycle", "highlights"):
        assert k in p


def test_filter_category(s):
    r = s.get(f"{API}/packagings", params={"category": "Dairy"})
    assert r.status_code == 200
    d = r.json()
    assert all(p["category"] == "Dairy" for p in d)
    assert len(d) >= 1


def test_search_query(s):
    r = s.get(f"{API}/packagings", params={"q": "glass"})
    assert r.status_code == 200
    d = r.json()
    assert len(d) >= 1
    for p in d:
        joined = (p["name"] + p["material"] + p["category"]).lower()
        assert "glass" in joined


def test_categories(s):
    r = s.get(f"{API}/packagings/categories")
    assert r.status_code == 200
    cats = r.json()["categories"]
    assert isinstance(cats, list)
    assert len(cats) >= 8


# ---------- New packagings (10 added in v1.1) ----------
NEW_PACKAGINGS = [
    "mushroom-packaging",
    "aluminium-coffee-capsule",
    "wine-glass-bottle",
    "pla-cold-cup",
    "molded-pulp-tray",
    "rigid-cardboard-box",
    "hdpe-milk-jug",
    "paper-straw",
    "pet-salad-clamshell",
    "reusable-steel-bottle",
]


@pytest.mark.parametrize("pid", NEW_PACKAGINGS)
def test_new_packaging_detail(s, pid):
    r = s.get(f"{API}/packagings/{pid}")
    assert r.status_code == 200, f"{pid} returned {r.status_code}"
    d = r.json()
    assert d["id"] == pid
    assert d["score_grade"] in {"A", "B", "C", "D", "E"}
    assert len(d["lifecycle"]) >= 1
    assert d["highlights"]


# ---------- i18n ----------
@pytest.mark.parametrize("loc", ["en", "it", "de", "pl"])
def test_i18n_locales(s, loc):
    r = s.get(f"{API}/i18n/{loc}")
    assert r.status_code == 200
    d = r.json()
    assert d["locale"] == loc
    assert isinstance(d["strings"], dict)
    assert len(d["strings"]) >= 20


def test_i18n_invalid(s):
    r = s.get(f"{API}/i18n/xx")
    assert r.status_code == 404


def test_root_reports_i18n_and_ai(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    d = r.json()
    assert d["ai_configured"] is True
    assert set(d["locales"]) >= {"en", "it", "de", "pl"}


# ---------- Card PNGs ----------
@pytest.mark.parametrize("pid", ["glass-milk-bottle", "pet-water-bottle", "mushroom-packaging"])
def test_card_png(s, pid):
    r = s.get(f"{API}/packagings/{pid}/card.png")
    assert r.status_code == 200, r.text[:200]
    assert r.headers.get("content-type", "").startswith("image/png")
    assert r.content[:8] == b"\x89PNG\r\n\x1a\n"
    assert len(r.content) > 10_000


def test_card_png_404(s):
    r = s.get(f"{API}/packagings/unknown-xyz/card.png")
    assert r.status_code == 404


# ---------- Localised story (cold + warm) ----------
@pytest.mark.parametrize("loc", ["it", "de", "pl"])
def test_story_localised(s, loc):
    import time as _t
    t0 = _t.time()
    r = s.post(f"{API}/packagings/glass-milk-bottle/story",
               json={"tone": "editorial", "locale": loc}, timeout=60)
    cold = _t.time() - t0
    assert r.status_code == 200, f"{loc}: {r.status_code} {r.text[:300]}"
    d = r.json()
    assert d["locale"] == loc
    assert len(d["slides"]) == 5
    # Cache test
    t0 = _t.time()
    r2 = s.post(f"{API}/packagings/glass-milk-bottle/story",
                json={"tone": "editorial", "locale": loc}, timeout=10)
    warm = _t.time() - t0
    assert r2.status_code == 200
    assert r2.json() == d
    print(f"[{loc}] cold={cold:.2f}s warm={warm:.2f}s")
    assert warm < cold


# ---------- Detail ----------
@pytest.mark.parametrize("pid,expected_grade", [
    ("glass-milk-bottle", "A"),
    ("pet-water-bottle", "D"),
    ("eps-meat-tray", "E"),
])
def test_detail(s, pid, expected_grade):
    r = s.get(f"{API}/packagings/{pid}")
    assert r.status_code == 200
    d = r.json()
    assert d["id"] == pid
    assert d["score_grade"] == expected_grade
    assert len(d["lifecycle"]) >= 1


def test_detail_404(s):
    r = s.get(f"{API}/packagings/nonexistent-xyz")
    assert r.status_code == 404


# ---------- Compare ----------
def test_compare(s):
    r = s.post(f"{API}/packagings/compare",
               json={"id_a": "glass-milk-bottle", "id_b": "pet-water-bottle"})
    assert r.status_code == 200
    d = r.json()
    assert d["a"]["id"] == "glass-milk-bottle"
    assert d["b"]["id"] == "pet-water-bottle"
    assert "deltas" in d and "co2_kg" in d["deltas"]
    # Glass has higher score (88 > 42)
    assert d["winner"] == "glass-milk-bottle"


def test_compare_404(s):
    r = s.post(f"{API}/packagings/compare",
               json={"id_a": "nope", "id_b": "pet-water-bottle"})
    assert r.status_code == 404


# ---------- Story (AI) ----------
def test_story_generate_and_cache(s):
    t0 = time.time()
    r = s.post(f"{API}/packagings/pp-yogurt-cup/story",
               json={"tone": "editorial"}, timeout=60)
    elapsed_cold = time.time() - t0
    assert r.status_code == 200, f"Story failed: {r.status_code} {r.text[:300]}"
    d = r.json()
    assert d["packaging_id"] == "pp-yogurt-cup"
    assert d["tone"] == "editorial"
    assert len(d["slides"]) == 5
    for sl in d["slides"]:
        assert sl["title"] and sl["body"] and sl["icon_hint"]

    # Second call -> cached, should be fast
    t0 = time.time()
    r2 = s.post(f"{API}/packagings/pp-yogurt-cup/story",
                json={"tone": "editorial"}, timeout=15)
    elapsed_warm = time.time() - t0
    assert r2.status_code == 200
    assert r2.json() == d
    print(f"Story cold={elapsed_cold:.2f}s warm={elapsed_warm:.2f}s")
    assert elapsed_warm < elapsed_cold  # cache should be faster


def test_story_404(s):
    r = s.post(f"{API}/packagings/missing/story", json={"tone": "editorial"})
    assert r.status_code == 404


# ---------- Submissions ----------
SUBMISSION_ID = {"id": None}


def test_create_submission(s):
    payload = {
        "name": "TEST_Glass jar 250ml",
        "category": "Pantry",
        "material": "Glass",
        "format": "250 ml jar",
        "weight_g": 150.0,
        "recycled_content_pct": 60.0,
        "recyclable": True,
        "compostable": False,
        "transport_km": 400,
        "shelf_life_days": 540,
        "contact_email": "test@example.com"
    }
    r = s.post(f"{API}/submissions", json=payload)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["id"]
    assert d["score_grade"] in {"A", "B", "C", "D", "E"}
    assert isinstance(d["score_value"], int)
    assert d["co2_kg"] >= 0
    assert isinstance(d["reasoning"], list) and len(d["reasoning"]) >= 1
    SUBMISSION_ID["id"] = d["id"]


def test_get_submission(s):
    sid = SUBMISSION_ID["id"]
    assert sid, "create test must run first"
    r = s.get(f"{API}/submissions/{sid}")
    assert r.status_code == 200
    d = r.json()
    assert d["id"] == sid
    assert d["input"]["name"] == "TEST_Glass jar 250ml"


def test_get_submission_404(s):
    r = s.get(f"{API}/submissions/does-not-exist")
    assert r.status_code == 404


def test_submission_card_png(s):
    sid = SUBMISSION_ID["id"]
    assert sid, "create test must run first"
    r = s.get(f"{API}/submissions/{sid}/card.png")
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("image/png")
    assert r.content[:8] == b"\x89PNG\r\n\x1a\n"
    assert len(r.content) > 10_000
