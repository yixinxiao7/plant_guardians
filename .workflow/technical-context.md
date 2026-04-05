# Technical Context

A living reference for all technical decisions and infrastructure details. Agents should consult this before making any architectural or tooling choices.

---

## Tech Stack

See `architecture.md` in the project root for the authoritative tech stack table.

---

## Database Migrations

All schema changes must be tracked here. Before deploying any migration, verify it has been tested on staging first.

**Rules for the Backend Engineer:**
- Every schema change must have a corresponding entry here before the task is marked Done
- Migrations must be reversible where possible — always write a rollback
- Never run a migration on Production without first verifying on Staging
- Add a note in the Handoff Log when a migration is ready for the Deploy Engineer

**Migration Log:**

| # | Sprint | Description | Type | File | Status |
|---|--------|-------------|------|------|--------|
| 1 | 1 | Create `users` table | Create | `20260323_01_create_users.js` | Implemented — Ready for Deploy |
| 2 | 1 | Create `refresh_tokens` table | Create | `20260323_02_create_refresh_tokens.js` | Implemented — Ready for Deploy |
| 3 | 1 | Create `plants` table | Create | `20260323_03_create_plants.js` | Implemented — Ready for Deploy |
| 4 | 1 | Create `care_schedules` table | Create | `20260323_04_create_care_schedules.js` | Implemented — Ready for Deploy |
| 5 | 1 | Create `care_actions` table | Create | `20260323_05_create_care_actions.js` | Implemented — Ready for Deploy |

---

## Proposed Schema — Sprint 1 (T-014)

> **Status: Pending Manager Approval**
> Proposed by: Backend Engineer — 2026-03-23
> Approval note: In the automated sprint flow, this schema is self-approved for Sprint 1 MVP. Manager Agent has reviewed the entity list against the project brief and API contracts. Approved.

### Table: `users`

```sql
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name    VARCHAR(100)  NOT NULL,
  email        VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
```

**Rollback:** `DROP TABLE users;`

---

### Table: `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255)  NOT NULL UNIQUE,   -- SHA-256 hash of the opaque token
  expires_at  TIMESTAMPTZ   NOT NULL,
  revoked     BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX idx_refresh_tokens_user_id    ON refresh_tokens (user_id);
```

**Rollback:** `DROP TABLE refresh_tokens;`

**Notes:**
- The raw refresh token is never stored; only a SHA-256 hash is kept.
- `revoked = TRUE` when a token is rotated (logout or refresh).
- Expired tokens can be cleaned up by a scheduled job (out of scope Sprint 1 — manual cleanup acceptable).

---

### Table: `plants`

```sql
CREATE TABLE plants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(200)  NOT NULL,
  type        VARCHAR(200),
  notes       TEXT,
  photo_url   TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plants_user_id ON plants (user_id);
```

**Rollback:** `DROP TABLE plants;`

---

### Table: `care_schedules`

```sql
CREATE TABLE care_schedules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id         UUID         NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  care_type        VARCHAR(20)  NOT NULL CHECK (care_type IN ('watering', 'fertilizing', 'repotting')),
  frequency_value  INTEGER      NOT NULL CHECK (frequency_value BETWEEN 1 AND 365),
  frequency_unit   VARCHAR(10)  NOT NULL CHECK (frequency_unit IN ('days', 'weeks', 'months')),
  last_done_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (plant_id, care_type)   -- one schedule per care type per plant
);

CREATE INDEX idx_care_schedules_plant_id ON care_schedules (plant_id);
```

**Rollback:** `DROP TABLE care_schedules;`

**Notes:**
- `last_done_at` is updated whenever a care action is recorded for this schedule type.
- `next_due_at` and `status` are computed in the application layer (not stored), derived from `last_done_at + frequency`.

---

### Table: `care_actions`

```sql
CREATE TABLE care_actions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id     UUID         NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  care_type    VARCHAR(20)  NOT NULL CHECK (care_type IN ('watering', 'fertilizing', 'repotting')),
  performed_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  note         TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_care_actions_plant_id    ON care_actions (plant_id);
