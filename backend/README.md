# MySawari Backend — Integrated Hackathon Build

**Har Safar, Apna Safar.** Node.js + Express API for the MySawari ride-booking platform. Demo city: Belagavi, Karnataka. Currency: INR.

This bundle includes the existing integrated backend plus hardening for server-trusted ride creation, explicit captain offer acceptance, background dispatch/reassignment, per-zone demand calculations, capped surge pricing, and pickup/drop route-stop optimization for pools.

> **Important deployment boundary:** The ZIP contains application code and SQL migrations. It cannot contain or provision your Supabase project, API credentials, NVIDIA account, public routing capacity, or deployed frontend. Until you add your own Supabase values and apply the migrations, cloud-backed endpoints cannot operate. The HTTP server and health endpoint can still start without Supabase.

## Requirements

- Node.js 20 or newer (Node 24 is supported)
- npm
- Supabase project (required for authentication, database and realtime)
- NVIDIA API key/model (optional; AI assistant degrades gracefully when absent)

## Install locally (Windows PowerShell)

From the repository root:

```powershell
cd E:\MySawari\backend
Copy-Item .env.example .env
npm install
npm run check
npm run db:check
npm test
npm run dev
```

The API listens on `http://localhost:4000` by default. The dispatch worker starts in the same Node.js process when `DISPATCH_ENABLED=true` and the service-role key is configured.

Health endpoint:

```text
GET http://localhost:4000/api/health
```

The health response reports whether Supabase, trusted database operations, NVIDIA, and automatic dispatch are configured. A healthy HTTP process does not mean the cloud integrations are ready.

## Supabase setup

1. Create a Supabase project.
2. In Project Settings → API, copy the Project URL and anon/publishable key into `backend/.env`.
3. Copy the service-role key into `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`. This key is server-only and must never be added to frontend `.env` files or committed to Git.
4. In Supabase SQL Editor, apply these files in numerical order:
   - `supabase/migrations/001_phase1_foundation.sql`
   - `supabase/migrations/002_full_platform.sql`
   - `supabase/migrations/003_dispatch_security_forecasting.sql`
   - `supabase/migrations/004_pool_dispatch_and_model_forecasting.sql`
5. Then run `supabase/seed.sql` for the illustrative Belagavi demo zone and explicitly labelled synthetic demand history.
6. Create a test rider and captain through Supabase Auth. The auth trigger creates new accounts as `rider`. A trusted administrator must promote a test captain to `captain` and a trusted admin account to `admin` using the Supabase SQL Editor or another controlled admin process. Never accept role changes from public registration input.
7. Create a captain profile through the captain onboarding API. Verify the captain through the admin endpoint before setting them online.

The seed zone is an approximate rectangular hackathon boundary, not an official Belagavi municipal boundary. Synthetic history is labelled `simulated` and must be described that way in the demo. `POOL_WAIT_SECONDS` controls how long a one-member pool waits before solo fallback.

## Environment variables

