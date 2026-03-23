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