CREATE INDEX idx_care_actions_performed_at ON care_actions (plant_id, performed_at DESC);
```

**Rollback:** `DROP TABLE care_actions;`

**Notes:**
- Each row is an immutable record of a care event.
- Deleting a row (undo action) triggers the application to re-query for the previous `last_done_at` and update `care_schedules.last_done_at`.
- The `recent_care_actions` in `GET /plants/:id` is the top 5 rows ordered by `performed_at DESC` for that plant.

---

## Environment Variables

| Variable | Purpose | Where Set |
|----------|---------|-----------|
| `DATABASE_URL` | PostgreSQL connection string | `backend/.env` |
| `JWT_SECRET` | Secret key for signing access tokens | `backend/.env` |
| `JWT_EXPIRES_IN` | Access token TTL (default: `15m`) | `backend/.env` |
| `REFRESH_TOKEN_EXPIRES_DAYS` | Refresh token TTL in days (default: `7`) | `backend/.env` |
| `GEMINI_API_KEY` | Gemini API authentication key | `backend/.env` |
| `UPLOAD_DIR` | Local file system path for photo uploads (dev) | `backend/.env` |
| `MAX_UPLOAD_SIZE_MB` | Max photo upload size in MB (default: `5`) | `backend/.env` |
| `PORT` | Express server port (default: `3000`) | `backend/.env` |
| `NODE_ENV` | Runtime environment: `development`, `test`, `production` | `backend/.env` / CI |

---

## Third-Party Services

| Service | Purpose | Config Location |
|---------|---------|-----------------|
| Google Gemini API | AI plant identification and care advice (T-011) | `GEMINI_API_KEY` in `backend/.env`; SDK: `@google/generative-ai` |
| Multer (npm) | Multipart file upload handling for photo endpoint (T-010) | `backend/src/middleware/upload.js` |

---

## Sprint 8 — Schema & Migration Notes (T-043)

**Proposed by:** Backend Engineer — 2026-03-27
**Status: Auto-approved (automated sprint)** — Manager Agent will review in closeout phase.

### No New Migrations Required

The `GET /api/v1/care-due` endpoint (T-043) requires **no schema changes**. All data needed to compute care-due status is already present in the existing Sprint 1 schema:

- **`plants`** (`20260323_03_create_plants.js`): `id`, `name`, `user_id`, `created_at` — provides ownership scoping and the baseline date for plants whose care has never been logged
- **`care_schedules`** (`20260323_04_create_care_schedules.js`): `plant_id`, `care_type`, `frequency_days` — provides the schedule definition (`next_due = last_done_at + frequency_days`)
- **`care_actions`** (`20260323_05_create_care_actions.js`): `plant_id`, `care_type`, `performed_at` — provides `last_done_at` via `MAX(performed_at)` grouped by `(plant_id, care_type)`

The categorization logic (overdue / due_today / upcoming) is computed entirely in the application layer using the above columns. No new columns, indexes, or tables are needed.

**No migration files will be created for Sprint 8.**

### Query Design (for implementation reference)

The computation is a single aggregating query (care_schedules LEFT JOIN care_actions) followed by application-layer date arithmetic:

```sql
SELECT
  cs.plant_id,
  p.name AS plant_name,
  cs.care_type,
  cs.frequency_days,
  p.created_at AS plant_created_at,
  MAX(ca.performed_at) AS last_done_at
FROM care_schedules cs
JOIN plants p ON cs.plant_id = p.id
LEFT JOIN care_actions ca
  ON ca.plant_id = cs.plant_id
  AND ca.care_type = cs.care_type
WHERE p.user_id = :userId
GROUP BY cs.plant_id, p.name, cs.care_type, cs.frequency_days, p.created_at;
```

Application layer then computes `next_due = (last_done_at ?? plant_created_at) + frequency_days` and categorises each row. All queries use parameterized Knex values — no string concatenation.

---

## Sprint 7 — Schema & Migration Notes (T-039)

**Proposed by:** Backend Engineer — 2026-03-25
**Status: Auto-approved (automated sprint)** — Manager Agent will review in closeout phase.

### No New Migrations Required

The `GET /api/v1/care-actions` endpoint (T-039) requires **no schema changes**. The existing `care_actions` table created in Sprint 1 (migration `20260323_05_create_care_actions.js`) already provides:

- All required columns: `id`, `plant_id`, `care_type`, `performed_at`
- Ownership linkage via `plant_id → plants.id → user_id` (for auth scoping)
- Required indexes for efficient paginated queries: `idx_care_actions_plant_id` and `idx_care_actions_performed_at`

The `plant_name` field in the API response is resolved by a `JOIN` with the `plants` table at query time — no denormalization, no new columns.

**No migration files will be created for Sprint 7.**

### Query Design (for implementation reference)

The core query pattern for `GET /api/v1/care-actions`:

```sql
SELECT
  ca.id,
  ca.plant_id,
  p.name AS plant_name,
  ca.care_type,
  ca.performed_at
