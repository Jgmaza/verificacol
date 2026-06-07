#!/usr/bin/env bash
# Muestra las variables que debes configurar en Render Dashboard
VERCEL_URL="${1:-https://TU-APP.vercel.app}"

echo "=== Variables para Render (backend) ==="
echo ""
echo "ALLOWED_ORIGINS=${VERCEL_URL}"
echo "WHISPER_MODEL=base"
echo "ALLOW_VERCEL_PREVIEWS=true"
echo ""
echo "=== Variables para Vercel (frontend) ==="
echo ""
echo "OPENAI_API_KEY=sk-..."
echo "TRANSCRIPTION_MODE=local"
echo "BACKEND_URL=https://verificacol-backend.onrender.com"
echo ""
echo "Reemplaza las URLs con las reales tras el deploy."
