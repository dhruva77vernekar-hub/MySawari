import { Router } from 'express';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware.js';
import * as paymentCtrl from '../controllers/payment.controller.js';

const router = Router();

// Public config to read public Razorpay Key ID
router.get('/config', paymentCtrl.getPaymentConfig);

// Create standard Razorpay order
router.post('/create-order', optionalAuth, paymentCtrl.createPaymentOrder);

// Verify signature from frontend checkout
router.post('/verify', optionalAuth, paymentCtrl.verifyPayment);

// Razorpay Webhook endpoint
router.post('/webhook', paymentCtrl.paymentWebhook);

// Check payment status
router.get('/order/:orderId', optionalAuth, paymentCtrl.getPaymentStatus);

export default router;
