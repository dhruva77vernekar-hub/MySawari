# MySawari Integrated Backend Build — 2.1.0

## Existing integrated modules retained
- Supabase Auth token verification and role-based authorization.
- Rider profiles and vehicle catalog.
- Captain onboarding, availability and location updates.
- OSRM route adapter with Haversine fallback.
- Nominatim geocoding and reverse geocoding.
- Fare estimates, ride request/history/cancellation and captain lifecycle.
- Nearby-captain lookup, zone/demand endpoints, matching and reassignment RPCs.
- Pool membership, AI assistant, SOS records, trip sharing, ratings and admin overview.

## 2.1.0 hardening and completion work
- Zod dependency upgraded to the 4.x line; Nodemon is not required (Node's built-in watch mode is used).
- Supabase environment is optional for local HTTP/health startup; protected/cloud routes return an explicit configuration error until configured.
- Service-role client is isolated to trusted backend operations.
- Ride creation is restricted to a service-role-only SQL RPC; the server authenticates the rider, calculates the route and fare, and then submits the trusted values.
- Captain assignment now creates a pending offer; captain must explicitly accept. Captain availability is reserved atomically and released on rejection, cancellation, timeout/reassignment or completion.
- Added a polling dispatch worker for waiting rides and expired captain offers, with a three-reassignment ceiling.
- Demand and supply are counted independently inside each active GeoJSON Polygon zone. Forecast uses same-hour/same-weekday history and labels low-data fallback.
- Added server-side zone multiplier lookup, capped surge calculation and admin repositioning suggestions.
- Pooling now filters by vehicle capacity and pickup/drop proximity; route optimizer checks pickup-before-drop order, shared passenger segment and detour limits, then obtains a multi-stop OSRM estimate.
- NVIDIA assistant output is parsed against a strict structured schema and can never book a ride.
- Added in-app notification list/read APIs and SQL inserts for ride offers/status changes.
- Added SQL hardening for SECURITY DEFINER function execution privileges and fixed search paths.
- Added demo Belagavi zone and explicitly synthetic historical demand seed.
- Added migration checker and pooling algorithm tests.

## Verification boundary
- JavaScript syntax check passed for all source files.
- SQL migration filename/order check passed.
- Pure local tests for fare, geo and pooling passed in the build environment.
- The full test suite requires `npm install` in the target environment; dependencies were not available in the build container.
- The SQL migrations have not been executed against the user's Supabase project. Live Supabase Auth/RLS, SQL, Realtime, dispatch, routing provider and end-to-end frontend behaviour remain to be verified after credentials are configured.


## v3.0.0 hardening and completion pass

- Added a small gradient-boosted demand forecasting model with holdout MAE metadata and explicit low-data fallback.
- Added migration 004 for atomic shared-pool captain dispatch, coordinated pool ride lifecycle, pooled timeout reassignment and singleton pool fallback.
- Updated dispatch worker to process pools before individual rides and to avoid dispatching pool members separately.
- Updated captain ride action handling to route multi-member pool actions through the pool lifecycle RPC.
- Added seven-day dispatch analytics for passenger waiting time, pickup ETA, completion rate, captain utilization and allocation fairness spread.
- Improved Zod validation and malformed/oversized JSON error responses.
- Added `npm run verify` as the consolidated local verification command.
