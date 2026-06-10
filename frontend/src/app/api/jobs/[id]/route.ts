import { NextRequest, NextResponse } from "next/server";
import type { TranscriptionJob } from "@/lib/jobs";
import { getRedis, isRedisConfigured, jobKey } from "@/lib/redis";

export const maxDuration = 10;

export async function GET(
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

    return NextResponse.json(job);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
