# System analysis — Whitelane Driver backend

## Purpose

Support the **Driver Mobile Application** with a **REST API** that:

1. Authenticates **only** provisioned drivers (no self-registration).
2. Exposes **operational** trip data **without** financial disclosure.
3. Enforces **state rules** (paid bookings, lifecycle transitions).

## Actors

| Actor | Goal |
|-------|------|
| **Driver** | Go online, see confirmed work, accept/reject, execute trip, complete. |
| **Admin / dispatcher** | Create users, assign trips, mark payments (out of scope of this API surface but reflected in DB flags). |
| **System** | Validates tokens, applies RBAC, maintains audit-friendly trip rows. |

## Logical data flow

1. **Login** — Identifier resolves to `users`; credentials verified; Sanctum access token + refresh row issued.
2. **Presence** — Driver toggles online; coordinates stored for future dispatch/geofence rules.
3. **Trip list** — Query returns rows where `driver_id` matches, `payment_paid`, not cancelled; upcoming excludes terminal states; history is terminal only.
4. **Accept / reject** — Mutates `trips.driver_status` and `driver_id` consistent with pool model.
5. **Status progression** — PATCH validates allowed `driver_status`; **completed** blocked unless `payment_paid`.

## RBAC matrix (implemented)

| Route prefix | Requirement |
|--------------|-------------|
| `POST /v1/auth/driver/login` | Public |
| `POST /v1/auth/refresh` | Public |
| `POST /v1/auth/logout` | Valid Sanctum token |
| `/v1/auth/driver/reset-password`, `/v1/driver/*` | Sanctum + `users.role = driver` + `account_status = active` |

## Data minimization (driver channel)

- Controllers return **`DriverTripResource`** only for driver routes.
- Internal columns (`payment_paid`) are **not** exposed in JSON; they drive authorization only.

## Extension points (future work)

- **Admin API** (separate guard) for user/trip CRUD and payment flags.
- **Dispatch service** — assign `driver_id` when driver is online and inside service polygon.
- **WebSockets / FCM** — notify on `offered` / `assigned` / `status` changes.
- **OTP** — replace `WHITELANE_OTP_FALLBACK_TO_PASSWORD` with SMS provider and short-lived codes.
- **Spatie Permission** — if role matrix grows beyond a single `role` string column.

## Non-functional

- **Scalability**: stateless API + horizontal PHP workers; DB connection pooling; Redis cache.
- **Availability**: health check `/up`, DB retries, queue for async notifications.
