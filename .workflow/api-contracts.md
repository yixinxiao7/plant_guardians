# API Contracts

Shared API specifications that the Backend Engineer publishes and the Frontend Engineer consumes. Must be defined before implementation begins each sprint.

---

## Rules

1. Backend Engineer must document all new/changed endpoints here **before** writing implementation code
2. Frontend Engineer must acknowledge the contract in handoff-log.md **before** starting UI integration
3. Any contract changes mid-sprint require a handoff-log.md entry and Manager approval
4. All contracts must follow the conventions defined in `architecture.md`

---

## Global Conventions

- **Base URL:** `/api/v1/`
- **Auth:** Bearer token in `Authorization: Bearer <access_token>` header
- **Success shape:** `{ "data": <payload> }`
- **Error shape:** `{ "error": { "message": "<string>", "code": "<string>" } }`
- **Pagination (list endpoints):** `?page=1&limit=20` → `{ "data": [...], "pagination": { "page": 1, "limit": 20, "total": 100 } }`
- **Timestamps:** All `*_at` fields returned as ISO 8601 UTC strings (e.g., `"2026-08-07T10:00:00.000Z"`)
- **UUIDs:** All `id` fields are UUID v4 strings

---

## Sprint 1 Contracts

---

### GROUP 1 — Authentication (T-008)

---

#### POST /api/v1/auth/register

**Auth:** Public (no token required)

**Description:** Creates a new user account. Returns access and refresh tokens on success.

**Request Body:**

```json
{
  "full_name": "string",    // required; min 2 chars, max 100 chars
  "email": "string",        // required; valid email format; unique across users
  "password": "string"      // required; min 8 chars
}
```

**Validation Rules:**
- `full_name`: required, string, 2–100 characters
- `email`: required, valid RFC-5322 email, case-insensitively unique
- `password`: required, minimum 8 characters (no other complexity enforced in Sprint 1)

**Success Response — 201 Created:**

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "full_name": "string",
      "email": "string",
      "created_at": "ISO8601"
    },
    "access_token": "string",   // JWT, expires in 15 minutes
    "refresh_token": "string"   // opaque token, expires in 7 days
  }
}
```

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | Missing or invalid fields; `message` describes which field |
| 409 | `EMAIL_ALREADY_EXISTS` | An account with that email already exists |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

**Example error (400):**
```json
{
  "error": {
    "message": "Password must be at least 8 characters.",
    "code": "VALIDATION_ERROR"
  }
}
```

---

#### POST /api/v1/auth/login

**Auth:** Public

**Description:** Authenticates an existing user with email and password. Returns access and refresh tokens.

**Request Body:**

```json
{
  "email": "string",      // required
  "password": "string"    // required
}
```

**Success Response — 200 OK:**

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "full_name": "string",
      "email": "string",
      "created_at": "ISO8601"
    },
    "access_token": "string",
    "refresh_token": "string"
  }
}
```

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | Missing email or password |
| 401 | `INVALID_CREDENTIALS` | Email not found or password is wrong (intentionally vague for security) |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

#### POST /api/v1/auth/refresh

**Auth:** Public (no Bearer token; uses the refresh token in body)

**Description:** Exchanges a valid refresh token for a new access token and a rotated refresh token. Old refresh token is invalidated.

**Request Body:**

```json
{
  "refresh_token": "string"   // required; the refresh token issued at login/register
}
```

**Success Response — 200 OK:**

```json
{
  "data": {
    "access_token": "string",
    "refresh_token": "string"   // new rotated token; old one is now invalid
  }
}
```

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | Missing `refresh_token` field |
| 401 | `INVALID_REFRESH_TOKEN` | Token not found, expired, or already rotated |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

#### POST /api/v1/auth/logout

**Auth:** Bearer token (required)

**Description:** Invalidates the user's current refresh token so it can no longer be used to obtain new access tokens. The access token itself cannot be revoked (short-lived by design); clients must discard it locally.

**Request Body:**

```json
{
  "refresh_token": "string"   // required; the refresh token to invalidate
}
```

**Success Response — 200 OK:**

```json
{
  "data": {
    "message": "Logged out successfully."
  }
}
```

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | Missing `refresh_token` |
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

### GROUP 2 — Plants CRUD (T-009)

---

#### GET /api/v1/plants

**Auth:** Bearer token (required)

**Description:** Returns all plants belonging to the authenticated user. Includes care schedule summaries and computed status per care type. Used by the Plant Inventory (Home) screen.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number for pagination |
| `limit` | integer | 50 | Records per page (max 100) |

**Success Response — 200 OK:**

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "string",
      "type": "string | null",
      "notes": "string | null",
      "photo_url": "string | null",
      "created_at": "ISO8601",
      "updated_at": "ISO8601",
      "care_schedules": [
        {
          "id": "uuid",
          "care_type": "watering | fertilizing | repotting",
          "frequency_value": 7,
          "frequency_unit": "days | weeks | months",
          "last_done_at": "ISO8601 | null",
          "next_due_at": "ISO8601",    // computed server-side: last_done_at + frequency
          "status": "on_track | due_today | overdue",  // computed
          "days_overdue": 0            // 0 if on_track or due_today; positive integer if overdue
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 3
  }
}
```

**Notes:**
- `care_schedules` array contains 0–3 entries (one per configured care type)
- If no schedules are set, `care_schedules` is an empty array `[]`
- `status` computation: `overdue` if `next_due_at` < today; `due_today` if `next_due_at` == today; `on_track` otherwise
- Plants are ordered by `created_at DESC` (newest first) by default

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

#### POST /api/v1/plants

**Auth:** Bearer token (required)

**Description:** Creates a new plant for the authenticated user, including optional care schedules.

**Request Body:**

```json
{
  "name": "string",           // required; 1–200 chars
  "type": "string",           // optional; 0–200 chars
  "notes": "string",          // optional; max 2000 chars
  "photo_url": "string",      // optional; valid URL; set after photo upload (see T-010)
  "care_schedules": [         // optional array; 0–3 entries
    {
      "care_type": "watering",          // required in each entry; enum: watering | fertilizing | repotting
      "frequency_value": 7,             // required in each entry; integer 1–365
      "frequency_unit": "days",         // required in each entry; enum: days | weeks | months
      "last_done_at": "ISO8601 | null"  // optional; if null, server defaults to current UTC time
    }
  ]
}
```

**Validation Rules:**
- `name`: required, 1–200 chars
- `type`: optional, max 200 chars
- `notes`: optional, max 2000 chars
- `care_schedules`: optional array, max 3 entries, no duplicate `care_type` values
- Each schedule `frequency_value`: required integer, 1–365
- Each schedule `frequency_unit`: required, one of `days`, `weeks`, `months`
- `care_type` in `care_schedules`: must be `watering`, `fertilizing`, or `repotting`; at most one entry per type
- Watering is not strictly required at the API level (UI enforces it client-side)

**Success Response — 201 Created:**

```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "string",
    "type": "string | null",
    "notes": "string | null",
    "photo_url": "string | null",
    "created_at": "ISO8601",
    "updated_at": "ISO8601",
    "care_schedules": [
      {
        "id": "uuid",
        "care_type": "watering",
        "frequency_value": 7,
        "frequency_unit": "days",
        "last_done_at": "ISO8601",
        "next_due_at": "ISO8601",
        "status": "on_track",
        "days_overdue": 0
      }
    ]
  }
}
```

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | Missing required fields or invalid values |
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

#### GET /api/v1/plants/:id

**Auth:** Bearer token (required)

**Description:** Returns full detail for a single plant, including all care schedules and the last 5 care actions (for the Recent Activity section).

**Path Parameters:**
- `id` (UUID) — the plant's unique identifier

**Success Response — 200 OK:**

```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "string",
    "type": "string | null",
    "notes": "string | null",
    "photo_url": "string | null",
    "created_at": "ISO8601",
    "updated_at": "ISO8601",
    "care_schedules": [
      {
        "id": "uuid",
        "care_type": "watering | fertilizing | repotting",
        "frequency_value": 7,
        "frequency_unit": "days",
        "last_done_at": "ISO8601 | null",
        "next_due_at": "ISO8601",
        "status": "on_track | due_today | overdue",
        "days_overdue": 0
      }
    ],
    "recent_care_actions": [
      {
        "id": "uuid",
        "care_type": "watering | fertilizing | repotting",
        "performed_at": "ISO8601",
        "note": "string | null"
      }
    ]
  }
}
```

**Notes:**
- `recent_care_actions` is limited to the 5 most recent actions for this plant, ordered `performed_at DESC`
- The authenticated user must own the plant; otherwise return 404 (not 403, to avoid leaking existence)

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 404 | `PLANT_NOT_FOUND` | Plant does not exist or does not belong to this user |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

#### PUT /api/v1/plants/:id

**Auth:** Bearer token (required)

**Description:** Full update of a plant's details and care schedules. Used by the Edit Plant screen. This is a full replacement of care schedules (not a patch — client sends the full desired schedule state).

**Path Parameters:**
- `id` (UUID) — the plant's unique identifier

**Request Body:**

```json
{
  "name": "string",           // required; 1–200 chars
  "type": "string | null",    // optional
  "notes": "string | null",   // optional
  "photo_url": "string | null",  // optional
  "care_schedules": [
    {
      "care_type": "watering",
      "frequency_value": 7,
      "frequency_unit": "days",
      "last_done_at": "ISO8601 | null"
    }
  ]
}
```

**Validation Rules:** Same as POST /api/v1/plants.

**Behavior:** Server replaces all existing care_schedules for this plant with the submitted set. If the client omits a previously-set schedule type, that schedule is deleted. This simplifies frontend logic (send the full desired state).

**Success Response — 200 OK:**

```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "string",
    "type": "string | null",
    "notes": "string | null",
    "photo_url": "string | null",
    "created_at": "ISO8601",
    "updated_at": "ISO8601",
    "care_schedules": [
      {
        "id": "uuid",
        "care_type": "watering",
        "frequency_value": 7,
        "frequency_unit": "days",
        "last_done_at": "ISO8601 | null",
        "next_due_at": "ISO8601",
        "status": "on_track | due_today | overdue",
        "days_overdue": 0
      }
    ]
  }
}
```

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | Invalid field values |
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 404 | `PLANT_NOT_FOUND` | Plant does not exist or belongs to another user |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

#### DELETE /api/v1/plants/:id

**Auth:** Bearer token (required)

**Description:** Permanently deletes a plant and all associated care schedules and care actions. This action is irreversible.

**Path Parameters:**
- `id` (UUID) — the plant's unique identifier

**Request Body:** None

**Success Response — 200 OK:**

```json
{
  "data": {
    "message": "Plant deleted successfully.",
    "id": "uuid"
  }
}
```

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 404 | `PLANT_NOT_FOUND` | Plant does not exist or belongs to another user |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

### GROUP 3 — Plant Photo Upload (T-010)

---

#### POST /api/v1/plants/:id/photo

**Auth:** Bearer token (required)

**Description:** Uploads a photo for a plant. Accepts `multipart/form-data`. Stores the file (local disk in development, cloud storage in production) and returns the URL. The client should then set this URL on the plant via PUT /plants/:id.

**Path Parameters:**
- `id` (UUID) — the plant's unique identifier

**Request:** `Content-Type: multipart/form-data`

| Field | Type | Rules |
|-------|------|-------|
| `photo` | file | required; MIME type must be `image/jpeg`, `image/png`, or `image/webp`; max size 5 MB |

**Success Response — 200 OK:**

```json
{
  "data": {
    "photo_url": "string"   // publicly accessible URL to the stored image
  }
}
```

**Notes:**
- The photo is stored but not automatically linked to the plant. The frontend should call PUT /plants/:id to save the `photo_url` field.
- Alternatively, the frontend may pass `photo_url` when creating the plant via POST /plants if the upload happens first (workflow: upload photo → get URL → create plant with URL).
- File is not permanently persisted if no plant references it — a cleanup job may run later (out of scope Sprint 1).

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `MISSING_FILE` | No file included in request |
| 400 | `INVALID_FILE_TYPE` | File MIME type is not jpeg/png/webp |
| 400 | `FILE_TOO_LARGE` | File exceeds 5 MB limit |
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 404 | `PLANT_NOT_FOUND` | Plant does not exist or belongs to another user |
| 500 | `INTERNAL_ERROR` | Storage failure or unexpected error |

---

### GROUP 4 — AI Advice (T-011)

---

#### POST /api/v1/ai/advice

**Auth:** Bearer token (required)

**Description:** Sends plant information to the Gemini AI and returns structured care recommendations. Accepts either a `plant_type` text string or a `photo_url` (or both). Returns a structured care advice object that the frontend uses to populate the Add/Edit Plant form.

**Request:** `Content-Type: application/json`

```json
{
  "plant_type": "string",   // optional; the plant's name/type, e.g. "Pothos"
  "photo_url": "string"     // optional; URL of a previously uploaded photo
}
```

**Validation Rules:**
- At least one of `plant_type` or `photo_url` must be provided
- `plant_type`: optional, max 200 chars
- `photo_url`: optional, valid URL string

**Success Response — 200 OK:**

```json
{
  "data": {
    "identified_plant_type": "string | null",   // AI-identified plant name; null if type was provided by user
    "confidence": "high | medium | low | null", // identification confidence; null if text-based query
    "care_advice": {
      "watering": {
        "frequency_value": 7,
        "frequency_unit": "days",
        "notes": "string | null"   // e.g. "Reduce in winter"
      },
      "fertilizing": {
        "frequency_value": 1,
        "frequency_unit": "months",
        "notes": "string | null"
      } ,
      "repotting": {
        "frequency_value": 1,
        "frequency_unit": "years",   // NOTE: "years" is valid here for display; map to months for storage
        "notes": "string | null"
      },
      "light": "string | null",       // display-only; e.g. "Bright indirect light"
      "humidity": "string | null",    // display-only; e.g. "Moderate"
      "additional_tips": "string | null"
    }
  }
}
```

**Notes:**
- `fertilizing` and `repotting` keys may be `null` if the AI determines they are not applicable
- `frequency_unit` for storage must always be `days | weeks | months` — the UI/backend will convert "years" to months (12) before persisting
- This endpoint calls the Gemini API synchronously; expect latency of 2–8 seconds; frontend must show a loading state

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | Neither `plant_type` nor `photo_url` provided |
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 422 | `PLANT_NOT_IDENTIFIABLE` | AI could not identify the plant from the provided photo; frontend should prompt user to try again or use text |
| 502 | `AI_SERVICE_UNAVAILABLE` | Gemini API returned an error or timed out |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

### GROUP 5 — Care Actions (T-012)

---

#### POST /api/v1/plants/:id/care-actions

**Auth:** Bearer token (required)

**Description:** Records a care action (e.g., "I just watered this plant"). Updates the corresponding care schedule's `last_done_at` timestamp, which recalculates `next_due_at` and `status`. Used by the "Mark as done" button on the Plant Detail screen.

**Path Parameters:**
- `id` (UUID) — the plant's unique identifier

**Request Body:**

```json
{
  "care_type": "watering",          // required; enum: watering | fertilizing | repotting
  "performed_at": "ISO8601 | null"  // optional; if null, server defaults to current UTC time
}
```

**Validation Rules:**
- `care_type`: required, one of `watering`, `fertilizing`, `repotting`
- `performed_at`: optional ISO 8601 datetime string; must not be in the future; if omitted, defaults to `NOW()`
- Plant must have a care schedule for the given `care_type`; otherwise return 422

**Success Response — 201 Created:**

```json
{
  "data": {
    "care_action": {
      "id": "uuid",
      "plant_id": "uuid",
      "care_type": "watering",
      "performed_at": "ISO8601",
      "note": "string | null"
    },
    "updated_schedule": {
      "id": "uuid",
      "care_type": "watering",
      "frequency_value": 7,
      "frequency_unit": "days",
      "last_done_at": "ISO8601",
      "next_due_at": "ISO8601",
      "status": "on_track",
      "days_overdue": 0
    }
  }
}
```

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | Missing or invalid `care_type`; future `performed_at` |
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 404 | `PLANT_NOT_FOUND` | Plant does not exist or belongs to another user |
| 422 | `NO_SCHEDULE_FOR_CARE_TYPE` | Plant does not have a schedule configured for that care_type |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

#### DELETE /api/v1/plants/:id/care-actions/:action_id

**Auth:** Bearer token (required)

**Description:** Deletes (undoes) a care action. The corresponding care schedule's `last_done_at` reverts to the previous action's timestamp (or null if none). Used by the 10-second "Undo" window on the Plant Detail screen.

**Path Parameters:**
- `id` (UUID) — the plant's unique identifier
- `action_id` (UUID) — the care action to delete

**Request Body:** None

**Success Response — 200 OK:**

```json
{
  "data": {
    "deleted_action_id": "uuid",
    "updated_schedule": {
      "id": "uuid",
      "care_type": "watering",
      "frequency_value": 7,
      "frequency_unit": "days",
      "last_done_at": "ISO8601 | null",
      "next_due_at": "ISO8601",
      "status": "on_track | due_today | overdue",
      "days_overdue": 0
    }
  }
}
```

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 404 | `PLANT_NOT_FOUND` | Plant does not exist or belongs to another user |
| 404 | `ACTION_NOT_FOUND` | Care action does not exist for this plant |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

### GROUP 6 — Profile & Stats (T-013)

---

#### GET /api/v1/profile

**Auth:** Bearer token (required)

**Description:** Returns the authenticated user's profile information and aggregate statistics. Used by the Profile page (SPEC-007).

**Request Body:** None

**Success Response — 200 OK:**

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "full_name": "string",
      "email": "string",
      "created_at": "ISO8601"
    },
    "stats": {
      "plant_count": 5,           // integer; number of plants this user currently owns
      "days_as_member": 42,       // integer; floor((now - created_at) / 86400)
      "total_care_actions": 120   // integer; total care action records across all plants
    }
  }
}
```

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## Shared Types Reference

### Plant Object (full)

```ts
type Plant = {
  id: string;               // UUID
  user_id: string;          // UUID
  name: string;
  type: string | null;
  notes: string | null;
  photo_url: string | null;
  created_at: string;       // ISO 8601
  updated_at: string;       // ISO 8601
  care_schedules: CareSchedule[];
};
```

### CareSchedule Object

```ts
type CareSchedule = {
  id: string;               // UUID
  care_type: "watering" | "fertilizing" | "repotting";
  frequency_value: number;  // 1–365
  frequency_unit: "days" | "weeks" | "months";
  last_done_at: string | null;  // ISO 8601
  next_due_at: string;          // ISO 8601, computed
  status: "on_track" | "due_today" | "overdue";
  days_overdue: number;         // 0 if not overdue
};
```

### CareAction Object

```ts
type CareAction = {
  id: string;               // UUID
  plant_id: string;         // UUID
  care_type: "watering" | "fertilizing" | "repotting";
  performed_at: string;     // ISO 8601
  note: string | null;
};
```

---

*Contracts written by Backend Engineer — 2026-03-23. Sprint 1.*

---

## Sprint 3 Contracts Review

**Date:** 2026-03-23
**Author:** Backend Engineer
**Sprint:** 3

### Summary

No new API endpoints are introduced in Sprint 3. All 14 endpoints documented in Sprint 1 above are fully implemented, tested (40/40 backend tests pass), and staging-verified. The Frontend Engineer may wire up all 7 UI screens directly against the existing contracts.

