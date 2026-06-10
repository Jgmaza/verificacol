import json
import logging
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Optional

logger = logging.getLogger("verificacol.transcription")


def _venv_bin(name: str) -> Optional[str]:
    venv_exe = Path(__file__).resolve().parents[1] / ".venv" / "bin" / name
    return str(venv_exe) if venv_exe.exists() else None


def _find_ffmpeg() -> Optional[str]:
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg:
        logger.debug("ffmpeg encontrado en PATH: %s", ffmpeg)
        return ffmpeg
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        logger.debug("ffmpeg via imageio_ffmpeg: %s", exe)
        return exe
    except ImportError:
        logger.warning("imageio_ffmpeg no instalado")
        return None


def _prepare_env() -> dict:
    """Prepara PATH con ffmpeg accesible como comando 'ffmpeg'."""
    env = os.environ.copy()
    ffmpeg = _find_ffmpeg()
    if not ffmpeg:
        logger.warning("ffmpeg no disponible — whisper puede fallar")
        return env

    ffmpeg_path = Path(ffmpeg)
    bin_dir = ffmpeg_path.parent
    env["PATH"] = f"{bin_dir}:{env.get('PATH', '')}"

    # Whisper busca el binario 'ffmpeg', no el nombre largo de imageio
    ffmpeg_link = bin_dir / "ffmpeg"
    if ffmpeg_path.name != "ffmpeg" and not ffmpeg_link.exists():
        try:
            ffmpeg_link.symlink_to(ffmpeg_path)
            logger.info("Symlink ffmpeg creado: %s -> %s", ffmpeg_link, ffmpeg_path)
        except OSError as e:
            logger.warning("No se pudo crear symlink ffmpeg: %s", e)

    return env


def _find_yt_dlp() -> str:
    for candidate in [_venv_bin("yt-dlp"), shutil.which("yt-dlp")]:
        if candidate:
            logger.debug("yt-dlp: %s", candidate)
            return candidate
    user_bin = Path.home() / "Library/Python/3.9/bin/yt-dlp"
    if user_bin.exists():
        return str(user_bin)
    raise RuntimeError("yt-dlp no encontrado. Ejecuta: cd backend && ./run.sh")


def _find_whisper() -> str:
    for candidate in [_venv_bin("whisper"), shutil.which("whisper")]:
        if candidate:
            logger.debug("whisper: %s", candidate)
            return candidate
    user_bin = Path.home() / "Library/Python/3.9/bin/whisper"
    if user_bin.exists():
        return str(user_bin)
    raise RuntimeError("whisper no encontrado. Ejecuta: cd backend && ./run.sh")


