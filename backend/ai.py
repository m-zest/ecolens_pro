"""
AI narrative layer for EcoLens.

Three providers are supported. Set **one** API key and, optionally, point
`AI_PROVIDER` at it:

  - **Anthropic Claude Sonnet 4.5** — official `anthropic` SDK.
    Top-tier editorial prose.
  - **Fireworks AI** — OpenAI-compatible REST. Hosts Llama / DeepSeek / Qwen.
    Cheap and fast.
  - **MiniMax** — OpenAI-compatible REST (`api.minimaxi.chat`). Strong
    multilingual models (IT / DE / PL, plus CN).

Provider selection:
  `AI_PROVIDER=anthropic|fireworks|minimax|auto`  (default `auto`)

  In `auto` mode, whichever key is set wins, in this preference order:
      anthropic → fireworks → minimax

  If the chosen provider's key is unset, we transparently fall through to
  the next available one before raising.

Env vars
  ANTHROPIC_API_KEY       AI_MODEL           (default claude-sonnet-4-5-20250929)
  FIREWORKS_API_KEY       FIREWORKS_MODEL    (default llama-v3p3-70b-instruct)
  MINIMAX_API_KEY         MINIMAX_MODEL      (default MiniMax-Text-01)
                          MINIMAX_BASE_URL   (default api.minimaxi.chat v2)
"""
from __future__ import annotations
import os
import re
import json
import logging
from typing import Any

logger = logging.getLogger("ecolens.ai")

ANTHROPIC_KEY_ENV = "ANTHROPIC_API_KEY"
FIREWORKS_KEY_ENV = "FIREWORKS_API_KEY"
MINIMAX_KEY_ENV = "MINIMAX_API_KEY"

ANTHROPIC_MODEL = os.environ.get("AI_MODEL", "claude-sonnet-4-5-20250929")

FIREWORKS_MODEL = os.environ.get(
    "FIREWORKS_MODEL", "accounts/fireworks/models/llama-v3p3-70b-instruct"
)
FIREWORKS_BASE = "https://api.fireworks.ai/inference/v1/chat/completions"

MINIMAX_MODEL = os.environ.get("MINIMAX_MODEL", "MiniMax-Text-01")
MINIMAX_BASE = os.environ.get(
    "MINIMAX_BASE_URL", "https://api.minimaxi.chat/v1/chat/completions"
)

PROVIDER_DEFAULT = os.environ.get("AI_PROVIDER", "auto").lower()


def _anthropic_key() -> str | None:
    return os.environ.get(ANTHROPIC_KEY_ENV)


def _fireworks_key() -> str | None:
    return os.environ.get(FIREWORKS_KEY_ENV)


def _minimax_key() -> str | None:
    return os.environ.get(MINIMAX_KEY_ENV)


def is_configured() -> bool:
    return bool(_anthropic_key() or _fireworks_key() or _minimax_key())


def _clean_json(text: str) -> Any:
    """Providers are instructed to return raw JSON; be defensive anyway."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


def _first_available(chain: list[str]) -> str | None:
    """Return the first provider name in `chain` whose key is set."""
    for name in chain:
        if name == "anthropic" and _anthropic_key():
            return name
        if name == "fireworks" and _fireworks_key():
            return name
        if name == "minimax" and _minimax_key():
            return name
    return None


def _resolve_provider() -> str:
    """Pick the provider that will actually be called, based on AI_PROVIDER."""
    if PROVIDER_DEFAULT in ("anthropic", "fireworks", "minimax"):
        chain = [PROVIDER_DEFAULT, "anthropic", "fireworks", "minimax"]
    else:
        chain = ["anthropic", "fireworks", "minimax"]
    chosen = _first_available(chain)
    if not chosen:
        raise RuntimeError(
            "AI layer not configured. Set ANTHROPIC_API_KEY, FIREWORKS_API_KEY, "
            "or MINIMAX_API_KEY."
        )
    return chosen


async def _call_anthropic(prompt: str, system: str) -> str:
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=_anthropic_key())
    msg = await client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=1200,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )
    return "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")


async def _call_openai_compatible(
    url: str, api_key: str, model: str, prompt: str, system: str,
) -> str:
    import httpx

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    body: dict[str, Any] = {
        "model": model,
        "max_tokens": 250,
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
    }
    async with httpx.AsyncClient(timeout=20.0) as http:
        r = await http.post(url, headers=headers, json=body)
        r.raise_for_status()
        data = r.json()
    return data["choices"][0]["message"]["content"]


async def generate_json(prompt: str, system: str, session_id: str) -> Any:
    """Send prompt, expect STRICT JSON reply, return parsed Python object."""
    provider = _resolve_provider()

    if provider == "anthropic":
        raw = await _call_anthropic(prompt, system)
        logger.info("AI story via anthropic (model=%s)", ANTHROPIC_MODEL)
    elif provider == "fireworks":
        raw = await _call_openai_compatible(
            FIREWORKS_BASE, _fireworks_key(), FIREWORKS_MODEL, prompt, system,
        )
        logger.info("AI story via fireworks (model=%s)", FIREWORKS_MODEL)
    else:
        raw = await _call_openai_compatible(
            MINIMAX_BASE, _minimax_key(), MINIMAX_MODEL, prompt, system,
        )
        logger.info("AI story via minimax (model=%s)", MINIMAX_MODEL)

    return _clean_json(raw)
