# MySawari — Phase 0 Executive Review

**Project:** MySawari — *Har Safar, Apna Safar.*  
**Team:** Polar Geeks  
**Demo city:** Belagavi, Karnataka, India  
**Phase:** 0 — inspection, architecture, system design and documentation  
**Status:** Documentation prepared; implementation not started.

## 1. Executive summary

MySawari is planned as an intelligent ride-booking platform for bikes, scooters and cars. Its frontend includes a 3D vehicle-morphing experience. The backend will support rider/captain roles, fare estimates, ride booking, matching, realtime status, AI booking interpretation and five mandatory advanced hackathon features.

**Recommendation:** use one modular Node.js + Express backend with JavaScript ES Modules, Supabase PostgreSQL/Auth/Realtime, NVIDIA API, OSRM and Nominatim. Keep business rules and privileged writes in Express. Use atomic database operations for captain acceptance, pool capacity and reassignment.

This architecture is feasible for a 24-hour hackathon only if the core ride path is implemented first and advanced algorithms are intentionally lightweight and explainable.

## 2. Existing repository inspection

Public repository inspected: `https://github.com/Shreya-Explorer/MySawari`.

What was visible:
- Public repository named `MySawari`.
- Default branch shown as `main`.
- Root listing showed `README.md` only.
- README contains project title and a short product description.
- Repository page showed one commit at inspection time.

What could not be verified:
- No `backend/` folder or source files were visible in the public root listing.
- No package.json, dependencies, `.env`, Supabase configuration, routes, controllers, tests or Git ignore rules were available to inspect.
- No live Supabase project was inspected.
- No private/local working tree was available in this task.

Therefore, existing implementation status is **not verifiable beyond the public root listing**. Do not infer that the backend is empty on the developer's laptop; re-check the local repository before adding files. The documentation package is designed to be added without overwriting existing source.

## 3. Final architecture recommendation

- One Node.js + Express application, ES Modules.
- Controllers handle HTTP; services own business logic; repositories own persistence queries.
- Supabase Auth for identity, PostgreSQL for data and Realtime for authorized live updates.
- Zod validation at all API boundaries.
- NVIDIA calls only from Express.
- OSRM for routing and Nominatim for geocoding, with caching, throttling and fallbacks.
- No Python server, no microservices and no direct browser access to service-role credentials.

## 4. Recommended folder structure

