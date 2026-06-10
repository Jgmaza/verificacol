import logging
import os
import sys
import traceback

from fastapi import BackgroundTasks, FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.jobs import get_job, process_job, save_job
from services.scraper import list_candidates, scrape_candidate
from services.transcription import get_diagnostics, transcribe_url

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("verificacol")

app = FastAPI(title="VerificaCol Backend", version="1.0.0")

_default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
_extra = os.getenv("ALLOWED_ORIGINS", "")
_origins = _default_origins + [o.strip() for o in _extra.split(",") if o.strip()]
# Permitir cualquier preview de Vercel si está configurado
if os.getenv("ALLOW_VERCEL_PREVIEWS", "true").lower() == "true":
    _origins.append("https://*.vercel.app")

logger.info("CORS origins: %s", _origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TranscribeRequest(BaseModel):
    url: str
    model: str = "base"


class ScrapeRequest(BaseModel):
    candidate_id: str
    force: bool = False


class ProcessJobRequest(BaseModel):
    job_id: str


@app.get("/health")
def health():
    return {"status": "ok", "service": "verificacol-backend"}


@app.get("/diagnostics")
def diagnostics():
    try:
        return {"status": "ok", "tools": get_diagnostics()}
    except Exception as e:
        logger.exception("Error en diagnostics")
        return {"status": "error", "error": str(e)}


@app.post("/transcribe")
def transcribe(req: TranscribeRequest):
    logger.info("POST /transcribe url=%s model=%s", req.url, req.model)
    try:
        result = transcribe_url(req.url, model=req.model)
        logger.info("Transcripción completada: %d chars", len(result.get("transcript", "")))
        return result
    except Exception as e:
        logger.error("Transcripción falló: %s", e)
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/candidates")
def candidates():
    return {"candidates": list_candidates()}


@app.post("/scrape")
def scrape(req: ScrapeRequest):
    try:
        result = scrape_candidate(req.candidate_id, force=req.force)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("Scrape falló")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/jobs/{job_id}")
def get_job_status(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job no encontrado")
    return job


@app.post("/jobs/process")
def start_job_processing(
    req: ProcessJobRequest,
    background_tasks: BackgroundTasks,
    x_worker_secret: str | None = Header(default=None),
):
    secret = os.getenv("WORKER_SECRET")
    if secret and x_worker_secret != secret:
        raise HTTPException(status_code=401, detail="No autorizado")

    job = get_job(req.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job no encontrado")

    if job.get("status") not in ("queued", "error"):
        return {"status": "already_processing", "job_id": req.job_id}

    job["status"] = "queued"
    save_job(req.job_id, job)

    background_tasks.add_task(process_job, req.job_id)
    logger.info("Job %s encolado para procesamiento", req.job_id)
    return {"status": "accepted", "job_id": req.job_id}
