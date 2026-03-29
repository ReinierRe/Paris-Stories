export interface GenerationJob {
  userId: string;
  cityId: string;
  status: "generating" | "ready" | "error";
  progress?: string;
  result?: {
    id: string;
    title?: string;
    script: string;
    audioUrl: string;
    durationSeconds: number;
    cached: boolean;
    subject?: string;
    angle?: string;
    voice?: string;
    language?: string;
    length?: string;
    createdAt?: string;
    customDbId?: string;
  };
  error?: string;
  createdAt: number;
}

export const generationJobs = new Map<string, GenerationJob>();

setInterval(() => {
  const now = Date.now();
  for (const [id, job] of generationJobs) {
    if (now - job.createdAt > 30 * 60 * 1000) {
      generationJobs.delete(id);
    }
  }
}, 10 * 60 * 1000);

export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}
