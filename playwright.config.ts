import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env at config time so that ENV values are available
dotenv.config({ path: path.resolve(__dirname, '.env') });

const BASE_URL = process.env.BASE_URL ?? 'https://staging.skolarx.com';
const AUTH_STATE = path.resolve(__dirname, '.auth/user.json');

export default defineConfig({
  // ─── Test Discovery ─────────────────────────────────────────────────────────
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  // ─── Parallelism ────────────────────────────────────────────────────────────
  fullyParallel: false,   // Disabled: tests share auth state; LLM rate limits are real
  workers: 1,             // Run serially per profile to avoid session conflicts

  // ─── Retries ────────────────────────────────────────────────────────────────
  retries: process.env.CI ? 2 : 0,

  // ─── Reporting ──────────────────────────────────────────────────────────────
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  // ─── Global Settings (authenticated by default) ──────────────────────────────
  use: {
    baseURL: BASE_URL,
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    // NOTE: storageState is NOT set here — each project controls its own
  },

  // ─── Global Setup / Teardown ────────────────────────────────────────────────
  globalSetup: './global-setup.ts',

  // ─── Projects (one per profile context) ─────────────────────────────────────
  projects: [
    // Login tests — truly unauthenticated (empty storage state)
    {
      name: 'auth-tests',
      testMatch: 'tests/auth/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        // Explicitly empty storage — overrides any inherited state
        storageState: { cookies: [], origins: [] },
      },
    },

    // Student profile tests — authenticated, stays in personal profile
    {
      name: 'student',
      testMatch: 'tests/student/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STATE,
      },
    },

    // Entity (IIT Madras) profile tests — authenticated, switches to entity
    {
      name: 'entity',
      testMatch: 'tests/entity/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STATE,
      },
    },

    // Shared tests — run under default auth state
    {
      name: 'shared',
      testMatch: 'tests/shared/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STATE,
      },
    },
  ],

  outputDir: 'test-results',
});

