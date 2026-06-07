#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -d ".venv" ]; then
  echo "Creando entorno virtual..."
  python3 -m venv .venv
  .venv/bin/pip install --upgrade pip
  .venv/bin/pip install -r requirements.txt
fi

PORT="${PORT:-8000}"

# Verificar que el puerto no esté ocupado por otro servicio
HEALTH=$(curl -sf "http://127.0.0.1:${PORT}/health" 2>/dev/null || true)
if [ -n "$HEALTH" ]; then
  if echo "$HEALTH" | grep -q "verificacol-backend"; then
    echo "✅ VerificaCol ya está corriendo en puerto ${PORT}"
    exit 0
  else
    echo "⚠️  Puerto ${PORT} está ocupado por OTRO servicio: $HEALTH"
    echo "    Prueba con: PORT=8001 ./run.sh"
    echo "    Y en frontend/.env.local: BACKEND_URL=http://127.0.0.1:8001"
    exit 1
  fi
fi

echo "Iniciando VerificaCol backend en http://127.0.0.1:${PORT}"
echo "Health:  http://127.0.0.1:${PORT}/health"
echo "Diagnóstico: http://127.0.0.1:${PORT}/diagnostics"
echo "Logs detallados activados (nivel DEBUG)"
exec .venv/bin/uvicorn main:app --reload --host 127.0.0.1 --port "$PORT" --log-level debug
