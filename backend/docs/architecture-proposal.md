# MySawari — Backend Architecture Proposal

**Phase:** 0 — Architecture and documentation only  
**Product:** MySawari · *Har Safar, Apna Safar.*  
**Team:** Polar Geeks  
**Hackathon:** 24 hours  
**Demo geography:** Belagavi, Karnataka, India  
**Currency:** INR  
**Repository:** https://github.com/Shreya-Explorer/MySawari

## 1. Executive architecture decision

Build one modular monolith using **Node.js + Express + JavaScript ES Modules**. Use Supabase for PostgreSQL, Auth and authorized Realtime. Keep business rules, privileged writes, allocation, pricing, pooling and AI orchestration in Express. The React client calls REST APIs; it may subscribe directly to narrowly scoped Supabase Realtime channels only where RLS and channel authorization make that safe.

This is deliberately not a microservice architecture. A single deployable backend is easier to develop, test and explain in a 24-hour hackathon. Modules are separated by responsibility so they can be extracted later if real scale justifies it.

### High-level system

```text
React + Vite + Tailwind + Three.js
  | HTTPS REST (Supabase access token)
  | Authorized Realtime subscriptions (limited)
  v
Node.js + Express (PORT 4000)
  ├── Middleware: auth, roles, validation, rate limits, errors
  ├── Controllers: HTTP translation only
  ├── Services: domain rules and orchestration
  ├── Repositories/data access: Supabase queries
  ├── Integrations: NVIDIA, OSRM, Nominatim
  └── Internal jobs: assignment timeout/retry, forecast refresh
         |
         +---- Supabase Auth
         +---- Supabase PostgreSQL + RLS + Realtime
         +---- NVIDIA API (server-side only)
         +---- OSRM routing
         +---- Nominatim geocoding
```

## 2. Technology decisions

| Concern | Decision | Reason / constraint |
|---|---|---|
| Runtime / API | Node.js, Express.js | One familiar server for all backend capabilities |
| Language | JavaScript, ES Modules | Matches requested stack; use `"type": "module"` |
| Database | Supabase PostgreSQL | Relational integrity, transactions through DB functions/RPC, indexes |
| Identity | Supabase Auth | Password/session lifecycle managed by provider |
| Live updates | Supabase Realtime | Ride and captain status changes with RLS/channel authorization |
| Validation | Zod | Validate params, query and body at API boundary |
| AI | NVIDIA API | Server-side booking-intent interpretation only |
| Routing | OSRM | Route distance/duration; public demo endpoint is not an SLA |
| Geocoding | Nominatim | Search and reverse geocoding; obey public service policy |
| Testing | Postman + automated tests | Contract and lifecycle verification |
| Frontend | React, Vite, Tailwind, Three.js | Separate frontend ownership; 3D animation remains client-side |

### Non-negotiable boundaries

1. One Express application; no Python/FastAPI service.
2. No secret keys in Vite variables or browser bundles.
3. Supabase service-role key is backend-only and bypasses RLS; use it only in trusted server code after explicit authorization checks.
4. Prefer a restricted server-side Supabase client for normal requests where feasible; never treat the service-role client as a substitute for authorization.
5. Frontend-supplied fare, role, captain score, zone multiplier, ride status and ownership are untrusted.
6. Use a database transaction/RPC for race-sensitive operations. Multiple independent HTTP requests are not a transaction.
7. Do not expose internal reassignment/dispatch operations as unrestricted public endpoints.

## 3. Recommended backend structure

