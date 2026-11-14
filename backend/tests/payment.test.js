import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createPaymentOrder, verifyPaymentSignature } from '../src/services/payment.service.js';

test('createPaymentOrder rejects non-positive payment amounts', async () => {
  await assert.rejects(
    async () => {
      await createPaymentOrder({ amount: 0 });
    },
    /Payment amount must be greater than zero/i
  );

  await assert.rejects(
    async () => {
      await createPaymentOrder({ amount: -50 });
    },
    /Payment amount must be greater than zero/i
  );
});

test('createPaymentOrder creates an order with correct amount in paise and INR currency', async () => {
  const order = await createPaymentOrder({
    amount: 149.50,
    rideId: 'RIDE-TEST-PAISE'
  });

  assert.ok(order.orderId);
  assert.equal(order.amount, 14950); // 149.50 * 100 paise
  assert.equal(order.currency, 'INR');
  assert.equal(order.rideId, 'RIDE-TEST-PAISE');
});

test('verifyPaymentSignature rejects missing order ID or payment ID', async () => {
  await assert.rejects(
    async () => {
      await verifyPaymentSignature({ razorpayOrderId: null, razorpayPaymentId: 'pay_123' });
    },
    /razorpay_order_id and razorpay_payment_id are required/i
  );

  await assert.rejects(
    async () => {
      await verifyPaymentSignature({ razorpayOrderId: 'order_123', razorpayPaymentId: null });
    },
    /razorpay_order_id and razorpay_payment_id are required/i
  );
});

test('verifyPaymentSignature verifies simulated development test orders', async () => {
  const result = await verifyPaymentSignature({
    razorpayOrderId: 'order_test_a1b2c3d4',
    razorpayPaymentId: 'pay_test_99887766',
    razorpaySignature: 'mock_signature'
  });

  assert.equal(result.verified, true);
  assert.equal(result.status, 'captured');
});

test('verifyPaymentSignature rejects invalid signature for production formatted orders', async () => {
  await assert.rejects(
    async () => {
      await verifyPaymentSignature({
        razorpayOrderId: 'order_live_999999',
        razorpayPaymentId: 'pay_live_888888',
        razorpaySignature: 'invalid_tampered_signature_hex'
      });
    },
    /Payment signature verification failed/i
  );
});
