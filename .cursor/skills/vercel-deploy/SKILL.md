---
name: vercel-deploy
description: >-
  Despliega VerificaCol: frontend en Vercel + backend Python en Render.
  Usa cuando el usuario quiera publicar la demo, configurar variables de entorno,
  o usar el MCP de Vercel desde Cursor.
---

# Despliegue VerificaCol — Guía completa

## Arquitectura producción

- **Vercel** → `frontend/` (Next.js) — análisis y chat con OpenAI
- **Render** → `backend/` (Docker + Whisper) — transcripción SIN créditos OpenAI
- **OpenAI API** → solo `/api/analyze` y `/api/chat`

## MCP de Vercel en Cursor

Archivo: `pruebaDani/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "vercel": {
      "url": "https://mcp.vercel.com"
    }
  }
}
```

Activación: Cursor Settings → MCP → vercel → **Needs login** → autorizar.

Con MCP activo el agente puede:
- Listar proyectos y deploys
- Ver logs de build/runtime
- Gestionar variables de entorno

## Orden de despliegue

### 1. Backend en Render (primero)

```bash
# Verificar Docker localmente (opcional)
cd backend && docker build -t verificacol-backend .
```

En Render:
- New → Blueprint → conectar repo
- `render.yaml` despliega automáticamente
- Env var: `ALLOWED_ORIGINS=https://MI-APP.vercel.app`
- Copiar URL del servicio

### 2. Frontend en Vercel

```bash
cd frontend
npx vercel login
npx vercel --prod
```

Variables obligatorias en Vercel:

| Variable | Valor producción |
|----------|----------------|
| `OPENAI_API_KEY` | sk-proj-... |
| `TRANSCRIPTION_MODE` | `local` |
| `BACKEND_URL` | URL de Render |

### 3. Verificar end-to-end

```bash
# Backend
curl https://BACKEND_URL/health

# Frontend
curl https://MI-APP.vercel.app
```

En la app: pegar URL de Instagram → Analizar (no demo) → debe transcribir vía Render.

## Checklist

- [ ] Repo en GitHub
- [ ] Render backend desplegado y `/health` OK
- [ ] `ALLOWED_ORIGINS` incluye URL de Vercel
- [ ] Vercel frontend desplegado
- [ ] `BACKEND_URL` apunta a Render en env vars de Vercel
- [ ] `OPENAI_API_KEY` en Vercel
- [ ] MCP Vercel autorizado en Cursor
- [ ] Probar transcripción real (no demo)

## Notas

- Whisper en Render necesita **mínimo 512MB-2GB RAM**. Si OOM, usar `WHISPER_MODEL=tiny`.
- La transcripción NUNCA usa OpenAI API — ahorra créditos.
- Ver `DEPLOY.md` para troubleshooting detallado.