See `.env.example`. Important settings:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`: user-scoped Auth/RLS requests.
- `SUPABASE_SERVICE_ROLE_KEY`: trusted server-side ride creation and dispatch worker. Never expose it to React/Vite.
- `DISPATCH_ENABLED`: enables the backend dispatch worker when service-role configuration exists.
- `DISPATCH_INTERVAL_MS`: worker polling interval.
- `CAPTAIN_OFFER_TIMEOUT_SECONDS`: time allowed for a captain to accept an offer.
- `NVIDIA_API_KEY`, `NVIDIA_MODEL`: optional AI assistant.
- `OSRM_BASE_URL`, `NOMINATIM_BASE_URL`: routing and geocoding providers.

Set `NOMINATIM_USER_AGENT` to a real project contact and respect the public Nominatim usage policy. Public OSRM is best-effort and not a production SLA; use a hosted provider or your own routing service for sustained traffic.

## API conventions

Protected routes require:

```http
Authorization: Bearer <Supabase access token>
Content-Type: application/json
```

Responses use a consistent envelope:

```json
{
  "success": true,
  "data": {},
  "meta": { "requestId": "..." }
}
```

## API overview

| Area | Method and path | Access |
|---|---|---|
| Health | `GET /api/health` | Public |
| Profile | `GET /api/profile`, `PATCH /api/profile` | Authenticated |
| Vehicle catalog | `GET /api/vehicle-types` | Authenticated |
| Captain | `GET /api/captains/me`, `POST /api/captains/onboard` | Captain |
| Captain status | `PATCH /api/captains/availability`, `PATCH /api/captains/location` | Captain |
| Geocoding | `GET /api/locations/search?q=...`, `GET /api/locations/reverse?latitude=...&longitude=...` | Authenticated |
| Routing | `POST /api/routing/estimate` | Authenticated |
| Fare | `POST /api/fares/estimate` | Authenticated |
| Nearby captains | `GET /api/captains/nearby?latitude=...&longitude=...` | Authenticated |
| Rides | `POST /api/rides`, `GET /api/rides`, `GET /api/rides/:id` | Authenticated; create requires rider |
| Ride cancellation | `POST /api/rides/:id/cancel` | Rider |
| Captain lifecycle | `POST /api/rides/:id/captain/accept`, `/reject`, `/cancel`, `/arrived`, `/start`, `/complete` | Captain |
| Zones | `GET /api/zones` | Authenticated |
| Zone intelligence | `GET /api/zones/:id/intelligence`, `GET /api/admin/zones/repositioning` | Admin |
| Demand | `GET /api/demand/forecast`, `POST /api/admin/demand/refresh` | Admin |
| Manual dispatch | `POST /api/admin/matching/allocate` | Admin |
| Reassignment | `POST /api/admin/rides/:id/reassign`, `GET /api/rides/:id/reassignment-history` | Admin / ride participant as configured by RLS |
| Pooling | `POST /api/pooling/match`, `POST /api/pooling/create`, `GET /api/pooling/:id` | Authenticated; owner checks in SQL |
| Pool membership | `POST /api/pooling/:id/join`, `POST /api/pooling/:id/leave` | Rider |
| Pool optimization | `POST /api/pooling/:id/optimize` | Pool participant |
| Notifications | `GET /api/notifications`, `PATCH /api/notifications/:id/read` | Authenticated owner |
| AI assistant | `POST /api/assistant/chat` | Authenticated |
| Safety | `POST /api/safety/sos` | Authenticated |
| Trip sharing | `POST /api/trips/share`, `GET /api/trips/shared/:token` | Authenticated / public token |
| Admin | `GET /api/admin/overview`, `GET /api/admin/analytics/dispatch`, `PATCH /api/admin/captains/:id/verification` | Admin |
| Ratings | `POST /api/ratings` | Rider |

## Operational behaviour and limitations

- **Dispatch:** the worker polls open pools and waiting individual rides. A selected captain receives a pending offer while the ride remains `searching`; the captain must explicitly accept. Unaccepted individual and pooled offers expire after `CAPTAIN_OFFER_TIMEOUT_SECONDS` and are reassigned. Pooled offers are assigned to one captain and share a single lifecycle. Three reassignment attempts are allowed before the ride/pool becomes `no_captain_available`.
- **Matching:** weighted, explainable heuristic: proximity/ETA 40%, workload 25%, fairness 25%, captain rating 10%. It is a hackathon heuristic, not a trained ML ranking model.
- **Demand forecasting:** computes demand and supply separately within each active GeoJSON Polygon service zone. It trains a small gradient-boosted regression-stump model on zone-hour history using hour/weekday cycles and lag/rolling-demand features; it reports holdout MAE, sample count, model version and confidence. Insufficient history uses an explicitly labelled same-hour/weekday fallback. Synthetic rows are clearly labelled.
- **Surge/repositioning:** demand/supply multiplier is transparent and capped at 1.5 in SQL; admin repositioning endpoint suggests donor-to-shortage zone moves. Suggestions do not automatically move a captain. Approve pricing policy before any real-money deployment.
- **Pooling:** SQL checks vehicle capacity and pickup/drop proximity. The optimizer enumerates pickup-before-drop sequences for up to four rides, checks detour percentage using Haversine distance, then asks OSRM for the chosen multi-stop route. The dispatch worker offers a multi-member pool to one captain and applies accept/arrive/start/complete transitions to all member rides together. A singleton pool waits for the configured pooling window, then falls back to a normal individual ride. This is a hackathon optimizer; it does not include traffic-aware global optimization or live multi-stop ETA updates.
- **AI:** NVIDIA output is constrained to a JSON schema and never creates a ride. A passenger must confirm in the normal ride-booking flow. Without NVIDIA credentials, a deterministic fallback message is returned.
- **Safety:** SOS creates a database event only. It does not contact emergency services. The UI must not imply that police/ambulance dispatch has occurred.
- **Payments:** no payment gateway or settlement is implemented.
- **Realtime:** migration 003 adds `rides`, `captain_profiles`, `notifications`, and `ride_events` to `supabase_realtime` when that publication exists, enables replica identity, and allows a rider to read the assigned captain's location only during that ride. The frontend must still create authenticated, narrowly filtered subscriptions and test them in the target Supabase project.
- **Geocoding/routing:** public Nominatim and OSRM are shared public services with usage limits. They are not suitable as an unlimited production dependency.

## Security notes

- User requests use the caller's Supabase access token so RLS applies.
- The service-role key is used only in trusted backend code for ride creation and dispatch; never attach it to `req` or return it to clients.
- Ride creation RPC is restricted to `service_role`; the API calculates route and fare server-side after authenticating the rider.
- Captain assignment is atomic at the database layer; the captain explicitly accepts an offer.
- `SECURITY DEFINER` functions in migration 003 have explicit execute grants and fixed search paths.
- The SQL migrations must be tested in a new development Supabase project before any production use. Migration 004 adds atomic shared-pool dispatch and the trained forecast metadata column.

## Verification

Run:

```powershell
npm run verify
npm audit
```

Syntax and unit tests can run locally after dependencies are installed. Supabase SQL execution, RLS behaviour, Auth, provider connectivity, dispatch timing and end-to-end frontend flows still require credentials and live integration testing. Do not describe those as verified until they have been tested in your project.