This section provides a screen-by-screen mapping of which endpoints each UI spec requires, along with Sprint 3-specific integration notes.

---

### Screen → Endpoint Mapping

| Spec | Screen | Endpoints Required | Tasks |
|------|--------|--------------------|-------|
| SPEC-001 | Login & Sign Up | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` | T-001 |
| SPEC-002 | Plant Inventory (Home) | `GET /plants`, `DELETE /plants/:id` | T-002 |
| SPEC-003 | Add Plant | `POST /plants`, `POST /plants/:id/photo`, `POST /ai/advice` | T-003 |
| SPEC-004 | Edit Plant | `GET /plants/:id`, `PUT /plants/:id` | T-004 |
| SPEC-005 | Plant Detail | `GET /plants/:id`, `POST /plants/:id/care-actions`, `DELETE /plants/:id/care-actions/:action_id` | T-005 |
| SPEC-006 | AI Advice Modal | `POST /plants/:id/photo` (optional pre-upload), `POST /ai/advice` | T-006 |
| SPEC-007 | Profile Page | `GET /profile`, `POST /auth/logout` | T-007 |

---

### Sprint 3 Integration Notes (Per Screen)

#### SPEC-001 — Login & Sign Up (T-001)

- `POST /auth/register` returns `access_token` + `refresh_token` in the response body. Store `access_token` in React context memory only (never localStorage). `refresh_token` should be stored in an httpOnly cookie or in memory — do not persist to localStorage.
- `POST /auth/login` returns the same shape. On success, redirect to `/` (inventory).
- On 409 `EMAIL_ALREADY_EXISTS`: display inline message beneath the email field: "An account with this email already exists."
- On 401 `INVALID_CREDENTIALS`: show a form-level banner (not a field error): "Incorrect email or password."
- Token auto-refresh: when any authenticated request returns 401, call `POST /auth/refresh` with the stored refresh token, then retry the original request. If refresh also fails with 401, clear auth state and redirect to `/login`.

#### SPEC-002 — Plant Inventory / Home (T-002)

- `GET /plants` returns an array under `data` with `pagination`. Default `limit=50` is sufficient for MVP — pagination controls are not required in the UI this sprint.
- Each plant object includes `care_schedules[]` with computed `status` (`on_track | due_today | overdue`) and `days_overdue`. The frontend must NOT compute these — use the server-provided values directly.
- Status badge display priority (most urgent shown first on card): `overdue` > `due_today` > `on_track`.
- `DELETE /plants/:id` returns `{ "data": { "message": "Plant deleted successfully.", "id": "uuid" } }`. The card should animate out (scale + opacity) on success.
- If `GET /plants` returns 401, the auth auto-refresh flow should handle it silently. Only show the "Couldn't load your plants" error banner on non-auth API failures.

#### SPEC-003 — Add Plant (T-003)

- **Photo upload flow:** `POST /plants/:id/photo` requires the plant to already exist (it needs an `:id`). Recommended workflow: (a) create the plant first without a photo via `POST /plants`, then (b) upload the photo via `POST /plants/:id/photo`, then (c) save the returned `photo_url` to the plant via `PUT /plants/:id`. Alternatively, the UI may upload the photo to a temporary endpoint and include `photo_url` in the initial `POST /plants` — but since `POST /plants/:id/photo` requires an existing plant ID, option (a) is the correct flow.
- `POST /plants` `care_schedules` field: the UI enforces watering as required client-side. The API accepts it as optional (does not 400 if omitted), so client-side enforcement is the source of truth here.
- `frequency_unit` values accepted by the API: `"days"`, `"weeks"`, `"months"` only. If the AI advice endpoint returns `"years"` for repotting, convert to months (`value * 12`, unit `"months"`) before submitting to `POST /plants`.

#### SPEC-004 — Edit Plant (T-004)

- Load existing plant data via `GET /plants/:id` on page mount.
- `PUT /plants/:id` is a **full replacement** of care schedules — send the complete desired schedule state. If the user removes a care type from the form, omit it from the `care_schedules` array in the PUT body (the server will delete it).
- The "Save" button should be disabled until the user makes at least one change (dirty-state tracking in form state).
- On success, redirect to the inventory screen (`/`).

#### SPEC-005 — Plant Detail (T-005)

- Load via `GET /plants/:id`. Response includes `care_schedules[]` (with computed `status`) and `recent_care_actions[]` (last 5 actions).
- **"Mark as done" flow:** Call `POST /plants/:id/care-actions` with the `care_type`. The response contains `updated_schedule` — update that schedule's status in local state from the response (do not re-fetch the full plant).
- **Undo flow (10-second window):** Call `DELETE /plants/:id/care-actions/:action_id` within 10 seconds. The response contains the reverted `updated_schedule` — update the local schedule state from it.
- Status badge colors map: `on_track` → Status Green (`#4A7C59`), `due_today` → Status Yellow (`#C4921F`), `overdue` → Status Red (`#B85C38`).
- `days_overdue` from the response can be displayed as "X days overdue" in the badge label when `status === "overdue"`.

#### SPEC-006 — AI Advice Modal (T-006)

- The modal accepts either a photo upload or a plain-text plant type name. If the user uploads a photo, call `POST /plants/:id/photo` first to get a `photo_url`, then pass that URL to `POST /ai/advice`. If text-only, pass `plant_type` directly.
- **Note on photo-before-plant scenario:** If the AI modal is opened from the Add Plant screen before the plant is created, the photo cannot be uploaded to `POST /plants/:id/photo` (no plant ID yet). Recommended approach: show a "text-only" mode in the modal when no plant exists yet, or upload the photo after plant creation. The AI endpoint also accepts `photo_url` from any previously uploaded source — the UI may upload to a generic endpoint if one exists, but currently `POST /plants/:id/photo` is the only upload endpoint and requires an existing plant.
  - **Practical guidance:** The modal should default to text-entry on the Add Plant screen (before a plant exists). If the user wants photo-based AI advice, they should first save the plant, then access the AI modal from the Edit Plant screen. This is acceptable MVP behavior.
- Expected response latency: 2–8 seconds. Always show a loading spinner/skeleton in the modal.
- On 422 `PLANT_NOT_IDENTIFIABLE`: show a user-friendly message — "We couldn't identify this plant from the photo. Try a clearer photo or enter the plant name manually."
- On 502 `AI_SERVICE_UNAVAILABLE`: show — "AI advice is temporarily unavailable. You can add care schedules manually."
- The "Accept" button should populate the Add/Edit Plant form fields with the AI-suggested values. Map `care_advice.watering`, `care_advice.fertilizing`, `care_advice.repotting` to the corresponding form fields. Convert `"years"` frequency_unit to months before writing to form state.

#### SPEC-007 — Profile Page (T-007)

- `GET /profile` returns `user` (id, full_name, email, created_at) and `stats` (plant_count, days_as_member, total_care_actions). All values are server-computed — display them directly.
- `POST /auth/logout` requires the current `refresh_token` in the request body (see contract above). On success, clear all auth state (access token, refresh token) from memory and redirect to `/login`.
- The profile page shows "member since" as a human-readable date formatted from `user.created_at`. Use the browser's `Intl.DateTimeFormat` API or a date utility — do not install a full date library for this one field.

---

### Environment & CORS Configuration (Sprint 3)

Both development and staging origins are whitelisted in the backend CORS config:

| Environment | Frontend Origin | Backend Port |
|-------------|----------------|-------------|
| Development (Vite dev server) | `http://localhost:5173` | `:3000` |
| Staging (Vite preview) | `http://localhost:4173` | `:3000` |

The `FRONTEND_URL` env var in `backend/.env` is set to `http://localhost:5173,http://localhost:4173` (comma-separated list). Both origins are accepted — no CORS issues should occur on either the dev server or the staging preview.

**API base URL for frontend:** `http://localhost:3000/api/v1` (development and staging).

---

### Security Requirements for Frontend (Sprint 3)

These items from the security checklist apply to frontend implementation and must be verified during QA (T-015):

| Requirement | Detail |
|-------------|--------|
| Token storage | `access_token` in React context memory only — never `localStorage`, never `sessionStorage` |
| Refresh token | In memory (React context) or httpOnly cookie — never exposed to JS if possible |
| Auth guards | All routes except `/login` and `/signup` must redirect unauthenticated users to `/login` |
| XSS | No use of `dangerouslySetInnerHTML`. All user content rendered as text nodes. |
| HTTPS | N/A for staging. Required before production deploy. |
| Token auto-refresh | On 401: silently refresh → retry. On refresh failure: clear auth + redirect to login. |

---

*Sprint 3 contract review written by Backend Engineer — 2026-03-23. No new endpoints. All 14 Sprint 1 endpoints confirmed valid.*

---

## Sprint 4 Contracts Review

**Date:** 2026-03-24
**Author:** Backend Engineer
**Sprint:** 4
**Related Task:** T-025 — Configure real Gemini API key + verify AI advice happy path

---

### Summary

Sprint 4 introduces **no new API endpoints**. The active-sprint.md explicitly places any new endpoints out of scope. The full 14-endpoint surface area documented in Sprint 1 remains authoritative and unchanged.

The only backend deliverable this sprint (T-025) is an operational change: replacing the placeholder `GEMINI_API_KEY` in `backend/.env` with a real key and verifying the `POST /api/v1/ai/advice` happy path end-to-end. No contract amendments are needed — the endpoint shape, validation rules, success response, and error codes are already fully specified in Sprint 1 Group 4 above.

---

### T-025 — AI Advice Happy Path: Contract Verification Notes

**Endpoint:** `POST /api/v1/ai/advice` (see Sprint 1, GROUP 4 for full spec)

**Status of contract:** ✅ No changes required. The existing contract is complete.

**Blocking dependency:** T-025 cannot be configured until T-024 (Monitor Agent staging health check) returns `Deploy Verified: Yes`. The endpoint is implemented and tested (3/3 unit tests pass in the unconfigured-key path). The only gap is the live Gemini key.

#### Happy-Path Response — Expected Shape (with real Gemini key)

When `GEMINI_API_KEY` is a valid key, a well-formed request should return HTTP 200 with a body matching this contract:

```json
{
  "data": {
    "identified_plant_type": "Epipremnum aureum",
    "confidence": "high",
    "care_advice": {
      "watering": {
        "frequency_value": 7,
        "frequency_unit": "days",
        "notes": "Allow top inch of soil to dry between waterings. Reduce in winter."
      },
      "fertilizing": {
        "frequency_value": 1,
        "frequency_unit": "months",
        "notes": "Feed monthly during the growing season (spring–summer). Skip in winter."
      },
      "repotting": {
        "frequency_value": 2,
        "frequency_unit": "years",
        "notes": "Repot when rootbound. Use well-draining potting mix."
      },
      "light": "Bright indirect light; tolerates low light",
      "humidity": "Moderate; mist occasionally",
      "additional_tips": "Toxic to pets. Wipe leaves monthly to remove dust."
    }
  }
}
```

**Notes for QA (T-025 verification):**
- `identified_plant_type`: non-null string when a photo is submitted; may be null for text-only queries where the user already named the plant
- `confidence`: one of `"high"`, `"medium"`, `"low"`; null for text-only queries
- `care_advice.repotting.frequency_unit` may be `"years"` — this is valid in the response. The frontend converts years→months (`value × 12`) before writing to care schedule storage. The backend does **not** convert this automatically.
- `care_advice.fertilizing` and `care_advice.repotting` may be `null` for some plant types if the AI determines they are not applicable.
- Expected response latency with a real Gemini key: 2–8 seconds. The frontend loading state must remain visible throughout.

#### Error Path Still Under Contract

The following error cases are unchanged and must continue to pass after T-025 is configured:

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | Neither `plant_type` nor `photo_url` provided |
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 422 | `PLANT_NOT_IDENTIFIABLE` | Gemini could not identify the plant |
| 502 | `AI_SERVICE_UNAVAILABLE` | Gemini API returned an error or timed out |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

The 502 `AI_SERVICE_UNAVAILABLE` path is directly referenced in T-026 (Frontend: AI Modal 502 fix). The frontend fix must display only a "Close" button (no "Try Again") with the exact message: `"Our AI service is temporarily offline. You can still add your plant manually."` — this is a frontend-only change; the contract error shape is unchanged.

---

### Schema Changes — Sprint 4

**No schema changes.** All 5 tables (`users`, `refresh_tokens`, `plants`, `care_schedules`, `care_actions`) established in Sprint 1 are sufficient. No new tables, columns, or indexes are required for T-025.

---

### Environment Configuration Note (T-025)

The `GEMINI_API_KEY` environment variable is read from `backend/.env`. The variable name and loading mechanism are already in place from Sprint 1 implementation. Only the value needs to change — from the current placeholder to a valid key issued by Google AI Studio.

**No other environment variables need to change for this sprint.**

If the project owner has not yet provided a valid Gemini API key, T-025 scope reduces to:
1. Documenting the gap in `qa-build-log.md`
2. Confirming all 40/40 backend unit tests continue to pass with the placeholder key
3. T-020 user testing proceeds with the AI advice flow known to be non-functional (the 502 error state will be shown — which is the correct and spec-compliant behavior after T-026 is merged)

---

*Sprint 4 contract review written by Backend Engineer — 2026-03-24. No new endpoints. Existing 14-endpoint contract unchanged. T-025 happy-path notes added for QA reference.*

---

## Sprint 5 Contracts — 2026-03-24

---

### Summary

Sprint 5 introduces **no new API endpoints and no schema changes**. The active-sprint.md explicitly places all new features out of scope — Sprint 5 is exclusively MVP validation and closeout.

The full 14-endpoint API surface documented in Sprint 1 (Groups 1–4) remains the authoritative and complete contract. No amendments are required.

**Backend tasks this sprint:**

| Task | Type | API Impact |
|------|------|-----------|
| T-025 | Configure real `GEMINI_API_KEY` + verify `POST /api/v1/ai/advice` happy path | No contract change — endpoint fully specified in Sprint 1 Group 4 and Sprint 4 T-025 notes |
| T-029 | Fix intermittent "socket hang up" in `POST /api/v1/plants` backend test | No contract change — test infrastructure fix only |

---

### T-025 — Sprint 5 Status: Contract Verification (Carry-Over)

**Endpoint:** `POST /api/v1/ai/advice` — see Sprint 1, GROUP 4 for full spec; see Sprint 4 T-025 section for happy-path response shape and QA notes.

**Contract status:** ✅ No changes. All sprint 4 contract verification notes remain current and authoritative.

**Sprint 5 scope:** The Backend Engineer will attempt to configure `GEMINI_API_KEY` in `backend/.env` with a valid key from Google AI Studio, then manually exercise the endpoint to confirm the happy-path 200 response matches the shape documented in the Sprint 4 T-025 section. Results will be written to `qa-build-log.md`.

**If no valid key is available:** T-025 scope reduces to documenting the gap in `qa-build-log.md`. The 40/40 backend unit tests must still pass. T-020 user testing continues — Flow 1 and Flow 3 do not require AI; Flow 2 will show the spec-compliant 502 error state.

**No frontend action required** — the `POST /api/v1/ai/advice` request/response shape is unchanged.

---

### T-029 — Sprint 5 Status: Flaky Test Fix (No API Impact)

**Affected area:** Backend test suite only — `POST /api/v1/plants > should create a plant with care schedules` intermittently throws "socket hang up" due to supertest/server teardown timing.

**API contract impact:** None. The `POST /api/v1/plants` endpoint behavior and contract are unchanged. This is a test infrastructure stability fix.

**Resolution approaches under consideration:**
1. Add `--runInBand` to Jest config (`backend/package.json` test script) to serialize test suites and eliminate cross-suite socket collisions
2. Improve supertest server teardown — ensure `server.close()` is called with a callback (not fire-and-forget) in `afterAll` hooks
3. Add a small `afterAll` delay between test files if teardown race conditions persist

**Acceptance criteria (contract-level):** All 40/40 backend tests pass reliably across 3 consecutive full-suite runs. No endpoint behavior changes.

---

### Schema Changes — Sprint 5

**No schema changes.** All 5 tables (`users`, `refresh_tokens`, `plants`, `care_schedules`, `care_actions`) from Sprint 1 are sufficient for all Sprint 5 work.

No migration files will be created this sprint.

---

### Environment Configuration — Sprint 5

The only environment change this sprint is replacing the placeholder value of `GEMINI_API_KEY` in `backend/.env` with a real key. No new variables are introduced, and no other variables change.

| Variable | Change | Notes |
|----------|--------|-------|
| `GEMINI_API_KEY` | Value updated (placeholder → valid key) | Only if project owner provisions a key; documented in `qa-build-log.md` either way |

---

*Sprint 5 contract review written by Backend Engineer — 2026-03-24. No new endpoints. No schema changes. Existing 14-endpoint contract is final and complete. T-025 and T-029 are operational/stability tasks only.*

---

## Sprint 6 Contracts — 2026-03-25

---

### Summary

Sprint 6 introduces **one new API endpoint**: `DELETE /api/v1/auth/account` (T-033). No other endpoints are added or changed. No schema migrations are required — all foreign key `ON DELETE CASCADE` constraints needed for the cascade delete were established in Sprint 1.

**Backend tasks this sprint with API impact:**

| Task | Type | API Impact |
|------|------|-----------|
| T-033 | DELETE /api/v1/auth/account endpoint | New endpoint — fully specified below |
| T-031 | Fix profile.test.js intermittent 30s timeout | No contract change — test infrastructure fix only |

---

### GROUP 5 — Account Management (T-033)

---

#### DELETE /api/v1/auth/account

**Auth:** Required — Bearer token in `Authorization: Bearer <access_token>` header

**Description:** Permanently deletes the authenticated user's account and all associated data. This action is irreversible. On success, the server invalidates all session data and returns 204 with no body.

**Data deleted (cascade order):**
1. `care_actions` — all care events for plants owned by this user (cascades from plants)
2. `care_schedules` — all care schedules for plants owned by this user (cascades from plants)
3. `plants` — all plants owned by this user (cascades from users)
4. `refresh_tokens` — all refresh tokens for this user (cascades from users)
5. Photo files on disk — any uploaded plant photo files associated with this user's plants (deleted by model layer before DB delete)
6. `users` — the user record itself

**Request Body:** None — no request body required or expected.

**Request Headers:**

```
Authorization: Bearer <access_token>   // required
```

**Success Response — 204 No Content:**

```
(empty body)
```

No `data` wrapper is returned for 204 responses (standard HTTP behavior for No Content).

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 401 | `UNAUTHORIZED` | Missing, expired, or invalid access token |
| 500 | `INTERNAL_ERROR` | Unexpected server error during deletion (e.g., DB failure, file system error). If the DB delete fails mid-way, the operation is atomic via a transaction — no partial deletes. |

**Notes for Frontend Engineer:**

- After a successful 204 response: clear all tokens (memory + any sessionStorage), then redirect to `/login`. Show a toast: "Your account has been deleted."
- If the request returns 401 (session expired before delete completes): display "Session expired. Please log in again." and redirect to `/login` after 2 seconds.
- If the request returns a network error or 5xx: re-enable the delete button and show inline error: "Something went wrong. Please try again."
- Do **not** retry the delete automatically — require the user to re-confirm.
- The full modal interaction spec is in SPEC-007 (ui-spec.md), documented as part of H-067.

**Notes for QA Engineer:**

