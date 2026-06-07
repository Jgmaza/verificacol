import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

async function checkBackendHealth(backendUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`${backendUrl}/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      const body = await res.text();
      return `Backend respondió ${res.status} en ${backendUrl}/health: ${body.slice(0, 200)}`;
    }
    const data = await res.json();
    if (data.service !== "verificacol-backend") {
      return `El puerto ${backendUrl} no es VerificaCol (respuesta: ${JSON.stringify(data)}). ¿Hay otro servicio ocupando el puerto?`;
    }
    return null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "sin conexión";
    return `No se pudo conectar al backend en ${backendUrl}: ${msg}. ¿Está corriendo ./run.sh en backend/?`;
  }
}

async function transcribeLocal(url: string) {
  const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";

  console.log(`[transcribe] mode=local backend=${backendUrl} url=${url}`);

  const healthError = await checkBackendHealth(backendUrl);
  if (healthError) {
    console.error(`[transcribe] health check failed: ${healthError}`);
    throw new Error(healthError);
  }

  console.log(`[transcribe] enviando POST ${backendUrl}/transcribe`);
  const start = Date.now();

  const response = await fetch(`${backendUrl}/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, model: "base" }),
    signal: AbortSignal.timeout(600_000),
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[transcribe] respuesta ${response.status} en ${elapsed}s`);

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
    const detail = err.detail || err.error || JSON.stringify(err);
    console.error(`[transcribe] error backend: ${detail}`);
    throw new Error(typeof detail === "string" ? detail : "Error transcribiendo");
  }

  const data = await response.json();
  console.log(`[transcribe] OK — ${data.transcript?.length ?? 0} caracteres`);
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL requerida" }, { status: 400 });
    }

    const mode = process.env.TRANSCRIPTION_MODE || "local";
    console.log(`[transcribe] POST url=${url} mode=${mode}`);

    if (mode === "openai") {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: "OPENAI_API_KEY requerida para modo openai" },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: "Modo openai no implementado aún. Usa TRANSCRIPTION_MODE=local con el backend Python." },
        { status: 501 }
      );
    }

    const result = await transcribeLocal(url);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error(`[transcribe] excepción: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
