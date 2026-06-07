import io
import json
import re
from pathlib import Path

import httpx
from bs4 import BeautifulSoup

SOURCES_PATH = Path(__file__).resolve().parents[2] / "data" / "sources.json"
CACHE_DIR = Path(__file__).resolve().parents[1] / "cache"
CACHE_DIR.mkdir(exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; VerificaCol/1.0; +educational)"
}


def _load_sources() -> dict:
    return json.loads(SOURCES_PATH.read_text(encoding="utf-8"))


def _clean_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
        tag.decompose()
    lines = []
    for el in soup.find_all(["h1", "h2", "h3", "h4", "p", "li"]):
        text = el.get_text(" ", strip=True)
        if len(text) > 20:
            lines.append(text)
    return "\n\n".join(lines[:200])


def _extract_pdf_text(url: str) -> str:
    try:
        from pypdf import PdfReader
    except ImportError:
        return ""

    with httpx.Client(timeout=30, follow_redirects=True) as client:
        response = client.get(url, headers=HEADERS)
        response.raise_for_status()
        reader = PdfReader(io.BytesIO(response.content))
        pages = []
        for page in reader.pages[:30]:
            text = page.extract_text()
            if text:
                pages.append(text)
        return "\n\n".join(pages)


def _fetch_url(url: str) -> str:
    with httpx.Client(timeout=30, follow_redirects=True) as client:
        response = client.get(url, headers=HEADERS)
        response.raise_for_status()
        return response.text


def scrape_candidate(candidate_id: str, force: bool = False) -> dict:
    sources = _load_sources()
    candidate = sources["candidates"].get(candidate_id)
    if not candidate:
        raise ValueError(f"Candidato no encontrado: {candidate_id}")

    cache_file = CACHE_DIR / f"{candidate_id}.json"
    if cache_file.exists() and not force:
        return json.loads(cache_file.read_text(encoding="utf-8"))

    texts = []
    fetched_from = []

    primary = candidate["sources"].get("primary")
    if primary:
        try:
            html = _fetch_url(primary)
            text = _clean_text(html)
            if text:
                texts.append(f"--- Fuente: {primary} ---\n{text}")
                fetched_from.append(primary)
        except Exception as e:
            texts.append(f"[Error scrapeando {primary}: {e}]")

    pdf_url = candidate["sources"].get("pdf")
    if pdf_url:
        try:
            pdf_text = _extract_pdf_text(pdf_url)
            if pdf_text:
                texts.append(f"--- Fuente PDF: {pdf_url} ---\n{pdf_text}")
                fetched_from.append(pdf_url)
        except Exception as e:
            texts.append(f"[Error leyendo PDF {pdf_url}: {e}]")

    if len("".join(texts)) < 500:
        fallback = candidate["sources"].get("fallback")
        if fallback:
            try:
                html = _fetch_url(fallback)
                text = _clean_text(html)
                if text:
                    texts.append(f"--- Fuente respaldo: {fallback} ---\n{text}")
                    fetched_from.append(fallback)
            except Exception as e:
                texts.append(f"[Error scrapeando respaldo {fallback}: {e}]")

    raw_content = "\n\n".join(texts)
    raw_content = re.sub(r"\n{3,}", "\n\n", raw_content)[:50000]

    result = {
        "id": candidate_id,
        "name": candidate["name"],
        "party": candidate["party"],
        "programTitle": candidate["programTitle"],
        "sources": fetched_from,
        "rawContent": raw_content,
        "charCount": len(raw_content),
    }

    cache_file.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    return result


def list_candidates() -> list[dict]:
    sources = _load_sources()
    return [
        {
            "id": c["id"],
            "name": c["name"],
            "party": c["party"],
            "programTitle": c["programTitle"],
        }
        for c in sources["candidates"].values()
    ]