def _run_cmd(cmd: list, env: dict, timeout: int, step: str) -> subprocess.CompletedProcess:
    logger.info("[%s] Ejecutando: %s", step, " ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, env=env)
    if result.stdout:
        logger.debug("[%s] stdout (%d chars): %s", step, len(result.stdout), result.stdout[:500])
    if result.stderr:
        logger.debug("[%s] stderr (%d chars): %s", step, len(result.stderr), result.stderr[:500])
    if result.returncode != 0:
        logger.error("[%s] Falló con código %d", step, result.returncode)
        logger.error("[%s] stderr completo: %s", step, result.stderr)
        logger.error("[%s] stdout completo: %s", step, result.stdout)
    else:
        logger.info("[%s] OK", step)
    return result


def get_diagnostics() -> dict:
    ffmpeg = _find_ffmpeg()
    use_faster = os.getenv("USE_FASTER_WHISPER", "false").lower() == "true"
    return {
        "engine": "faster-whisper" if use_faster else "openai-whisper",
        "whisper_model": os.getenv("WHISPER_MODEL", "base"),
        "yt_dlp": _find_yt_dlp(),
        "whisper_cli": _find_whisper() if not use_faster else None,
        "ffmpeg": ffmpeg,
        "ffmpeg_on_path": shutil.which("ffmpeg") is not None,
    }


def _transcribe_faster_whisper(audio_file: Path, model: str) -> str:
    from faster_whisper import WhisperModel

    compute_type = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
    logger.info("[faster-whisper] Cargando modelo %s (%s)", model, compute_type)
    whisper_model = WhisperModel(model, device="cpu", compute_type=compute_type)
    segments, info = whisper_model.transcribe(str(audio_file), language="es")
    logger.info("[faster-whisper] idioma=%s prob=%.2f", info.language, info.language_probability)
    parts = [segment.text.strip() for segment in segments]
    return " ".join(p for p in parts if p)


def get_video_metadata(url: str) -> dict:
    yt_dlp = _find_yt_dlp()
    env = _prepare_env()
    result = _run_cmd(
        [yt_dlp, "--dump-json", "--no-warnings", url],
        env=env,
        timeout=60,
        step="metadata",
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"No se pudo obtener metadata (code {result.returncode}): "
            f"{result.stderr or result.stdout}"
        )

    lines = [l for l in result.stdout.strip().split("\n") if l.strip()]
    if not lines:
        raise RuntimeError("yt-dlp no devolvió JSON de metadata")

    data = json.loads(lines[-1])
    meta = {
        "title": data.get("title") or data.get("fulltitle"),
        "description": data.get("description"),
        "author": data.get("uploader") or data.get("channel"),
        "duration": data.get("duration"),
        "url": url,
        "extractor": data.get("extractor"),
    }
    logger.info("Metadata OK: author=%s duration=%s extractor=%s", meta["author"], meta["duration"], meta["extractor"])
    return meta


def _pick_audio_format(url: str, yt_dlp: str, env: dict) -> str:
    """Elige el mejor formato de solo-audio disponible."""
    result = _run_cmd(
        [yt_dlp, "-F", "--no-warnings", url],
        env=env,
        timeout=60,
        step="list-formats",
    )
    if result.returncode != 0:
        logger.warning("No se pudieron listar formatos, usando bestaudio/best")
        return "bestaudio[ext=m4a]/bestaudio/best"

    output = result.stdout
    audio_ids = []
    for line in output.splitlines():
        lower = line.lower()
        if "audio only" in lower or ("m4a" in lower and "audio" in lower):
            parts = line.split()
            if parts and (parts[0].isdigit() or parts[0].startswith("dash-")):
                audio_ids.append(parts[0])

    if audio_ids:
        chosen = audio_ids[0]
        logger.info("Formato de audio elegido: %s", chosen)
        return chosen

    return "bestaudio[ext=m4a]/bestaudio/best"


def transcribe_url(url: str, model: Optional[str] = None) -> dict:
    model = model or os.getenv("WHISPER_MODEL", "base")
    use_faster = os.getenv("USE_FASTER_WHISPER", "false").lower() == "true"
    logger.info(
        "=== Iniciando transcripción: %s (model=%s engine=%s) ===",
        url, model, "faster-whisper" if use_faster else "openai-whisper",
    )

    yt_dlp = _find_yt_dlp()
    whisper_bin = _find_whisper() if not use_faster else None
    env = _prepare_env()

    metadata = get_video_metadata(url)
    audio_format = _pick_audio_format(url, yt_dlp, env)

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        audio_path = tmp_path / "audio"
        logger.info("Directorio temporal: %s", tmp_path)

        download = _run_cmd(
            [
                yt_dlp,
                "-f", audio_format,
                "-o", str(audio_path) + ".%(ext)s",
                "--no-warnings",
                "--no-playlist",
                url,
            ],
            env=env,
            timeout=180,
            step="download",
        )
        if download.returncode != 0:
            logger.info("Reintentando descarga con bestaudio/best...")
            download = _run_cmd(
                [
                    yt_dlp,
                    "-f", "bestaudio[ext=m4a]/bestaudio/best",
                    "-o", str(audio_path) + ".%(ext)s",
                    "--no-warnings",
                    "--no-playlist",
                    url,
                ],
                env=env,
                timeout=180,
                step="download-fallback",
            )
            if download.returncode != 0:
                raise RuntimeError(
                    f"Error descargando audio: {download.stderr or download.stdout}"
                )

        audio_files = list(tmp_path.glob("audio.*"))
        logger.info("Archivos de audio encontrados: %s", [f.name for f in audio_files])
        if not audio_files:
            all_files = list(tmp_path.iterdir())
            raise RuntimeError(
                f"No se descargó audio. Archivos en tmp: {[f.name for f in all_files]}"
            )

        audio_file = audio_files[0]
        logger.info("Audio descargado: %s (%d bytes)", audio_file.name, audio_file.stat().st_size)

        if use_faster:
            transcript = _transcribe_faster_whisper(audio_file, model)
        else:
            output_dir = tmp_path / "out"
            output_dir.mkdir()

            whisper_cmd = [
                whisper_bin,
                str(audio_file),
                "--model", model,
                "--language", "es",
                "--output_dir", str(output_dir),
                "--output_format", "txt",
            ]

            transcribe = _run_cmd(
                whisper_cmd,
                env=env,
                timeout=600,
                step="whisper",
            )
            if transcribe.returncode != 0:
                raise RuntimeError(
                    f"Error transcribiendo (code {transcribe.returncode}): "
                    f"{transcribe.stderr or transcribe.stdout}"
                )

            txt_files = list(output_dir.glob("*.txt"))
            logger.info("Archivos de transcripción: %s", [f.name for f in txt_files])
            if not txt_files:
                raise RuntimeError(
                    f"Whisper no generó .txt. Salida whisper: {transcribe.stdout[-500:] if transcribe.stdout else 'vacía'}"
                )

            transcript = txt_files[0].read_text(encoding="utf-8").strip()

        logger.info("Transcripción OK: %d caracteres", len(transcript))

    return {
        **metadata,
        "transcript": transcript,
        "model": model,
    }
