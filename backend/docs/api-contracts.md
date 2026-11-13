# MySawari — API Contracts (Phase 0)

## 1. Conventions

Base URL: `http://localhost:4000` during local development. Use HTTPS in deployment. All endpoints are under `/api`. JSON request/response. Bearer token: `Authorization: Bearer <Supabase access token>`.

Success envelope:
```json
{"success":true,"data":{},"meta":{"requestId":"req-id"}}
```
Error envelope:
```json
{"success":false,"error":{"code":"FORBIDDEN","message":"You cannot perform this action.","details":[]},"meta":{"requestId":"req-id"}}
```

Common status codes: `200` read/update, `201` created, `202` accepted for async processing, `204` no content only where envelope is not needed, `400` malformed request, `401` missing/invalid token, `403` role/ownership failure, `404` missing or deliberately concealed resource, `409` state/concurrency conflict, `422` valid JSON but invalid domain input, `429` rate limited, `502/503` provider unavailable, `500` unexpected server error.

All request bodies require Zod schemas. IDs are UUIDs. Coordinates: latitude `[-90,90]`, longitude `[-180,180]`; Belagavi service-boundary validation is separate. INR amounts are server-calculated decimals. Never accept client-provided `role`, `captain_id`, `surge_multiplier`, `final_fare`, score or status as authoritative.

## 2. General and catalog APIs

| Method / path | Auth / role | Purpose and contract | Success | Errors / validation / DB / screen |
|---|---|---|---|---|
| `GET /api/health` | Public | Liveness and dependency status; do not reveal secrets | `{status:"ok",version}` | `503` if critical dependency unavailable; no DB mutation; developer health |
| `GET /api/vehicle-types` | Public | Active vehicle catalog | `{items:[{id,code,name,capacity}]}` | DB read; client vehicle selector |
| `GET /api/geocode?q=` | Authenticated | Search place; `q` 2–160 chars, limit bounded | `{items:[{label,lat,lng,providerId}]}` | `422` empty/too long, `429`, `503`; Nominatim/cache; pickup/destination search |
| `GET /api/reverse-geocode?lat=&lng=` | Authenticated | Resolve coordinate to label | `{label,lat,lng}` | coordinate validation, provider failure; map pin confirmation |

## 3. Profile and fare

| Method / path | Auth / role | Request | Success | Rules / errors / DB / screen |
|---|---|---|---|---|
| `GET /api/profile` | Rider/captain/admin | None | `{profile:{id,name,role,phone,avatarUrl}}` | Own profile; 401/404; profiles read; profile screen |
| `PATCH /api/profile` | Rider/captain | `{fullName?,phone?,avatarUrl?}` | `{profile:{...}}` | Allowlist fields; never change role/suspension; phone format; update own profile; 422/409; profile edit |
| `POST /api/fare/estimate` | Rider | `{pickup:{lat,lng},destination:{lat,lng},vehicleTypeId,poolRequested?}` | `{distanceMeters,durationSeconds,estimatedFare,currency:"INR",pricing:{multiplier,reason}}` | Server calls OSRM and fare policy; 422 out of zone, 503 route fallback; no ride write; fare card |

## 4. Rider ride APIs