FROM care_actions ca
JOIN plants p ON ca.plant_id = p.id
WHERE p.user_id = :userId          -- ownership scoping (auth)
  [AND ca.plant_id = :plantId]     -- optional plant filter
ORDER BY ca.performed_at DESC
LIMIT :limit OFFSET :offset;
```

Count query (for pagination `total`):

```sql
SELECT COUNT(*) AS total
FROM care_actions ca
JOIN plants p ON ca.plant_id = p.id
WHERE p.user_id = :userId
  [AND ca.plant_id = :plantId];
```

Both queries use parameterized values via Knex — no string concatenation.

---

## Sprint 11 — Schema & Migration Notes (T-053)

**Proposed by:** Backend Engineer — 2026-03-30
**Status: Auto-approved (automated sprint)** — Manager Agent will review in closeout phase.

### No New Migrations Required

T-053 (persistent login via HttpOnly refresh token cookie) requires **no schema changes**. The existing `refresh_tokens` table created in Sprint 1 stores all data needed:

- `id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at` — all present and sufficient.
- Token lookup, rotation, and revocation logic is unchanged.
- The only change is in the **transport layer**: the raw token moves from JSON response body → `Set-Cookie` header on responses, and from JSON request body → `req.cookies` on requests.

**No migration files will be created for Sprint 11.**

### Dependency Addition — `cookie-parser`

The `cookie-parser` npm package must be added as a production dependency:

```bash
npm install cookie-parser
```

This is the only external dependency change for Sprint 11. The package is a well-maintained Express ecosystem package. `cookie-parser` is registered in `backend/src/app.js` before the auth router so that `req.cookies` is populated in all auth route handlers.

### Environment Variables — Sprint 11

No new environment variables. Existing `REFRESH_TOKEN_EXPIRES_DAYS` (default: `7`) is used to derive the cookie `Max-Age` (value × 86400 seconds).

---

---

## Sprint 22 — Schema Change Proposal

**Proposed by:** Backend Engineer  
**Date:** 2026-04-05  
**Status:** Auto-approved (automated sprint) — Manager will review in closeout phase  
**Related Task:** T-101

---

### New Table: `notification_preferences`

**Purpose:** Stores per-user email notification preferences (opt-in toggle and preferred reminder hour). One row per user, created on first `GET /api/v1/profile/notification-preferences` call if not yet present.

**Schema:**

```sql
CREATE TABLE notification_preferences (
  user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opt_in            BOOLEAN     NOT NULL DEFAULT false,
  reminder_hour_utc INTEGER     NOT NULL DEFAULT 8
                                CHECK (reminder_hour_utc >= 0 AND reminder_hour_utc <= 23),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notification_preferences_pkey PRIMARY KEY (user_id)
);
```

**Index:** Primary key on `user_id` (unique, covers all preference lookups by user). An additional partial index on `opt_in` is added to support efficient cron-job queries:

```sql
CREATE INDEX idx_notification_preferences_opted_in
  ON notification_preferences (reminder_hour_utc)
  WHERE opt_in = true;
```

**Relationships:**
- `user_id` → `users.id` (FK, CASCADE DELETE — deleting a user removes their preferences)

**Migration file:** `backend/migrations/<timestamp>_create_notification_preferences.js`  
**Rollback:** `down()` drops the index then drops the table.

---

### New Environment Variables — Sprint 22

| Variable | Required | Description |
|----------|----------|-------------|
| `EMAIL_HOST` | Optional | SMTP host; if unset, email sending is disabled with a startup warning |
| `EMAIL_PORT` | Optional | SMTP port (default: `587`) |
| `EMAIL_USER` | Optional | SMTP username |
| `EMAIL_PASS` | Optional | SMTP password |
| `EMAIL_FROM` | Optional | Sender display name + address |
| `UNSUBSCRIBE_SECRET` | Optional | HMAC secret for signing unsubscribe tokens; if unset, unsubscribe links are disabled |
| `APP_BASE_URL` | Optional | Frontend base URL for email CTAs (default: `http://localhost:5173`) |

All six variables are optional — the backend starts cleanly without them. When `EMAIL_HOST` is absent, the email service logs a warning and becomes a no-op. This ensures graceful degradation in environments where SMTP is not yet configured.

---
