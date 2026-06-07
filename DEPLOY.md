# Despliegue VerificaCol — Producción

Arquitectura en producción:

```
Usuario → Vercel (Next.js) → Render (Python + Whisper)  ← transcripción GRATIS
                ↓
           OpenAI API  ← solo análisis + chat (gpt-4o-mini)
```

La transcripción **no gasta créditos OpenAI** porque corre en el backend Python con Whisper local.

---

## Paso 1: Backend Python en Render (gratis de transcripción)

### Opción A — Blueprint (recomendado)

1. Sube este repo a GitHub
2. Ve a [render.com](https://render.com) → **New** → **Blueprint**
3. Conecta el repo — Render detecta `render.yaml`
4. Plan **Starter** (~$7/mes, 512MB puede ser justo; si falla Whisper usa Standard 2GB)
5. En variables de entorno agrega:
   ```
   ALLOWED_ORIGINS=https://TU-APP.vercel.app
   ```
6. Espera el deploy (~10-15 min la primera vez por el modelo Whisper)
7. Copia la URL: `https://verificacol-backend.onrender.com`

### Opción B — Docker manual

```bash
cd backend
docker build -t verificacol-backend .
docker run -p 8000:8000 -e ALLOWED_ORIGINS=https://tu-app.vercel.app verificacol-backend
```

### Verificar backend

```bash
curl https://verificacol-backend.onrender.com/health
curl https://verificacol-backend.onrender.com/diagnostics
```

---

## Paso 2: Frontend en Vercel

### Variables de entorno en Vercel Dashboard

| Variable | Valor |
|----------|-------|
| `OPENAI_API_KEY` | Tu clave de platform.openai.com |
| `TRANSCRIPTION_MODE` | `local` |
| `BACKEND_URL` | `https://verificacol-backend.onrender.com` |

### Deploy con CLI

```bash
cd frontend
npx vercel login
npx vercel --prod
```

### Deploy con Git

1. Importa el repo en [vercel.com/new](https://vercel.com/new)
2. **Root Directory**: `frontend`
3. Agrega las variables de entorno arriba
4. Deploy

---

## Paso 3: MCP de Vercel en Cursor

El archivo `.cursor/mcp.json` ya está configurado:

```json
{
  "mcpServers": {
    "vercel": {
      "url": "https://mcp.vercel.com"
    }
  }
}
```

**Para activarlo:**
1. Abre Cursor → Settings → MCP
2. Busca **vercel** → clic en **Needs login** → autoriza con tu cuenta
3. El agente podrá ver deploys, logs y variables desde Cursor

---

## Costos estimados

| Servicio | Uso | Costo |
|----------|-----|-------|
| Render (backend) | Whisper + yt-dlp | ~$7/mes (Starter) |
| Vercel (frontend) | Next.js | Gratis (hobby) |
| OpenAI API | Solo análisis + chat | ~$0.01 por video analizado |

**Ahorro:** La transcripción con Whisper local evita ~$0.006/min de OpenAI Whisper API.

---

## Troubleshooting

**Render: out of memory con Whisper**
→ Sube al plan Standard (2GB RAM) o cambia `WHISPER_MODEL=tiny` en Render env vars.

**CORS error desde Vercel**
→ Agrega tu URL exacta en `ALLOWED_ORIGINS` del backend Render.

**Render cold start (~30s)**
→ Normal en plan gratuito/starter. La primera transcripción tras inactividad tarda más.

**Timeout en Vercel**
→ `vercel.json` ya tiene `maxDuration: 300` para `/api/transcribe`.