```text
backend/
├── src/
│   ├── config/
│   │   ├── env.js
│   │   └── supabase.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── profile.controller.js
│   │   ├── ride.controller.js
│   │   ├── captain.controller.js
│   │   ├── fare.controller.js
│   │   ├── location.controller.js
│   │   ├── matching.controller.js
│   │   ├── demand.controller.js
│   │   ├── zone.controller.js
│   │   ├── pooling.controller.js
│   │   ├── ai.controller.js
│   │   ├── sharing.controller.js
│   │   └── admin.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── rateLimit.middleware.js
│   │   ├── requestId.middleware.js
│   │   └── error.middleware.js
│   ├── routes/
│   │   ├── index.routes.js
│   │   └── [domain].routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── profile.service.js
│   │   ├── ride.service.js
│   │   ├── captain.service.js
│   │   ├── fare.service.js
│   │   ├── location.service.js
│   │   ├── matching.service.js
│   │   ├── fairness.service.js
│   │   ├── reassignment.service.js
│   │   ├── demand.service.js
│   │   ├── zone.service.js
│   │   ├── pooling.service.js
│   │   ├── ai-assistant.service.js
│   │   ├── sharing.service.js
│   │   └── admin.service.js
│   ├── integrations/
│   │   ├── nvidia.client.js
│   │   ├── osrm.client.js
│   │   └── nominatim.client.js
│   ├── validators/
│   │   └── [domain].schema.js
│   ├── repositories/
│   │   └── [domain].repository.js
│   ├── jobs/
│   │   ├── assignment-timeout.job.js
│   │   └── demand-forecast.job.js
│   ├── utils/
│   │   ├── api-response.js
│   │   ├── app-error.js
│   │   └── distance.js
│   ├── app.js
│   └── server.js
├── docs/                         # exactly nine Phase 0 documents
├── tests/
├── scripts/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

This is a target structure, not a claim that these source files already exist. Create only the folders/files needed as implementation begins; avoid empty boilerplate for every possible module.

### Layer responsibilities

- **Routes:** declare URL, middleware and controller.
- **Controllers:** read validated inputs, call one service, return an HTTP response.
- **Services:** implement business rules and coordinate transactions/integrations.
- **Repositories:** isolate Supabase queries and map persistence details.
- **Validators:** define Zod schemas and reject invalid data before business logic.
- **Integrations:** encapsulate external HTTP clients, timeouts and provider-specific responses.
- **Jobs:** run bounded background work such as assignment expiry and forecast refresh. For a hackathon, a single-process job loop is acceptable only for a demo; production requires a durable queue/worker or database-scheduled mechanism.
- **Middleware:** authentication, role authorization, request IDs, rate limiting and consistent errors.

## 4. Module map and dependencies

| Module | Owns | Depends on |
|---|---|---|
| Authentication/profile | identity mapping, profile and roles | Supabase Auth, profiles |
| Vehicle | vehicle catalog and captain vehicle eligibility | vehicle_types, captain_profiles |
| Location/routing | geocode, route, ETA, nearby search | Nominatim, OSRM, captain location |
| Fare | estimate and final fare | route distance/time, vehicle, zone policy |
| Ride | lifecycle, ownership, ride events | profile, vehicle, fare, matching |
| Captain | availability, location, earnings | Auth, rides, captain profile |
| Matching/fairness | candidate eligibility and ranked selection | location, vehicle, workload, allocation history |
| Reassignment | timeout/reject/cancel recovery | ride, matching, allocation history |
| Demand/zone | forecasts, supply-demand metrics, pricing recommendations | ride history, captain availability, service zones |
| Pooling | compatible passenger groups and stop order | ride, route, vehicle capacity, fare |
| AI assistant | natural-language intent parsing | NVIDIA integration, location lookup |
| Safety/engagement | sharing, SOS, rating | ride, profile |
| Admin/demo | aggregate views and controlled simulation | all relevant read models |

## 5. Main data flows

### Booking
1. Client obtains Supabase Auth access token.
2. Client requests geocoding/route and fare estimate.
3. Client posts a ride request with pickup/destination coordinates, vehicle type and optional pool preference.
4. Express validates identity, coordinates, service coverage and fare inputs.
5. Fare is recalculated server-side; client estimate is informational only.
6. Ride and initial event are persisted atomically.
7. Matching service filters eligible captains and ranks candidates.
8. A bounded offer is created; captain accepts through a conditional atomic operation.
9. Ride status changes and event are committed; authorized clients receive updates.

### Live tracking
Captain app sends throttled location updates to Express. Server validates that the authenticated captain is online and is assigned to the active ride, stores the latest position, and publishes only the minimum data needed to authorized subscribers. Do not expose all captains' exact locations to every rider.

### Advanced intelligence
Ride events and captain availability feed zone metrics and demand history. Forecasts produce zone-level demand estimates. Zone policy may adjust a bounded multiplier and generate repositioning suggestions. Allocation uses current supply, ETA, workload and fairness history. Reassignment invokes the same eligibility/ranking pipeline after an offer expires or fails.

## 6. API and response conventions

All API paths are versionable; use `/api` for the hackathon and consider `/api/v1` before public launch.

Success:
```json
{
  "success": true,
  "data": {},
  "meta": { "requestId": "server-generated-id" }
}
```

Error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be processed.",
    "details": []
  },
  "meta": { "requestId": "server-generated-id" }
}
```

Use correct HTTP status codes. Never return stack traces, SQL text, secrets or provider credentials.

## 7. Integration boundaries

- **Supabase:** identity, relational persistence, RLS and selected Realtime events.
- **NVIDIA:** parse booking language into a constrained schema; never let model output directly create a ride or set a fare.
- **OSRM:** calculate route distance/duration; validate returned coordinates and cache short-lived route results.
- **Nominatim:** geocode/reverse geocode with a descriptive User-Agent, caching, throttling and policy-compliant use.

External calls need timeouts, bounded retries, provider error normalization and fallback behavior. Do not retry non-idempotent operations blindly.

## 8. Operational and architectural risks

| Risk | Mitigation |
|---|---|
| Public OSRM/Nominatim service limits | Cache, throttle, show provider unavailable state; use configured provider for production |
| Service-role bypasses RLS | Keep key server-only; authorize every operation; minimize use |
| Concurrent captain accepts | Atomic DB function/transaction with conditional status update |
| In-memory timers lost on restart | Demo-only limitation; durable worker/queue before production |
| AI hallucination | Structured schema, server validation, user confirmation |
| Location privacy | Minimize precision, limit access, retention policy, authorized channels |
| Dynamic pricing abuse | Server-side cap/floor, transparent multiplier and audit record |
| Demo data mixing with real users | `is_demo`/session scoping and explicit demo cleanup |
| Scope too large for 24 hours | Core ride flow first; thin but real demonstrators for each required advanced feature |

## 9. Phase 0 decisions and open questions

**Recommended now:** adopt the modular monolith, Supabase Auth/Postgres, server-side privileged writes, bounded algorithms and demo-scoped data.

**Approval needed before Phase 1:**
1. Confirm exact rider/captain/admin role model and whether one account can switch roles.
2. Confirm vehicle capacity rules and whether bike/scooter allow only one rider.
3. Confirm pool maximum size and acceptable detour threshold.
4. Confirm base fare, per-km/per-minute rates, minimum fare and surge cap for Belagavi demo.
5. Confirm whether payment is out of scope (recommended for 24-hour MVP).
6. Confirm whether captain app is part of the demo or captain actions are simulated in a dashboard.
7. Confirm zone boundary method (fixed demo polygons recommended initially).
8. Confirm data retention and location precision policy.

## 10. Phase 1 readiness

**Architecture is ready for implementation planning, not yet implementation approval.** The public repository inspection available for this Phase 0 package showed only a root README; no backend source tree was visible to inspect. Re-check the local working tree before creating files in the actual repository. No database or code changes are made by this document.