Test cases required per T-033 acceptance criteria:
1. **Happy path (204):** Authenticated user calls DELETE /account → 204 returned → all DB rows for that user deleted → photo files cleaned up → calling GET /plants or GET /auth/profile with the same (now-deleted) account's credentials returns 401.
2. **Unauthenticated (401):** Request with no Authorization header → 401 `UNAUTHORIZED`.
3. **Invalid token (401):** Request with a malformed or expired JWT → 401 `UNAUTHORIZED`.
4. **Cascade verification:** After delete, query DB directly to confirm users, plants, care_schedules, care_actions, and refresh_tokens rows for that user_id are all gone.
5. **Regression:** All 44 existing backend tests continue to pass after T-033 is merged.

---

### Schema Changes — Sprint 6

**No new migrations required.** All foreign key `ON DELETE CASCADE` constraints established in Sprint 1 are sufficient:

| Table | FK to | Cascade |
|-------|-------|---------|
| `refresh_tokens` | `users.id` | `ON DELETE CASCADE` — tokens deleted when user deleted |
| `plants` | `users.id` | `ON DELETE CASCADE` — plants deleted when user deleted |
| `care_schedules` | `plants.id` | `ON DELETE CASCADE` — schedules deleted when plant deleted |
| `care_actions` | `care_schedules.id` | `ON DELETE CASCADE` — actions deleted when schedule deleted |

Photo file cleanup (files in `backend/uploads/`) is handled in the application layer (User model) — not a DB schema concern.

**No migration files will be created this sprint.**

---

### Environment Configuration — Sprint 6

No new environment variables are required for T-033 or T-031.

---

*Sprint 6 contract written by Backend Engineer — 2026-03-25. One new endpoint: DELETE /api/v1/auth/account. No schema changes. All 14 prior endpoints unchanged.*

---

## Sprint 7 Contracts — 2026-03-25

---

### Summary

Sprint 7 introduces **one new API endpoint**: `GET /api/v1/care-actions` (T-039). No other endpoints are added or changed. No schema migrations are required — the `care_actions` table and all necessary indexes were established in Sprint 1 (T-014). A cross-table JOIN with `plants` satisfies the `plant_name` field requirement without any schema change.

**New endpoints this sprint: 1** (total endpoints: 16)

---

### GROUP 7 — Care History (T-039)

---

#### GET /api/v1/care-actions

**Auth:** Bearer token (required)

**Description:** Returns a paginated, reverse-chronological list of all care actions performed by the authenticated user across all their plants. Optionally filtered to a single plant via the `plant_id` query parameter. Used by the Care History page (`/history`, SPEC-008).

**Query Parameters:**

| Parameter | Type | Required | Default | Rules |
|-----------|------|----------|---------|-------|
| `page` | integer | No | `1` | Must be ≥ 1 |
| `limit` | integer | No | `20` | Must be between 1 and 100 inclusive |
| `plant_id` | UUID string | No | — | If provided, must be a valid UUID; results restricted to this plant; returns empty array (not 404) if the plant has no care actions. If the plant_id does not belong to the authenticated user, return empty array (ownership isolation — do not reveal existence of other users' plants). |

**Request Body:** None

**Success Response — 200 OK:**

```json
{
  "data": [
    {
      "id": "uuid",
      "plant_id": "uuid",
      "plant_name": "string",
      "care_type": "watering | fertilizing | repotting",
      "performed_at": "ISO8601"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42
  }
}
```

**Field Notes:**

| Field | Source | Notes |
|-------|--------|-------|
| `id` | `care_actions.id` | UUID v4 |
| `plant_id` | `care_actions.plant_id` | UUID v4 |
| `plant_name` | `plants.name` (JOIN) | The plant's display name at time of query |
| `care_type` | `care_actions.care_type` | Enum: `"watering"`, `"fertilizing"`, `"repotting"` |
| `performed_at` | `care_actions.performed_at` | ISO 8601 UTC; used to compute relative timestamps on the frontend |

**Sorting:** Always sorted by `performed_at DESC` (most recent first). Sorting is not configurable by the client.

**Pagination Behavior:**
- `page` and `limit` follow standard offset pagination: `OFFSET = (page - 1) * limit`
- `total` is the count of all matching rows before pagination (used by frontend to compute "N remaining" for load-more)
- Empty result is a valid 200 response: `{ "data": [], "pagination": { "page": 1, "limit": 20, "total": 0 } }`

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | `page` or `limit` is not a positive integer; `limit` exceeds 100; `plant_id` is not a valid UUID format |
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

**Example — successful response with filter:**

```
GET /api/v1/care-actions?plant_id=abc123de-...&page=1&limit=20
Authorization: Bearer <access_token>
```

```json
{
  "data": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "plant_id": "abc123de-0000-0000-0000-000000000001",
      "plant_name": "Monstera Deliciosa",
      "care_type": "watering",
      "performed_at": "2026-03-24T14:32:00.000Z"
    },
    {
      "id": "a1b2c3d4-58cc-4372-a567-0e02b2c3d480",
      "plant_id": "abc123de-0000-0000-0000-000000000001",
      "plant_name": "Monstera Deliciosa",
      "care_type": "fertilizing",
      "performed_at": "2026-03-20T09:15:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2
  }
}
```

**Example — empty result (no care actions or no-match filter):**

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

**Example error (401):**

```json
{
  "error": {
    "message": "Authentication required.",
    "code": "UNAUTHORIZED"
  }
}
```

**Example error (400 — invalid plant_id format):**

```json
{
  "error": {
    "message": "plant_id must be a valid UUID.",
    "code": "VALIDATION_ERROR"
  }
}
```

---

### Schema Changes — Sprint 7

**No new migrations required.** The `care_actions` table was created in Sprint 1 (T-014, migration `20260323_05_create_care_actions.js`) and already contains all fields needed by this endpoint. The required indexes are already in place:

| Index | Columns | Purpose |
|-------|---------|---------|
| `idx_care_actions_plant_id` | `plant_id` | Fast filter-by-plant queries |
| `idx_care_actions_performed_at` | `(plant_id, performed_at)` | Fast sort + filter for history listing |

The `plant_name` field is resolved at query time via a `JOIN` on the `plants` table — no denormalization or new columns needed.

**No migration files will be created this sprint.**

---

### Environment Configuration — Sprint 7

No new environment variables are required for T-039.

---

*Sprint 7 contract written by Backend Engineer — 2026-03-25. One new endpoint: GET /api/v1/care-actions. No schema changes. All 15 prior endpoints unchanged.*

---

## Sprint 8 Contracts — 2026-03-27

---

Sprint 8 introduces **one new API endpoint**: `GET /api/v1/care-due` (T-043). No other endpoints are added or changed. No schema migrations are required — all data needed for care-due calculations is already available in the existing `care_schedules` and `care_actions` tables from Sprint 1.

---

### GROUP 17 — Care Due Dashboard (T-043)

---

#### GET /api/v1/care-due

**Auth:** Required — Bearer token in `Authorization: Bearer <access_token>` header

**Description:** Returns all care events for the authenticated user's plants, categorised into three urgency buckets: overdue (past due), due today, and upcoming (within the next 7 days). The frontend uses this response to render the Care Due Dashboard (`/due`) and to populate the sidebar badge count (overdue + due_today items).

**Calculation Logic:**
- For each `(plant, care_schedule)` pair owned by the authenticated user, compute:
  ```
  next_due = last_done_at + frequency_days
             (or plant.created_at + frequency_days if the care type has never been logged)
  ```
- Compare `next_due` against today's server date (UTC, date-only comparison):
  - `next_due < today` → **overdue** — `days_overdue = today - next_due` (in days, integer ≥ 1)
  - `next_due = today` → **due_today**
  - `next_due > today` AND `next_due ≤ today + 7 days` → **upcoming** — `due_in_days = next_due - today` (integer 1–7)
  - `next_due > today + 7 days` → **not returned** (on track, outside the 7-day window)
- `last_done_at` is the most recent `performed_at` from `care_actions` for the given `(plant_id, care_type)` pair. If no record exists, `last_done_at` is `null` and `plant.created_at` is used as the baseline.

**Query Parameters:** None — all data is scoped to the authenticated user.

**Request Body:** None (GET request).

**Success Response — 200 OK:**

```json
{
  "data": {
    "overdue": [
      {
        "plant_id": "uuid",
        "plant_name": "string",
        "care_type": "watering | fertilizing | repotting",
        "days_overdue": 3,
        "last_done_at": "2026-03-24T08:00:00.000Z"
      }
    ],
    "due_today": [
      {
        "plant_id": "uuid",
        "plant_name": "string",
        "care_type": "watering | fertilizing | repotting"
      }
    ],
    "upcoming": [
      {
        "plant_id": "uuid",
        "plant_name": "string",
        "care_type": "watering | fertilizing | repotting",
        "due_in_days": 3,
        "due_date": "2026-03-30"
      }
    ]
  }
}
```

**Field Details:**

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `plant_id` | UUID string | No | The plant's UUID |
| `plant_name` | string | No | The plant's name (from `plants.name`) |
| `care_type` | enum string | No | One of: `watering`, `fertilizing`, `repotting` |
| `days_overdue` | integer ≥ 1 | No (overdue only) | How many days past due. Minimum 1. |
| `last_done_at` | ISO 8601 UTC string | **Yes** | Timestamp of most recent care action for this type. `null` if care has never been logged (never-done plant). Present in `overdue` items only. |
| `due_in_days` | integer 1–7 | No (upcoming only) | Days until next due. 1 = tomorrow, 7 = one week away. |
| `due_date` | ISO 8601 date string | No (upcoming only) | Calendar date when care is next due, e.g. `"2026-03-30"` (UTC date, no time component). |

**Empty response (all plants on track — no overdue, due today, or upcoming in 7 days):**
```json
{
  "data": {
    "overdue": [],
    "due_today": [],
    "upcoming": []
  }
}
```
This is a valid 200 response — the frontend renders the global all-clear state.

**Response when user has no plants:**
```json
{
  "data": {
    "overdue": [],
    "due_today": [],
    "upcoming": []
  }
}
```
Same empty shape — no special status code.

**Sorting (server-side, applied before response):**
- `overdue`: sorted by `days_overdue` DESC, then `plant_name` ASC for ties
- `due_today`: sorted by `plant_name` ASC
- `upcoming`: sorted by `due_in_days` ASC, then `plant_name` ASC for ties

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 401 | `UNAUTHORIZED` | No `Authorization` header, token is malformed, expired, or refers to a deleted user |
| 500 | `INTERNAL_ERROR` | Unexpected server error (DB failure, etc.) |

**Example error (401):**
```json
{
  "error": {
    "message": "Unauthorized.",
    "code": "UNAUTHORIZED"
  }
}
```

**Example error (500):**
```json
{
  "error": {
    "message": "An unexpected error occurred.",
    "code": "INTERNAL_ERROR"
  }
}
```

**Example curl:**
```bash
curl -X GET http://localhost:3000/api/v1/care-due \
  -H "Authorization: Bearer <access_token>"
```

**Example happy-path response (mixed statuses):**
```json
{
  "data": {
    "overdue": [
      {
        "plant_id": "a1b2c3d4-...",
        "plant_name": "Monstera",
        "care_type": "watering",
        "days_overdue": 5,
        "last_done_at": "2026-03-22T09:00:00.000Z"
      },
      {
        "plant_id": "e5f6g7h8-...",
        "plant_name": "Pothos",
        "care_type": "fertilizing",
        "days_overdue": 2,
        "last_done_at": null
      }
    ],
    "due_today": [
      {
        "plant_id": "a1b2c3d4-...",
        "plant_name": "Monstera",
        "care_type": "fertilizing"
      }
    ],
    "upcoming": [
      {
        "plant_id": "i9j0k1l2-...",
        "plant_name": "Snake Plant",
        "care_type": "watering",
        "due_in_days": 3,
        "due_date": "2026-03-30"
      }
    ]
  }
}
```

---

### Schema Notes — Sprint 8

**No new migrations required.**

The `GET /api/v1/care-due` endpoint requires **no schema changes**. All data is derivable from existing tables:

- `plants` (Sprint 1, migration 3): provides `id`, `name`, `user_id`, `created_at` (baseline date for never-done plants)
- `care_schedules` (Sprint 1, migration 4): provides `plant_id`, `care_type`, `frequency_days`
- `care_actions` (Sprint 1, migration 5): provides `plant_id`, `care_type`, `performed_at` (used as `last_done_at`)

**No migration files will be created for Sprint 8 (T-043).**

---

### Query Design (for implementation reference)

The core computation requires a `LEFT JOIN` from `care_schedules` to the most recent `care_action` per `(plant_id, care_type)`:

```sql
-- Step 1: Get most recent care action per (plant_id, care_type) for this user
SELECT
  cs.plant_id,
  p.name AS plant_name,
  cs.care_type,
  cs.frequency_days,
  p.created_at AS plant_created_at,
  MAX(ca.performed_at) AS last_done_at
FROM care_schedules cs
JOIN plants p ON cs.plant_id = p.id
LEFT JOIN care_actions ca ON ca.plant_id = cs.plant_id
  AND ca.care_type = cs.care_type
WHERE p.user_id = :userId
GROUP BY cs.plant_id, p.name, cs.care_type, cs.frequency_days, p.created_at

-- Step 2 (application layer): compute next_due from last_done_at (or plant_created_at)
-- and categorise each row into overdue / due_today / upcoming / on_track
```

All queries use parameterized values via Knex — no string concatenation of user input.

---

### Environment Configuration — Sprint 8

No new environment variables are required for T-043.

---

*Sprint 8 contract written by Backend Engineer — 2026-03-27. One new endpoint: GET /api/v1/care-due. No schema changes. All 16 prior endpoints unchanged.*

---

## Sprint 9 Contracts

---

### T-048 — Gemini 429 Model Fallback Chain (Behavioral Update to POST /api/v1/ai/advice)

**Task:** T-048
**Type:** Internal behavior change — no contract shape changes
**Status:** Contracted (2026-03-28)

---

#### Summary

Sprint 9 introduces **no new endpoints** and **no schema changes**. The single backend task (T-048) modifies the internal error-handling behavior of the existing `POST /api/v1/ai/advice` endpoint. The request body, success response shape, and all error response codes/shapes remain **identical** to the Sprint 1 contract.

Frontend engineers and QA: **no integration changes required.** The external-facing contract is frozen.

---

#### POST /api/v1/ai/advice — Behavioral Update

**Auth:** Bearer token (unchanged)

**Request Body:** Unchanged from Sprint 1.

```json
{
  "plant_type": "string | null",   // optional; max 200 chars
  "photo_url":  "string | null"    // optional; must be a URL string
}
```

At least one of `plant_type` or `photo_url` must be provided.

**Success Response — 200 OK:** Unchanged from Sprint 1.

```json
{
  "data": {
    "identified_plant_type": "string | null",
    "confidence": "high | medium | low | null",
    "care_advice": {
      "watering": {
        "frequency_value": 7,
        "frequency_unit": "days",
        "notes": "string | null"
      },
      "fertilizing": {
        "frequency_value": 2,
        "frequency_unit": "weeks",
        "notes": "string | null"
      },
      "repotting": {
        "frequency_value": 12,
        "frequency_unit": "months",
        "notes": "string | null"
      },
      "light": "string | null",
      "humidity": "string | null",
      "additional_tips": "string | null"
    }
  }
}
```

**Error Responses:** Unchanged from Sprint 1.

| Status | Code | Trigger |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | Neither `plant_type` nor `photo_url` provided; `plant_type` exceeds 200 chars |
| 401 | `UNAUTHORIZED` | Missing or invalid Bearer token |
| 422 | `PLANT_NOT_IDENTIFIABLE` | Gemini returned a response that could not be parsed into the expected care-advice structure |
| 502 | `AI_SERVICE_UNAVAILABLE` | Gemini API key not configured; OR all fallback models returned 429 rate-limit errors |

---

#### Behavioral Change: 429 Fallback Chain (Internal Only)

This is an **internal implementation detail**. It changes when the 502 is surfaced, not what the frontend receives when it is.

**Previous behavior (Sprint 1–8):**
Any Gemini API error (including 429 rate limit) immediately throws `ExternalServiceError` → `502 AI_SERVICE_UNAVAILABLE`.

**New behavior (Sprint 9 — T-048):**
On a 429 rate-limit response (`err.status === 429` or `err.message` contains `'429'`), the backend silently retries through a model chain before returning 502:

```
Attempt 1: gemini-2.0-flash      (primary model)
    ↓ if 429 →
Attempt 2: gemini-2.5-flash
    ↓ if 429 →
Attempt 3: gemini-2.5-flash-lite
    ↓ if 429 →
Attempt 4: gemini-2.5-pro
    ↓ if 429 →
502 AI_SERVICE_UNAVAILABLE       (all models exhausted)
```

**Rules:**
- Non-429 errors at any step are re-thrown immediately — no fallback occurs.
- If any model in the chain succeeds, the 200 success response is returned normally.
- If all four models return 429, `ExternalServiceError` is thrown → `502 AI_SERVICE_UNAVAILABLE` with the same error body as before.

**Frontend impact:** None. The frontend already handles 502 per SPEC-006 (shows "Our AI service is temporarily offline" with only a "Close" button). The only observable difference is that a rate-limited request may take longer (up to 4 sequential model attempts) before the 502 is returned — this is intentional resilience behavior.

---

#### Schema Changes — Sprint 9

None. No new tables, columns, or migrations required for T-048.

---

#### Environment Variables — Sprint 9

No new environment variables required. `GEMINI_API_KEY` (existing) is used by all four fallback models.

---

*Sprint 9 contract written by Backend Engineer — 2026-03-28. Zero new endpoints. No schema changes. Behavioral-only update to POST /api/v1/ai/advice (429 fallback chain). All 17 prior endpoints and their shapes unchanged.*

---

## Sprint 11 Contracts

**Task:** T-053 — Persistent Login via HttpOnly Refresh Token Cookie
**Written by:** Backend Engineer — 2026-03-30
**Status:** Ready for implementation

---

### GROUP 11A — Authentication Cookie Upgrade (T-053)

**Summary of changes:** The four existing auth endpoints (`register`, `login`, `refresh`, `logout`) are updated to transport the refresh token via an `HttpOnly` cookie instead of the response/request body. The access token remains in the response body (memory-only on the frontend — no XSS regression). No new endpoints. No schema changes.

---

#### POST /api/v1/auth/register *(Updated — Sprint 11)*

**Auth:** Public (no token required)

**Description:** Creates a new user account. Returns an access token in the response body and sets the refresh token as an HttpOnly cookie. **Breaking change from Sprint 1:** `refresh_token` is no longer in the response body.

**Request Body:** Unchanged from Sprint 1.

```json
{
  "full_name": "string",    // required; min 2 chars, max 100 chars
  "email": "string",        // required; valid email format; unique across users
  "password": "string"      // required; min 8 chars
}
```

**Response Headers Set:**
```
Set-Cookie: refresh_token=<opaque_token>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800
```
- `HttpOnly` — prevents JavaScript access (XSS protection)
- `Secure` — only sent over HTTPS (browser ignores on plain `http://` in production; accepted in local dev where `Secure` is set but not enforced by localhost)
- `SameSite=Strict` — not sent on cross-site requests (CSRF protection)
- `Path=/api/v1/auth` — scoped to auth routes only; not sent on `/plants`, `/care-actions`, etc.
- `Max-Age=604800` — 7 days (matches `REFRESH_TOKEN_EXPIRES_DAYS`)

**Success Response — 201 Created:**

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "full_name": "string",
      "email": "string",
      "created_at": "ISO8601"
    },
    "access_token": "string"
  }
}
```

> **Note:** `refresh_token` is no longer in the response body. It is exclusively in the `Set-Cookie` header.

**Error Responses:** Unchanged from Sprint 1.

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | Missing or invalid fields |
| 409 | `EMAIL_ALREADY_EXISTS` | An account with that email already exists |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

#### POST /api/v1/auth/login *(Updated — Sprint 11)*

**Auth:** Public

**Description:** Authenticates an existing user. Returns an access token in the response body and sets the refresh token as an HttpOnly cookie. **Breaking change from Sprint 1:** `refresh_token` is no longer in the response body.

**Request Body:** Unchanged from Sprint 1.

```json
{
  "email": "string",      // required
  "password": "string"    // required
}
```

**Response Headers Set:**
```
Set-Cookie: refresh_token=<opaque_token>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800
```

**Success Response — 200 OK:**

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "full_name": "string",
      "email": "string",
      "created_at": "ISO8601"
    },
    "access_token": "string"
  }
}
```

