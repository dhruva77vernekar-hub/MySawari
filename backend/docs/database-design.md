# MySawari — Supabase PostgreSQL Database Design

## 1. Design principles

- Supabase Auth owns credentials and authentication sessions. Do not duplicate passwords.
- `profiles.id` references `auth.users.id`.
- Use UUID primary keys, `timestamptz` in UTC, `numeric` for INR money, `jsonb` only for bounded metadata/snapshots.
- Store latitude/longitude as `double precision` for the hackathon; PostGIS is preferable for production geospatial queries if enabled.
- Enforce important invariants in PostgreSQL, not only in Express.
- Use database transactions/RPC for accepting a ride, reserving pool capacity and reassignment claims.
- Add `created_at`, `updated_at` where useful. Use `is_demo` and `demo_session_id` consistently for demo separation.
- This is a proposed schema. No SQL is executed and no live Supabase project has been inspected.

## 2. Core tables

### `profiles`
Purpose: application identity and role profile.

| Column | Type | Rules |
|---|---|---|
| `id` | uuid | PK, FK → `auth.users(id)` ON DELETE CASCADE |
| `full_name` | text | NOT NULL, length 1–120 |
| `phone` | text | nullable; normalize and unique if verified |
| `role` | text | NOT NULL CHECK in `rider`,`captain`,`admin` |
| `avatar_url` | text | nullable; validate URL/storage policy |
| `is_suspended` | boolean | NOT NULL DEFAULT false |
| `created_at`, `updated_at` | timestamptz | NOT NULL DEFAULT now() |
| `is_demo` | boolean | NOT NULL DEFAULT false |
| `demo_session_id` | uuid | nullable |

Indexes: role, `(is_demo, demo_session_id)`. RLS: user can select/update own safe profile fields; role and suspension changes must be server/admin controlled. Do not let users self-promote to admin/captain.

### `vehicle_types`
Purpose: server-controlled vehicle catalog and fare/capacity rules.

| Column | Type | Rules |
|---|---|---|
| `id` | uuid | PK |
| `code` | text | UNIQUE NOT NULL: `bike`,`scooter`,`car` |
| `display_name` | text | NOT NULL |
| `capacity` | smallint | CHECK 1–8 |
| `base_fare` | numeric(10,2) | CHECK >= 0 |
| `per_km_rate` | numeric(10,2) | CHECK >= 0 |
| `per_minute_rate` | numeric(10,2) | CHECK >= 0 |
| `minimum_fare` | numeric(10,2) | CHECK >= 0 |
| `is_active` | boolean | DEFAULT true |
| `created_at`, `updated_at` | timestamptz | defaults |

RLS: public read of active catalog; writes admin-only/server-only.

### `captain_profiles`
Purpose: captain-specific state, vehicle, location and operational data.

| Column | Type | Rules |
|---|---|---|
| `profile_id` | uuid | PK, FK → profiles.id |
| `vehicle_type_id` | uuid | FK → vehicle_types.id |
| `vehicle_registration` | text | nullable; unique if supplied |
| `online_status` | text | CHECK `offline`,`online`,`busy`,`suspended` |
| `latitude`, `longitude` | double precision | nullable, range checks |
| `location_updated_at` | timestamptz | nullable |
| `active_ride_id` | uuid | nullable FK → rides.id (add FK after rides creation) |
| `completed_rides_count` | integer | DEFAULT 0 CHECK >= 0 |
| `recent_acceptance_rate` | numeric(5,2) | CHECK 0–100 |
| `created_at`, `updated_at` | timestamptz | defaults |

Indexes: `(online_status, vehicle_type_id)`, location freshness, active ride. RLS: captain reads/updates permitted own operational fields; location writes should go through backend. Rider access must be limited to assigned captain and active trip.

### `rides`
Purpose: canonical booking and ride snapshot.

