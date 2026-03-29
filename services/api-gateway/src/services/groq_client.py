"""Groq API client for LLM interactions (free tier — Llama 3).

Drop-in replacement for the previous Ollama client.
"""

import json
import logging

import httpx

from src.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Você é um assistente especializado em criação de conteúdo para vídeos.
Você ajuda criadores a criar roteiros, escolher avatares e estilos visuais para seus vídeos.

Quando o usuário pedir um roteiro, forneça:
1. O roteiro completo no campo "script"
2. Uma sugestão de avatar adequado ao conteúdo
3. Um estilo visual recomendado

Responda sempre em formato JSON com esta estrutura:
{
  "message": "sua resposta amigável ao usuário",
  "script": "roteiro completo (ou null se não aplicável)",
  "suggested_avatar": "tipo de avatar sugerido (ou null)",
  "suggested_style": "estilo visual sugerido (ou null)"
}

Se o usuário não pedir roteiro, coloque null nos campos script, suggested_avatar e suggested_style.
"""

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


class LLMError(Exception):
    """Raised when LLM fails to respond."""


class LLMMessage:
    def __init__(
        self,
        message: str,
        script: str | None = None,
        suggested_avatar: str | None = None,
        suggested_style: str | None = None,
    ) -> None:
        self.message = message
        self.script = script
        self.suggested_avatar = suggested_avatar
        self.suggested_style = suggested_style


async def chat_with_llm(
    conversation_history: list[dict[str, str]],
    user_message: str,
) -> LLMMessage:
    """Send a message to Groq API and return parsed response."""
    if not settings.groq_api_key:
        raise LLMError("GROQ_API_KEY não configurada. Configure nas variáveis de ambiente.")

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(conversation_history)
    messages.append({"role": "user", "content": user_message})

    payload = {
        "model": settings.groq_model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 2048,
        "response_format": {"type": "json_object"},
    }

    try:
        async with httpx.AsyncClient(timeout=settings.groq_timeout) as client:
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
    except httpx.TimeoutException as exc:
        logger.error("Groq timeout after %ds", settings.groq_timeout)
        raise LLMError("LLM demorou demais para responder. Tente novamente.") from exc
    except httpx.HTTPStatusError as exc:
        logger.error("Groq HTTP error: %s %s", exc.response.status_code, exc.response.text[:200])
        raise LLMError("Erro ao comunicar com o LLM.") from exc
    except httpx.RequestError as exc:
        logger.error("Groq connection error: %s", exc)
        raise LLMError("LLM indisponível no momento.") from exc

    try:
        body = response.json()
        raw_content = body["choices"][0]["message"]["content"]
        data = json.loads(raw_content)
    except (KeyError, json.JSONDecodeError, ValueError, IndexError) as exc:
        logger.warning("Groq non-JSON response, wrapping: %s", exc)
        raw_content = ""
        try:
            raw_content = body["choices"][0]["message"]["content"]
        except (KeyError, IndexError):
            pass
        data = {"message": raw_content or "Desculpe, não consegui processar sua mensagem."}

    return LLMMessage(
        message=data.get("message", ""),
        script=data.get("script"),
        suggested_avatar=data.get("suggested_avatar"),
        suggested_style=data.get("suggested_style"),
    )
