import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import * as c from '../controllers/platform.controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { success } from '../utils/api-response.js';

const r = Router();
const auth = requireAuth;
const captain = [auth, requireRole('captain')];
const admin = [auth, requireRole('admin')];
const rider = [auth, requireRole('rider')];

// Captain endpoints
r.get('/captains/me', ...captain, c.captainMe);
r.post('/captains/onboard', ...captain, c.upsertCaptain);
r.patch('/captains/availability', ...captain, c.captainAvailability);
r.patch('/captains/location', ...captain, c.updateLocation);

// Geocoding, routing, fares (support public/optional auth for fast preview)
r.get('/locations/search', optionalAuth, c.geocodeSearch);
r.get('/locations/reverse', optionalAuth, c.geocodeReverse);
r.post('/routing/estimate', optionalAuth, c.routeEstimate);
r.post('/fares/estimate', optionalAuth, c.fareEstimate);
r.get('/captains/nearby', optionalAuth, c.nearbyCaptains);

// Rides lifecycle
r.post('/rides', ...rider, c.createRide);
r.get('/rides', auth, c.listRides);
r.get('/rides/:id', auth, c.getRide);
r.post('/rides/:id/cancel', ...rider, c.cancelRide);
r.post('/rides/:id/captain/:action', ...captain, c.rideAction);

// Zones & intelligence
r.get('/zones', optionalAuth, c.zones);
r.get('/zones/:id/intelligence', ...admin, c.zoneIntel);
r.get('/admin/zones/repositioning', ...admin, c.repositionRecommendations);
r.get('/demand/forecast', ...admin, c.demandForecast);
r.post('/admin/demand/refresh', ...admin, c.demandRefresh);
r.post('/admin/matching/allocate', ...admin, c.allocateRide);
r.post('/admin/rides/:id/reassign', ...admin, c.reassignRide);
r.get('/rides/:id/reassignment-history', auth, c.reassignmentHistory);

// Pooling
r.post('/pooling/match', ...rider, c.poolMatch);
r.post('/pooling/create', ...rider, c.poolCreate);
r.get('/pooling/:id', auth, c.poolDetail);
r.post('/pooling/:id/join', ...rider, c.poolJoin);
r.post('/pooling/:id/leave', ...rider, c.poolLeave);
r.post('/pooling/:id/optimize', auth, c.poolOptimize);

// Notifications, Assistant, Safety
r.get('/notifications', auth, c.listNotifications);
r.patch('/notifications/:id/read', auth, c.markNotificationRead);
r.post('/assistant/chat', auth, c.assistant);
r.post('/safety/sos', auth, c.sosCreate);
r.post('/trips/share', auth, c.shareCreate);
r.get('/trips/shared/:token', c.sharePublic);
r.get('/admin/overview', ...admin, c.adminOverview);
r.get('/admin/analytics/dispatch', ...admin, c.dispatchAnalytics);
r.patch('/admin/captains/:id/verification', ...admin, c.verifyCaptain);
r.post('/ratings', ...rider, c.createRating);

export default r;
