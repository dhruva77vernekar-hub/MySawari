# MySawari — 24-Hour Hackathon Implementation Plan

## 1. Guiding strategy

Build a stable ride-booking path first, then layer demonstrable advanced capabilities on top of the same domain data. Avoid separate services and complex ML. Every advanced feature should have a real backend rule/algorithm, even if its input history or captain population is seeded for the demo.

Suggested team split (adapt to actual skills):
- Backend lead: Express, Supabase, ride lifecycle and transaction safety.
- Frontend lead: React screens, API integration, map and 3D experience.
- Intelligence lead: demand/zone/fairness/pooling algorithms and seeded datasets.
- Integration/test lead: captain/admin demo flows, Postman, testing, presentation.

## 2. Time-boxed plan

| Time | Deliverable | Exit criteria |
|---|---|---|
| Hour 0–1 | Confirm scope, repo, environment, Supabase project, API contract | Everyone agrees on roles, vehicle types, fare assumptions and demo flow |
| Hour 1–3 | Express skeleton, health, env validation, Supabase client, auth middleware | Server starts; health and protected test route work |
| Hour 3–5 | Profiles, vehicle catalog, captain profile/status/location | Rider/captain identity and availability persisted |
| Hour 5–7 | Geocode/route adapter and fare estimate | Estimate returns distance, duration, fare; fallback is explicit |
| Hour 7–10 | Ride create/read/cancel, event history, ownership | Rider can create and see own ride; invalid access rejected |
| Hour 10–12 | Matching and atomic captain acceptance | One captain can accept; duplicate acceptance blocked |
| Hour 12–13 | Realtime status/location | Rider sees assigned captain/status after refresh/reconnect |
| Hour 13–15 | Fairness scoring and allocation history | Candidate ranking includes explainable score breakdown |
| Hour 15–16 | Reassignment on rejection/timeout | Demo rejection causes next eligible candidate to be offered |
| Hour 16–18 | Zone metrics, capped dynamic fare, reposition recommendation | Admin sees demand/supply and bounded multiplier |
| Hour 18–19 | Demand forecast baseline | Seeded history yields zone/time forecast with simulated label |
| Hour 19–21 | Pool matching and greedy insertion | Two compatible demo trips join within capacity/detour rule |
| Hour 21–22 | AI parse fallback/provider if available; SOS/share if time | AI never books without confirmation |
| Hour 22–23 | Integration, failure paths, Postman smoke tests | Full demo flow succeeds twice from clean state |
| Hour 23–24 | Freeze, rehearse, backup demo data and presentation | No risky feature additions; explain limitations honestly |

If time slips, preserve ride create → match → accept → status → completion. Do not sacrifice transaction safety for visual polish.

## 3. Priority implementation

### P0 — Core MVP (must work)
1. Express server and health.
2. Supabase connection and access-token verification.
3. Rider/captain profiles and role checks.
4. Vehicle catalog.
5. Pickup/destination validation and route/fare estimate.
6. Ride creation and event history.
7. Captain online status and location.
8. Candidate filtering and captain acceptance with atomic claim.
9. Ride lifecycle and ownership checks.
10. Authorized Realtime or reliable polling fallback.

### P1 — Mandatory advanced features (all demonstrable)
1. **Predictive demand:** aggregate seeded historical request buckets; weighted moving average; show predicted requests and shortage.
2. **Zone intelligence:** fixed demo polygons; calculate requests/captains; cap multiplier; suggest repositioning.
3. **Pooling:** greedy insertion; capacity/detour checks; per-rider fare share.
4. **Fair allocation:** ETA + workload + fairness + reliability score; persist score breakdown.
5. **Reassignment:** offer expiry/reject event; bounded retries through same matching service; persisted attempt history.

### P2 — Enhancements
- NVIDIA AI booking parser (only if credentials/provider access confirmed).
- Trip sharing and SOS record.
- Ratings.
- Admin user management and analytics polish.
- Advanced Three.js animation and extra UI transitions.

