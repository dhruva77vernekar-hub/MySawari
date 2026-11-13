# MySawari — Feature Roadmap

## 1. Scope and status language

This is a plan, not an implementation report. Every feature below is **planned**. A future demo may use seeded/simulated input data, but the API logic and state transitions should be real and testable. Never label a simulated forecast as a live-trained ML prediction.

Priority:
- **P0 — Core MVP:** required for a reliable end-to-end ride.
- **P1 — Mandatory advanced:** all five PS02 capabilities must have demonstrable backend behavior.
- **P2 — Enhancements:** implement only after P0 and P1 are stable.

## 2. Core modules

| Module | Purpose / services | Main data | Priority | Frontend integration |
|---|---|---|---|---|
| Authentication | Supabase token verification, role checks, profile provisioning | `profiles`, `auth.users` | P0 | Login, registration, protected route state |
| Rider/profile | Read/update own profile, contact preferences | `profiles` | P0 | Profile screen |
| Captain | Captain details, online state, vehicle and current location | `captain_profiles`, `vehicle_types` | P0 | Captain dashboard |
| Vehicle | Catalog, seat/capacity and supported vehicle validation | `vehicle_types` | P0 | Vehicle selector |
| Location/routing | Search/reverse geocode, route distance/ETA, nearby captain query | `captain_profiles`, `service_zones` | P0 | Map and search UI |
| Fare | Server-side estimate and final fare snapshot | `rides`, `vehicle_types`, `zone_metrics` | P0 | Fare card/checkout |
| Ride | Create, read, cancel, accept, status lifecycle and event history | `rides`, `ride_events` | P0 | Booking and active trip |
| Matching | Filter and rank eligible captains | captain state, allocation history | P0/P1 | Waiting/matching screen |
| Realtime | Authorized ride/captain event delivery | Realtime publication/channel policy | P0 | Live ride status/map |
| Ratings | One rating per completed ride per eligible rider | `ratings` | P2 | Post-ride feedback |
| Trip sharing/SOS | Scoped public share token and SOS event record | `trip_share_tokens`, `sos_events` | P2 | Share trip and safety screen |
| Admin | Aggregated operations and demo controls | relevant tables | P1 | Admin dashboard |

## 3. Five mandatory advanced features

### Feature 1 — Predictive demand forecasting and proactive dispatch

**Problem solved:** Captains may cluster in low-demand areas while demand rises elsewhere. Forecasting helps operations anticipate supply shortages.

**Workflow**
1. Record ride request events with timestamp and zone.
2. Aggregate counts by zone and time bucket (recommended: 30-minute buckets).
3. Generate next-window estimates using a transparent baseline: weighted moving average of recent same-zone/same-time buckets, with a minimum-data fallback to recent average.
4. Compare predicted demand to online eligible captains.
5. Mark zones as normal, elevated or shortage using configurable thresholds.
6. Generate repositioning recommendations for admin/captain dashboard.
7. Store forecast, algorithm version, input window and generated timestamp.

**Algorithm:** start with seasonal-naive/weighted moving average; no training pipeline is required. Use seeded historical demand for demo, clearly labeled `simulated`. Evaluate MAE on held-out synthetic buckets if time allows.

**Data:** `demand_history`, `demand_forecasts`, `service_zones`, `zone_metrics`, ride timestamps and captain availability.

**APIs:** `GET /api/demand/forecast`, `GET /api/demand/zones`, `GET /api/demand/history`; admin-only refresh can be internal or `POST /api/admin/demand/refresh`.

**Frontend demo:** zone heatmap/cards show forecast requests, online captains, shortage level and recommended action.

**Fallback:** insufficient history → zone/time baseline or static demo seed; display confidence/data coverage. Never fabricate precision.

### Feature 2 — Zone intelligence, dynamic pricing and repositioning

**Problem solved:** demand/supply imbalance can create longer ETAs. Zone-level signals help balance availability and pricing.

**Workflow**
1. Define service zones as fixed GeoJSON polygons for Belagavi demo.
2. Assign pickup and captain coordinates to zones using point-in-polygon.
3. Aggregate recent requests and eligible online captains.
4. Compute demand-supply ratio and intensity.
5. Apply pricing policy with configured minimum/maximum multiplier and smoothing.
6. Save metric snapshot and reason; generate captain reposition suggestions.
7. Fare service reads active zone policy and calculates price server-side.

