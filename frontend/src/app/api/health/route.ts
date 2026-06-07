import { NextResponse } from "next/server";

export async function GET() {
  const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
  let backendStatus = "unknown";
  let backendError = "";

  try {
    const res = await fetch(`${backendUrl}/health`, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    backendStatus = data.service === "verificacol-backend" ? "ok" : "wrong-service";
    if (backendStatus === "wrong-service") {
      backendError = `Puerto ocupado por otro servicio: ${JSON.stringify(data)}`;
    }
  } catch (e) {
    backendStatus = "unreachable";
    backendError = e instanceof Error ? e.message : "sin conexión";
  }

  return NextResponse.json({
    frontend: "ok",
    transcriptionMode: process.env.TRANSCRIPTION_MODE || "local",
    backendUrl,
    backendStatus,
    backendError: backendError || undefined,
    openaiConfigured: !!process.env.OPENAI_API_KEY,
  });
}
