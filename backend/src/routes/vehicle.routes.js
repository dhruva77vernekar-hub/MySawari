import { Router } from 'express';
import { getVehicleTypes } from '../controllers/vehicle.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/', optionalAuth, getVehicleTypes);
export default router;
