import json
import logging
import os
import threading
from datetime import datetime, timezone
from typing import Any, Optional

logger = logging.getLogger("verificacol.jobs")

JOB_TTL_SECONDS = 3600
_lock = threading.Lock()
_processing = False


def _redis():
    from upstash_redis import Redis

    url = os.getenv("UPSTASH_REDIS_REST_URL")
    token = os.getenv("UPSTASH_REDIS_REST_TOKEN")
    if not url or not token:
        raise RuntimeError("UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN requeridos")
    return Redis(url=url, token=token)


def _job_key(job_id: str) -> str:
    return f"job:{job_id}"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_job(job_id: str) -> Optional[dict]:
    raw = _redis().get(_job_key(job_id))
    if not raw:
        return None
    if isinstance(raw, str):
        return json.loads(raw)
    return raw


def save_job(job_id: str, data: dict) -> None:
    data["updatedAt"] = _now()
    _redis().set(_job_key(job_id), json.dumps(data, ensure_ascii=False), ex=JOB_TTL_SECONDS)


def append_message(job_id: str, message: str) -> None:
    job = get_job(job_id)
    if not job:
        return
    messages = job.get("messages") or []
    if not messages or messages[-1] != message:
        messages.append(message)
    job["messages"] = messages
    save_job(job_id, job)


def update_job_status(job_id: str, status: str, **extra: Any) -> None:
    job = get_job(job_id) or {"id": job_id, "messages": []}
    job["status"] = status
    for key, value in extra.items():
        job[key] = value
    save_job(job_id, job)


def process_job(job_id: str) -> None:
    global _processing

    with _lock:
        if _processing:
            append_message(job_id, "Hay otro análisis en curso. Tu turno llegará enseguida...")
            return
        _processing = True

    try:
        job = get_job(job_id)
        if not job:
            logger.error("Job no encontrado: %s", job_id)
            return

        url = job.get("url")
        if not url:
            update_job_status(job_id, "error", error="URL no encontrada en el job")
            return

        append_message(job_id, "Recibí tu enlace. Voy a descargar el audio del video...")
        update_job_status(job_id, "downloading")

        from services.transcription import transcribe_url

        append_message(
            job_id,
            "Transcribiendo con Whisper local (sin gastar créditos OpenAI)...",
        )
        update_job_status(job_id, "transcribing")

        result = transcribe_url(url)

        append_message(
            job_id,
            f"Transcripción lista — {len(result.get('transcript', ''))} caracteres.",
        )
        update_job_status(
            job_id,
            "done",
            transcript=result.get("transcript"),
            metadata={
                "title": result.get("title"),
                "author": result.get("author"),
                "description": result.get("description"),
                "duration": result.get("duration"),
                "url": result.get("url") or url,
            },
        )
        logger.info("Job %s completado", job_id)

    except Exception as e:
        logger.exception("Job %s falló", job_id)
        append_message(job_id, f"Error: {str(e)}")
        update_job_status(job_id, "error", error=str(e))
    finally:
        with _lock:
            _processing = False
