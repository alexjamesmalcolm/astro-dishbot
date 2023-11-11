import { loadEnv } from "vite";

export function getEnvironmentVariable(
  key: string,
  defaultValue?: string
): string {
  const potentialValue = loadEnv(
    process.env.NODE_ENV as string,
    process.cwd(),
    ""
  )[key];
  if (potentialValue) {
    return potentialValue;
  }
  if (defaultValue) {
    return defaultValue;
  }
  throw new Error(`Not able to find environment variable ${key}`);
}

export const redisConnectionUrl = getEnvironmentVariable("REDIS_URL");
