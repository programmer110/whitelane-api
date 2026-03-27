# Whitelane Driver API — Reference

Base path: **`/v1`**.  
JSON lists are **top-level arrays** (no `data` wrapper). Errors: `{ "error": { "code", "message" } }` (validation may use Laravel’s `message` + `errors`).

## Auth

### `POST /v1/auth/driver/login`

```json
{ "identifier": "driver1", "secret": "password", "mode": "password" }
```

`mode`: `password` | `otp`

**200**

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 3600,
  "must_reset_password": false,
  "user": {
    "id": "1",
    "display_name": "Demo Driver",
    "roles": ["driver"],
    "is_online": false
  }
}
```

**403** — not a driver / inactive. **404** — unknown user or bad secret.

### `POST /v1/auth/refresh`

```json
{ "refresh_token": "..." }
```

Returns new `access_token`, `refresh_token`, `expires_in`.

### `POST /v1/auth/logout`

Header: `Authorization: Bearer {access_token}`  
**204** — revokes all Sanctum tokens and refresh rows for that user.

### `POST /v1/auth/driver/reset-password`

Requires driver token.

```json
{ "current_password": "...", "new_password": "..." }
```

**204** on success.

---

## Driver

All routes: `Authorization: Bearer` + role `driver` + `account_status=active` (except where noted).

### `PATCH /v1/driver/presence`

```json
{ "is_online": true, "lat": 24.71, "lng": 46.67 }
```

**204**

### `GET /v1/driver/trips/upcoming`

Returns **array** of driver-safe trip objects (`confirmed_for_driver: true` only).

### `GET /v1/driver/trips/history?page=1&page_size=20`

Returns **array** of completed/cancelled trips for the driver.

### `GET /v1/driver/trips/{id}`

Single trip object.

### `POST /v1/driver/trips/{id}/accept`

`offered` → `assigned`. **409** if not offered.

### `POST /v1/driver/trips/{id}/reject`

Clears `driver_id`, sets pool state (`offered`). **409** if not offered.

### `PATCH /v1/driver/trips/{id}/status`

```json
{ "driver_status": "navigating_to_pickup" }
```

Allowed: `navigating_to_pickup`, `arrived`, `in_progress`, `completed`.  
**403** if `completed` and `payment_paid` is false, or trip already completed.

---

## Trip object (driver channel)

| Field | Notes |
|-------|--------|
| `id` | String in JSON |
| `pickup_address`, `dropoff_address` | |
| `scheduled_at` | ISO-8601 |
| `customer_display_name` | |
| `vehicle_type_label` | |
| `segment` | `b2b` \| `b2c` |
| `driver_status` | See mobile spec |
| `confirmed_for_driver` | `true` when paid & not cancelled |
| `pickup_lat` / `lng`, `dropoff_lat` / `lng` | Optional numbers |

**Never returned:** price, fare, payment status, invoice, earnings.
