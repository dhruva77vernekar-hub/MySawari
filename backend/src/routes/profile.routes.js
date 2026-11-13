import { Router } from 'express';
import { getProfile, patchProfile } from '../controllers/profile.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { updateProfileSchema } from '../validators/profile.schema.js';

const router = Router();
router.use(requireAuth);
router.get('/', getProfile);
router.patch('/', validate({ body: updateProfileSchema }), patchProfile);
export default router;
