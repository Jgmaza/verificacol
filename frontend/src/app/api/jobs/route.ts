import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { TranscriptionJob } from "@/lib/jobs";
import { getRedis, isRedisConfigured, jobKey, JOB_TTL_SECONDS } from "@/lib/redis";

export const maxDuration = 30;

function triggerBackendProcessing(jobId: string): void {
  const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const secret = process.env.WORKER_SECRET;
  if (secret) headers["X-Worker-Secret"] = secret;

  fetch(`${backendUrl}/jobs/process`, {
    method: "POST",
    headers,
    body: JSON.stringify({ job_id: jobId }),
    signal: AbortSignal.timeout(8000),
  }).catch((err) => {
    console.error(`[jobs] no se pudo disparar worker para ${jobId}:`, err);
  });
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL requerida" }, { status: 400 });
    }

    if (!isRedisConfigured()) {
      return NextResponse.json(
        {
          error:
            "Redis no configurado. Agrega UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN.",
        },
        { status: 503 }
      );
    }

    const jobId = randomUUID();
    const now = new Date().toISOString();
    const job: TranscriptionJob = {
      id: jobId,
      url: url.trim(),
      status: "queued",
      messages: ["En cola — preparando tu análisis..."],
      createdAt: now,
      updatedAt: now,
    };

    const redis = getRedis();
    await redis.set(jobKey(jobId), job, { ex: JOB_TTL_SECONDS });

    triggerBackendProcessing(jobId);

    return NextResponse.json({ jobId, status: "queued" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("[jobs] POST error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
