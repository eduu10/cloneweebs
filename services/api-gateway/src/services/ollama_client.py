"""Ollama HTTP client for LLM interactions."""

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


class OllamaError(Exception):
    """Raised when Ollama fails to respond."""


class OllamaMessage:
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


async def chat_with_ollama(
    conversation_history: list[dict[str, str]],
    user_message: str,
) -> OllamaMessage:
    """Send a message to Ollama and return parsed response."""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(conversation_history)
    messages.append({"role": "user", "content": user_message})

    payload = {
        "model": settings.ollama_model,
        "messages": messages,
        "stream": False,
        "format": "json",
    }

    try:
        async with httpx.AsyncClient(
            timeout=settings.ollama_timeout
        ) as client:
            response = await client.post(
                f"{settings.ollama_base_url}/api/chat",
                json=payload,
            )
            response.raise_for_status()
    except httpx.TimeoutException as exc:
        logger.error("Ollama timeout after %ds", settings.ollama_timeout)
        raise OllamaError("LLM demorou demais para responder. Tente novamente.") from exc
    except httpx.HTTPStatusError as exc:
        logger.error("Ollama HTTP error: %s", exc)
        raise OllamaError("Erro ao comunicar com o LLM.") from exc
    except httpx.RequestError as exc:
        logger.error("Ollama connection error: %s", exc)
        raise OllamaError("LLM indisponível no momento.") from exc

    try:
        body = response.json()
        raw_content = body["message"]["content"]
        data = json.loads(raw_content)
    except (KeyError, json.JSONDecodeError, ValueError) as exc:
        logger.warning("Ollama non-JSON response, wrapping: %s", exc)
        raw_content = body.get("message", {}).get("content", "") if "body" in dir() else ""
        data = {"message": raw_content or "Desculpe, não consegui processar sua mensagem."}

    return OllamaMessage(
        message=data.get("message", ""),
        script=data.get("script"),
        suggested_avatar=data.get("suggested_avatar"),
        suggested_style=data.get("suggested_style"),
    )