| Column | Type | Rules |
|---|---|---|
| `id` | uuid | PK |
| `rider_id` | uuid | FK → profiles.id NOT NULL |
| `captain_id` | uuid | nullable FK → profiles.id |
| `vehicle_type_id` | uuid | FK → vehicle_types.id NOT NULL |
| `status` | text | CHECK `requested`,`offered`,`accepted`,`arriving`,`in_progress`,`completed`,`cancelled`,`no_captain_available` |
| `pickup_label`, `destination_label` | text | NOT NULL |
| `pickup_lat`, `pickup_lng` | double precision | NOT NULL, range checks |
| `destination_lat`, `destination_lng` | double precision | NOT NULL, range checks |
| `distance_meters` | integer | nullable CHECK >= 0 |
| `estimated_duration_seconds` | integer | nullable CHECK >= 0 |
| `estimated_fare` | numeric(10,2) | CHECK >= 0 |
| `final_fare` | numeric(10,2) | nullable CHECK >= 0 |
| `currency` | char(3) | DEFAULT `INR` |
| `pricing_snapshot` | jsonb | NOT NULL DEFAULT `{}`; multiplier, rate version and reason |
| `is_pool_eligible` | boolean | DEFAULT false |
| `pool_id` | uuid | nullable FK → ride_pools.id (add after table exists) |
| `cancelled_by` | uuid | nullable FK → profiles.id |
| `cancellation_reason` | text | nullable |
| `requested_at`, `accepted_at`, `started_at`, `completed_at`, `cancelled_at` | timestamptz | nullable/default as appropriate |
| `created_at`, `updated_at` | timestamptz | defaults |
| `is_demo`, `demo_session_id` | boolean/uuid | demo isolation |

Indexes: `(rider_id, created_at DESC)`, `(captain_id, status)`, `(status, created_at)`, `(pool_id)`. RLS: rider sees own rides; captain sees rides assigned to them and offers explicitly addressed to them; admin access server-authorized. Do not expose all requested rides to all captains.

### `ride_events`
Purpose: append-only lifecycle and audit trail.

Columns: `id uuid PK`, `ride_id uuid FK NOT NULL`, `actor_id uuid FK profiles nullable`, `actor_role text`, `event_type text NOT NULL`, `from_status text`, `to_status text`, `reason text`, `metadata jsonb DEFAULT '{}'`, `created_at timestamptz DEFAULT now()`.

Index `(ride_id, created_at)`. RLS: visible to ride participants and admins; insert through trusted backend/transaction. Do not permit clients to rewrite/delete history.

### `ratings`
Purpose: rider feedback for completed rides.

Columns: `id uuid PK`, `ride_id uuid FK NOT NULL`, `rider_id uuid FK profiles NOT NULL`, `captain_id uuid FK profiles NOT NULL`, `score smallint CHECK 1–5`, `comment text nullable length-limited`, `created_at timestamptz`.

Constraint: UNIQUE `(ride_id, rider_id)`. RLS: rider may create one rating only for own completed ride; captain sees ratings addressed to them subject to privacy policy; admin moderation server-side.

## 3. Advanced feature tables

### `service_zones`
`id uuid PK`, `code text UNIQUE`, `name text`, `boundary_geojson jsonb` (or PostGIS geometry after extension approval), `is_active boolean`, `created_at`, `updated_at`. Index active zones. RLS: read active zone definitions; writes admin-only.

### `demand_history`
`id bigserial PK`, `zone_id uuid FK service_zones`, `bucket_start timestamptz`, `bucket_minutes smallint DEFAULT 30`, `request_count integer CHECK >= 0`, `completed_count integer CHECK >= 0`, `source text CHECK in `live`,`simulated``, `demo_session_id uuid nullable`, `created_at timestamptz`. Unique `(zone_id,bucket_start,bucket_minutes,source,demo_session_id)` with null handling considered. Index `(zone_id,bucket_start DESC)`.

