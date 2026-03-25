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
