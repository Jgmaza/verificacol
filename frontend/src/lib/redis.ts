import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN requeridos");
  }

  redis = new Redis({ url, token });
  return redis;
}

export function isRedisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export const JOB_TTL_SECONDS = 3600;

export function jobKey(jobId: string): string {
  return `job:${jobId}`;
}
