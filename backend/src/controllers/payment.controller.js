import { z } from 'zod';
import { success } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import * as paymentService from '../services/payment.service.js';
import { env } from '../config/env.js';

export const createPaymentOrder = asyncHandler(async (req, res) => {
  const schema = z.object({
    amount: z.coerce.number().positive(),
    currency: z.string().default('INR'),
    rideId: z.string().uuid().optional().nullable(),
    notes: z.record(z.string(), z.unknown()).optional()
  });

  const body = schema.parse(req.body);
  const userId = req.user?.id || null;

  const result = await paymentService.createPaymentOrder({
    amount: body.amount,
    currency: body.currency,
    rideId: body.rideId,
    userId,
    notes: body.notes || {},
    userClient: req.supabase
  });

  return success(res, result, 201);
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const schema = z.object({
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().optional().default(''),
    ride_id: z.string().uuid().optional().nullable(),
    method: z.string().optional().default('razorpay_checkout')
  });

  const body = schema.parse(req.body);
  const userId = req.user?.id || null;

  const result = await paymentService.verifyPaymentSignature({
    razorpayOrderId: body.razorpay_order_id,
    razorpayPaymentId: body.razorpay_payment_id,
    razorpaySignature: body.razorpay_signature,
    rideId: body.ride_id,
    userId,
    userClient: req.supabase,
    method: body.method
  });

  return success(res, result);
});

export const paymentWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'] || '';
  const rawBody = req.rawBody || JSON.stringify(req.body);

  const result = await paymentService.processWebhook({
    rawBody,
    signature,
    payload: req.body
  });

  return success(res, result);
});

export const getPaymentStatus = asyncHandler(async (req, res) => {
  const orderId = z.string().min(1).parse(req.params.orderId);
  const result = await paymentService.getPaymentStatus(orderId, req.supabase);
  return success(res, result);
});

export const getPaymentConfig = asyncHandler(async (req, res) => {
  return success(res, {
    keyId: env.RAZORPAY_KEY_ID,
    isConfigured: env.razorpayConfigured,
    currency: 'INR'
  });
});