| Method / path | Auth / role | Request/query | Success | Rules / errors / DB / screen |
|---|---|---|---|---|
| `POST /api/rides` | Rider | `{pickup:{label,lat,lng},destination:{label,lat,lng},vehicleTypeId,poolOptIn?,passengerCount?,clientRequestId}` | `201 {ride:{id,status:"requested",estimatedFare,...}}` | Idempotency key; server recalculates route/fare; create ride + event atomically; 409 duplicate/state, 422; booking confirmation |
| `GET /api/rides` | Rider | `?status=&cursor=&limit=` | `{items:[ride summary],nextCursor}` | Own rides only; limit 1–50; DB read; history |
| `GET /api/rides/:id` | Rider/captain/admin | None | `{ride:{...},events:[...]}` | Participant/admin ownership check; 404 conceal unauthorized; details/active trip |
| `PATCH /api/rides/:id/cancel` | Rider | `{reason,clientRequestId}` | `{ride:{id,status:"cancelled"}}` | Only allowed before configured cutoff; atomic status transition + event; 409 if already started/completed; active trip |
| `POST /api/rides/:id/rating` | Rider | `{score:1..5,comment?}` | `{rating:{id,score}}` | Own completed ride; one rating; unique constraint; 409 duplicate; feedback |
| `POST /api/rides/:id/sos` | Rider/captain participant | `{latitude,longitude,description?}` | `201 {sosEvent:{id,status:"recorded"}}` | Active ride participant; rate limit; records alert only unless real response workflow is established; safety screen |

## 5. Captain APIs

| Method / path | Auth / role | Request/query | Success | Rules / errors / DB / screen |
|---|---|---|---|---|
| `POST /api/captain/profile` | Captain | `{vehicleTypeId,vehicleRegistration?}` | `{captainProfile:{...}}` | Create/update own captain profile; validate vehicle; 409 duplicate registration; captain onboarding |
| `PATCH /api/captain/status` | Captain | `{status:"online"|"offline"}` | `{status,updatedAt}` | Cannot go offline during active ride without exception flow; update own profile; 409; captain home |
| `GET /api/captain/requests` | Captain | `?cursor=&limit=` | `{items:[offer summary]}` | Only offers addressed to captain; never all nearby requests; captain request list |
| `POST /api/rides/:id/accept` | Captain | `{offerId,clientRequestId}` | `{ride:{id,status:"accepted",captainId}}` | Atomic claim; eligible captain and unexpired offer; one winner; 409 if already claimed; captain request |
| `PATCH /api/rides/:id/status` | Assigned captain | `{status:"arriving"|"in_progress"|"completed",clientRequestId}` | `{ride:{id,status}}` | Valid transition only; assigned captain; completion locks fare snapshot; event write; active trip |
| `POST /api/rides/:id/location` | Assigned captain | `{latitude,longitude,accuracyMeters?,recordedAt?}` | `{accepted:true,recordedAt}` | Assigned active captain only; throttle and freshness checks; update location; publish authorized realtime; map |
| `GET /api/captain/earnings` | Captain | `?from=&to=` | `{total,completedRides,currency:"INR",items:[]}` | Own completed rides only; no payout claim unless payment exists; earnings screen |

## 6. Matching and dispatch

| Method / path | Auth / role | Request/query | Success | Contract decision |
|---|---|---|---|---|
| `GET /api/matching/nearby` | Admin; optionally captain for own diagnostics | `?lat=&lng=&vehicleTypeId=&radiusMeters=` | `{candidates:[{captainId,etaSeconds,distanceMeters}]}` | Do not expose all captain identities/locations to riders. Usually internal service, not a public rider API. |
| `POST /api/matching/allocate` | Admin/dispatch service only | `{rideId}` | `{assignment:{captainId,offerId,expiresAt,scoreBreakdown}}` | Prefer internal service invocation; if exposed for demo, admin-only and audited. |
| `GET /api/matching/:rideId/status` | Ride participant/admin | None | `{status,attempts:[...]}` | Ownership check; limited details; ride waiting screen |

## 7. Demand and zone intelligence