**Algorithm:** `ratio = demand / max(supply, 1)`. Map ratio bands to a capped multiplier; smooth with prior multiplier to avoid abrupt swings. A sample demo policy could cap at 1.5x, but the final cap and base rates require team approval. Apply a floor of 1.0x unless an approved discount exists.

**Data:** `service_zones`, `zone_metrics`, `demand_history`, `demand_forecasts`, captain locations, fare config.

**APIs:** `GET /api/zones`, `GET /api/zones/:id`, `GET /api/zones/:id/intelligence`, `GET /api/zones/repositioning-recommendations`.

**Frontend demo:** colored zone tiles, multiplier, demand/supply and reposition suggestion. Explain why a multiplier was applied.

**Safety:** backend calculates price; cap surge; persist fare snapshot and pricing reason; no discriminatory personal pricing.

### Feature 3 — Multi-passenger ride pooling and route optimization

**Problem solved:** passengers with compatible routes can share vehicle capacity and reduce per-person fare.

**Workflow**
1. Rider opts into pooling and submits pickup/drop coordinates and passenger count.
2. Search open pools with same vehicle class, available seats and compatible direction.
3. Evaluate inserting pickup and drop into existing stop sequence.
4. Query OSRM for candidate route legs where available; calculate detour against solo route.
5. Reject candidate if capacity or detour threshold is exceeded.
6. Lock pool row/seat capacity transactionally; create membership and ordered stops.
7. Recalculate individual shares using a deterministic allocation formula.
8. On cancellation, recompute route, seats and fare shares or dissolve pool if constraints fail.

**Algorithm:** greedy insertion is sufficient for a hackathon: evaluate valid pickup/drop insertion positions, select the lowest incremental route cost subject to precedence, capacity and detour constraints. Do not claim globally optimal VRP.

**Data:** `ride_pools`, `ride_pool_members`, `rides`, route snapshots, `vehicle_types`.

**APIs:** `POST /api/pooling/match`, `POST /api/pooling/create`, `GET /api/pooling/:id`, `POST /api/pooling/:id/join`, `POST /api/pooling/:id/leave`.

**Frontend demo:** show matched riders, seat count, stop order, estimated detour and per-rider fare. Use two or three seeded trips if live concurrent users are unavailable.

**Fallback:** if OSRM fails, use haversine estimate for candidate rejection only and mark route estimate approximate; do not claim road-accurate ETA.

### Feature 4 — Intelligent driver allocation and fairness scoring

**Problem solved:** nearest-only allocation can overload the same captains and repeatedly disadvantage others.

**Workflow**
1. Filter online, active, compatible captains within configured radius.
2. Exclude captains already assigned, suspended, stale-location or ineligible.
3. Calculate ETA/distance, workload, recent allocations and response reliability.
4. Normalize factors and rank eligible captains.
5. Create one pending offer with an expiry; write candidate/score explanation to allocation history.
6. On accept, perform atomic ride claim; only one captain can win.
7. Update fairness counters after assignment/completion according to policy.

**Explainable score (higher is better):**
- ETA score: 40% — closer/faster pickup receives higher score.
- Availability/workload score: 20% — lower active workload receives higher score.
- Fairness score: 25% — fewer recent assignments relative to peers receives higher score.
- Reliability score: 15% — recent response/acceptance reliability, with neutral default for new captains.

Each component is normalized to 0–100; weighted sum is 0–100. These are starting weights, not validated optimal weights. Keep ETA dominant so fairness does not create unreasonable pickup delays. Do not use protected/sensitive attributes.

**Data:** `captain_profiles`, `rides`, `captain_allocation_history`, `reassignment_attempts`.

**API:** public read-only `GET /api/matching/nearby` may be restricted to authorized captain/admin contexts. `POST /api/matching/allocate` should be internal/admin-triggered, not open to riders.

**Frontend demo:** show selected captain and a compact “why matched” explanation; admin can inspect candidate ranking.

### Feature 5 — Automatic driver reassignment and exception handling

**Problem solved:** a ride should recover when a captain rejects, cancels or fails to respond.

