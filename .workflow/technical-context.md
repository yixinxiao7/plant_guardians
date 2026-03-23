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
