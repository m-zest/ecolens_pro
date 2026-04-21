from __future__ import annotations
import os
import re
import json
import logging
from typing import Any

logger = logging.getLogger("ecolens.ai")

# ENV KEYS
ANTHROPIC_KEY_ENV = "ANTHROPIC_API_KEY"
FIREWORKS_KEY_ENV = "FIREWORKS_API_KEY"
MINIMAX_KEY_ENV = "MINIMAX_API_KEY"

# MODELS (optimized defaults)
ANTHROPIC_MODEL = os.environ.get("AI_MODEL", "claude-sonnet-4-5-20250929")

FIREWORKS_MODEL = os.environ.get(
    "FIREWORKS_MODEL",
    "accounts/fireworks/models/llama-v3p1-8b-instruct"  #  small, fast, widely available
)
FIREWORKS_BASE = "https://api.fireworks.ai/inference/v1/chat/completions"

MINIMAX_MODEL = os.environ.get("MINIMAX_MODEL", "MiniMax-Text-01")
MINIMAX_BASE = os.environ.get(
    "MINIMAX_BASE_URL",
    "https://api.minimaxi.chat/v1/chat/completions"
)

PROVIDER_DEFAULT = os.environ.get("AI_PROVIDER", "auto").lower()


# ------------------------
# ENV HELPERS
# ------------------------
def _anthropic_key() -> str | None:
    return os.environ.get(ANTHROPIC_KEY_ENV)


def _fireworks_key() -> str | None:
    return os.environ.get(FIREWORKS_KEY_ENV)


def _minimax_key() -> str | None:
    return os.environ.get(MINIMAX_KEY_ENV)


def is_configured() -> bool:
    return bool(_anthropic_key() or _fireworks_key() or _minimax_key())


# ------------------------
# JSON CLEANING
# ------------------------
def _clean_json(text: str) -> Any:
    text = text.strip()
    #  Strip reasoning-model preambles (qwen3-*, deepseek-r1, etc. wrap their
    #  output in <think>...</think> before the real answer — json.loads hates
    #  that). Non-greedy, dotall, case-insensitive.
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"^```(?:json)?\s*", "", text.strip())
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        #  Last-chance rescue: pull the first balanced JSON object out of
        #  whatever the model surrounded it with.
        m = re.search(r"\{[\s\S]*\}", text)
        if m:
            return json.loads(m.group(0))
        raise


# ------------------------
# PROVIDER SELECTION
# ------------------------
def _first_available(chain: list[str]) -> str | None:
    for name in chain:
        if name == "anthropic" and _anthropic_key():
            return name
        if name == "fireworks" and _fireworks_key():
            return name
        if name == "minimax" and _minimax_key():
            return name
    return None


def _resolve_provider() -> str:
    if PROVIDER_DEFAULT in ("anthropic", "fireworks", "minimax"):
        chain = [PROVIDER_DEFAULT, "anthropic", "fireworks", "minimax"]
    else:
        chain = ["anthropic", "fireworks", "minimax"]

    chosen = _first_available(chain)
    if not chosen:
        raise RuntimeError("No AI provider configured")

    return chosen


# ------------------------
# PROVIDERS
# ------------------------
async def _call_anthropic(prompt: str, system: str) -> str:
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=_anthropic_key())

    #  5 slides × (6-word title + 45-word body + icon) ≈ 260 output tokens.
    #  400 gives enough headroom without paying for slow long completions.
    msg = await client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=400,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )

    return "".join(
        b.text for b in msg.content if getattr(b, "type", "") == "text"
    )


async def _call_openai_compatible(
    url: str,
    api_key: str,
    model: str,
    prompt: str,
    system: str,
) -> str:
    import httpx

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    body: dict[str, Any] = {
        "model": model,
        "max_tokens": 400,
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
    }

    #  Hard 8s ceiling — the demo should never block longer than that. If
    #  the provider is slow we'd rather drop to the deterministic fallback.
    async with httpx.AsyncClient(timeout=8.0) as http:
        r = await http.post(url, headers=headers, json=body)
        if r.status_code >= 400:
            logger.error("provider %s returned %s: %s", url, r.status_code, r.text[:500])
            r.raise_for_status()
        data = r.json()

    return data["choices"][0]["message"]["content"]


# ------------------------
# MAIN FUNCTION (SAFE)
# ------------------------
async def generate_json(prompt: str, system: str, session_id: str) -> Any:
    provider = _resolve_provider()
    import time

    t0 = time.time()
    raw = ""
    try:
        if provider == "anthropic":
            raw = await _call_anthropic(prompt, system)
        elif provider == "fireworks":
            raw = await _call_openai_compatible(
                FIREWORKS_BASE, _fireworks_key(), FIREWORKS_MODEL, prompt, system,
            )
        else:
            raw = await _call_openai_compatible(
                MINIMAX_BASE, _minimax_key(), MINIMAX_MODEL, prompt, system,
            )
        elapsed = time.time() - t0
        logger.info("AI via %s in %.2fs, raw head=%r", provider, elapsed, raw[:300])
        return _clean_json(raw)

    except Exception as e:
        elapsed = time.time() - t0
        logger.error(
            "AI failed via %s after %.2fs: %s | raw head=%r",
            provider, elapsed, e, (raw or "")[:300],
        )

        #  FALLBACK (never break demo)
        #  Each slide must carry an icon_hint — Pydantic StorySlide requires it.
        return {
            "slides": [
                {"title": "Overview", "body": "A quick read on this packaging's LCA profile — materials, energy, recovery.", "icon_hint": "leaf"},
                {"title": "Carbon Story", "body": "Moderate emissions driven mainly by material production, not transport.", "icon_hint": "factory"},
                {"title": "End of Life", "body": "Recovery depends on kerbside systems and format recyclability.", "icon_hint": "recycle"},
                {"title": "Lifecycle", "body": "Production dominates the footprint; use-phase is minimal for packaging.", "icon_hint": "bolt"},
                {"title": "Trade-off", "body": "Durability vs recyclability — the choice rarely satisfies both at once.", "icon_hint": "warning"},
            ]
        }
