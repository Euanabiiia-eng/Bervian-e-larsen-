import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL ?? '',
  token: process.env.REDIS_TOKEN ?? '',
});

export async function setCache(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
}

export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get<string>(key);
  if (data === null || data === undefined) return null;
  try {
    return (typeof data === 'string' ? JSON.parse(data) : data) as T;
  } catch {
    return data as unknown as T;
  }
}

export default redis;
