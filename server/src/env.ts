// Centralized, lazily-read env access. Throwing helpers keep failures loud
// at the call site rather than producing confusing downstream errors.

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function optionalEnv(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  get databaseUrl() {
    return requireEnv("DATABASE_URL");
  },
  get appUrl() {
    return optionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  },
  get emergencyNumber() {
    return optionalEnv("NEXT_PUBLIC_EMERGENCY_NUMBER", "911");
  },
  get twilioAuthToken() {
    return optionalEnv("TWILIO_AUTH_TOKEN");
  },
  get openaiApiKey() {
    return optionalEnv("OPENAI_API_KEY");
  },
  // Triage thresholds (PRD 3.3 step 3).
  get tRoute() {
    return num("TRIAGE_T_ROUTE", 0.8);
  },
  get tReview() {
    return num("TRIAGE_T_REVIEW", 0.5);
  },
  // Dedup tuning (PRD 3.3 step 4).
  get dedupRadiusMeters() {
    return num("DEDUP_RADIUS_METERS", 75);
  },
  // Cosine DISTANCE threshold (0 = identical). Lower = stricter.
  get dedupCosineThreshold() {
    return num("DEDUP_EMBEDDING_COSINE_THRESHOLD", 0.15);
  },
};
