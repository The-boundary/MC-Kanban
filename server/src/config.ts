import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables
dotenvConfig({ path: path.resolve(process.cwd(), '../.env') });

const envSchema = z.object({
  PORT: z.string().default('3049'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CACHE_TTL: z.string().default('300'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  port: parseInt(parsed.data.PORT, 10),
  nodeEnv: parsed.data.NODE_ENV,
  cacheTtl: parseInt(parsed.data.CACHE_TTL, 10),
  corsOrigin: parsed.data.CORS_ORIGIN,
} as const;