## 4. Practical algorithm choices

### Demand forecast
Use a weighted average of recent same-zone/same-time buckets. Example weights: most recent bucket 0.5, previous 0.3, earlier 0.2. If missing, use recent zone mean or a seeded baseline. Keep `algorithm_version`, `generated_at` and `is_simulated`.

### Zone pricing
Calculate demand/supply ratio, map to a multiplier band, smooth changes and cap at an approved maximum. Use one central fare service so all estimates and final fare calculations follow the same policy. Persist multiplier and reason.

### Pooling
For each open compatible pool, try pickup/drop insertion positions. Reject if capacity exceeded, pickup follows drop, route detour exceeds configured cap or vehicle class differs. Select smallest incremental route distance/time.

### Fair allocation
Normalize ETA, workload, fairness and reliability into 0–100; weighted score: 40% ETA, 20% workload, 25% fairness, 15% reliability. Exclude stale/offline/incompatible captains before scoring. Display score factors, not just a magic number.

### Reassignment
Persist offer expiry; on timeout/reject, atomically mark attempt failed, exclude failed candidate and rerun matching. Retry at most a configured small count. If exhausted, mark no captain available and give rider a clear option.

## 5. Demo data plan

Prepare one isolated demo session with:
- 3–5 zones in Belagavi (team-defined polygons, not assumed official boundaries);
- 10–20 demo captains with bike/scooter/car distribution and varied locations;
- 1–2 weeks of synthetic 30-minute demand buckets;
- several rider requests with two compatible pool routes;
- captains with varied recent workload and response rates;
- one scenario for rejection/timeout to trigger reassignment.

Every generated record should be marked as demo data. Include a reset script only after confirming safe scoping. Do not seed production-like real personal details.

## 6. Demo storyline (5–7 minutes)

1. Rider chooses pickup/destination and bike/scooter/car.
2. Backend calculates route and fare.
3. Rider requests ride; matching ranks eligible captains.
4. First captain rejects or times out; system reassigns automatically.
5. Second captain accepts; rider sees live status/location.
6. Admin opens zone dashboard: forecast demand, shortage and capped dynamic fare.
7. Admin shows reposition recommendation.
8. Two riders demonstrate a pool match with seat capacity, detour and fare split.
9. Show AI parse only if working; otherwise show honest manual fallback.
10. Explain simulated history and what is truly computed live.

## 7. Risks and contingency

| Risk | Contingency |
|---|---|
| Supabase schema/auth setup takes longer | Freeze minimum tables and use local seeded test users only if policy permits; never fake successful auth |
| External routing/geocoding throttled | Cache demo locations and use labeled approximate fallback |
| NVIDIA credentials unavailable | AI feature gracefully disabled; manual booking remains complete |
| Realtime setup fails | Short polling with backoff for demo, clearly documented |
| Concurrent accept race | Prioritize DB atomic function over extra UI |
| Team integration conflict | One backend owner, shared API contract, small PRs and protected main |
| Scope overrun | Drop P2 first; reduce visual polish; keep all five P1 feature demonstrators thin but genuine |
| Demo reset deletes real data | Require demo session ID and restrict reset to `is_demo=true` |

## 8. Final checklist

- [ ] Server runs on port 4000.
- [ ] `.env` excluded; `.env.example` committed.
- [ ] Auth and roles verified.
- [ ] Rider ownership enforced.
- [ ] Fare recalculated server-side.
- [ ] Duplicate ride creation controlled.
- [ ] Two-captain accept race tested.
- [ ] Captain location access scoped.
- [ ] Reassignment bounded and auditable.
- [ ] Demand/zone values labeled live or simulated.
- [ ] Surge cap configured and explained.
- [ ] Pool capacity/detour rules tested.
- [ ] AI provider failure does not block booking.
- [ ] Postman smoke tests pass.
- [ ] Demo accounts/data reset safely.
- [ ] Presentation states limitations honestly.
