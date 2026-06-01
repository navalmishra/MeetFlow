const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_STREAM_API_KEY',
  'STREAM_SECRET_KEY',
] as const;

export function getMissingEnvVars(): string[] {
  return REQUIRED_ENV_VARS.filter((name) => !process.env[name]?.trim());
}

export function isClerkConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());
}

export function isStreamConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STREAM_API_KEY?.trim());
}

export function isAppConfigured(): boolean {
  return getMissingEnvVars().length === 0;
}
