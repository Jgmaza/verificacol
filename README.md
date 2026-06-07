# VerificaCol — Validador de información electoral

Portal demo para combatir desinformación en época electoral. Analiza URLs (transcripción + credibilidad), simplifica propuestas de candidatos y permite conversar sobre el contenido.

## Requisitos

- Node.js 18+
- Python 3.9+
- API key de OpenAI

## Inicio rápido (demo local)

### 1. Backend Python (con venv)

```bash
cd backend
chmod +x run.sh
./run.sh
```

La primera vez crea `.venv`, instala dependencias y levanta uvicorn en `http://localhost:8000`.

**Alternativa manual:**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Si el puerto 8000 está ocupado:

```bash
PORT=8001 ./run.sh
```

Y en `frontend/.env.local` pon `BACKEND_URL=http://127.0.0.1:8001`.

### Transcripción falla — diagnóstico

1. Verifica que el backend responde:
   ```bash
   curl http://127.0.0.1:8000/health
   # Debe devolver: {"status":"ok","service":"verificacol-backend"}
   ```

2. Revisa herramientas instaladas:
   ```bash
   curl http://127.0.0.1:8000/diagnostics
   ```

3. Prueba transcripción directa (mira los logs en la terminal del backend):
   ```bash
   curl -X POST http://127.0.0.1:8000/transcribe \
     -H "Content-Type: application/json" \
     -d '{"url":"https://www.instagram.com/reel/DY7KQ0gRUOh/"}'
   ```

4. Si `/health` no devuelve `verificacol-backend`, otro servicio ocupa el puerto. Usa otro puerto y actualiza `BACKEND_URL`.

5. Los logs detallados aparecen en la terminal donde corre `./run.sh` (nivel DEBUG).

### 2. Frontend Next.js

```bash
cd frontend
cp .env.local.example .env.local
# Edita .env.local y agrega tu OPENAI_API_KEY

npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### Demo precargada

En la landing o en `/analizar`, haz clic en **Cargar demo** para ver el análisis del reel de Juan Daniel Oviedo sin esperar transcripción.

## Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Clave OpenAI (análisis + chat) | — |
| `TRANSCRIPTION_MODE` | `local` o `openai` | `local` |
| `BACKEND_URL` | URL del backend Python | `http://localhost:8000` |

## Estructura

```
pruebaDani/
├── frontend/          # Next.js 15 (deployable en Vercel)
├── backend/           # FastAPI (solo desarrollo local)
├── data/sources.json  # URLs de candidatos
└── .cursor/           # MCP Vercel + skill de deploy
```

## Funcionalidades

- **Analizar URL**: Instagram/YouTube → transcripción → detector de credibilidad → chat
- **Propuestas**: Iván Cepeda y Abelardo de la Espriella (scrape + resumen IA + chat)
- **Detector de credibilidad**: Puntuación 0-100, afirmaciones clasificadas, señales de alerta

## Despliegue en producción

**Arquitectura:** Vercel (frontend) + Render (backend Python con Whisper gratis)

La transcripción en producción **no gasta créditos OpenAI** — corre Whisper en el backend Docker.

Guía completa: **[DEPLOY.md](DEPLOY.md)**

### Resumen rápido

```bash
# 1. Backend en Render (conecta repo GitHub → Blueprint → render.yaml)
# 2. Frontend en Vercel
cd frontend && npx vercel login && npx vercel --prod

# Variables Vercel:
#   OPENAI_API_KEY, TRANSCRIPTION_MODE=local, BACKEND_URL=https://tu-backend.onrender.com
```

### MCP Vercel en Cursor

Activa `.cursor/mcp.json` → Settings → MCP → vercel → **Needs login**

Ver `.cursor/skills/vercel-deploy/SKILL.md` para el checklist completo.

## Limitaciones del MVP

- Sin base de datos ni historial de sesiones
- Sin fact-checking automático contra verificadores (Colombiacheck, etc.)
- Transcripción local requiere backend Python corriendo
- Scraping depende de que los sitios de campaña sigan accesibles