| Method / path | Auth / role | Query | Success | Notes |
|---|---|---|---|---|
| `GET /api/demand/forecast` | Admin | `?zoneId=&from=&to=` | `{items:[{zoneId,forecastFor,predictedRequests,availableCaptains,shortageLevel,isSimulated}]}` | Forecast history read; date range bounded |
| `GET /api/demand/zones` | Admin | `?at=` | `{items:[{zoneId,demand,supply,intensity}]}` | Aggregate view |
| `GET /api/demand/history` | Admin | `?zoneId=&from=&to=&bucketMinutes=` | `{items:[{bucketStart,requestCount,source}]}` | Label simulated vs live |
| `GET /api/zones` | Authenticated; public coarse view optional | None | `{items:[{id,name,bounds?}]}` | Do not expose operational sensitive metrics to riders |
| `GET /api/zones/:id` | Authenticated | None | `{zone:{id,name,bounds}}` | Active zone only |
| `GET /api/zones/:id/intelligence` | Admin | None | `{zone:{demand,supply,ratio,intensity,multiplier,reason}}` | Admin-only |
| `GET /api/zones/repositioning-recommendations` | Admin/captain own recommendation | `?zoneId=` | `{items:[{captainId?,fromZone,toZone,reason}]}` | Captains receive only own suggestion; admin sees operational list |

Forecast refresh, zone recomputation and price-policy updates are internal jobs/admin operations. Do not expose arbitrary model execution to anonymous clients.

## 8. Pooling APIs

| Method / path | Auth / role | Request | Success | Validation / DB / screen |
|---|---|---|---|---|
| `POST /api/pooling/match` | Rider | `{pickup,destination,vehicleTypeId,passengerCount}` | `{matches:[{poolId,detourSeconds,seatsAvailable,estimatedFareShare}]}` | Compatibility and detour checks; read-only candidate search; 422 invalid count |
| `POST /api/pooling/create` | Rider | `{rideId,maxDetourPercent?}` | `{pool:{id,status,capacity}}` | Ride must be pool eligible; create pool transactionally |
| `GET /api/pooling/:id` | Pool member/assigned captain/admin | None | `{pool:{...},members:[...],routeOrder:[...]}` | No unrelated passenger PII |
| `POST /api/pooling/:id/join` | Rider | `{rideId,passengerCount,clientRequestId}` | `{membership:{id,fareShare},pool:{...}}` | Atomic seat reservation; no over-capacity |
| `POST /api/pooling/:id/leave` | Pool member | `{reason}` | `{pool:{...},membershipStatus:"left"}` | Recompute route/fare; reject if trip state disallows leaving |

## 9. Reassignment APIs

| Method / path | Auth / role | Request | Success | Decision |
|---|---|---|---|---|
| `POST /api/rides/:id/reassign` | Admin/dispatch service only | `{reason}` | `{rideId,attempt,status}` | Internal service operation preferred; admin override must be audited |
| `GET /api/rides/:id/reassignment-history` | Ride owner/admin | None | `{items:[{attempt,trigger,result,createdAt}]}` | Hide other riders/captain sensitive data |

Automatic timeout and rejection handling should call `reassignment.service` internally. Do not rely on a browser to trigger retry.

## 10. AI booking assistant

`POST /api/ai/parse-booking` — authenticated rider.

Request:
```json
{"message":"Book a scooter from KLE Tech to CBT Belagavi"}
```
Success:
```json
{
  "intent":"book_ride",
  "pickup":{"text":"KLE Tech","resolved":false},
  "destination":{"text":"CBT Belagavi","resolved":false},
  "vehiclePreference":"scooter",
  "missingFields":[],
  "needsConfirmation":true
}
```
Validation: message 1–1000 characters; output must match schema; location strings are suggestions, not coordinates; user must confirm before booking. Errors: `422` empty/unsafe content, `503` provider unavailable with safe fallback. No database write.

## 11. Trip sharing

`GET /api/share/:token` — public, rate-limited, token-scoped. Returns only sanitized share data: `{rideStatus,pickupArea,destinationArea,captainFirstName,updatedAt}` as approved. Token must be high entropy, stored hashed, expiry checked and revocable. Never return phone, email, full profile or full location history. Invalid/expired token returns `404`.

## 12. Admin APIs