> **Note:** `refresh_token` is no longer in the response body. It is exclusively in the `Set-Cookie` header.

**Error Responses:** Unchanged from Sprint 1.

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | Missing email or password |
| 401 | `INVALID_CREDENTIALS` | Email not found or password is wrong |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

#### POST /api/v1/auth/refresh *(Updated — Sprint 11)*

**Auth:** Public — no Bearer token. Refresh token read from cookie (must send `credentials: 'include'`).

**Description:** Silently re-authenticates a returning user. Reads the `refresh_token` cookie, validates it, issues a new access token (in body) and a rotated refresh token (new cookie). Old refresh token is invalidated. **Breaking change from Sprint 1:** `refresh_token` is no longer in the request body.

**Request Body:** Empty (no body required). The refresh token is read from the `refresh_token` HttpOnly cookie.

```json
{}
```

**Cookie Required:**
```
Cookie: refresh_token=<opaque_token>
```
The browser sends this automatically when the request is made with `credentials: 'include'`.

**Response Headers Set (rotated token):**
```
Set-Cookie: refresh_token=<new_opaque_token>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800
```

**Success Response — 200 OK:**

```json
{
  "data": {
    "access_token": "string"
  }
}
```

> **Note:** New rotated refresh token is set via `Set-Cookie` header only — not in the response body.

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 401 | `INVALID_REFRESH_TOKEN` | Cookie missing, token not found in DB, token expired, or token already revoked |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

#### POST /api/v1/auth/logout *(Updated — Sprint 11)*

**Auth:** Bearer token required (`Authorization: Bearer <access_token>`)

**Description:** Revokes the refresh token and clears the HttpOnly cookie. **Breaking change from Sprint 1:** `refresh_token` is no longer required in the request body.

**Request Body:** Empty (no body required). The refresh token is read from the `refresh_token` HttpOnly cookie.

```json
{}
```

**Cookie Required:**
```
Cookie: refresh_token=<opaque_token>
```

**Response Headers Set (clears the cookie):**
```
Set-Cookie: refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

**Success Response — 200 OK:** Unchanged from Sprint 1.

```json
{
  "data": {
    "message": "Logged out successfully."
  }
}
```

> **Note:** Cookie is cleared via `Max-Age=0` + epoch `Expires`. If the `refresh_token` cookie is absent, logout still succeeds (idempotent — access token is still invalidated via normal session end on the client).

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 401 | `UNAUTHORIZED` | Missing or invalid Bearer token in `Authorization` header |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

### Frontend Integration Notes (for Frontend Engineer)

The following changes are required in `frontend/src/utils/api.js`:

1. **All fetch calls** must include `credentials: 'include'` so the browser sends and accepts cookies cross-origin.
2. **On app init** (e.g., inside a `useEffect` in `App.jsx` or a top-level auth provider): call `POST /api/v1/auth/refresh` with `credentials: 'include'`. If it returns `200`, store the `access_token` in memory and mark the user as authenticated. If it returns `401`, redirect to `/login`.
3. **Login and register** — `refresh_token` is no longer in the response body. Read only `access_token` from `data`. The cookie is set automatically by the browser.
4. **Logout** — no need to send `refresh_token` in the body. Call `POST /api/v1/auth/logout` with Bearer token and `credentials: 'include'`.
5. **Access token** stays memory-only (no `localStorage` / `sessionStorage`). This is unchanged from Sprint 1.

---

### Schema Changes — Sprint 11

None. No new tables, columns, or migrations required for T-053.

The existing `refresh_tokens` table is unchanged. The cookie transport is a route-layer concern only.

---

### Middleware Addition — Sprint 11

The `cookie-parser` npm package must be added to `backend/package.json` and registered in `backend/src/app.js` before the auth router:

```js
const cookieParser = require('cookie-parser');
app.use(cookieParser());
```

This is required for `req.cookies.refresh_token` to be available in the auth routes.

No environment variable changes required for cookie behavior. `REFRESH_TOKEN_EXPIRES_DAYS` (existing, defaults to `7`) continues to control token lifetime and is used to derive `Max-Age`.

---

*Sprint 11 contract written by Backend Engineer — 2026-03-30. Four existing auth endpoints updated (register, login, refresh, logout). Refresh token transport moves from body to HttpOnly cookie. Zero new endpoints. No schema changes. No migration files.*

---

## Sprint 12 Contracts — 2026-03-30

**Written by:** Backend Engineer — 2026-03-30
**Status:** Final — No new or changed endpoints this sprint.

---

### Overview

Sprint #12 scope contains **zero new API endpoints** and **zero schema changes**. All backend work is reliability and configuration fixes:

| Task | Type | API Impact |
|------|------|-----------|
| T-056 | Bug fix — intermittent 500 on `POST /api/v1/auth/login` | None — contract unchanged, reliability improved |
| T-057 | Config fix — `TEST_DATABASE_URL` port in `backend/.env` | None — test-only, zero runtime impact |

---

### T-056 — POST /api/v1/auth/login Reliability Fix

**Contract status:** UNCHANGED from Sprint 11. The endpoint spec defined in GROUP 11A remains authoritative.

**What is being fixed:** An intermittent HTTP 500 occurs on `POST /api/v1/auth/login` when the backend is cold-started (FB-044). Root cause is suspected Knex connection pool cold-start (pool `min` is 0, so first request races against pool warm-up) or a `cookie-parser` middleware registration race in `app.js`. No change to request shape, response shape, error codes, or auth requirements.

**Behavioral guarantee after fix:** `POST /api/v1/auth/login` MUST return `200 OK` with a valid access token (and set the `refresh_token` HttpOnly cookie) on every call, including the very first request after a cold backend restart. The 5-in-a-row / no-500 acceptance criterion from `active-sprint.md` is the verification target.

**For Frontend Engineer:** No changes to your integration. `credentials: 'include'` is already required (Sprint 11 contract). The fix simply eliminates the transient 500 that could interrupt the login flow.

**For QA Engineer:** After T-056 is implemented, verify:
1. Restart backend (kill process → `npm start`)
2. Immediately call `POST /api/v1/auth/login` 5 times in rapid succession
3. All 5 must return `200 OK` — zero `500 Internal Server Error`
4. All 72/72 backend tests must still pass

---

### T-057 — TEST_DATABASE_URL Config Fix

**Contract status:** No API impact whatsoever.

**What is being fixed:** `backend/.env` has `TEST_DATABASE_URL` pointing to port `5432`. `docker-compose.yml` maps the test PostgreSQL service to port `5433`. This mismatch causes test-suite failures if tests run against Docker. The fix updates the port to `5433` in `backend/.env`.

**For Frontend Engineer:** No action needed.
**For QA Engineer:** After T-057 is applied, confirm all 72/72 backend tests pass. No new test cases needed for this fix.

---

### Schema Changes — Sprint 12

**None.** No new tables, columns, or migrations. No Manager approval required.

---

*Sprint 12 contract written by Backend Engineer — 2026-03-30. Zero new endpoints. Zero schema changes. T-056 stabilizes existing POST /api/v1/auth/login reliability. T-057 corrects a test config port mismatch. All existing Sprint 11 contracts remain authoritative.*

---

## Sprint 14 Contracts — 2026-03-30

**Written by:** Backend Engineer — 2026-03-30
**Status:** Ready for implementation — API contracts published before any code is written.

---

### Overview

Sprint #14 contains **zero new API endpoints** and **zero schema changes**. All backend API work is bug-fix corrections to two existing endpoints:

| Task | Type | Affected Endpoint | Change |
|------|------|-------------------|--------|
| T-058 | Bug fix — pool idle reaping causes transient 500 on login | `POST /api/v1/auth/login` | Contract UNCHANGED — reliability fix only (knexfile.js / server.js config) |
| T-059 | Bug fix — plant photo URL not browser-accessible after upload | `POST /api/v1/plants/:id/photo` | Contract CLARIFIED — `photo_url` format requirement made explicit |
| T-060 | Bug fix — Care Due Dashboard timezone mismatch | `GET /api/v1/care-due` | Contract UPDATED — new optional `utcOffset` query parameter added |
| T-061 | Dependency update — npm audit fix | None | No API impact |

---

### T-058 — POST /api/v1/auth/login Pool Idle Fix

**Contract status:** UNCHANGED from Sprint 11 / Sprint 12.

**What is being fixed (implementation only):** After a 30-second idle period, the Knex connection pool reaps idle connections. The `afterCreate` validation hook adds latency during pool refill, creating a brief window where requests fail with 500. This is the same bug class as T-056 (cold-start), but triggered by idle reaping rather than cold-start.

**Fix strategy (implementation-only, no contract impact):**
- Increase `idleTimeoutMillis` from `30000` to `600000` (10 minutes) in `backend/knexfile.js` production and staging config sections; AND/OR
- Add a periodic keepalive query (`SELECT 1`) in `backend/src/server.js` to prevent connection reaping during normal app operation.

**Behavioral guarantee after fix:** `POST /api/v1/auth/login` MUST return `200 OK` consistently, including immediately after a 30+ second period of server inactivity. The fix must not change request shape, response shape, error codes, or auth requirements.

**For Frontend Engineer:** No changes to your integration.

**For QA Engineer:** After T-058 is implemented, verify:
1. Allow the backend to sit idle for 30+ seconds (or simulate by temporarily setting `idleTimeoutMillis` to 3 seconds in a test config)
2. Immediately call `POST /api/v1/auth/login` 5 times in rapid succession
3. All 5 must return `200 OK` — zero `500 Internal Server Error`
4. All 74/74 backend tests must still pass

---

### T-059 — POST /api/v1/plants/:id/photo — photo_url Format Clarification

**Contract status:** CLARIFIED. The original Sprint 1 contract stated `photo_url` is a "publicly accessible URL" but did not specify the URL format. This sprint's fix makes the format requirement explicit.

#### POST /api/v1/plants/:id/photo *(Clarified — Sprint 14)*

**Auth:** Bearer token (required) — unchanged

**Description:** Unchanged from Sprint 1. Uploads a photo for a plant via `multipart/form-data` and returns a browser-accessible URL.

**Request:** Unchanged from Sprint 1.

| Field | Type | Rules |
|-------|------|-------|
| `photo` | file | required; MIME type `image/jpeg`, `image/png`, or `image/webp`; max 5 MB |

**Success Response — 200 OK:**

```json
{
  "data": {
    "photo_url": "/uploads/<uuid>.<ext>"
  }
}
```

**`photo_url` format requirements (Sprint 14 clarification):**
- MUST be a **relative path** of the form `/uploads/<filename>` (e.g., `/uploads/a3f8d2b1-...jpg`)
- MUST be resolvable by the browser when prefixed with the backend origin (e.g., `http://localhost:3000/uploads/<filename>` returns HTTP 200)
- The backend MUST serve the `./uploads/` directory as static files at the `/uploads/` path via `express.static`
- The filename MUST be a UUID v4 (to prevent enumeration/path traversal) plus the original file extension
- Do NOT store an absolute `http://localhost:3000/...` URL in the database — store only the relative `/uploads/<filename>` path. This ensures portability across environments.

**Error Responses:** Unchanged from Sprint 1.

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `MISSING_FILE` | No `photo` field in the multipart request |
| 400 | `INVALID_FILE_TYPE` | File MIME type is not `image/jpeg`, `image/png`, or `image/webp` |
| 400 | `FILE_TOO_LARGE` | File exceeds 5 MB |
| 401 | `UNAUTHORIZED` | Missing or invalid Bearer token |
| 404 | `PLANT_NOT_FOUND` | No plant with this ID exists, or it belongs to a different user |
| 500 | `INTERNAL_ERROR` | Unexpected server error (e.g., file system write failure) |

**Implementation notes for Backend Engineer:**
- Add `app.use('/uploads', express.static(path.join(__dirname, '../uploads')))` in `backend/src/app.js`
- Ensure the `uploads/` directory is created at startup if it does not exist (use `fs.mkdirSync` with `{ recursive: true }`)
- The route handler must construct `photo_url` as `/uploads/<filename>` — NOT `http://localhost:3000/uploads/<filename>`
- This relative URL is stored in `plants.photo_url` and returned by `GET /plants` and `GET /plants/:id`

**End-to-end verification (for QA):**
1. Call `POST /api/v1/plants/:id/photo` with a valid image → response contains `photo_url: "/uploads/<uuid>.jpg"`
2. Call `GET /api/v1/plants/:id` → `photo_url` field matches the URL returned by step 1
3. Fetch `GET http://localhost:3000<photo_url>` directly → returns HTTP 200 with `Content-Type: image/*`

---

### T-060 — GET /api/v1/care-due — UTC Offset Query Parameter (Updated)

**Contract status:** UPDATED. The original Sprint 8 contract did not include timezone support. A new optional `utcOffset` query parameter is added. All other fields (auth, response shape, error codes) are unchanged.

#### GET /api/v1/care-due *(Updated — Sprint 14)*

**Auth:** Required — Bearer token in `Authorization: Bearer <access_token>` header — unchanged

**Description:** Returns care events for all of the authenticated user's plants, bucketed by urgency. **Sprint 14 update:** Accepts an optional `utcOffset` query parameter so urgency bucketing reflects the user's local timezone rather than UTC. All other behavior is unchanged from Sprint 8.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `utcOffset` | integer (minutes) | optional | The caller's UTC offset in minutes from UTC. **Positive values = ahead of UTC (e.g., UTC+5:30 → `330`). Negative values = behind UTC (e.g., UTC-5 → `-300`).** If omitted, backend defaults to UTC (existing behavior — no regression for consumers that don't send the param). |

**Computing `utcOffset` on the frontend:**
```js
// JavaScript's getTimezoneOffset() returns minutes *behind* UTC (inverted convention)
// We invert it to get minutes *ahead* of UTC (standard convention)
const utcOffset = new Date().getTimezoneOffset() * -1;
// US Eastern Standard Time → getTimezoneOffset() = 300 → utcOffset = -300
// Central European Time    → getTimezoneOffset() = -60 → utcOffset = 60
```

**Validation:**
- `utcOffset`: optional; if provided, must be an integer in the range `-840` to `840` (valid UTC offset range in minutes); returns `400 VALIDATION_ERROR` if out of range or non-integer

**Backend logic change:**
- If `utcOffset` is provided: compute "local today" as `[UTC midnight + utcOffset minutes, UTC midnight + utcOffset minutes + 24 hours)` — all comparisons use this local day boundary
- If `utcOffset` is omitted: use UTC midnight (existing behavior — no change)

**Request — unchanged from Sprint 8:**

```
GET /api/v1/care-due?utcOffset=-300
Authorization: Bearer <access_token>
```

**Success Response — 200 OK:** Unchanged from Sprint 8.

```json
{
  "data": {
    "overdue": [
      {
        "plant_id": "uuid",
        "plant_name": "string",
        "care_type": "watering | fertilizing | repotting",
        "days_overdue": 3,
        "last_done_at": "ISO8601 | null"
      }
    ],
    "due_today": [
      {
        "plant_id": "uuid",
        "plant_name": "string",
        "care_type": "watering | fertilizing | repotting",
        "last_done_at": "ISO8601 | null"
      }
    ],
    "upcoming": [
      {
        "plant_id": "uuid",
        "plant_name": "string",
        "care_type": "watering | fertilizing | repotting",
        "due_in_days": 3,
        "due_date": "YYYY-MM-DD"
      }
    ]
  }
}
```

