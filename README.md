# AhamX Automation Testing Framework

Production-grade Playwright automation suite for **AhamX (SkolarX)** — an LLM-based AI learning platform.

## Tech Stack

- **Playwright** — browser automation
- **TypeScript** — type-safe tests
- **Page Object Model** — clean, maintainable test architecture
- **dotenv** — environment-based secrets (no hardcoded credentials)

---

## Project Structure

```
├── src/
│   ├── config/env.config.ts          # Type-safe env loader (single source of truth)
│   ├── pages/                        # Page Object Models
│   │   ├── base.page.ts              # Abstract base with shared helpers
│   │   ├── login.page.ts             # Login page
│   │   ├── bodhi-dashboard.page.ts   # Bodhi home (Student + Entity variants)
│   │   ├── profile-switcher.page.ts  # Switch Profile dropdown
│   │   ├── ask-ahamx-chat.page.ts    # LLM Chat drawer
│   │   ├── concept-manager.page.ts   # Studio: Concept Manager
│   │   ├── course-library.page.ts    # Studio: Course Library
│   │   ├── cohort-manager.page.ts    # Studio: Cohort Manager
│   │   ├── cohort-detail.page.ts     # Cohort detail view
│   │   └── learning-workspace.page.ts # Course player
│   ├── fixtures/authenticated.fixture.ts  # All POMs injected into tests
│   └── utils/
│       ├── test.helpers.ts           # Generic utilities
│       └── wait.helpers.ts           # LLM-aware polling waits
├── tests/
│   ├── auth/login.spec.ts            # Login scenarios (unauthenticated)
│   ├── student/                      # Student profile tests
│   │   ├── dashboard.spec.ts
│   │   ├── chat.spec.ts
│   │   └── cohorts.spec.ts
│   ├── entity/                       # Entity (IIT Madras) profile tests
│   │   ├── dashboard.spec.ts
│   │   ├── studio-navigation.spec.ts
│   │   └── chat.spec.ts
│   └── shared/app.spec.ts            # Profile-agnostic tests
├── global-setup.ts                   # One-time login → saves auth state
├── playwright.config.ts              # Multi-project config
├── .env.example                      # Credentials template (committed)
└── .env                              # Actual secrets (gitignored ✓)
```

---

## Quick Start

### 1. Clone and install

```bash
npm install
npx playwright install chromium
```

### 2. Configure credentials

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Run all tests

```bash
npm test
```

### 4. Run by profile

```bash
# Student profile tests only
npm run test:bodhi:student

# Entity (IIT Madras) profile tests only
npm run test:bodhi:entity

# Login / auth tests only
npm run test:auth

# Ask AhamX chat tests only
npm run test:chat
```

### 5. View HTML report

```bash
npm run test:report
```

---

## Key Design Principles

| Principle | Implementation |
|-----------|---------------|
| **No hardcoded credentials** | All in `.env`, loaded via `env.config.ts` |
| **Single login** | `global-setup.ts` logs in once, saves `.auth/user.json` |
| **No fake passes** | Every test assertion is a real DOM/URL check |
| **No `waitForTimeout` for LLM** | `wait.helpers.ts` polls send-button state |
| **Profile-aware tests** | Separate `tests/student/` and `tests/entity/` folders |
| **Clean POM** | Tests only call high-level methods; selectors live in page classes |
| **Scalable** | Drop in a new page + spec file — zero changes to existing code |

---

## Profile Testing Order

Tests follow this order by design:

1. **Auth tests** — unauthenticated, test login flow
2. **Student profile tests** — switch to personal profile, test student Bodhi
3. **Entity profile tests** — switch to IIT Madras entity, test Studio + admin features
4. **Shared tests** — profile-agnostic app checks

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `BASE_URL` | App base URL |
| `USER_EMAIL` | Login email |
| `USER_PASSWORD` | Login password |
| `STUDENT_PROFILE_NAME` | Name shown in profile switcher (e.g., "Harshavardhan MG") |
| `ENTITY_PROFILE_NAME` | Entity name (e.g., "IIT Madras") |
| `DEFAULT_TIMEOUT` | Default action timeout (ms) |
| `LLM_RESPONSE_TIMEOUT` | Max wait for LLM stream to complete (ms) |
| `NAVIGATION_TIMEOUT` | Page navigation timeout (ms) |