```text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── integrations/
│   ├── validators/
│   ├── repositories/
│   ├── jobs/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── docs/
│   ├── architecture-proposal.md
│   ├── feature-roadmap.md
│   ├── database-design.md
│   ├── api-contracts.md
│   ├── ai-integration-contract.md
│   ├── frontend-backend-mapping.md
│   ├── security-and-testing-plan.md
│   ├── hackathon-implementation-plan.md
│   └── phase-0-review.md
├── tests/
├── scripts/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

This is a target structure. Create source files during Phase 1 only as implementation requires.

## 5. Dependency recommendations

Core runtime:
- `express`
- `@supabase/supabase-js`
- `zod`
- `helmet`
- `cors`
- `express-rate-limit`
- `dotenv` (or Node-supported environment loading approach)
- `pino` or another structured logger (optional but recommended)

Development/testing:
- `nodemon`
- `vitest` or `jest` (choose one)
- `supertest`
- Postman collection for manual contract checks

Do not install all packages during Phase 0. Confirm supported Node LTS version and package versions at implementation time. Avoid adding a queue, ORM, Redis or geospatial extension unless the selected implementation requires it.

## 6. Database design summary

Core tables:
- `profiles`
- `vehicle_types`
- `captain_profiles`
- `rides`
- `ride_events`
- `ratings`

Advanced/support tables:
- `service_zones`
- `demand_history`
- `demand_forecasts`
- `zone_metrics`
- `captain_allocation_history`
- `reassignment_attempts`
- `ride_pools`
- `ride_pool_members`
- `notifications`
- `trip_share_tokens`
- `sos_events`
- `demo_sessions`
- `audit_logs`

Use UUIDs, UTC timestamps, numeric INR values, constraints, indexes and RLS. Consider PostGIS for production; simple polygon/bounding-box/haversine calculations are acceptable for a small controlled demo. Use atomic database functions/transactions for race-sensitive actions. The schema is proposed only; no SQL was executed.

## 7. API design summary

Client-facing groups:
- health/catalog/location;
- profile;
- fare;
- rider rides;
- captain profile/status/requests/accept/status/location/earnings;
- AI parse;
- pooling;
- scoped trip sharing and SOS;
- admin and zone/demand views.

Keep allocation, offer timeout, automatic reassignment and forecast refresh as internal service operations. Expose admin-only endpoints only where the dashboard needs explicit control. Standardize success/error envelopes and use idempotency keys for mutations.

## 8. Five mandatory advanced features

| Feature | Recommended implementation | Demo input |
|---|---|---|
| Predictive demand forecasting and proactive dispatch | 30-minute zone buckets + weighted moving average + shortage comparison | Synthetic historical demand |
| Zone intelligence, dynamic pricing and repositioning | Fixed demo polygons + demand/supply ratio + smoothed capped multiplier | Seeded captain locations and requests |
| Multi-passenger pooling and route optimization | Greedy pickup/drop insertion with capacity and detour constraints | Two or more compatible trips |
| Intelligent driver allocation and fairness | Candidate filters + 40% ETA, 20% workload, 25% fairness, 15% reliability | Varied captain history |
| Automatic reassignment | Offer expiry/rejection + atomic retry claim + bounded candidate exclusion | Triggered reject/timeout |

These are genuine backend algorithms when implemented, even if some input datasets are simulated. The UI and presentation must label simulated history/captain movement honestly.

## 9. Security concerns

Highest priority:
1. Supabase service-role key and NVIDIA key remain server-only.
2. Verify Supabase access tokens and trusted roles.
3. Enforce rider ownership and captain assignment on every ride operation.
4. Use RLS on all user-facing tables and narrowly scoped Realtime channels.
5. Use atomic conditional updates so two captains cannot accept one ride.
6. Validate all input with Zod and use parameterized DB access.
7. Recalculate fare on server; cap dynamic pricing.
8. Rate-limit AI/geocoding/SOS/share and mutation endpoints.
9. Hash, expire and revoke trip-share tokens.
10. Keep exact location and personal data private; do not overstate SOS capabilities.

## 10. Third-party integration risks

- NVIDIA model ID, endpoint, request schema and quota are not confirmed; treat as configurable and optional.
- Public OSRM/Nominatim services may throttle or be unsuitable for production; cache, identify requests appropriately, limit calls and provide fallback.
- Supabase Realtime access must be tested across separate accounts; a subscription is not automatically private.
- Provider failures must never create duplicate rides or bypass validation.

## 11. Frontend integration requirements

React client uses `VITE_API_URL` only for the public backend base URL. It forwards Supabase access tokens. Backend binds to port 4000; use `0.0.0.0` only for LAN demo access. Frontend receives vehicle metadata, fare estimate, ride state and authorized live updates. Three.js vehicle morphing is presentation-only; backend validates selected vehicle type.

## 12. 24-hour priorities

P0: server, auth, profiles, vehicles, location, fare, ride lifecycle, matching, atomic accept, realtime.

P1: all five mandatory features using simple explainable algorithms and demo-scoped seed data.

P2: AI, SOS/share, ratings, richer admin analytics and visual polish.

Do not sacrifice the core ride flow to add optional features.

## 13. Unresolved questions / approval required

1. Can one account be both rider and captain, or is role fixed?
2. What is the exact passenger capacity for bike, scooter and car?
3. What base fare, per-km rate, per-minute rate and minimum fare should be used?
4. What is the maximum dynamic pricing multiplier? Suggested demo cap should be approved, not assumed.
5. What pool size and maximum detour are acceptable?
6. Are payments explicitly out of scope?
7. Will a real captain UI be built, or will captain acceptance be demonstrated through an admin/captain simulator?
8. Which Belagavi demo zones/polygons will the team use?
9. Is PostGIS enabled/allowed in the Supabase project?
10. What is the desired captain offer timeout and maximum reassignment attempts?
11. What is the policy for location retention and trip-share expiry?

## 14. Files created in this Phase 0 package

Exactly nine Markdown files are included under `backend/docs/`:
1. `architecture-proposal.md`
2. `feature-roadmap.md`
3. `database-design.md`
4. `api-contracts.md`
5. `ai-integration-contract.md`
6. `frontend-backend-mapping.md`
7. `security-and-testing-plan.md`
8. `hackathon-implementation-plan.md`
9. `phase-0-review.md`

No source code, SQL, frontend files, live Supabase settings or Git configuration are changed by this package. No Git push is performed.

## 15. Phase 1 readiness assessment

**Status: Ready for team review — not approved for implementation.**

Architecture and documentation are sufficiently defined to review and approve. Phase 1 should begin only after the team confirms the open product rules above and rechecks the local repository. This package intentionally stops at Phase 0.
