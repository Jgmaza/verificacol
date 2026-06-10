import { NextRequest, NextResponse } from "next/server";
import { getRedis, isRedisConfigured, jobKey } from "@/lib/redis";
import type { TranscriptionJob } from "@/lib/jobs";

export const maxDuration = 10;

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
    console.error(`[jobs/retry] worker trigger failed for ${jobId}:`, err);
  });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    if (!isRedisConfigured()) {
      return NextResponse.json({ error: "Redis no configurado" }, { status: 503 });
    }

    const redis = getRedis();
    const job = await redis.get<TranscriptionJob>(jobKey(jobId));
    if (!job) {
      return NextResponse.json({ error: "Job no encontrado" }, { status: 404 });
    }

    if (job.status !== "queued" && job.status !== "error") {
      return NextResponse.json({ status: "skipped", reason: job.status });
    }

    triggerBackendProcessing(jobId);
    return NextResponse.json({ status: "retriggered" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
