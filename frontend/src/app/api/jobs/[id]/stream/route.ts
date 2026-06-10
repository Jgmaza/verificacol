import { NextRequest } from "next/server";
import type { TranscriptionJob } from "@/lib/jobs";
import { isJobTerminal } from "@/lib/jobs";
import { getRedis, isRedisConfigured, jobKey } from "@/lib/redis";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;

  if (!isRedisConfigured()) {
    return new Response("Redis no configurado", { status: 503 });
  }

  const redis = getRedis();
  const encoder = new TextEncoder();
  let lastMessageCount = 0;
  let lastStatus = "";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(event, data)));
      };

      send("connected", { jobId });

      const maxPolls = 180;
      for (let i = 0; i < maxPolls; i++) {
        const job = (await redis.get<TranscriptionJob>(jobKey(jobId))) ?? null;

        if (!job) {
          send("error", { error: "Job no encontrado" });
          break;
        }

        if (job.status !== lastStatus) {
          send("status", { status: job.status });
          lastStatus = job.status;
        }

        const messages = job.messages || [];
        if (messages.length > lastMessageCount) {
          for (let m = lastMessageCount; m < messages.length; m++) {
            send("message", { text: messages[m], index: m });
          }
          lastMessageCount = messages.length;
        }

        if (isJobTerminal(job.status)) {
          if (job.status === "done") {
            send("done", {
              transcript: job.transcript,
              metadata: job.metadata,
            });
          } else {
            send("error", { error: job.error || "Error en transcripción" });
          }
          break;
        }

        await new Promise((r) => setTimeout(r, 1500));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
