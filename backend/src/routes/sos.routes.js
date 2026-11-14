import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';
import * as sosController from '../controllers/sos.controller.js';

const router = Router();

// Emergency Contacts Management (Supports optionalAuth for quick testing / authenticated user)
router.get('/emergency/contacts', optionalAuth, sosController.listContacts);
router.post('/emergency/contacts', optionalAuth, sosController.addContact);
router.put('/emergency/contacts/:id', optionalAuth, sosController.updateContact);
router.delete('/emergency/contacts/:id', optionalAuth, sosController.deleteContact);

// OTP Verification for Emergency Contacts
router.post('/emergency/contacts/:id/send-otp', optionalAuth, sosController.sendOtp);
router.post('/emergency/contacts/:id/verify-otp', optionalAuth, sosController.verifyOtp);

// In-Ride SOS Trigger (SMS & WhatsApp ONLY)
router.post('/sos/trigger', optionalAuth, sosController.triggerSos);
router.get('/sos/incidents/:id', optionalAuth, sosController.getIncident);

// Admin Emergency Management Console
router.get('/admin/sos/incidents', optionalAuth, sosController.listAdminIncidents);
router.post('/admin/sos/incidents/:id/acknowledge', optionalAuth, sosController.acknowledgeIncident);
router.post('/admin/sos/incidents/:id/resolve', optionalAuth, sosController.resolveIncident);
router.post('/admin/sos/notifications/:id/retry', optionalAuth, sosController.retryNotification);

// Provider Webhook for MSG91 / Meta delivery receipts
router.post('/sos/webhook/msg91', sosController.handleProviderWebhook);

export default router;