### `demand_forecasts`
`id uuid PK`, `zone_id uuid FK`, `forecast_for timestamptz`, `generated_at timestamptz`, `predicted_requests numeric(10,2) CHECK >= 0`, `available_captains integer CHECK >= 0`, `shortage_level text CHECK in `normal`,`elevated`,`shortage``, `algorithm_version text`, `input_window jsonb`, `is_simulated boolean`, `demo_session_id uuid nullable`. Index `(zone_id,forecast_for)` and generated time.

### `zone_metrics`
`id uuid PK`, `zone_id uuid FK`, `measured_at timestamptz`, `recent_demand integer`, `available_captains integer`, `demand_supply_ratio numeric(10,3)`, `intensity text`, `surge_multiplier numeric(4,2) CHECK between 1.0 and configured hard cap`, `pricing_reason text`, `repositioning jsonb`, `is_demo boolean`, `demo_session_id uuid`. Index `(zone_id,measured_at DESC)`.

### `captain_allocation_history`
`id uuid PK`, `ride_id uuid FK`, `captain_id uuid FK profiles`, `attempt_number integer`, `eta_seconds integer`, `distance_meters integer`, `workload_score numeric(5,2)`, `fairness_score numeric(5,2)`, `reliability_score numeric(5,2)`, `total_score numeric(5,2)`, `outcome text CHECK in `offered`,`accepted`,`rejected`,`timeout`,`cancelled`,`skipped``, `reason text`, `created_at timestamptz`. Index `(captain_id,created_at DESC)`, `(ride_id,attempt_number)`.

### `reassignment_attempts`
`id uuid PK`, `ride_id uuid FK`, `previous_captain_id uuid FK nullable`, `new_captain_id uuid FK nullable`, `attempt_number integer`, `trigger text CHECK in `rejected`,`captain_cancelled`,`timeout`,`captain_unavailable`,`admin_retry``, `result text`, `error_code text nullable`, `created_at timestamptz`. Unique `(ride_id,attempt_number)`. Index `(ride_id,created_at)`.

### `ride_pools`
`id uuid PK`, `status text CHECK in `open`,`locked`,`in_progress`,`completed`,`cancelled``, `vehicle_type_id uuid FK`, `captain_id uuid FK nullable`, `capacity smallint CHECK > 0`, `seats_reserved smallint CHECK >= 0 AND <= capacity`, `max_detour_percent numeric(5,2)`, `route_order jsonb`, `route_distance_meters integer`, `route_duration_seconds integer`, `created_at`, `updated_at`, `is_demo boolean`, `demo_session_id uuid`. Index `(status,vehicle_type_id)`.

### `ride_pool_members`
`id uuid PK`, `pool_id uuid FK ride_pools ON DELETE CASCADE`, `ride_id uuid UNIQUE FK rides`, `rider_id uuid FK profiles`, `passenger_count smallint CHECK > 0`, `pickup_sequence smallint`, `drop_sequence smallint`, `fare_share numeric(10,2) CHECK >= 0`, `status text`, `created_at`. Constraint unique pool/ride and ensure pickup precedes drop in service/transaction logic. Index `(pool_id,pickup_sequence)`.

## 4. Safety, admin and demo tables

### `notifications`
`id uuid PK`, `user_id uuid FK profiles`, `type text`, `title text`, `body text`, `payload jsonb`, `read_at timestamptz`, `created_at timestamptz`. Index `(user_id,created_at DESC)`. Avoid storing secrets or excessive personal data.

### `trip_share_tokens`
`id uuid PK`, `ride_id uuid FK`, `created_by uuid FK profiles`, `token_hash text UNIQUE NOT NULL`, `expires_at timestamptz`, `revoked_at timestamptz`, `created_at timestamptz`. Store only a hash of a high-entropy random token; public endpoint returns limited trip status, not personal contact/location history.

### `sos_events`
`id uuid PK`, `ride_id uuid FK`, `created_by uuid FK profiles`, `latitude double precision`, `longitude double precision`, `status text`, `created_at timestamptz`, `resolved_at timestamptz`. Restrict access to participants and authorized admins. Define what SOS does operationally before presenting it as emergency dispatch.

