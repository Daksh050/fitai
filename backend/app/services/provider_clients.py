import json
from typing import Any, Dict

import httpx

from app.core.config import settings

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


def get_active_ai_provider() -> str:
    provider = (settings.AI_PROVIDER or "local").strip().lower()
    if provider == "gemini" and settings.GEMINI_API_KEY:
        return "gemini"
    if provider == "anthropic" and settings.ANTHROPIC_API_KEY:
        return "anthropic"
    if provider in {"gemini", "anthropic"} and not settings.AI_FALLBACK_TO_LOCAL:
        raise RuntimeError(f"AI provider '{provider}' is selected but its API key is missing")
    return "local"


def get_default_model(provider: str) -> str:
    configured = (settings.AI_MODEL or "").strip()
    if configured:
        return configured
    if provider == "gemini":
        return "gemini-1.5-flash"
    if provider == "anthropic":
        return "claude-3-5-sonnet-latest"
    return "fitai-local-brain"


def extract_json_payload(raw_text: str) -> Dict[str, Any]:
    text = raw_text.strip()
    if "```json" in text:
        text = text.split("```json", 1)[1].split("```", 1)[0].strip()
    elif "```" in text:
        text = text.split("```", 1)[1].split("```", 1)[0].strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise


async def call_anthropic_json(prompt: str, max_tokens: int = 5000) -> Dict[str, Any]:
    headers = {
        "x-api-key": settings.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    payload = {
        "model": get_default_model("anthropic"),
        "max_tokens": max_tokens,
        "temperature": 0.6,
        "messages": [{"role": "user", "content": prompt}],
    }
    async with httpx.AsyncClient(timeout=45.0) as http:
        resp = await http.post(ANTHROPIC_API_URL, headers=headers, json=payload)
        resp.raise_for_status()
    data = resp.json()
    text = "".join(
        part.get("text", "")
        for part in data.get("content", [])
        if part.get("type") == "text"
    )
    return extract_json_payload(text)


async def call_gemini_json(prompt: str) -> Dict[str, Any]:
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.6,
            "responseMimeType": "application/json",
        },
    }
    async with httpx.AsyncClient(timeout=45.0) as http:
        resp = await http.post(
            GEMINI_API_URL.format(model=get_default_model("gemini")),
            params={"key": settings.GEMINI_API_KEY},
            json=payload,
        )
        resp.raise_for_status()
    data = resp.json()
    candidates = data.get("candidates", [])
    if not candidates:
        raise RuntimeError("Gemini returned no candidates")
    parts = candidates[0].get("content", {}).get("parts", [])
    text = "".join(part.get("text", "") for part in parts if "text" in part)
    return extract_json_payload(text)


async def generate_structured_plan(prompt: str, fallback_factory) -> Dict[str, Any]:
    provider = get_active_ai_provider()
    if provider == "local":
        return fallback_factory()
    if provider == "gemini":
        return await call_gemini_json(prompt)
    if provider == "anthropic":
        return await call_anthropic_json(prompt)
    return fallback_factory()
