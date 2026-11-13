# MySawari — Security and Testing Plan

## 1. Security objectives

Protect identity, ride ownership, location, fare integrity, captain availability, operational intelligence and demo controls. Security must be enforced in Express and PostgreSQL RLS; hiding a UI button is not authorization.

## 2. Authentication and authorization

- Verify Supabase JWT/access token on every protected API request using the supported Supabase verification approach; validate signature, issuer, audience and expiry.
- Resolve the application profile from the authenticated user ID. Do not trust `role` supplied by the client.
- Use role middleware for rider, captain and admin routes.
- Add resource-level checks in services: rider owns ride; captain is assigned/offered; admin permission is explicit.
- Do not allow profile update to modify role, suspension, earnings or verified identity fields.
- Admin role assignment must be a controlled server-side process, not self-service.
- A service-role Supabase client bypasses RLS. Keep it backend-only and perform explicit authorization before each privileged write.

## 3. Security middleware and purpose

| Component | Purpose |
|---|---|
| Helmet | Sensible HTTP security headers |
| CORS | Allow only configured frontend origins and required methods/headers |
| express-rate-limit | Protect login-adjacent APIs, AI, geocoding, SOS, share-token lookup and mutations |
| Zod | Validate request body, params and query before service logic |
| Authentication middleware | Verify Supabase token and attach trusted identity |
| Role middleware | Gate route by trusted application role |
| Ownership checks | Ensure actor is a ride participant/owner/assigned captain |
| Central error middleware | Normalize errors; hide stack traces and provider internals |
| Request ID/logging | Trace requests without logging secrets or sensitive payloads |

Also consider request body size limits, timeouts, strict JSON content type, dependency updates and secret scanning.

## 4. Data and credential protection

Never expose:
- `SUPABASE_SERVICE_ROLE_KEY`
- `NVIDIA_API_KEY`
- database passwords/connection strings
- access/refresh tokens
- internal host/network configuration
- private rider/captain information

`.env` must be ignored by Git. Commit only `.env.example` with blank placeholders. Do not prefix secrets with `VITE_`. Rotate any credential accidentally committed.

Use parameterized Supabase query APIs; never concatenate user input into SQL. If using RPC/SQL, bind parameters and validate input. Do not return raw database/provider errors.

## 5. Location and trip privacy

- Exact captain location is available only to authorized operations and the assigned active ride.
- Riders see only their assigned captain's required trip location.
- Avoid global captain maps with identifying data.
- Use coarse pickup/destination labels in public trip-share response.
- Trip-share token must be high entropy, stored as a hash, expiry-limited, revocable and rate-limited.
- Do not log precise coordinates by default.
- Define retention and deletion policy before real users are onboarded.
- SOS event recording is not equivalent to dispatching emergency services. UI copy must be honest.

## 6. Realtime security

- Enable RLS on underlying tables.
- Authorize channels by user/ride membership.
- Do not publish unrestricted location or ride topics.
- Test subscriptions using two separate rider accounts and two captains.
- On access revocation or ride completion, ensure access to live location stops.
- Treat Realtime payloads as untrusted hints; REST read remains authoritative.

## 7. Abuse prevention and business integrity

- Rate-limit AI parse, geocode, reverse-geocode, ride creation, accept, SOS and public share lookup.
- Validate service area, coordinates, vehicle compatibility and passenger count.
- Recalculate fare on server; persist pricing snapshot.
- Cap dynamic pricing and record policy reason.
- Use idempotency keys for create/accept/cancel/join.
- Prevent replayed or duplicate status transitions.
- Use atomic conditional writes for captain acceptance and pool capacity.
- Limit admin demo captain spawning and demo reset to a scoped demo session.
- Audit admin suspension, manual reassignment, fare-policy changes and demo reset.

## 8. Test strategy

### Unit tests
- Zod schemas: missing fields, wrong types, out-of-range coordinates, invalid enums.
- Fare: base + distance + time, minimum fare, vehicle rates, surge cap.
- Fairness score: normalization, weights, neutral new-captain score.
- Zone lookup: inside, outside, boundary and overlapping polygon behavior.
- Pool insertion: pickup before drop, capacity, detour cap and fare share.
- AI parser: valid, malformed, missing fields and prompt injection text.

### Integration tests
- Supabase token valid/expired/invalid.
- Rider profile isolation.
- Rider cannot read another rider's ride.
- Captain cannot accept a ride not offered to them.
- Assigned captain can update only their active ride.
- Rider cannot set fare or captain ID.
- Ride creation writes initial event.
- Cancellation follows valid lifecycle.
- Rating only for own completed ride.
- Public share token expiry/revocation and data minimization.
- Realtime channel isolation.

### Concurrency and failure tests
- Two captains accept same ride simultaneously: exactly one succeeds.
- Two pool join requests compete for last seat: only capacity-safe outcome commits.
- Duplicate client request ID: one ride is created.
- Two reassignment workers run simultaneously: one attempt claim.
- Timeout and captain rejection occur together: one consistent outcome.
- OSRM/Nominatim/NVIDIA timeout: graceful fallback, no duplicate write.
- Supabase unavailable: health endpoint indicates degraded state and mutations fail safely.

### Advanced-feature tests
| Feature | Test cases |
|---|---|
| Forecasting | Empty history fallback, seeded history, zone-specific buckets, no negative demand, forecast timestamp and simulated label |
| Zone intelligence | Demand/supply ratio with zero supply, multiplier cap, smoothing, out-of-zone coordinate |
| Pooling | Compatible route, opposite direction, insufficient seats, detour threshold, cancellation recompute |
| Allocation fairness | nearest captain wins when appropriate; repeated allocation improves fair score; workload penalty; stale/offline excluded |
| Reassignment | reject, timeout, cancellation, max attempts, no eligible captain, duplicate retry blocked |

## 9. Postman collection plan

Organize collections:
1. Health and catalog.
2. Authenticated rider/profile.
3. Captain onboarding/status.
4. Fare and geocoding.
5. Ride lifecycle.
6. Captain offer and acceptance.
7. Demand and zones.
8. Pooling.
9. AI.
10. Safety/share.
11. Admin/demo.

Use environment variables for base URL and test tokens. Never commit real tokens. Add pre-request scripts only for test convenience; do not bypass authorization.

## 10. Release gate

Do not begin a public demo with real personal data until:
- auth and ownership tests pass;
- duplicate acceptance and pool capacity race tests pass;
- secret scan is clean;
- CORS/rate limits are configured;
- Realtime isolation is verified;
- demo and real data are separated;
- provider failure states are visible;
- location/share/SOS copy is accurate.