| Method / path | Auth / role | Request | Success | Notes |
|---|---|---|---|---|
| `GET /api/admin/stats` | Admin | `?from=&to=` | `{users,riders,captains,totalRides,completed,cancelled,revenue,demand}` | Aggregates; revenue only completed rides and explicitly not payment settlement |
| `GET /api/admin/rides` | Admin | `?status=&zoneId=&cursor=` | `{items,nextCursor}` | Paginated and audited |
| `GET /api/admin/users` | Admin | `?role=&status=&cursor=` | `{items,nextCursor}` | Minimize PII |
| `PATCH /api/admin/users/:id/suspend` | Admin | `{suspended:boolean,reason}` | `{userId,isSuspended}` | Admin audit, cannot suspend self/last admin without policy |
| `POST /api/admin/demo/spawn-captains` | Admin | `{demoSessionId,count,zoneIds,vehicleTypeIds}` | `{createdCount,sessionId}` | Only demo accounts; bounded count; never creates real auth users without explicit design |
| `POST /api/admin/demand/refresh` | Admin | `{zoneId?,source?}` | `{generatedAt,items}` | Recommended additional endpoint; rate-limited/audited |
| `POST /api/admin/demo/reset` | Admin | `{demoSessionId}` | `{deletedCounts}` | Optional; strictly scoped to demo session and confirm before destructive use |

## 13. Endpoint classification

**Public/authenticated client-facing:** health, vehicle catalog, geocode, reverse geocode, profile, fare estimate, rider ride APIs, captain APIs, pooling APIs, AI parse, scoped share.

**Restricted admin:** demand/zone analytics, aggregate admin data, demo controls, admin reassignment override.

**Internal service operations:** candidate ranking, allocation orchestration, offer expiry, automatic reassignment, forecast refresh, price recomputation, pool route recomputation. If a hackathon admin UI needs to trigger these, expose a narrowly authorized admin endpoint and audit it.

## 14. Frontend integration notes

- Send bearer token for every protected request.
- Generate idempotency/client request IDs for ride create, accept, cancel, pool join.
- Treat `409` as state conflict and refresh current ride.
- Display provider fallback/approximate route state.
- Subscribe only to authorized Realtime channels; REST remains source of truth after reconnect.
- Never infer that a ride is accepted solely from a successful button animation; wait for API response.

## 2.1.0 implementation addendum

- `GET /api/notifications` returns the authenticated user's in-app notifications.
- `PATCH /api/notifications/:id/read` marks only the caller's notification as read.
- `POST /api/pooling/:id/optimize` runs pickup-before-drop sequence optimization for a pool participant and persists the route order and OSRM/fallback route estimate.
- Ride creation is performed by the Express API through a service-role-only RPC after server-side routing and fare calculation; browsers must not invoke that RPC directly.
- Dispatch worker offers remain in `searching` with `captain_id` populated until the captain explicitly accepts. `accept` changes status to `accepted`; `reject` releases the captain and returns the ride to the waiting queue.


## Dispatch evaluation analytics (v3)

`GET /api/admin/analytics/dispatch` — administrator only. Returns a rolling seven-day summary of total/completed/cancelled/failed rides, completion rate, average request-to-accept waiting time, accepted-offer pickup ETA, online/active captain utilization, and captain offer-count coefficient of variation. Values are calculated from persisted operational records; the response includes sample sizes and methodology so small samples are not mistaken for reliable benchmarks.

## Shared-pool dispatch lifecycle (v3)

Pool member rides are dispatched as one unit once at least two active members have joined. The dispatch worker calls the service-role-only `allocate_pool` RPC. A single captain offer is attached to all member rides; the captain's existing ride-action endpoint routes accept/reject/arrived/start/complete/cancel through `pool_ride_action`. Offer timeout calls `reassign_pool`. A pool with one member waits for `POOL_WAIT_SECONDS`, then its pool record is closed and the ride falls back to individual dispatch. Membership changes are blocked after a pool offer is issued; rider cancellation requeues remaining members so route and captain allocation can be recomputed.
