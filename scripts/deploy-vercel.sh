#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../frontend"

echo "=== Deploy VerificaCol Frontend a Vercel ==="
echo ""
echo "Variables requeridas en Vercel (configúralas en el dashboard o con vercel env):"
echo "  OPENAI_API_KEY      → tu clave de platform.openai.com"
echo "  TRANSCRIPTION_MODE  → local"
echo "  BACKEND_URL         → URL de Render (ej. https://verificacol-backend.onrender.com)"
echo ""

if ! npx vercel whoami &>/dev/null; then
  echo "Iniciando login de Vercel..."
  npx vercel login
fi

echo "Desplegando a producción..."
npx vercel --prod

echo ""
echo "✅ Deploy completado. Verifica en https://vercel.com/dashboard"
echo "No olvides configurar BACKEND_URL apuntando a tu backend en Render."
