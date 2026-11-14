import { Router } from 'express';
import healthRoutes from './health.routes.js';
import profileRoutes from './profile.routes.js';
import vehicleRoutes from './vehicle.routes.js';
import platformRoutes from './platform.routes.js';
import paymentRoutes from './payment.routes.js';
import sosRoutes from './sos.routes.js';

const router = Router();
router.use('/health', healthRoutes);
router.use('/profile', profileRoutes);
router.use('/vehicle-types', vehicleRoutes);
router.use('/payments', paymentRoutes);
router.use('/', sosRoutes);
router.use('/', platformRoutes);

export default router;
