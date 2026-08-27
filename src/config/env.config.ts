import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root — runs once at import time
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Type-safe environment configuration singleton.
 * All test code reads from here — never from process.env directly.
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[env.config] Missing required environment variable: "${key}". ` +
        `Make sure .env exists and contains this key. See .env.example for reference.`
    );
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const ENV = {
  // ─── Application ────────────────────────────────────────────────────────────
  BASE_URL: requireEnv('BASE_URL'),

  // ─── Credentials ────────────────────────────────────────────────────────────
  USER_EMAIL: requireEnv('USER_EMAIL'),
  USER_PASSWORD: requireEnv('USER_PASSWORD'),

  // ─── Profile Names (as shown in Switch Profile dropdown) ────────────────────
  STUDENT_PROFILE_NAME: requireEnv('STUDENT_PROFILE_NAME'),
  ENTITY_PROFILE_NAME: requireEnv('ENTITY_PROFILE_NAME'),

  // ─── Timeouts (ms) ──────────────────────────────────────────────────────────
  DEFAULT_TIMEOUT: parseInt(optionalEnv('DEFAULT_TIMEOUT', '30000'), 10),
  LLM_RESPONSE_TIMEOUT: parseInt(optionalEnv('LLM_RESPONSE_TIMEOUT', '60000'), 10),
  NAVIGATION_TIMEOUT: parseInt(optionalEnv('NAVIGATION_TIMEOUT', '30000'), 10),

  // ─── Paths ──────────────────────────────────────────────────────────────────
  AUTH_STATE_PATH: path.resolve(__dirname, '../../.auth/user.json'),
} as const;