**Note on `due_date`:** When `utcOffset` is provided, `due_date` is expressed as a local calendar date (YYYY-MM-DD in the user's local timezone), not a UTC date.

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | `utcOffset` provided but not a valid integer in range `[-840, 840]` |
| 401 | `UNAUTHORIZED` | Missing or invalid Bearer token |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

**Frontend integration (for Frontend Engineer — T-060 frontend half):**

In `frontend/src/pages/CareDuePage.jsx` (or `frontend/src/utils/api.js` in the `careDue.get()` method), send `utcOffset` with every request:

```js
// In api.js — careDue.get()
const utcOffset = new Date().getTimezoneOffset() * -1;
const response = await fetch(`/api/v1/care-due?utcOffset=${utcOffset}`, {
  headers: { Authorization: `Bearer ${accessToken}` },
  credentials: 'include',
});
```

**Backward compatibility:** Any existing API consumer that calls `GET /api/v1/care-due` without `utcOffset` continues to receive UTC-bucketed results. No breaking change.

**Example curl (with utcOffset):**
```bash
curl -X GET "http://localhost:3000/api/v1/care-due?utcOffset=-300" \
  -H "Authorization: Bearer <access_token>"
```

---

### T-061 — npm audit fix

**Contract status:** No API impact.

**What is being done:** Run `npm audit fix` in both `backend/` and `frontend/` to resolve available non-breaking vulnerabilities. No new endpoints, no schema changes, no request/response shape changes.

**For Frontend Engineer:** No action needed.
**For QA Engineer:** After T-061, verify all 74/74 backend tests and 130/130 frontend tests still pass. Review `npm audit` output — no new high-severity production vulnerabilities should be introduced.

---

### Schema Changes — Sprint 14

**None.** No new tables, columns, or migrations required for any Sprint 14 task.

- T-058 is a config-only fix (`knexfile.js`, optionally `server.js`)
- T-059 is a route/static-file fix (no DB schema change; `photo_url` column already exists in `plants` table from Sprint 1)
- T-060 is a route-logic fix (offset computation uses existing `care_schedules` and `care_actions` data)
- T-061 is a dependency update only

**No Manager approval required for schema changes this sprint** — there are none.

---

### Health Endpoint Documentation Fix (T-062)

> **Note for QA Engineer:** T-062 assigns QA to fix a documentation discrepancy. If any reference to `/api/v1/health` exists in this file or in `.agents/monitor-agent.md`, it should be corrected to `/api/health`. The actual endpoint is `GET /api/health` (not under `/api/v1/`). No code changes required — docs only.

---

*Sprint 14 contract written by Backend Engineer — 2026-03-30. Zero new endpoints. Zero schema changes. Two endpoint clarifications/updates: POST /api/v1/plants/:id/photo (photo_url format made explicit); GET /api/v1/care-due (utcOffset query parameter added). T-058 and T-061 have no API contract impact. All prior sprint contracts remain authoritative.*

---

## Sprint 15 Contracts

*Written by Backend Engineer — 2026-03-31*

---

### GROUP 1 — Care History Analytics (T-064)

---

#### GET /api/v1/care-actions/stats

**Auth:** Bearer token (required)

**Description:** Returns aggregated care action statistics for the authenticated user — total count, breakdown by plant, breakdown by care type, and a recent activity feed. Powers the `/analytics` frontend page (SPEC-011).

**Query Parameters:** None

**Request Body:** None

**Success Response — 200 OK:**

```json
{
  "data": {
    "total_care_actions": 42,
    "by_plant": [
      {
        "plant_id": "uuid",
        "plant_name": "string",
        "count": 15,
        "last_action_at": "ISO8601"
      }
    ],
    "by_care_type": [
      { "care_type": "watering",    "count": 30 },
      { "care_type": "fertilizing", "count": 8  },
      { "care_type": "repotting",   "count": 4  }
    ],
    "recent_activity": [
      {
        "plant_name": "string",
        "care_type": "watering | fertilizing | repotting",
        "performed_at": "ISO8601"
      }
    ]
  }
}
```

**Field Rules:**

| Field | Type | Notes |
|-------|------|-------|
| `total_care_actions` | integer ≥ 0 | Count of all care actions recorded by this user across all plants |
| `by_plant` | array | One entry per plant that has at least one care action; sorted by `count` DESC, then `plant_name` ASC as a tiebreaker |
| `by_plant[].plant_id` | UUID string | Plant's unique identifier |
| `by_plant[].plant_name` | string | Human-readable plant name |
| `by_plant[].count` | integer ≥ 1 | Total care actions for this plant |
| `by_plant[].last_action_at` | ISO 8601 UTC string | Timestamp of the most recent care action for this plant |
| `by_care_type` | array | One entry per care type that appears in the user's care action history; sorted by `count` DESC |
| `by_care_type[].care_type` | string | One of `"watering"`, `"fertilizing"`, `"repotting"` (or any valid care type stored in care_schedules) |
| `by_care_type[].count` | integer ≥ 1 | Total care actions of this type |
| `recent_activity` | array | The 10 most recent care actions across all plants, sorted by `performed_at` DESC |
| `recent_activity[].plant_name` | string | Name of the plant that was cared for |
| `recent_activity[].care_type` | string | Type of care performed |
| `recent_activity[].performed_at` | ISO 8601 UTC string | When the care action was recorded |

**Empty State:**
When the user has no care actions at all, the response is:
```json
{
  "data": {
    "total_care_actions": 0,
    "by_plant": [],
    "by_care_type": [],
    "recent_activity": []
  }
}
```
This is a valid 200 response — not an error. The frontend renders the empty state UI per SPEC-011.

**User Isolation:** All aggregations are scoped to the authenticated user's plants and care actions only. The query must JOIN through `plants` on `plants.user_id = :userId` to guarantee isolation. No other user's data may leak.

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|----------|
| 401 | `UNAUTHORIZED` | Missing, expired, or invalid Bearer token |
| 500 | `INTERNAL_ERROR` | Unexpected server or database error |

**No pagination** — this endpoint is a stats aggregate, not a paginated list.

**Implementation notes (for T-064):**
- Route handler: `backend/src/routes/careActions.js` (add to existing file) or a new `careActionsStats.js` if separation is cleaner
- Model method: `CareAction.getStatsByUser(userId)` in `backend/src/models/CareAction.js`
- Three separate aggregation queries (or one CTE) joined in the model:
  1. `SELECT COUNT(*) AS total_care_actions FROM care_actions JOIN plants ON ...`
  2. `SELECT plants.id, plants.name, COUNT(*), MAX(performed_at) FROM care_actions JOIN plants ON ... GROUP BY plants.id ORDER BY count DESC, name ASC`
  3. `SELECT care_type, COUNT(*) FROM care_actions JOIN plants ON ... GROUP BY care_type ORDER BY count DESC`
  4. `SELECT plants.name, ca.care_type, ca.performed_at FROM care_actions ca JOIN plants ON ... ORDER BY ca.performed_at DESC LIMIT 10`
- All queries must use **parameterized Knex** — never string-interpolate `userId`
- Auth middleware (`requireAuth`) must be applied to this route exactly as it is on `GET /api/v1/care-due`

---

### Schema Changes — Sprint 15

**None.** No new tables, columns, or migrations are required for Sprint 15.

- `GET /api/v1/care-actions/stats` (T-064) aggregates data from existing `care_actions`, `plants`, and `care_schedules` tables — all created in Sprint 1 migrations
- T-066 (pool startup hardening) is a config/startup-sequence fix only — no DB schema change

**No Manager approval required for schema changes this sprint — there are none.**

*Auto-approved (automated sprint) — Manager will review in closeout phase.*

---

*Sprint 15 contract written by Backend Engineer — 2026-03-31. One new endpoint: GET /api/v1/care-actions/stats (T-064). Zero schema changes. T-066 has no API contract impact. All prior sprint contracts remain authoritative.*

---

## Sprint 16 Contracts

---

### GROUP 1 — Account Deletion (T-069)

---

#### DELETE /api/v1/account

**Auth:** Required — Bearer token in `Authorization: Bearer <access_token>` header

**Description:** Permanently deletes the authenticated user's account and all associated data (plants, care schedules, care actions, refresh tokens). The user is immediately logged out: the refresh token cookie is cleared on success.

**Request Body:**

```json
{
  "password": "string"   // required; user's current password — confirms intentional deletion
}
```

**Validation Rules:**
- `password`: required, non-empty string — must match the stored bcrypt hash for the authenticated user

**Success Response — 204 No Content:**

No response body. The refresh token `HttpOnly` cookie is cleared (Set-Cookie with `Max-Age=0`).

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `INVALID_PASSWORD` | `password` field is present but does not match the user's stored password hash. Message: `"Password is incorrect."` |
| 400 | `VALIDATION_ERROR` | `password` field is missing or not a string. Message describes which field. |
| 401 | `UNAUTHORIZED` | Missing, expired, or invalid Bearer token — auth middleware rejects before any DB query |
| 500 | `INTERNAL_ERROR` | Unexpected server or database error |

**Error Response Shape (example — wrong password):**

```json
{
  "error": {
    "message": "Password is incorrect.",
    "code": "INVALID_PASSWORD"
  }
}
```

**Cascade Behavior:**

All user-owned rows must be deleted. Preferred approach: rely on PostgreSQL `ON DELETE CASCADE` FK constraints already in place on `plants`, `care_schedules`, `care_actions`, and `refresh_tokens` tables (all reference `users.id`). Deleting the `users` row cascades automatically.

If any FK does not currently have `ON DELETE CASCADE`, explicit DELETEs in the following order must be used instead:
1. `DELETE FROM care_actions WHERE plant_id IN (SELECT id FROM plants WHERE user_id = :userId)`
2. `DELETE FROM care_schedules WHERE plant_id IN (SELECT id FROM plants WHERE user_id = :userId)`
3. `DELETE FROM refresh_tokens WHERE user_id = :userId`
4. `DELETE FROM plants WHERE user_id = :userId`
5. `DELETE FROM users WHERE id = :userId`

All executed within a single database transaction.

**User Isolation:** Only the authenticated user's own data may be deleted. The `userId` is sourced exclusively from the verified JWT payload — never from the request body or URL params.

**Implementation Notes (for T-069):**
- Route: `DELETE /account` in `backend/src/routes/account.js` (new file, or add to existing accounts route)
- Model method: `User.deleteWithAllData(userId)` in `backend/src/models/User.js`
- Auth middleware: `requireAuth` applied to this route
- After successful deletion, clear the refresh token cookie: `res.clearCookie('refreshToken')` (same options as the cookie was set with)
- Return `res.status(204).send()` — no body

---

### GROUP 2 — Stats Rate Limiter Amendment (T-071)

---

#### GET /api/v1/care-actions/stats — Rate Limit Amendment

**Existing contract:** See Sprint 15, GROUP 1 — `GET /api/v1/care-actions/stats`.

**Amendment (T-071):** An endpoint-specific rate limiter is added on top of the existing global limiter. This is a middleware-only change; the request/response schema is unchanged.

**New Rate Limit:**
- **Limit:** 30 requests per 15-minute window, per IP address
- **Scope:** Applied only to `GET /api/v1/care-actions/stats`; the global limiter (100 req/15min) continues to apply to all other endpoints

**On Rate Limit Exceeded — 429 Too Many Requests:**

```json
{
  "error": {
    "message": "Too many requests.",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

**Updated Error Responses for GET /api/v1/care-actions/stats:**

| HTTP | Code | Scenario |
|------|------|----------|
| 401 | `UNAUTHORIZED` | Missing, expired, or invalid Bearer token |
| 429 | `RATE_LIMIT_EXCEEDED` | More than 30 requests in a 15-minute window from the same IP |
| 500 | `INTERNAL_ERROR` | Unexpected server or database error |

**Implementation Notes (for T-071):**
- Create a dedicated `express-rate-limit` instance: `max: 30`, `windowMs: 15 * 60 * 1000`
- Apply it as middleware immediately before the `GET /care-actions/stats` route handler
- The `handler` option must return the structured `{ error: { message, code } }` body above with status 429

---

### GROUP 3 — Plant Name Max-Length Validation Amendment (T-075)

---

#### POST /api/v1/plants — Validation Amendment

**Existing contract:** See Sprint 1, GROUP 3 — `POST /api/v1/plants`.

**Amendment (T-075):** The `name` field now enforces a maximum length of 100 characters server-side.

**Updated Validation Rule:**
- `name`: required, string, **1–100 characters** (previously no upper bound enforced)

**New Error Case:**

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | `name` exceeds 100 characters. Message: `"name must be 100 characters or fewer."` |

---

#### PUT /api/v1/plants/:id — Validation Amendment

**Existing contract:** See Sprint 1, GROUP 3 — `PUT /api/v1/plants/:id`.

**Amendment (T-075):** The `name` field now enforces a maximum length of 100 characters server-side.

**Updated Validation Rule:**
- `name`: optional on PUT, but if provided must be a string of **1–100 characters** (previously no upper bound enforced)

**New Error Case:**

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | `name` exceeds 100 characters. Message: `"name must be 100 characters or fewer."` |

**Implementation Notes (for T-075):**
- Add the max-length check in `backend/src/middleware/validation.js` (or wherever plant field validation lives)
- The check must apply to both `POST /plants` and `PUT /plants/:id` route handlers
- Use parameterized Knex for all queries — this change is validation-layer only; no DB schema migration needed (PostgreSQL `TEXT` column already accepts any length; the constraint is application-level)

---

### Schema Changes — Sprint 16

**None.** No new tables, columns, or migrations are required for Sprint 16.

- `DELETE /api/v1/account` (T-069): operates on existing `users`, `plants`, `care_schedules`, `care_actions`, and `refresh_tokens` tables — all created in Sprint 1 migrations. If FK `ON DELETE CASCADE` constraints are not yet in place, the model uses explicit ordered DELETEs in a transaction (no schema change needed).
- T-071 (stats rate limiter): middleware-only change — no DB schema impact.
- T-075 (plant name max-length): application-level validation — no DB schema migration required.

**No Manager approval required for schema changes this sprint — there are none.**

*Auto-approved (automated sprint) — Manager will review in closeout phase.*

---

*Sprint 16 contracts written by Backend Engineer — 2026-04-01. One new endpoint: DELETE /api/v1/account (T-069). Two amendments to existing endpoints: GET /api/v1/care-actions/stats rate-limit amendment (T-071), POST+PUT /api/v1/plants name max-length amendment (T-075). Zero schema changes. All prior sprint contracts remain authoritative.*

---

## Sprint 17 Contracts

**Tasks:** T-077 — `POST /api/v1/ai/advice` (Gemini text-based advice), T-078 — `POST /api/v1/ai/identify` (Gemini image-based identification)
**Written by:** Backend Engineer — 2026-04-01
**Status:** Ready for implementation — Frontend Engineer may begin T-079 (text flow) immediately; T-080 (image flow) may begin once T-078 contract is acknowledged.

---

### GROUP 17A — AI Recommendations: Text-Based Advice (T-077)

---

#### POST /api/v1/ai/advice *(Breaking Shape Update — Sprint 17)*

> **⚠️ BREAKING CHANGE** — The response shape of this endpoint is being updated in Sprint 17 (T-077) to align with the structured form-field mapping required by the AI Recommendations feature. The prior shape (Sprint 1 / Sprint 9) used nested `care_advice` with `frequency_value`/`frequency_unit` sub-objects. The new shape uses a flat `care` object with direct `*_interval_days` integers. Frontend integrations from prior sprints used the old `/ai/advice` endpoint in a different context; this sprint's T-079 is the first consumer of the new shape.

**Auth:** Bearer token (required)

**Description:** Accepts a plant type name (text string) and calls the Gemini API to return structured care recommendations. The response maps directly to Add/Edit Plant form fields so the frontend can auto-populate them on "Accept Advice". The `GeminiService` handles the Gemini API call with the existing 429 fallback chain (Sprint 9 behavior).

**Request:** `Content-Type: application/json`

```json
{
  "plant_type": "string"   // required; the plant's common or scientific name; max 200 chars
}
```

**Validation Rules:**
- `plant_type`: required, non-empty string, max 200 characters
- Missing, null, empty string, or only-whitespace value → `400 VALIDATION_ERROR`

**Success Response — 200 OK:**

```json
{
  "data": {
    "identified_plant": "string",        // matched/normalized plant name returned by Gemini
    "confidence": "high | medium | low", // Gemini's identification confidence
    "care": {
      "watering_interval_days": 7,       // integer; number of days between watering
      "fertilizing_interval_days": 14,   // integer | null; null if not applicable
      "repotting_interval_days": 365,    // integer | null; null if not applicable
      "light_requirement": "string",     // display-only; e.g. "Bright indirect light"
      "humidity_preference": "string",   // display-only; e.g. "Moderate"
      "care_tips": "string"              // free-text care advice, 1–3 sentences
    }
  }
}
```

**Field Mapping to Add/Edit Plant Form (for Frontend — T-079):**

| Response Field | Form Field |
|---|---|
| `identified_plant` | species/name field (only if currently empty) |
| `care.watering_interval_days` | watering schedule interval |
| `care.fertilizing_interval_days` | fertilizing schedule interval (skip if `null`) |
| `care.repotting_interval_days` | repotting schedule interval (skip if `null`) |
| `care.light_requirement` | display-only in advice panel; not mapped to form |
| `care.humidity_preference` | display-only in advice panel; not mapped to form |
| `care.care_tips` | display-only in advice panel; not mapped to form |

**Error Responses:**

| HTTP | Code | Message | Scenario |
|------|------|---------|---------|
| 400 | `VALIDATION_ERROR` | `"plant_type is required."` | `plant_type` missing, null, empty, or whitespace-only |
| 400 | `VALIDATION_ERROR` | `"plant_type must be 200 characters or fewer."` | `plant_type` exceeds 200 chars |
| 401 | `UNAUTHORIZED` | `"Authentication required."` | Missing or invalid Bearer token |
| 502 | `EXTERNAL_SERVICE_ERROR` | `"AI advice is temporarily unavailable. Please try again."` | Gemini API error, timeout, unrecognized plant, or all 429 fallback models exhausted |
| 500 | `INTERNAL_ERROR` | `"An unexpected error occurred."` | Unhandled server error |

**Rate Limiting:** Reuses the general rate limiter (100 req / 15 min per IP). No endpoint-specific limit.

**Environment Variables:**
- `GEMINI_API_KEY` — Gemini API key. Must never be hardcoded. Read via `process.env.GEMINI_API_KEY`.

**Implementation Notes:**
- `GeminiService.js` (new) handles all Gemini communication and the Sprint 9 429-fallback chain
- Route file: `backend/src/routes/ai.js`
- Mount point: `backend/src/server.js` → `app.use('/api/v1/ai', aiRouter)`
- Gemini model primary: `gemini-2.0-flash`; fallback chain: `gemini-2.5-flash` → `gemini-2.5-flash-lite` → `gemini-2.5-pro`
- Parse Gemini's JSON response server-side and validate all required fields are present before returning 200; if fields are missing/malformed, surface as 502

**Test Requirements (T-077 — minimum 4 new tests):**
1. Happy path: valid `plant_type` → 200 with correct response shape
2. Missing `plant_type` → 400 `VALIDATION_ERROR`
3. Gemini API error mocked → 502 `EXTERNAL_SERVICE_ERROR`
4. Missing auth header → 401 `UNAUTHORIZED`

---

### GROUP 17B — AI Recommendations: Image-Based Identification (T-078)

---

#### POST /api/v1/ai/identify

**Auth:** Bearer token (required)

**Description:** Accepts a plant photo upload (JPEG, PNG, or WebP, max 5MB) and calls the Gemini Vision API to identify the plant and return structured care recommendations. Returns the same response shape as `POST /api/v1/ai/advice`. The image is **never persisted** — it is held in memory only and forwarded transiently to Gemini.

**Request:** `Content-Type: multipart/form-data`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `image` | file | Yes | JPEG, PNG, or WebP; max 5MB |

**Validation Rules (server-side):**
- `image` field must be present → otherwise `400 VALIDATION_ERROR` with `"An image is required."`
- MIME type must be `image/jpeg`, `image/png`, or `image/webp` → otherwise `400 VALIDATION_ERROR` with `"Image must be JPEG, PNG, or WebP."`
- File size must be ≤ 5MB (5,242,880 bytes) → otherwise `400 VALIDATION_ERROR` with `"Image must be 5MB or smaller."`
- Validation enforced via `multer` memory storage with `fileFilter` and `limits.fileSize`

**Success Response — 200 OK:**

```json
{
  "data": {
    "identified_plant": "string",        // plant name identified from the image by Gemini Vision
    "confidence": "high | medium | low", // Gemini's identification confidence
    "care": {
      "watering_interval_days": 7,       // integer; number of days between watering
      "fertilizing_interval_days": 14,   // integer | null; null if not applicable
      "repotting_interval_days": 365,    // integer | null; null if not applicable
      "light_requirement": "string",     // display-only; e.g. "Bright indirect light"
      "humidity_preference": "string",   // display-only; e.g. "Moderate"
      "care_tips": "string"              // free-text care advice, 1–3 sentences
    }
  }
}
```

*The response shape is **identical** to `POST /api/v1/ai/advice`. The frontend `AIAdvicePanel` can use the same result-rendering and accept/field-mapping logic for both endpoints.*

**Field Mapping to Add/Edit Plant Form (for Frontend — T-080):**
*Identical to T-077 mapping table above.*

**Error Responses:**

| HTTP | Code | Message | Scenario |
|------|------|---------|---------|
| 400 | `VALIDATION_ERROR` | `"An image is required."` | `image` field missing from request |
| 400 | `VALIDATION_ERROR` | `"Image must be JPEG, PNG, or WebP."` | Uploaded file is not a supported image type |
| 400 | `VALIDATION_ERROR` | `"Image must be 5MB or smaller."` | Uploaded file exceeds 5MB |
| 401 | `UNAUTHORIZED` | `"Authentication required."` | Missing or invalid Bearer token |
| 502 | `EXTERNAL_SERVICE_ERROR` | `"AI advice is temporarily unavailable. Please try again."` | Gemini Vision API error, timeout, unidentifiable plant, or all 429 fallback models exhausted |
| 500 | `INTERNAL_ERROR` | `"An unexpected error occurred."` | Unhandled server error |

**Rate Limiting:** Reuses the general rate limiter (100 req / 15 min per IP). No endpoint-specific limit.

**Storage Policy:**
- Image is parsed into memory (Buffer) by `multer` with `memoryStorage()`
- Image Buffer is base64-encoded and passed directly to Gemini Vision API
- **No file system writes. No database writes. No S3/cloud storage uploads.**
- Buffer is garbage-collected after the request completes

**Environment Variables:**
- `GEMINI_API_KEY` — same key used by T-077. No additional env variables required.

**Implementation Notes:**
- Extends `GeminiService.js` (created in T-077) with a `identifyFromImage(imageBuffer, mimeType)` method
- `multer` configured with `memoryStorage()`, `limits: { fileSize: 5 * 1024 * 1024 }`, and a `fileFilter` rejecting non-image MIME types
- When multer's `limits.fileSize` is exceeded, multer emits a `LIMIT_FILE_SIZE` error — catch in the route's error handler and convert to `400 VALIDATION_ERROR` with the correct message
- Route file: `backend/src/routes/ai.js` (same file as T-077, second route)
- Gemini Vision prompt: include the image as an inline base64 part; instruct Gemini to identify the plant and return the same JSON structure as the text-based endpoint
- Parse and validate Gemini's JSON response; if fields are missing/malformed, surface as 502

**Test Requirements (T-078 — minimum 6 new tests):**
1. Happy path: valid image upload → 200 with correct response shape
2. Missing `image` field → 400 `VALIDATION_ERROR` `"An image is required."`
3. Unsupported MIME type (e.g., `image/gif`) → 400 `VALIDATION_ERROR` `"Image must be JPEG, PNG, or WebP."`
4. Image > 5MB → 400 `VALIDATION_ERROR` `"Image must be 5MB or smaller."`
5. Gemini Vision API error mocked → 502 `EXTERNAL_SERVICE_ERROR`
6. Missing auth header → 401 `UNAUTHORIZED`

---

### Schema Changes — Sprint 17

**None.** No new tables, columns, or indexes are required for Sprint 17.

- `POST /api/v1/ai/advice` (T-077): calls `GeminiService` — no database interaction
- `POST /api/v1/ai/identify` (T-078): calls `GeminiService` — no database interaction; images not persisted
- No Knex migrations required this sprint

**No Manager approval required for schema changes this sprint — there are none.**

*Auto-approved (automated sprint) — Manager will review in closeout phase.*

---

## Sprint 18 Contracts

---

### T-083 — GET /api/v1/plants (Updated — Sprint 18)

**Contract status:** UPDATED. The original Sprint 1 contract added `page` and `limit` query parameters. Sprint 18 extends it with two new optional filter parameters: `search` and `status`. All other fields (auth, response shape, error codes for auth/server errors) are unchanged from Sprint 1.

---

#### GET /api/v1/plants *(Updated — Sprint 18)*

**Auth:** Bearer token (required)

**Description:** Returns all plants belonging to the authenticated user, with pagination. **Sprint 18 update:** Accepts two new optional query parameters — `search` (case-insensitive name substring filter) and `status` (care-status filter: `overdue | due_today | on_track`). Both can be used simultaneously. Omitting either param restores the original unfiltered behaviour. An optional `utcOffset` parameter enables timezone-aware status bucketing (same semantics as `GET /api/v1/care-due` from Sprint 14).

**Query Parameters:**

| Param | Type | Default | Required | Description |
|-------|------|---------|----------|-------------|
| `page` | integer | `1` | no | Page number for pagination |
| `limit` | integer | `50` | no | Records per page (max 100) |
| `search` | string | — | no | Case-insensitive substring match against the plant's `name` field. Trimmed of leading/trailing whitespace before matching. Max 200 characters. Omit to return all plants (no name filter). |
| `status` | string (enum) | — | no | Filter by computed care status. Must be one of: `overdue`, `due_today`, `on_track`. A plant matches the requested status if **at least one** of its care schedules has that status. Omit to return plants of all statuses. |
| `utcOffset` | integer | `0` (UTC) | no | The caller's UTC offset in minutes. Used to compute "local today" for status calculations. Positive = ahead of UTC (e.g. UTC+5:30 → `330`). Negative = behind UTC (e.g. UTC-5 → `-300`). Omit to default to UTC. Same semantics as `GET /api/v1/care-due`. |

**Validation Rules:**

- `page`: optional; positive integer; defaults to `1`
- `limit`: optional; positive integer; max `100`; defaults to `50`
- `search`: optional; string; trimmed of whitespace; max **200** characters after trim; returns `400 VALIDATION_ERROR` if trimmed length exceeds 200
- `status`: optional; if provided, must be exactly one of `overdue`, `due_today`, `on_track` (case-sensitive); returns `400 VALIDATION_ERROR` for any other value
- `utcOffset`: optional; if provided, must be an integer in the range `[-840, 840]` (valid UTC offset range in minutes); returns `400 VALIDATION_ERROR` if out of range or non-integer

**Status Computation Logic (timezone-aware, same as GET /api/v1/care-due):**

- If `utcOffset` is provided: "local today" = `[UTC midnight + utcOffset minutes, UTC midnight + utcOffset minutes + 24 hours)`
- If `utcOffset` is omitted: "local today" = UTC calendar day (existing behaviour — no regression)
- `overdue`: `next_due_at` is before the start of local today
- `due_today`: `next_due_at` falls within local today
- `on_track`: `next_due_at` is after the end of local today
- A plant matches `?status=overdue` if **at least one** of its care schedules is `overdue`
- A plant matches `?status=due_today` if **at least one** schedule is `due_today` (and none are `overdue`)
- A plant matches `?status=on_track` if **all** of its care schedules are `on_track`
- Plants with zero care schedules are excluded from all `status` filter results (no computable status)

**Combined Filter Behaviour:**

- `search` and `status` are ANDed: a plant must satisfy **both** conditions to appear in results
- Pagination (`page`, `limit`) applies to the already-filtered set; `pagination.total` reflects the **filtered** count, not the user's total plant count

**Success Response — 200 OK:**

Response shape is **identical** to the Sprint 1 contract. No new fields added.

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "string",
      "type": "string | null",
      "notes": "string | null",
      "photo_url": "string | null",
      "created_at": "ISO8601",
      "updated_at": "ISO8601",
      "care_schedules": [
        {
          "id": "uuid",
          "care_type": "watering | fertilizing | repotting",
          "frequency_value": 7,
          "frequency_unit": "days | weeks | months",
          "last_done_at": "ISO8601 | null",
          "next_due_at": "ISO8601",
          "status": "on_track | due_today | overdue",
          "days_overdue": 0
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 3
  }
}
```

**Notes:**

- Empty filtered result returns `"data": []` with `"pagination": { "page": 1, "limit": 50, "total": 0 }` — **not** a 404
- `care_schedules` array continues to contain 0–3 entries per plant regardless of which filter is active
- Plants are ordered by `created_at DESC` within the filtered set (unchanged)

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | `search` exceeds 200 characters (after trim) |
| 400 | `VALIDATION_ERROR` | `status` is not one of `overdue`, `due_today`, `on_track` |
| 400 | `VALIDATION_ERROR` | `utcOffset` provided but not an integer in range `[-840, 840]` |
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

**Example Requests:**

```bash
# Search by name (case-insensitive substring)
GET /api/v1/plants?search=pothos

# Filter by status only
GET /api/v1/plants?status=overdue

# Combined search + status + timezone offset
GET /api/v1/plants?search=spider&status=due_today&utcOffset=-300

# Paginated with search and status
GET /api/v1/plants?search=monstera&status=on_track&page=1&limit=20

# No filters — existing behaviour unchanged
GET /api/v1/plants?page=2&limit=20

# 400 — invalid status value
GET /api/v1/plants?status=healthy

# 400 — search exceeds 200 chars
GET /api/v1/plants?search=[201-char string]
```

**Backward Compatibility:**

Any existing consumer calling `GET /api/v1/plants` without the new parameters receives the same unfiltered paginated results as before. **No breaking change.**

---

### Schema Changes — Sprint 18

**None.** No new tables, columns, or indexes are required for Sprint 18.

- `GET /api/v1/plants` (T-083): query-parameter extension only — all status computation is derived from existing `care_schedules` data already present in the database
- No Knex migrations required this sprint

**No Manager approval required for schema changes this sprint — there are none.**

*Auto-approved (automated sprint) — Manager will review in closeout phase.*

---

*Sprint 18 contract written by Backend Engineer — 2026-04-01. One endpoint updated: GET /api/v1/plants (new optional `search`, `status`, and `utcOffset` query params). Response shape unchanged. No schema changes. All prior sprint contracts remain authoritative.*

---

*Sprint 17 contracts written by Backend Engineer — 2026-04-01. One endpoint shape update: POST /api/v1/ai/advice (T-077, breaking response shape change). One new endpoint: POST /api/v1/ai/identify (T-078). Zero schema changes. All prior sprint contracts remain authoritative for their respective endpoints.*

---

## Sprint 19 Contracts

---

### GROUP 1 — Care Streak (T-090)

---

#### GET /api/v1/care-actions/streak

**Auth:** Required — Bearer token in `Authorization: Bearer <access_token>` header. Returns `401` if token is missing or invalid.

**Description:** Returns the authenticated user's current care streak (consecutive calendar days with ≥1 care action), their longest-ever streak, and the date of their most recent care action. All date calculations are shifted by the optional `utcOffset` query parameter so that "today" and "yesterday" match the user's local calendar day.

**Streak Definition:**
- A "streak day" is any calendar day (in the user's local timezone, as determined by `utcOffset`) on which the user logged ≥1 care action.
- The current streak counts backwards from today (inclusive if today has an action) or from yesterday (if no action yet today but yesterday had one). If neither today nor yesterday has an action, the streak is 0.
- `currentStreak = 0` if the user has no care actions ever recorded.

**Query Parameters:**

| Parameter | Type | Required | Validation | Default | Description |
|-----------|------|----------|-----------|---------|-------------|
| `utcOffset` | integer | No | Must be an integer in range `[-840, 840]` (minutes). Non-integer or out-of-range → 400. | `0` (UTC) | Minutes to offset UTC timestamps to the user's local timezone for date bucketing (e.g., `-300` for UTC-5, `+330` for UTC+5:30). |

**Request Body:** None (GET request)

**Success Response — 200 OK:**

```json
{
  "data": {
    "currentStreak": 7,
    "longestStreak": 14,
    "lastActionDate": "2026-04-05"
  }
}
```

**Response Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `currentStreak` | integer ≥ 0 | Number of consecutive calendar days (user's local time) ending today (or yesterday) on which ≥1 care action was logged. `0` if no streak is active. |
| `longestStreak` | integer ≥ 0 | Highest consecutive-day streak this user has ever achieved. `0` if the user has no care actions. |
| `lastActionDate` | `"YYYY-MM-DD"` string or `null` | The user's local-timezone date of their most recent care action. `null` if the user has never logged a care action. |

**Edge Cases / Examples:**

| Scenario | `currentStreak` | `longestStreak` | `lastActionDate` |
|----------|----------------|----------------|-----------------|
| New user — no care actions ever | `0` | `0` | `null` |
| Single action logged today | `1` | `1` | today |
| Actions on today + yesterday | `2` | `2` | today |
| 3 consecutive days ending today | `3` | `3` | today |
| Streak broken — last action was 2+ days ago | `0` | (prior best) | (prior action date) |
| Actions on yesterday only (none today) | `1` | ≥1 | yesterday |
| utcOffset shifts yesterday's UTC action into today locally | streak reflects local-date calculation | — | local date |

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | `utcOffset` provided but not an integer |
| 400 | `VALIDATION_ERROR` | `utcOffset` is an integer outside the range `[-840, 840]` |
| 401 | `UNAUTHORIZED` | Missing, malformed, or expired access token |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

**Example Requests:**

```bash
# Default (UTC) — no offset
GET /api/v1/care-actions/streak
Authorization: Bearer <access_token>

# User in UTC-5 (EST, no DST)
GET /api/v1/care-actions/streak?utcOffset=-300
Authorization: Bearer <access_token>

# User in UTC+5:30 (IST)
GET /api/v1/care-actions/streak?utcOffset=330
Authorization: Bearer <access_token>

# 400 — utcOffset out of range
GET /api/v1/care-actions/streak?utcOffset=999

# 401 — no auth header
GET /api/v1/care-actions/streak
```

**Example Success Responses:**

```json
// Active 7-day streak
{
  "data": {
    "currentStreak": 7,
    "longestStreak": 30,
    "lastActionDate": "2026-04-05"
  }
}

// No actions ever (new user)
{
  "data": {
    "currentStreak": 0,
    "longestStreak": 0,
    "lastActionDate": null
  }
}

// Streak broken (last action was 3 days ago)
{
  "data": {
    "currentStreak": 0,
    "longestStreak": 14,
    "lastActionDate": "2026-04-02"
  }
}
```

**Example Error Responses:**

```json
// 400 — utcOffset out of range
{
  "error": {
    "message": "utcOffset must be an integer between -840 and 840",
    "code": "VALIDATION_ERROR"
  }
}

// 401 — no/invalid token
{
  "error": {
    "message": "Unauthorized",
    "code": "UNAUTHORIZED"
  }
}
```

---

### T-087 — Auth Cookie Secure Flag Fix

**No API contract change.** T-087 is an internal implementation fix only:
- Changes the `secure` flag on the `refresh_token` cookie from always-`true` to `process.env.NODE_ENV === 'production'`
- **Request and response shapes are unchanged** — no new fields, no removed fields, no status code changes
- The existing `POST /api/v1/auth/register` and `POST /api/v1/auth/login` contracts in Sprint 1 remain fully authoritative
- Frontend integration is unaffected — the cookie is set by the browser automatically; client-side code does not read the `secure` flag

---

### Schema Changes — Sprint 19

**None.** No new tables, columns, or indexes are required for Sprint 19.

- `GET /api/v1/care-actions/streak` (T-090): all streak computation is derived at query time from the existing `care_actions` table (specifically `created_at` timestamps and `user_id` via plant ownership join). No new columns or tables are needed.
- T-087 auth cookie fix: no database changes.
- No Knex migrations required this sprint.

**No Manager approval required for schema changes this sprint — there are none.**

*Auto-approved (automated sprint) — Manager will review in closeout phase.*

---

*Sprint 19 contracts written by Backend Engineer — 2026-04-05. One new endpoint: GET /api/v1/care-actions/streak (T-090). T-087 is an internal cookie-flag fix — no contract change. Zero schema changes. All prior sprint contracts remain authoritative for their respective endpoints.*

---

## Sprint 20 Contracts

---

### T-093 — Care History Endpoint

---

#### GET /api/v1/plants/:id/care-history

**Auth:** Required — `Authorization: Bearer <access_token>`. Returns 401 if token is missing or invalid.

**Description:** Returns a paginated, reverse-chronological list of care actions logged for a specific plant owned by the authenticated user. Supports optional filtering by care type. Used by the Care History section on the Plant Detail page (SPEC-015).

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID string | The plant's UUID. Must belong to the authenticated user. |

**Query Parameters:**

| Parameter | Type | Default | Constraints | Description |
|-----------|------|---------|-------------|-------------|
| `page` | integer | `1` | ≥ 1 | Page number (1-indexed) |
| `limit` | integer | `20` | 1–100 (inclusive) | Items per page |
| `careType` | string | *(none — all types)* | `watering` \| `fertilizing` \| `repotting` | Filter to a single care type. Omit to return all types. |

**Validation Rules:**
- `page`: optional; must be a positive integer (≥ 1); 400 if present and out of range
- `limit`: optional; must be an integer between 1 and 100 inclusive; 400 if present and out of range
- `careType`: optional; if provided must be exactly one of `"watering"`, `"fertilizing"`, `"repotting"` (case-sensitive); 400 if any other value

**Success Response — 200 OK:**

```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "careType": "watering",
        "performedAt": "2026-04-04T09:00:00.000Z",
        "notes": "string | null"
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

**Response Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `items` | array | Ordered list of care action records for this page, newest first |
| `items[].id` | UUID string | Unique identifier of the care action record |
| `items[].careType` | string | One of: `"watering"`, `"fertilizing"`, `"repotting"` |
| `items[].performedAt` | ISO 8601 UTC string | When the care action was performed (maps to `performed_at` column) |
| `items[].notes` | string \| null | Optional note attached to the care action (maps to `note` column); `null` when no note was recorded |
| `total` | integer | Total number of matching records across all pages |
| `page` | integer | Current page number (matches the `page` query param used) |
| `limit` | integer | Page size used for this response (matches the `limit` query param used) |
| `totalPages` | integer | Total number of pages: `Math.ceil(total / limit)` |

**Ordering:** Items are always returned `performed_at DESC` (most recent first), within each page.

**Empty Result:** A plant with no care history (or no matching care history for the given filter) returns a 200 with `items: []`, `total: 0`, `totalPages: 0`.

**Field Mapping Note:** The underlying `care_actions` database column is `note` (singular). The API response exposes this as `notes` (plural) for naming consistency with the rest of the API surface. The implementation will alias `note AS notes` in the query.

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | `careType` is not one of the allowed values; or `page` / `limit` is out of range. `message` identifies the failing field. |
| 401 | `UNAUTHORIZED` | No `Authorization` header, or token is expired/invalid |
| 403 | `FORBIDDEN` | Plant `:id` exists but does not belong to the authenticated user |
| 404 | `NOT_FOUND` | No plant with `:id` exists |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

**Example Requests:**

```
GET /api/v1/plants/a1b2c3d4-.../care-history
Authorization: Bearer eyJ...

GET /api/v1/plants/a1b2c3d4-.../care-history?careType=watering&page=2&limit=10
Authorization: Bearer eyJ...
```

**Example Success Response (page 1, careType=watering, 2 of 5 items):**

```json
{
  "data": {
    "items": [
      {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "careType": "watering",
        "performedAt": "2026-04-04T09:00:00.000Z",
        "notes": "Soil was very dry — gave extra water"
      },
      {
        "id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
        "careType": "watering",
        "performedAt": "2026-03-28T08:30:00.000Z",
        "notes": null
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

**Example Error Responses:**

```json
// 400 — invalid careType
{
  "error": {
    "message": "careType must be one of: watering, fertilizing, repotting",
    "code": "VALIDATION_ERROR"
  }
}

// 400 — limit out of range
{
  "error": {
    "message": "limit must be an integer between 1 and 100",
    "code": "VALIDATION_ERROR"
  }
}

// 400 — page out of range
{
  "error": {
    "message": "page must be a positive integer",
    "code": "VALIDATION_ERROR"
  }
}

// 401 — no/invalid token
{
  "error": {
    "message": "Unauthorized",
    "code": "UNAUTHORIZED"
  }
}

// 403 — plant belongs to a different user
{
  "error": {
    "message": "You do not have access to this plant",
    "code": "FORBIDDEN"
  }
}

// 404 — plant does not exist
{
  "error": {
    "message": "Plant not found",
    "code": "NOT_FOUND"
  }
}
```

---

### T-095 — Lodash Security Fix

**No API contract change.** T-095 is a dependency-only security fix:
- Runs `npm audit fix` in `backend/` and `frontend/` to resolve the lodash ≤4.17.23 prototype-pollution / code-injection advisory
- If lodash cannot be auto-fixed (pinned by a parent dep), adds an `overrides` entry in `package.json` to pin lodash to `>=4.17.24`
- **No endpoints added, removed, or modified**
- **No request or response shapes change**
- All existing contracts remain fully authoritative

---

### Schema Changes — Sprint 20

**None.** No new tables, columns, or indexes are required for Sprint 20.

- `GET /api/v1/plants/:id/care-history` (T-093): queries the existing `care_actions` table using columns `id`, `care_type`, `performed_at`, and `note` — all present since Sprint 1 migration `20260323_05_create_care_actions.js`. The `idx_care_actions_performed_at` index on `(plant_id, performed_at DESC)` already covers the primary query pattern.
- The API field name `notes` (plural) maps to the existing `note` (singular) column via a SQL alias — this is not a schema change.
- No new Knex migrations required.

**No Manager approval required for schema changes this sprint — there are none.**

*Auto-approved (automated sprint) — Manager will review in closeout phase.*

---

*Sprint 20 contracts written by Backend Engineer — 2026-04-05. One new endpoint: GET /api/v1/plants/:id/care-history (T-093). T-095 is a security dependency fix — no contract change. Zero schema changes. All prior sprint contracts remain authoritative for their respective endpoints.*

---

## Sprint 21 Contracts

---

### T-097 — Extend POST /plants/:id/care-actions to Accept Optional `notes` Field

---

#### UPDATED: POST /api/v1/plants/:id/care-actions

**Auth:** Bearer token (required)

**Description:** Records a care action for a plant owned by the authenticated user. **Sprint 21 update:** Adds an optional `notes` field to the request body so users can attach a care observation when marking a care action done. All existing behavior is unchanged — callers that omit `notes` continue to work exactly as before.

**This is a non-breaking change.** The `notes` field is entirely optional and defaults to `null` when absent. No previously valid request will fail.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID string | Yes | The plant's unique identifier. Must belong to the authenticated user. |

**Request Body:**

```json
{
  "care_type": "watering",           // required; enum: watering | fertilizing | repotting
  "performed_at": "ISO8601 | null",  // optional; if null/omitted, server defaults to current UTC time
  "notes": "string | null"           // optional (NEW in Sprint 21); freeform observation text; max 280 characters
}
```

**Validation Rules:**

| Field | Rule |
|-------|------|
| `care_type` | Required. Must be exactly one of: `"watering"`, `"fertilizing"`, `"repotting"`. Case-sensitive. |
| `performed_at` | Optional ISO 8601 datetime string. Must not be in the future. If omitted or `null`, server defaults to `NOW()`. |
| `notes` | Optional. If present, must be a string. Maximum 280 characters after whitespace-trimming. If the value is `null`, an empty string, or whitespace-only (e.g. `"   "`), it is stored as `null`. Returns `400 VALIDATION_ERROR` if length exceeds 280 chars after trim. |

**Normalization rules for `notes`:**
- `null` → stored as `null`
- `""` (empty string) → stored as `null`
- `"   "` (whitespace-only) → trimmed to `""` → stored as `null`
- `"  Great watering session  "` → trimmed to `"Great watering session"` → stored as provided trimmed value
- `"x".repeat(281)` → 400 `VALIDATION_ERROR` (exceeds 280 chars after trim)

**Success Response — 201 Created:**

```json
{
  "data": {
    "care_action": {
      "id": "uuid",
      "plant_id": "uuid",
      "care_type": "watering",
      "performed_at": "ISO8601",
      "notes": "string | null"
    },
    "updated_schedule": {
      "id": "uuid",
      "care_type": "watering",
      "frequency_value": 7,
      "frequency_unit": "days",
      "last_done_at": "ISO8601",
      "next_due_at": "ISO8601",
      "status": "on_track",
      "days_overdue": 0
    }
  }
}
```

**Response Field Notes:**

| Field | Type | Description |
|-------|------|-------------|
| `care_action.id` | UUID string | The newly created care action record's unique identifier |
| `care_action.plant_id` | UUID string | The plant this action was recorded against |
| `care_action.care_type` | string | One of: `"watering"`, `"fertilizing"`, `"repotting"` |
| `care_action.performed_at` | ISO 8601 UTC string | When the care action was performed |
| `care_action.notes` | string \| null | The (trimmed) note text, or `null` if none provided. Maps to the `note` column in `care_actions` (aliased to `notes` for API consistency with `GET /plants/:id/care-history`). |
| `updated_schedule.*` | — | Recalculated care schedule state after this action — same shape as in prior sprints |

**Naming alignment note:** The underlying `care_actions` database column is `note` (singular, established Sprint 1). The API consistently exposes it as `notes` (plural) across both read (`GET /plants/:id/care-history`) and write (`POST /plants/:id/care-actions`) paths. The implementation aliases `note AS notes` in SELECT queries. The Sprint 1 contract showed `"note"` (singular) in the POST response — Sprint 21 aligns the POST response to `"notes"` (plural) for consistency with the GET contract; no DB schema change is required.

**Example — request with note:**

```
POST /api/v1/plants/a1b2c3d4-.../care-actions
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "care_type": "watering",
  "notes": "Soil was very dry today — gave a deep soak"
}
```

**Example — request without note (backward-compatible, unchanged behavior):**

```
POST /api/v1/plants/a1b2c3d4-.../care-actions
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "care_type": "fertilizing"
}
```

**Example — whitespace-only note stored as null:**

```json
// Request body
{ "care_type": "watering", "notes": "   " }

// Response: care_action.notes will be null
```

**Example — note too long (400):**

```json
// Request body — notes field is 281 characters after trim
{ "care_type": "watering", "notes": "a...a" }

// Error response
{
  "error": {
    "message": "notes must be 280 characters or fewer",
    "code": "VALIDATION_ERROR"
  }
}
```

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | Missing or invalid `care_type`; `performed_at` is in the future; `notes` exceeds 280 characters (after trimming) |
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 404 | `PLANT_NOT_FOUND` | Plant does not exist or belongs to another user |
| 422 | `NO_SCHEDULE_FOR_CARE_TYPE` | Plant does not have a care schedule configured for the given `care_type` |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

### Frontend Integration Notes (for T-098)

The following guidance applies when integrating the updated contract on the frontend:

1. **Sending `notes`:** Include `"notes": noteText.trim() || null` in the POST body. If the textarea is empty or contains only whitespace, send `null` (or omit the field entirely — the server will default it to `null`).

2. **Character limit enforcement:** Hard-limit the textarea to `maxLength=280`. Display a character counter when the user has typed ≥ 200 characters.

3. **Backward compatibility:** No changes needed for existing mark-done flows that do not include notes — they continue to work exactly as before.

4. **Care History display:** The `GET /api/v1/plants/:id/care-history` response already includes `notes` for each care action (Sprint 20 contract). After a successful POST, the new care action's `notes` will appear in the history on next fetch. No additional backend changes are required for display.

---

### Schema Changes — Sprint 21

**No schema changes required.** The `care_actions` table has contained a `note` (nullable text) column since Sprint 1 (migration `20260323_05_create_care_actions.js`). T-097 wires up the write path to persist values into this existing column — no `ALTER TABLE`, no new indexes, and no new migration files are needed.

**No Manager approval required for schema changes this sprint — there are none.**

*Auto-approved (automated sprint) — Manager will review in closeout phase.*

---

*Sprint 21 contracts written by Backend Engineer — 2026-04-05. No new endpoints — one updated endpoint: POST /api/v1/plants/:id/care-actions now accepts optional `notes` field (T-097). Zero schema changes. All prior sprint contracts remain authoritative for their respective endpoints.*

---

## Sprint 22 Contracts

**Sprint Goal:** Care Reminder Email Notifications — notification preferences API + email service + daily cron job (T-101).

---

### GROUP — Notification Preferences & Email Reminders (T-101)

---

#### GET /api/v1/profile/notification-preferences

**Auth:** Bearer token required (`Authorization: Bearer <access_token>`)

**Description:** Returns the current authenticated user's notification preferences. If no preference row exists yet (new user or first call), creates a default row (`opt_in: false`, `reminder_hour_utc: 8`) and returns it. This means the endpoint is always safe to call on page load — it will never 404 for an authenticated user.

**Request Body:** None

**Success Response — 200 OK:**

```json
{
  "data": {
    "opt_in": false,           // boolean — true = user wants email reminders
    "reminder_hour_utc": 8     // integer 0–23 — hour of day (UTC) to send reminder
  }
}
```

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 401 | `UNAUTHORIZED` | Missing or invalid Bearer token |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

#### POST /api/v1/profile/notification-preferences

**Auth:** Bearer token required (`Authorization: Bearer <access_token>`)

**Description:** Updates the authenticated user's notification preferences. Accepts partial updates — only the fields provided are changed; omitted fields retain their current value. Creates the preference row if it does not yet exist (upsert semantics). Returns the full updated preference object.

**Request Body:**

```json
{
  "opt_in": true,              // optional; boolean
  "reminder_hour_utc": 8      // optional; integer 0–23 inclusive
}
```

**Validation Rules:**
- At least one of `opt_in` or `reminder_hour_utc` must be present
- `opt_in`: optional, boolean; non-boolean values → 400
- `reminder_hour_utc`: optional, integer; must be in range 0–23 inclusive; non-integer or out-of-range → 400

**Success Response — 200 OK:**

```json
{
  "data": {
    "opt_in": true,
    "reminder_hour_utc": 8
  }
}
```

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | `reminder_hour_utc` is not an integer or is outside 0–23; or body is empty / no valid fields provided |
| 401 | `UNAUTHORIZED` | Missing or invalid Bearer token |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

#### GET /api/v1/unsubscribe

**Auth:** Public — no Bearer token required. Authentication is provided by a signed `token` query parameter generated at email-send time.

**Description:** One-click unsubscribe endpoint linked from the email footer. When clicked, verifies the HMAC-signed token, sets `opt_in = false` for the corresponding user, and returns a plain-text or minimal-HTML confirmation. Designed to be safe to call from a browser via a link click (GET semantics are appropriate because this is an idempotent, user-initiated unsubscribe — one-click from email requires GET).

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | yes | HMAC-SHA256 signed token encoding `user_id`; signed with `UNSUBSCRIBE_SECRET` env var |

**Token Format (server-side):** `base64url(HMAC-SHA256(UNSUBSCRIBE_SECRET, user_id))`  
The email service constructs this token at send time. The unsubscribe endpoint re-derives the expected HMAC and compares via constant-time comparison.

**Success Response — 200 OK:**

```json
{
  "data": {
    "message": "You have been unsubscribed from Plant Guardians care reminder emails."
  }
}
```

*Note: The frontend may render a full confirmation page at `/unsubscribe?token=…` instead of consuming this JSON response directly — the UI team may choose to redirect to a confirmation page. The backend endpoint returns JSON; the frontend SPA catches the route.*

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `INVALID_TOKEN` | `token` param is missing, malformed, or HMAC verification fails |
| 404 | `USER_NOT_FOUND` | Token is valid but user no longer exists |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

#### POST /api/v1/admin/trigger-reminders *(Dev/Test Only)*

**Auth:** Bearer token required (`Authorization: Bearer <access_token>`)

**Description:** Manually triggers the care reminder cron job for the current UTC hour. Intended for development and QA testing — allows testers to fire the reminder job on demand without waiting for the scheduled hour. **This endpoint must only be registered when `NODE_ENV !== 'production'`** — it is never exposed in production.

In non-production environments this endpoint is available to any authenticated user (no special admin role required in Sprint 22 — a future sprint may add role-based access).

**Request Body:** None (or optional override — see below)

**Optional Request Body:**

```json
{
  "hour_utc": 8   // optional; integer 0–23; if omitted, uses current UTC hour
}
```

**Validation Rules:**
- `hour_utc`: optional, integer 0–23; if provided and invalid → 400

**Success Response — 200 OK:**

```json
{
  "data": {
    "triggered_at": "2026-04-05T08:00:00.000Z",   // ISO 8601 UTC — actual time trigger ran
    "hour_utc": 8,                                  // UTC hour that was evaluated
    "users_evaluated": 3,                           // users with opt_in=true and matching hour
    "emails_sent": 2,                               // users with ≥1 due/overdue care event
    "users_skipped": 1                              // opted-in users with no due/overdue care
  }
}
```

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | `hour_utc` provided but invalid (not integer or out of 0–23 range) |
| 401 | `UNAUTHORIZED` | Missing or invalid Bearer token |
| 403 | `FORBIDDEN` | Endpoint called in production environment |
| 500 | `INTERNAL_ERROR` | Unexpected server error (includes SMTP failure summary in `message`) |

---

### Schema Changes — Sprint 22

**New table: `notification_preferences`**

See proposal in `.workflow/technical-context.md` (Sprint 22 entry). Migration status: **Auto-approved (automated sprint)** — Manager will review in closeout phase.

---

### Environment Variables — Sprint 22

The following new environment variables are required by the email service. All are **optional** — if not set, the backend starts and runs without crashing; email sending is skipped with a logged warning at startup.

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `EMAIL_HOST` | string | — | SMTP server hostname (e.g., `smtp.mailpit.local`) |
| `EMAIL_PORT` | integer | `587` | SMTP port |
| `EMAIL_USER` | string | — | SMTP username |
| `EMAIL_PASS` | string | — | SMTP password |
| `EMAIL_FROM` | string | — | Sender address (e.g., `Plant Guardians <noreply@plantguardians.app>`) |
| `UNSUBSCRIBE_SECRET` | string | — | Secret key used to HMAC-sign unsubscribe tokens; required for unsubscribe links to work |
| `APP_BASE_URL` | string | `http://localhost:5173` | Frontend base URL; used to construct the CTA button and unsubscribe link in emails |

**Graceful degradation rule:** If `EMAIL_HOST` or `UNSUBSCRIBE_SECRET` is unset, the email service logs `[EmailService] WARNING: EMAIL_HOST not configured — email sending disabled` at startup and returns early (no-op) on every send call. The cron job and trigger endpoint still run — they just skip sending.

---

### Frontend Integration Notes (for T-102)

1. **Page load:** Call `GET /api/v1/profile/notification-preferences` on ProfilePage mount. Pre-populate toggle (`opt_in`) and timing selector (`reminder_hour_utc` → map 8→Morning, 12→Midday, 18→Evening).

2. **Save action:** Call `POST /api/v1/profile/notification-preferences` with `{ opt_in, reminder_hour_utc }`. Both fields should always be sent (not partial) since the UI always has a value for each after initial fetch.

3. **Timing selector mapping:**

| Display label | UTC hour sent in POST body |
|---------------|---------------------------|
| Morning (~8 AM) | `8` |
| Midday (~12 PM) | `12` |
| Evening (~6 PM) | `18` |

4. **Default state:** If `opt_in` is `false`, the timing selector should be hidden (but retain the last selected value in local state so it re-appears when the user toggles on).

5. **Unsubscribe:** The unsubscribe URL is constructed by the backend email service and embedded in the email HTML. The frontend SPA should handle the route `/unsubscribe?token=…` and display a confirmation message after the backend call succeeds. The `api.js` module should expose `notificationPreferences.unsubscribe(token)` → `GET /api/v1/unsubscribe?token=<token>`.

---

*Sprint 22 contracts written by Backend Engineer — 2026-04-05. New endpoints: GET + POST /api/v1/profile/notification-preferences, GET /api/v1/unsubscribe, POST /api/v1/admin/trigger-reminders (dev only). Schema change: notification_preferences table (see technical-context.md). All prior sprint contracts remain authoritative.*

---

## Sprint 23 Contracts — 2026-04-05

**Sprint Goal:** Account deletion endpoint (T-106). No new tables required — this sprint deletes across existing tables within a transaction.

---

### GROUP — Account Deletion (T-106)

---

#### DELETE /api/v1/profile

**Auth:** Required — Bearer token in `Authorization: Bearer <access_token>` header

**Description:** Permanently deletes the authenticated user's account and all associated data. Deletes records in dependency order within a single database transaction: `care_actions` → `notification_preferences` → `care_schedules` → `plants` → `refresh_tokens` → `users`. Returns no body on success. This is a hard delete — there is no grace period or soft-delete (post-MVP concern).

**Request Body:** None

**Query Parameters:** None

**Success Response — 204 No Content:**

```
(no response body)
```

**Error Responses:**

| HTTP | Code | Scenario |
|------|------|---------|
| 401 | `UNAUTHORIZED` | No `Authorization` header provided, token is missing, expired, or invalid |
| 404 | `USER_NOT_FOUND` | Authenticated user ID does not match any row in the `users` table (edge case: account already deleted via another request or race condition) |
| 500 | `INTERNAL_ERROR` | Unexpected server error; transaction rolled back — no partial data deletion |

**Auth Flow Notes:**
- User ID is extracted from the verified JWT payload (`req.user.id`). No request body or query param is needed — the token is the identity proof.
- After a successful deletion, the access token is technically still valid until it expires (15 min) but all protected endpoints will return 404 or 401 as the user row no longer exists. The frontend must clear tokens client-side immediately on 204.

**Transaction Deletion Order (explicit, not relying on DB cascade):**

```
BEGIN TRANSACTION
  DELETE FROM care_actions   WHERE plant_id IN (SELECT id FROM plants WHERE user_id = ?)
  DELETE FROM notification_preferences   WHERE user_id = ?
  DELETE FROM care_schedules WHERE plant_id IN (SELECT id FROM plants WHERE user_id = ?)
  DELETE FROM plants         WHERE user_id = ?
  DELETE FROM refresh_tokens WHERE user_id = ?
  DELETE FROM users          WHERE id = ?
COMMIT
```

**Implementation Notes:**
- All deletes must be inside a single Knex transaction (`knex.transaction(trx => { ... })`)
- If any step throws, the transaction rolls back automatically — no partial data loss
- The model method should be `User.deleteWithAllData(userId, trx)`
- Route handler is a new `DELETE /` handler on `backend/src/routes/profile.js`
- Auth middleware (`requireAuth`) must be applied before this handler

---

### Schema Changes — Sprint 23

**No new tables or columns required.** This sprint only reads from and deletes rows across existing tables:
- `users` (existing)
- `plants` (existing)
- `care_actions` (existing)
- `care_schedules` (existing)
- `notification_preferences` (existing, added Sprint 22)
- `refresh_tokens` (existing)

No Knex migration file is needed. No Deploy Engineer migration handoff is required for this sprint.

---

### Frontend Integration Notes (for T-107)

1. **Trigger:** `DELETE /api/v1/profile` is called when the user confirms account deletion (types "DELETE" exactly and clicks confirm button in the modal).

2. **Request:** Send `Authorization: Bearer <access_token>` header. No request body.

3. **On 204 success:**
   - Clear all auth tokens from client state (call `logout()` / clear token storage)
   - Redirect to `/login?deleted=true`
   - On the login page, detect `?deleted=true` in query string and show dismissible banner: *"Your account has been permanently deleted."*

4. **On 401:** Treat as a session expiry — redirect to `/login`. (Should not happen if auth is checked before showing the modal, but handle defensively.)

5. **On 404:** Show inline modal error: *"Could not delete your account. Please try again."* (This is an edge case — the user's session is valid but the account is already gone.)

6. **On 500 / network error:** Show inline modal error: *"Could not delete your account. Please try again."* Retry is safe — the endpoint is idempotent for the user's data state.

7. **api.js helper:** Expose `profile.delete()` → sends `DELETE /api/v1/profile` with auth header. Returns the raw response (204 or throws on error).

---

*Sprint 23 contracts written by Backend Engineer — 2026-04-05. New endpoint: DELETE /api/v1/profile (T-106). No schema changes. T-104 (streak test flakiness fix) has no API surface changes — test-only fix. All prior sprint contracts remain authoritative.*

---

## Sprint 24 Contracts — 2026-04-06

**Sprint Goal:** Batch Mark-Done on Care Due Dashboard (T-109) + Rate Limiting on high-frequency endpoints (T-111).

**Author:** Backend Engineer
**Date:** 2026-04-06

---

### GROUP — Batch Care Actions (T-109)

---

#### POST /api/v1/care-actions/batch

**Auth:** Required — Bearer token in `Authorization: Bearer <access_token>` header

**Description:** Records multiple care actions in a single atomic transaction. Accepts up to 50 care action items. Each item's ownership is validated against the authenticated user before insert. Returns `207 Multi-Status` with a per-item result array indicating whether each action was created or failed. This enables the batch mark-done flow on the Care Due Dashboard (SPEC-019).

**Request Body:**

```json
{
  "actions": [
    {
      "plant_id": "uuid",          // required; UUID of the plant
      "care_type": "string",       // required; one of: "watering", "fertilizing", "repotting"
      "performed_at": "string"     // required; ISO 8601 UTC timestamp (e.g. "2026-04-06T14:30:00.000Z")
    }
  ]
}
```

**Validation Rules:**

| Field | Rules |
|-------|-------|
| `actions` | Required; non-empty array; maximum 50 items; returns `400` if missing, empty, or length > 50 |
| `actions[*].plant_id` | Required; valid UUID format; must be a plant owned by the authenticated user (ownership failure → per-item error in 207 response, not a top-level 403) |
| `actions[*].care_type` | Required; must be one of `"watering"`, `"fertilizing"`, `"repotting"` |
| `actions[*].performed_at` | Required; must be a valid ISO 8601 date-time string; future dates are accepted |

**Ownership Resolution:** For each `plant_id` in the batch, the backend verifies it belongs to `req.user.id`. Plant IDs that exist but belong to another user produce a per-item `"error"` in the results array. Plant IDs that do not exist at all also produce a per-item `"error"`. No top-level `403` is returned — all ownership failures are reported at the item level.

**Transaction Behavior:** All items that pass validation and ownership checks are inserted into `care_actions` in a single database transaction. If the transaction itself fails (DB error), the entire batch rolls back and a `500` is returned. Individual validation/ownership failures for specific items do NOT cause the entire transaction to abort — valid items are still committed.

**Success Response — 207 Multi-Status:**

Returned for any request where the array was non-empty and ≤ 50 items, regardless of per-item success or failure. The caller must inspect each result's `status` field.

```json
{
  "data": {
    "results": [
      {
        "plant_id": "uuid",
        "care_type": "watering",
        "performed_at": "2026-04-06T14:30:00.000Z",
        "status": "created",   // "created" | "error"
        "error": null          // null on success; error message string on failure
      },
      {
        "plant_id": "uuid",
        "care_type": "fertilizing",
        "performed_at": "2026-04-06T14:30:00.000Z",
        "status": "error",
        "error": "Plant not found or not owned by user"
      }
    ],
    "created_count": 1,    // integer; number of items with status "created"
    "error_count": 1       // integer; number of items with status "error"
  }
}
```

**All-success example (3 of 3 created):**

```json
{
  "data": {
    "results": [
      { "plant_id": "uuid-1", "care_type": "watering",    "performed_at": "2026-04-06T14:30:00.000Z", "status": "created", "error": null },
      { "plant_id": "uuid-2", "care_type": "fertilizing", "performed_at": "2026-04-06T14:30:00.000Z", "status": "created", "error": null },
      { "plant_id": "uuid-3", "care_type": "repotting",   "performed_at": "2026-04-06T14:30:00.000Z", "status": "created", "error": null }
    ],
    "created_count": 3,
    "error_count": 0
  }
}
```

**Error Responses (top-level — request rejected before processing):**

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | `actions` array is missing, empty (`[]`), or exceeds 50 items; or any item is missing a required field (`plant_id`, `care_type`, `performed_at`); or `care_type` is not one of the accepted values; or `performed_at` is not a valid ISO 8601 string. The `message` field identifies the specific violation. |
| 401 | `UNAUTHORIZED` | Missing, expired, or invalid Bearer token |
| 500 | `INTERNAL_ERROR` | Unexpected server error; transaction rolled back — no partial data written |

**Error response shape (400 example):**

```json
{
  "error": {
    "message": "actions must be a non-empty array with at most 50 items",
    "code": "VALIDATION_ERROR"
  }
}
```

**Error response shape (400 — missing field example):**

```json
{
  "error": {
    "message": "actions[2].care_type is required and must be one of: watering, fertilizing, repotting",
    "code": "VALIDATION_ERROR"
  }
}
```

**Implementation Notes:**

- Route handler: new `POST /batch` handler on `backend/src/routes/careActions.js`
- Model method: `CareAction.batchCreate(userId, actions)` in `backend/src/models/CareAction.js`
  - Resolves ownership for all `plant_id` values in a single query (`SELECT id FROM plants WHERE user_id = ? AND id = ANY(?)`) before attempting inserts
  - Inserts all valid (owned + valid fields) actions in a single `knex.transaction`
  - Returns the results array with per-item status
- Auth middleware (`requireAuth`) must be applied before this handler
- `performed_at` defaults to `new Date().toISOString()` is **not** applied server-side — the client must always supply it explicitly

---

### GROUP — Rate Limiting (T-111)

---

**Note:** Rate limiting is implemented as Express middleware (`backend/src/middleware/rateLimiter.js`) — not a new endpoint. This section documents the rate limiting rules applied to existing endpoints, the 429 response contract, and header conventions that all clients must handle.

#### Rate Limiting Rules

| Route Group | Endpoints | Limit | Window | Error Code |
|-------------|-----------|-------|--------|------------|
| Auth (strict) | `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/auth/refresh` | 10 requests | 15 minutes per IP | `RATE_LIMIT_EXCEEDED` |
| Stats/read-heavy (moderate) | `GET /api/v1/care-actions/stats`, `GET /api/v1/care-actions/streak` | 60 requests | 1 minute per IP | `RATE_LIMIT_EXCEEDED` |
| Global fallback (permissive) | All other `/api/v1/*` routes | 200 requests | 15 minutes per IP | `RATE_LIMIT_EXCEEDED` |

**Environment variable overrides:**

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_AUTH_MAX` | `10` | Max requests for auth endpoints per window |
| `RATE_LIMIT_AUTH_WINDOW_MS` | `900000` (15 min) | Window duration (ms) for auth endpoints |
| `RATE_LIMIT_STATS_MAX` | `60` | Max requests for stats/streak endpoints per window |
| `RATE_LIMIT_STATS_WINDOW_MS` | `60000` (1 min) | Window duration (ms) for stats/streak endpoints |
| `RATE_LIMIT_GLOBAL_MAX` | `200` | Max requests for global fallback per window |
| `RATE_LIMIT_GLOBAL_WINDOW_MS` | `900000` (15 min) | Window duration (ms) for global fallback |

**Test environment behavior:** Rate limiters are **skipped entirely** when `NODE_ENV === 'test'`. This ensures zero impact on the existing test suite. Implemented via `skip: (req) => process.env.NODE_ENV === 'test'` on all limiter instances.

#### 429 Too Many Requests Response

Returned when any configured limit is exceeded. Follows the existing error shape convention.

```json
{
  "error": {
    "message": "Too many requests. Please try again later.",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

**Rate Limit Headers (included in all responses from rate-limited routes):**

| Header | Description |
|--------|-------------|
| `RateLimit-Limit` | Maximum number of requests allowed in the current window |
| `RateLimit-Remaining` | Number of requests remaining in the current window |
| `RateLimit-Reset` | Unix timestamp (seconds) when the current window resets |

**Frontend Integration Notes:**

- The frontend does **not** need to actively handle 429 responses under normal usage — regular users will never hit these limits
- If a 429 is encountered (e.g., during aggressive polling or test scenarios), treat it as a retriable error — surface a generic "Service temporarily unavailable. Please try again." message
- Do not retry 429 responses automatically — wait for the `RateLimit-Reset` timestamp before retrying

---

### Schema Changes — Sprint 24

**No new tables or columns required for Sprint 24.**

- `POST /api/v1/care-actions/batch` writes to the existing `care_actions` table (no structural changes)
- Rate limiting (T-111) is application-layer middleware — no database involvement

No Knex migration file is needed. No Deploy Engineer migration handoff is required for this sprint.

---

### Frontend Integration Notes — Sprint 24 (for T-110)

#### POST /api/v1/care-actions/batch — Integration Guide

1. **Helper method:** Add `careActions.batch(actions)` to `frontend/src/utils/api.js`:
   ```js
   // actions: Array<{ plant_id: string, care_type: string, performed_at: string }>
   batch: (actions) => apiFetch('/care-actions/batch', {
     method: 'POST',
     body: JSON.stringify({ actions }),
   })
   ```

2. **Request shape:** Always supply `performed_at` as `new Date().toISOString()` for each action at call time. Do not rely on server-side defaulting.

3. **Interpreting the 207 response:**
   - Check `data.error_count`: if `0` → all items succeeded → full success flow
   - If `error_count > 0` and `created_count > 0` → partial failure flow
   - If `error_count === actions.length` → all failed (edge case, treat as full failure)
   - The `results` array is positionally ordered to match the input `actions` array

4. **Retry on partial failure:** When retrying failed items, send only the items whose `status === "error"` in the previous 207 response. Do not re-send already-created items.

5. **Error handling:**
   - `400 VALIDATION_ERROR` → programming error (malformed request) — log to console, show generic error banner
   - `401 UNAUTHORIZED` → trigger auth refresh flow (same as all other protected endpoints)
   - `500 INTERNAL_ERROR` → show generic error: "Something went wrong. Please try again."

---

*Sprint 24 contracts written by Backend Engineer — 2026-04-06. New endpoint: POST /api/v1/care-actions/batch (T-109). Rate limiting addendum for T-111. No schema changes. All prior sprint contracts remain authoritative.*

---

## Sprint 25 Contracts — 2026-04-06

**Sprint Goal:** `.env` rate-limit variable cleanup (T-115, P3) + fix care status inconsistency between My Plants and Care Due Dashboard (T-116, P1).

**Author:** Backend Engineer
**Date:** 2026-04-06

---

### Overview

Sprint #25 introduces **zero new endpoints** and **zero schema changes**. Both tasks are backend-only fixes:

| Task | Type | Affected Surface | Contract Impact |
|------|------|-----------------|----------------|
| T-115 | Config cleanup — stale `.env` variable names | `backend/.env` | None — no API surface change |
| T-116 | Bug fix — care status inconsistency across views | `GET /api/v1/plants` + `GET /api/v1/care-due` | Behavioral clarification only — request/response shapes unchanged |

---

### T-115 — `.env` Rate-Limit Variable Cleanup

**Contract impact: None.** This task removes stale legacy variable names (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`) from `backend/.env` and replaces them with the correct T-111 names (`RATE_LIMIT_AUTH_MAX`, `RATE_LIMIT_AUTH_WINDOW_MS`, `RATE_LIMIT_STATS_MAX`, `RATE_LIMIT_STATS_WINDOW_MS`, `RATE_LIMIT_GLOBAL_MAX`, `RATE_LIMIT_GLOBAL_WINDOW_MS`).

No API endpoints are changed. No behavioral change is expected. Rate limiting middleware (`rateLimiter.js`) already reads the T-111 variable names — this fix ensures the `.env` file actually supplies them. All 183/183 backend tests must continue to pass.

**For QA:** Verify that `backend/.env` no longer contains the three stale names and does contain all six T-111 names. Run the full backend test suite and confirm 183/183 pass.

---

### T-116 — Behavioral Clarification: Care Status Date Boundary Alignment

**Contract status:** BEHAVIORAL CLARIFICATION. The request/response shapes of both endpoints are unchanged. This entry documents the **canonical, authoritative overdue/care-status boundary algorithm** that both `GET /api/v1/plants` and `GET /api/v1/care-due` must implement identically after the T-116 fix.

**Problem statement:** Before this fix, a plant could appear as `overdue` in `GET /api/v1/plants` (via `careStatus.js`) yet appear in the `coming_up` bucket in `GET /api/v1/care-due` (via `careDue.js`). Root cause: the two code paths applied different date boundary / timezone offset logic when computing whether a plant's next due date has passed.

---

#### Canonical Date Boundary Algorithm (both endpoints, post-fix)

Both `GET /api/v1/plants` and `GET /api/v1/care-due` **must** use the following identical algorithm when the `utcOffset` query parameter is present:

```
local_now_ms      = Date.now() + (utcOffset * 60 * 1000)
local_today_start = start of the calendar day that contains local_now_ms
                  = local_now_ms - (local_now_ms % 86_400_000)   [ms since epoch, truncated to day]
local_today_end   = local_today_start + 86_400_000               [exclusive upper bound]

overdue   → next_due_date_ms <  local_today_start
due_today → local_today_start <= next_due_date_ms < local_today_end
coming_up → next_due_date_ms >= local_today_end
```

When `utcOffset` is **omitted**, both endpoints default to UTC (`utcOffset = 0`), preserving existing behaviour.

**Critical invariant (testable):**  
Given the same `utcOffset` value, a plant that has `care_status = "overdue"` in the `GET /api/v1/plants` response **must** appear in the `overdue` array in `GET /api/v1/care-due`. No plant may be overdue in one view and coming_up or due_today in the other.

---

#### GET /api/v1/plants *(Behavioral clarification — Sprint 25 / T-116)*

**No request or response shape changes.** See Sprint 18 contract for the full spec.

**Behavioral fix:** `careStatus.js` is updated to use the canonical algorithm above. The `utcOffset` query parameter interpretation is identical to `GET /api/v1/care-due` after this fix.

**Affected field:** `care_schedules[].care_status` in the response — values `"overdue"`, `"due_today"`, `"coming_up"`, `"no_schedule"` are unchanged; only the boundary logic that assigns them is corrected.

---

#### GET /api/v1/care-due *(Behavioral clarification — Sprint 25 / T-116)*

**No request or response shape changes.** See Sprint 8 + Sprint 14 contracts for the full spec.

**Behavioral fix:** `careDue.js` is updated to use the canonical algorithm above, matching `careStatus.js` exactly.

**Affected fields:** `overdue[]`, `due_today[]`, `coming_up[]` arrays in the response — their structure is unchanged; only the boundary logic that populates each bucket is corrected.

---

#### Error Responses — unchanged

Both endpoints retain the same error codes documented in their original contracts:

| HTTP | Code | Scenario |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | `utcOffset` out of range `[-840, 840]` or non-integer |
| 401 | `UNAUTHORIZED` | Missing or invalid Bearer token |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

### Regression Tests Required (T-116)

At least 2 new regression tests must be added to the backend test suite covering the overdue/timezone boundary case:

1. **Boundary alignment test:** Given a plant with `next_due_date` strictly before local midnight (at a non-UTC timezone offset), verify it is classified as `overdue` by both `careStatus.js` and `careDue.js` using the same `utcOffset`.
2. **No cross-bucket divergence test:** Given the same `utcOffset`, a plant cannot be `overdue` in one code path and `coming_up` or `due_today` in the other.

---

### Schema Changes — Sprint 25

**None.** No new tables, columns, indexes, or migration files are required for either T-115 or T-116.

---

*Sprint 25 contracts written by Backend Engineer — 2026-04-06. Zero new endpoints. Zero schema changes. T-115: config-only `.env` cleanup. T-116: behavioral clarification — canonical date boundary algorithm for GET /api/v1/plants and GET /api/v1/care-due. All prior sprint contracts remain authoritative.*

---

## Sprint 26 Contracts — 2026-04-06

**Sprint Goal:** Harden test reliability and polish edge-case UX — fix `careActionsStreak.test.js` timezone flakiness (T-117, P2) and unsubscribe error CTA differentiation (T-118, P3).

**Author:** Backend Engineer
**Date:** 2026-04-06

---

### Overview

Sprint #26 introduces **zero new endpoints** and **zero schema changes**. Both tasks are targeted fixes with no API surface modifications:

| Task | Owner | Type | Affected Surface | Contract Impact |
|------|-------|------|-----------------|----------------|
| T-117 | Backend Engineer | Test-only fix — timezone flakiness | `backend/tests/careActionsStreak.test.js` | None — test helper change only, no production code change |
| T-118 | Frontend Engineer | UX fix — unsubscribe error CTA | `frontend/src/pages/UnsubscribePage.jsx` | None — uses existing `GET /api/v1/unsubscribe` contract (Sprint 22); frontend rendering logic change only |

---

### T-117 — Test Reliability Fix: careActionsStreak.test.js Timezone Flakiness

**Contract impact: None.**

This task is a test-only fix. No production code, no routes, no models, and no database schema are changed.

**Root cause:** The `daysAgo(0)` helper in `backend/tests/careActionsStreak.test.js` constructs a timestamp set to noon UTC today (`d.setUTCHours(12, 0, 0, 0)`). Between midnight and noon UTC this timestamp is in the future, causing the backend's `performed_at` validation to reject the request with `400` instead of the expected `201`.

**Fix:** Change `daysAgo(0)` to set the timestamp to the **start** of the UTC day (`d.setUTCHours(0, 0, 0, 0)`). This ensures the timestamp is always in the past regardless of the current UTC hour.

**Acceptance criteria (test-only):**
- `daysAgo(0)` never produces a future timestamp at any UTC hour
- All 5 affected streak tests pass reliably at any UTC time-of-day
- All 188/188 backend tests continue to pass — no regressions

**No API surface change. No handoff to Deploy Engineer required.**

---

### T-118 — Frontend UX Fix: Unsubscribe Error CTA Differentiation

**Contract impact: None — existing endpoint is unchanged.**

The `GET /api/v1/unsubscribe` endpoint documented in **Sprint 22** remains the authoritative contract. Request/response shapes, status codes, and error codes are all unchanged.

#### Reference: Existing GET /api/v1/unsubscribe Error Codes (Sprint 22 — unchanged)

| HTTP | Code | Scenario | Frontend CTA (post T-118 fix) |
|------|------|---------|-------------------------------|
| 400 | `VALIDATION_ERROR` | Missing or malformed token query param | "Sign In" → `/login` |
| 401 | `UNAUTHORIZED` | HMAC signature invalid or token tampered | "Sign In" → `/login` |
| 404 | `USER_NOT_FOUND` | Token valid but account no longer exists (deleted) | **"Go to Plant Guardians" → `/`** |
| 422 | `UNSUBSCRIBE_ERROR` | Token structure valid but cannot be processed | "Sign In" → `/login` |
| 500 | `INTERNAL_ERROR` | Unexpected server error | "Sign In" → `/login` |

**Frontend implementation note (for T-118):**
- Only the `404` response triggers the alternate CTA
- All non-404 errors retain the existing "Sign In" → `/login` CTA
- At least 1 new test must cover the 404 → "Go to Plant Guardians" path

---

### Schema Changes — Sprint 26

**None.** No new tables, columns, indexes, or migration files are required for either T-117 or T-118.

**No Deploy Engineer migration handoff required.**

---

*Sprint 26 contracts written by Backend Engineer — 2026-04-06. Zero new endpoints. Zero schema changes. T-117: test-only fix for careActionsStreak.test.js daysAgo(0) timezone issue. T-118: frontend UX fix consuming existing GET /api/v1/unsubscribe — CTA differentiation by HTTP status code. All prior sprint contracts remain authoritative.*
