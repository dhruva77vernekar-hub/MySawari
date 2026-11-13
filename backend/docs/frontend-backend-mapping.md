# MySawari — Frontend / Backend Integration Mapping

## 1. Integration baseline

Frontend: React + Vite + Tailwind CSS + Three.js. Backend: Express on port `4000`.

```dotenv
# frontend .env.local — public URL only
VITE_API_URL=http://localhost:4000
```

For another laptop on the same LAN, replace `localhost` with the backend laptop's LAN IP at runtime/configuration time; do not hardcode an IP in source control. Backend should bind to `0.0.0.0` only when LAN access is required. Configure CORS to the exact frontend origin(s).

Supabase Auth client on frontend may handle sign-in and session refresh. Send the access token to Express. Supabase service-role key and NVIDIA key must never enter frontend environment variables.

## 2. Screen-to-API map

| Frontend screen | User action | API | Auth / realtime | Loading and error behavior |
|---|---|---|---|---|
| Welcome/login | Sign in/up | Supabase Auth SDK | Supabase session | Show auth error; do not call backend before session |
| Onboarding | Create rider/captain profile | `GET/PATCH /api/profile`, `POST /api/captain/profile` | Auth; role-specific | Loading profile; handle duplicate phone/vehicle |
| Home / vehicle selector | Load available options | `GET /api/vehicle-types` | Public or authenticated | Skeleton; fallback message |
| Pickup/destination | Search and select place | `GET /api/geocode`, reverse lookup | Auth | Debounce search; show provider unavailable; user confirms exact pin |
| Route preview | Estimate route and fare | `POST /api/fare/estimate` | Rider | Show approximate marker if routing fallback used |
| Confirm booking | Request ride | `POST /api/rides` | Rider | Disable duplicate submit; use idempotency key; handle 409 |
| Finding captain | Show search status | `GET /api/matching/:rideId/status`, `GET /api/rides/:id` | Rider; scoped Realtime | Reconnect by refetching REST state |
| Active ride | Track captain/status | `GET /api/rides/:id`, captain location API | Rider + assigned captain; scoped Realtime | Stale-location indicator; do not show false live movement |
| Ride history | List past rides | `GET /api/rides` | Rider | Cursor pagination; empty state |
| Post-ride | Rate captain | `POST /api/rides/:id/rating` | Rider | One submission; 409 duplicate |
| Captain home | Go online/offline | `PATCH /api/captain/status` | Captain | Block offline if active trip |
| Captain requests | View/accept offer | `GET /api/captain/requests`, `POST /api/rides/:id/accept` | Captain | Offer expiry countdown; handle race-lost 409 |
| Captain trip | Update status/location | `PATCH /api/rides/:id/status`, `POST /api/rides/:id/location` | Assigned captain | Throttle location; validate state transitions |
| AI assistant | Parse natural-language booking | `POST /api/ai/parse-booking` | Rider | Show parsing state; allow manual correction and confirmation |
| Trip sharing | Create/share link (future create endpoint) and open | `GET /api/share/:token` | Public token-scoped read | Expired/revoked state; sanitized fields only |
| Safety | SOS event | `POST /api/rides/:id/sos` | Ride participant | Confirm action; clearly say “recorded” not emergency services dispatched |
| Pooling | Find/join/leave pool | `/api/pooling/*` | Rider/member | Show seats, detour, fare share; handle capacity race |
| Admin overview | View stats/users/rides | `/api/admin/*` | Admin | Aggregate loading, date filter, restricted data |
| Demand/zone dashboard | View forecasts and zone metrics | `/api/demand/*`, `/api/zones/*` | Admin | Show data timestamp and simulated/live label |
| Reassignment monitor | Inspect attempts | `GET /api/rides/:id/reassignment-history` | Ride owner/admin | Show attempt reason/time without private data |

## 3. Example requests

### Fare estimate
```json
{
  "pickup": {"lat": 15.8497, "lng": 74.4977},
  "destination": {"lat": 15.8573, "lng": 74.5069},
  "vehicleTypeId": "vehicle-type-uuid",
  "poolRequested": false
}
```

### Create ride
```json
{
  "pickup": {"label": "KLE Tech", "lat": 15.8497, "lng": 74.4977},
  "destination": {"label": "Central Bus Terminal", "lat": 15.8573, "lng": 74.5069},
  "vehicleTypeId": "vehicle-type-uuid",
  "poolOptIn": false,
  "passengerCount": 1,
  "clientRequestId": "client-generated-uuid"
}
```

### Captain location
```json
{
  "latitude": 15.8510,
  "longitude": 74.5000,
  "accuracyMeters": 12,
  "recordedAt": "2026-11-13T08:00:00.000Z"
}
```

## 4. Standard response handling

Success:
```json
{"success":true,"data":{"ride":{"id":"...","status":"requested"}},"meta":{"requestId":"..."}}
```

Error:
```json
{"success":false,"error":{"code":"RIDE_STATE_CONFLICT","message":"This ride is no longer available.","details":[]},"meta":{"requestId":"..."}}
```

Client behavior:
- `401`: refresh session once; if still invalid, return to login.
- `403`: show access denied; do not repeatedly retry.
- `404`: show unavailable/not found.
- `409`: refetch resource and explain that another action changed it.
- `422`: show field-level validation.
- `429`: respect retry guidance; avoid request loops.
- `502/503`: show provider unavailable and offer manual fallback.
- Network disconnect: show reconnecting; refetch authoritative state after reconnect.

## 5. Realtime subscription strategy

Subscribe only after authentication and only to a channel authorized for the current user/ride. Recommended events:
- ride status/event updates for a ride participant;
- limited assigned captain location updates for the active ride;
- captain offer notification for the captain addressed by the offer.

Do not subscribe a rider to all `captain_profiles` or all `rides`. Test cross-account access. Realtime is an update hint; on reconnect, fetch current state through REST.

## 6. Three.js vehicle morphing boundary

The vehicle morphing animation is a frontend presentation feature. Backend returns stable vehicle metadata (`code`, display name, capacity, fare estimate, availability state). It should not stream 3D assets or control frame-by-frame animation. Selecting bike/scooter/car changes the requested `vehicleTypeId`; backend validates compatibility and pricing.

## 7. Integration checklist for frontend/backend handoff

- [ ] Confirm exact API base URL and CORS origin.
- [ ] Agree on TypeScript/JSDoc types from API contracts.
- [ ] Confirm Supabase Auth token forwarding.
- [ ] Confirm role and onboarding behavior.
- [ ] Use `clientRequestId` for retryable mutations.
- [ ] Implement loading, empty, error and stale states.
- [ ] Treat fare and route as estimates until server response.
- [ ] Reconcile Realtime events with REST state.
- [ ] Label simulated data in admin visualizations.
- [ ] Never expose secrets or private captain data.
