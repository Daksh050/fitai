"""
FitAI Brain — Custom AI engine powered by Google Gemini.
Generates personalised diet & workout plans with unique, conversational answers.
"""
import json
import re
from typing import Any, Dict, Optional
from app.core.config import settings
from app.services.local_brain import build_local_diet_plan, build_local_workout_plan

def _get_gemini_client():
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model_name = settings.AI_MODEL or "gemini-1.5-flash"
        return genai.GenerativeModel(
            model_name=model_name,
            generation_config={
                "temperature": 0.85,
                "top_p": 0.92,
                "top_k": 40,
                "max_output_tokens": 8192,
                "response_mime_type": "application/json",
            },
            system_instruction=(
                "You are FitAI Brain — an elite-level AI fitness coach and sports nutritionist. "
                "You are warm, direct, and science-backed. You give personalised, unique plans "
                "based on each athlete's exact physiology. Every output must be valid JSON. "
                "Never repeat canned advice. Always consider the user's specific numbers."
            ),
        )
    except Exception:
        return None


def _extract_json(raw: str) -> Dict[str, Any]:
    raw = raw.strip()
    # Strip markdown fences
    raw = re.sub(r"^```(?:json)?", "", raw, flags=re.MULTILINE).strip()
    raw = re.sub(r"```$", "", raw, flags=re.MULTILINE).strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end > start:
            return json.loads(raw[start:end + 1])
        raise


async def call_fitai_brain(prompt: str) -> Dict[str, Any]:
    """Call Gemini-powered FitAI Brain. Returns parsed JSON dict."""
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not set")

    client = _get_gemini_client()
    if client is None:
        raise RuntimeError("Could not initialise Gemini client — install google-generativeai")

    # Run in thread to avoid blocking the event loop
    import asyncio
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(None, client.generate_content, prompt)
    return _extract_json(response.text)


async def generate_structured_plan(
    prompt: str,
    fallback_factory,
) -> Dict[str, Any]:
    """Try Gemini brain first, fall back to local engine if needed."""
    provider = (settings.AI_PROVIDER or "local").strip().lower()

    if provider == "gemini" and settings.GEMINI_API_KEY:
        try:
            return await call_fitai_brain(prompt)
        except Exception as exc:
            if not settings.AI_FALLBACK_TO_LOCAL:
                raise RuntimeError(f"FitAI Brain error: {exc}") from exc
            # Fall through to local
    elif provider == "anthropic" and settings.ANTHROPIC_API_KEY:
        try:
            from app.services.provider_clients import call_anthropic_json
            return await call_anthropic_json(prompt)
        except Exception as exc:
            if not settings.AI_FALLBACK_TO_LOCAL:
                raise RuntimeError(f"Anthropic error: {exc}") from exc

    return fallback_factory()
