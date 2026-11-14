import { z } from 'zod';
import { success } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import * as sosService from '../services/sos.service.js';

// Schemas
const contactInputSchema = z.object({
  contact_name: z.string().trim().min(2).max(100),
  phone_number: z.string().trim().min(10).max(20),
  relationship: z.string().trim().default('Family'),
  is_primary: z.boolean().optional().default(false)
});

const triggerSosSchema = z.object({
  ride_id: z.string().optional().default('RIDE-BEL-802'),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  address: z.string().optional().default('Belagavi City, Karnataka'),
  customer_name: z.string().optional().default('Customer'),
  captain_name: z.string().optional().default('Captain'),
  vehicle_number: z.string().optional().default('KA-22-EZ-4091'),
  note: z.string().max(500).optional().default('In-ride emergency SOS activated')
});

/**
 * List emergency contacts for the authenticated user
 */
export const listContacts = asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'demo-user-123';
  const contacts = await sosService.getContacts(userId, req.supabase);
  return success(res, { contacts, total: contacts.length });
});

/**
 * Add a new emergency contact (max 5)
 */
export const addContact = asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'demo-user-123';
  const body = contactInputSchema.parse(req.body);
  const contact = await sosService.addContact(userId, body, req.supabase);
  return success(res, contact, 201);
});

/**
 * Update an existing emergency contact
 */
export const updateContact = asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'demo-user-123';
  const contactId = req.params.id;
  const body = z.object({
    contact_name: z.string().trim().min(2).max(100).optional(),
    phone_number: z.string().trim().min(10).max(20).optional(),
    relationship: z.string().trim().optional(),
    is_primary: z.boolean().optional()
  }).parse(req.body);

  const updated = await sosService.updateContact(userId, contactId, body, req.supabase);
  return success(res, updated);
});

/**
 * Delete an emergency contact
 */
export const deleteContact = asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'demo-user-123';
  const contactId = req.params.id;
  const result = await sosService.deleteContact(userId, contactId, req.supabase);
  return success(res, result);
});

/**
 * Send OTP to contact for verification
 */
export const sendOtp = asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'demo-user-123';
  const contactId = req.params.id;
  const result = await sosService.sendContactVerificationOtp(userId, contactId, req.supabase);
  return success(res, result);
});

/**
 * Verify OTP code
 */
export const verifyOtp = asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'demo-user-123';
  const contactId = req.params.id;
  const body = z.object({
    otp: z.string().trim().min(4).max(8)
  }).parse(req.body);

  const result = await sosService.verifyContactOtp(userId, contactId, body.otp, req.supabase);
  return success(res, result);
});

/**
 * Trigger SOS Emergency Alert
 * Only SMS and WhatsApp channels
 */
export const triggerSos = asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'demo-user-123';
  const body = triggerSosSchema.parse(req.body);

  const alertResult = await sosService.triggerSosAlert(userId, {
    rideId: body.ride_id,
    latitude: body.latitude,
    longitude: body.longitude,
    address: body.address,
    customerName: body.customer_name,
    captainName: body.captain_name,
    vehicleNumber: body.vehicle_number,
    note: body.note
  }, req.supabase);

  return success(res, alertResult, 201);
});

/**
 * Get incident details with all notification delivery logs
 */
export const getIncident = asyncHandler(async (req, res) => {
  const incidentId = req.params.id;
  const result = await sosService.getIncident(incidentId, req.supabase);
  return success(res, result);
});

/**
 * Admin: List all SOS incidents
 */
export const listAdminIncidents = asyncHandler(async (req, res) => {
  const incidents = await sosService.listAdminIncidents(req.supabase);
  return success(res, { incidents, total: incidents.length });
});

/**
 * Admin: Acknowledge an incident
 */
export const acknowledgeIncident = asyncHandler(async (req, res) => {
  const incidentId = req.params.id;
  const adminId = req.user?.id || 'admin-belagavi';
  const result = await sosService.acknowledgeIncident(incidentId, adminId, req.supabase);
  return success(res, result);
});

/**
 * Admin: Resolve an incident
 */
export const resolveIncident = asyncHandler(async (req, res) => {
  const incidentId = req.params.id;
  const adminId = req.user?.id || 'admin-belagavi';
  const body = z.object({
    notes: z.string().trim().max(1000).optional()
  }).parse(req.body);

  const result = await sosService.resolveIncident(incidentId, adminId, body.notes, req.supabase);
  return success(res, result);
});

/**
 * Admin: Retry sending failed notification
 */
export const retryNotification = asyncHandler(async (req, res) => {
  const notificationId = req.params.id;
  const result = await sosService.retryNotification(notificationId);
  return success(res, result);
});

/**
 * Provider webhook for MSG91 / Meta delivery receipts
 */
export const handleProviderWebhook = asyncHandler(async (req, res) => {
  console.log('Received provider SOS delivery webhook:', req.body);
  return success(res, { received: true });
});