**Workflow**
1. Matching creates an offer with `expires_at`.
2. Captain accepts/rejects before expiry.
3. If rejected, cancelled pre-pickup, or timed out, transaction marks the offer failed and records a reason.
4. Reassignment service locks the ride, confirms it remains `requested`/eligible, excludes recently failed candidates, and calls the same matching engine.
5. New offer is created with incremented attempt number.
6. After configured maximum attempts, mark ride `no_captain_available` (or keep a distinct matching state) and notify rider.
7. Record all attempts and expose history to admin.

**Retry policy:** small bounded number (e.g. 3) of offers, short configurable timeout, exponential backoff only for transient provider/system errors. Do not retry indefinitely. Idempotency key and row lock prevent duplicate concurrent reassignments.

**Data:** `rides`, `ride_events`, `captain_allocation_history`, `reassignment_attempts`.

**API:** `POST /api/rides/:id/reassign` should be internal/admin-only; `GET /api/rides/:id/reassignment-history` rider-visible only for their own ride or admin.

**Frontend demo:** simulate rejection/timeout and show attempt 1 → attempt 2 → new captain, with reason and timestamp.

## 4. Dependencies and implementation order

```text
Auth + profiles + vehicle catalog
          |
Location + captain online/location
          |
Fare estimate + ride creation
          |
Atomic matching + accept + ride lifecycle
          |
Realtime + event history
          |
Fairness allocation ---- Reassignment
          |
Zones + demand aggregation + pricing
          |
Pooling + route insertion
          |
AI assistant + SOS/share + analytics polish
```

Recommended order:
1. Server health, environment validation, Supabase connection.
2. Auth middleware and profiles/roles.
3. Vehicle catalog, captain availability and location.
4. Geocoding/routing adapter and fare estimate.
5. Ride create/read/cancel with events.
6. Matching and atomic acceptance.
7. Realtime and complete rider/captain demo.
8. Fairness score and assignment history.
9. Timeout/rejection reassignment.
10. Zone metrics and capped dynamic pricing.
11. Forecast baseline and proactive recommendations.
12. Pool matching and greedy route insertion.
13. AI assistant, trip share, SOS, ratings, admin polish.

## 5. Demo truthfulness matrix

| Capability | What should be real | What may be simulated |
|---|---|---|
| Ride booking | API, validation, persistence, state transitions | Demo rider/captain accounts |
| Captain matching | Eligibility, score, atomic claim | Seeded captain locations |
| Forecasting | Aggregation and forecast algorithm | Historical demand input |
| Zone intelligence | Polygon lookup, supply/demand ratio, capped pricing | Predefined demo polygons |
| Pooling | Capacity, compatibility, membership, stop ordering | Seeded compatible trip requests |
| Reassignment | Timeout/reject handling and persisted attempt history | Triggered rejection/timeout event |
| AI | Schema validation and safe confirmation flow | Fallback parser if provider unavailable |
| Live tracking | Authorized event flow | Simulated moving captain marker only if clearly labeled |

## 6. Module-level delivery criteria

A module is complete only when it has:
- validated request contract;
- authenticated/authorized access;
- service-level business logic;
- database constraints and indexes;
- consistent errors;
- at least one success and relevant failure test;
- frontend integration example;
- explicit simulated-data label where applicable.

## 7. Out of scope for the 24-hour build

Real payment settlement, production-grade dispatch optimization, ML training infrastructure, multi-city operations, driver background checks, tax invoices, enterprise observability and production SLA guarantees should be explicitly deferred unless the problem statement requires them.


## v3 implementation note

The PS02 backend now includes a lightweight gradient-boosted regression-stump model for zone/hour demand forecasting with holdout MAE metadata, plus coordinated one-captain dispatch for multi-member pools. These are hackathon-grade implementations and still require live Supabase integration tests and evaluation on the selected demo data.


## PS02 evaluation metrics

The administrator endpoint `GET /api/admin/analytics/dispatch` exposes measured rolling-seven-day indicators: request-to-accept waiting time, accepted captain pickup ETA, ride completion/cancellation/failure rates, online-captain utilization, and captain offer distribution. Report sample sizes and do not compare a small demo sample as if it were a statistically robust benchmark.