### `demo_sessions`
`id uuid PK`, `label text`, `status text`, `created_by uuid FK profiles`, `started_at timestamptz`, `ended_at timestamptz`, `created_at timestamptz`. Index active sessions.

### `audit_logs`
`id bigserial PK`, `actor_id uuid nullable`, `action text`, `entity_type text`, `entity_id text`, `request_id text`, `metadata jsonb`, `created_at timestamptz`. Restrict reads; never log credentials, access tokens or full sensitive payloads.

## 5. Relationship summary

```text
auth.users 1—1 profiles
profiles 1—0/1 captain_profiles
vehicle_types 1—many captain_profiles
profiles (rider) 1—many rides
profiles (captain) 1—many rides
rides 1—many ride_events
rides 1—0/1 ratings (or one per rider policy)
service_zones 1—many demand_history / demand_forecasts / zone_metrics
rides 1—many captain_allocation_history / reassignment_attempts
ride_pools 1—many ride_pool_members
ride_pool_members many—1 rides
rides 1—many notifications/share/SOS records as applicable
```

## 6. Atomic operations and constraints

Implement database functions/RPC or an equivalent transaction boundary for:
1. `accept_ride(ride_id, captain_id, offer_id)`: lock ride/offer, verify status and captain eligibility, claim once, set accepted captain and timestamps, append event and allocation outcome.
2. `reserve_pool_seats(pool_id, ride_id, passenger_count, ...)`: lock pool, validate status/capacity/detour, insert membership and update reserved seats atomically.
3. `claim_reassignment(ride_id, expected_status, attempt_number)`: lock ride, ensure no active assignment/worker claim, create one attempt.
4. `transition_ride(...)`: validate allowed state transition and write event in same transaction.

Use conditional updates such as `UPDATE rides SET ... WHERE id=? AND status='offered' AND captain_id IS NULL` and check affected row count. Add unique constraints for one active accepted captain/one membership as appropriate. The exact offer representation may require a dedicated `ride_offers` table if several captains are offered concurrently; recommended for robust matching.

## 7. RLS and Realtime plan

- Enable RLS on all user-facing tables.
- `profiles`: owner read/update safe fields; admin operations through backend.
- `rides`: rider owner and assigned captain only; pending captain offers must be explicitly addressed.
- `ride_events`: participants read; server-only writes.
- `captain_profiles`: captain own profile; riders see only assigned captain's limited public fields during active ride.
- `ratings`: enforce completed ride and ownership.
- `trip_share_tokens`: do not expose raw token table publicly; public share endpoint validates hash/expiry and returns a sanitized projection.
- Demand/zone tables: admin/operations read; public app may see only non-sensitive, coarse zone information.
- Allocation, audit, reassignment and SOS data: restricted to authorized backend/admin roles.
- Realtime: subscribe only to channels scoped by ride/user; verify channel authorization and test cross-user leakage. Do not broadcast exact captain coordinates globally.

RLS policies should use `auth.uid()` and server-owned role claims/profile rows. Do not trust role values sent by the browser.

## 8. Indexes and performance

Start with indexes listed above. Add indexes only after query plans show need. For location search, a simple bounding-box filter plus haversine calculation is acceptable for a small demo. Production nearby queries should use PostGIS geography/GiST indexes. Consider partial indexes for active rides and online captains.

## 9. Decisions requiring approval

- Enable PostGIS or use simple coordinate math for hackathon?
- Are vehicle capacities fixed per type or configured per vehicle?
- Are multiple captain offers sent concurrently or one at a time? If concurrent, add `ride_offers`.
- How long is captain location considered fresh?
- What is the pool passenger limit and detour cap?
- What demo data reset/retention policy is required?
- Are phone numbers verified by Supabase Auth or stored as optional profile data?

**Status:** Proposed schema only. No SQL has been executed and no live Supabase schema has been verified.
