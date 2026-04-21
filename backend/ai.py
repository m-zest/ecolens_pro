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
    "accounts/fireworks/models/qwen3-8b"  #  fast + stable
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
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


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

    msg = await client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=300,  #  reduced from 1200
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
        "max_tokens": 200,  #  fast + safe
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
    }

    async with httpx.AsyncClient(timeout=15.0) as http:  #  reduced timeout
        r = await http.post(url, headers=headers, json=body)
        r.raise_for_status()
        data = r.json()

    return data["choices"][0]["message"]["content"]


# ------------------------
# MAIN FUNCTION (SAFE)
# ------------------------
async def generate_json(prompt: str, system: str, session_id: str) -> Any:
    provider = _resolve_provider()

    try:
        if provider == "anthropic":
            raw = await _call_anthropic(prompt, system)
            logger.info("AI via anthropic")

        elif provider == "fireworks":
            raw = await _call_openai_compatible(
                FIREWORKS_BASE,
                _fireworks_key(),
                FIREWORKS_MODEL,
                prompt,
                system,
            )
            logger.info("AI via fireworks")

        else:
            raw = await _call_openai_compatible(
                MINIMAX_BASE,
                _minimax_key(),
                MINIMAX_MODEL,
                prompt,
                system,
            )
            logger.info("AI via minimax")

        return _clean_json(raw)

    except Exception as e:
        logger.error("AI failed: %s", str(e))

        #  FALLBACK (never break demo)
        return {
            "slides": [
                {"title": "Overview", "body": "Packaging impact summary."},
                {"title": "CO₂", "body": "Moderate emissions based on material."},
                {"title": "Recyclability", "body": "Depends on local systems."},
                {"title": "Lifecycle", "body": "Production dominates impact."},
                {"title": "Trade-off", "body": "Balance between durability and sustainability."}
            ]
        }
