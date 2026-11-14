import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import { supabaseAdmin, supabasePublic } from '../config/supabase.js';

/**
 * Get configured Razorpay SDK instance
 */
function getRazorpayInstance() {
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET
  });
}

/**
 * Resolves an active Supabase client (service role preferred for verified backend writes,
 * falls back to user client or public client).
 */
function getDbClient(customClient = null) {
  if (supabaseAdmin) return supabaseAdmin;
  if (customClient) return customClient;
  if (supabasePublic) return supabasePublic;
  return null;
}

/**
 * Create a new Razorpay payment order
 * Prevents duplicate transactions if ride is already paid.
 */
export async function createPaymentOrder({
  amount,
  currency = 'INR',
  rideId = null,
  userId = null,
  notes = {},
  userClient = null
}) {
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    throw new AppError(400, 'INVALID_AMOUNT', 'Payment amount must be greater than zero.');
  }

  const db = getDbClient(userClient);

  // Check if this ride is already paid to prevent double charges
  if (rideId && db) {
    try {
      const { data: existingPayment } = await db
        .from('payments')
        .select('id,razorpay_order_id,status,amount')
        .eq('ride_id', rideId)
        .eq('status', 'captured')
        .maybeSingle();

      if (existingPayment) {
        throw new AppError(
          409,
          'RIDE_ALREADY_PAID',
          `This ride has already been paid (Payment ID: ${existingPayment.id}).`
        );
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      // If table doesn't exist yet or connection error in mock mode, continue gracefully
      console.warn('Pre-check ride payment warning:', err?.message);
    }
  }

  // Razorpay accepts amounts in the lowest currency unit (paise for INR)
  const amountInPaise = Math.round(numericAmount * 100);
  const cleanReceipt = `rcpt_${rideId ? rideId.slice(0, 12) : Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;

  let razorpayOrder;

  // If live credentials are valid, use Razorpay API
  if (env.razorpayConfigured) {
    try {
      const instance = getRazorpayInstance();
      razorpayOrder = await instance.orders.create({
        amount: amountInPaise,
        currency,
        receipt: cleanReceipt,
        notes: {
          ride_id: rideId || '',
          user_id: userId || '',
          ...notes
        }
      });
    } catch (err) {
      console.error('Razorpay orders.create API error:', err);
      // Fallback to simulated test order in development if keys are test credentials
      if (env.NODE_ENV === 'development') {
        razorpayOrder = {
          id: `order_test_${crypto.randomBytes(8).toString('hex')}`,
          entity: 'order',
          amount: amountInPaise,
          amount_paid: 0,
          amount_due: amountInPaise,
          currency,
          receipt: cleanReceipt,
          status: 'created',
          created_at: Math.floor(Date.now() / 1000),
          isMock: true
        };
      } else {
        throw new AppError(502, 'RAZORPAY_ERROR', err?.error?.description || 'Failed to initialize Razorpay order.');
      }
    }
  } else {
    // Development / Demo Mode simulated test order
    razorpayOrder = {
      id: `order_test_${crypto.randomBytes(8).toString('hex')}`,
      entity: 'order',
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency,
      receipt: cleanReceipt,
      status: 'created',
      created_at: Math.floor(Date.now() / 1000),
      isMock: true
    };
  }

  // Record order in Supabase payments table
  if (db) {
    try {
      await db.from('payments').upsert({
        ride_id: rideId || null,
        user_id: userId || null,
        razorpay_order_id: razorpayOrder.id,
        amount: numericAmount,
        currency,
        status: 'created',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'razorpay_order_id' });
    } catch (dbErr) {
      console.warn('Could not persist payment record to Supabase (continuing):', dbErr?.message);
    }
  }

  return {
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    receipt: razorpayOrder.receipt,
    keyId: env.RAZORPAY_KEY_ID,
    rideId,
    isMock: Boolean(razorpayOrder.isMock)
  };
}

/**
 * Verify Razorpay payment signature
 * Uses HMAC SHA256 of `order_id|payment_id` with RAZORPAY_KEY_SECRET
 */
export async function verifyPaymentSignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  rideId = null,
  userId = null,
  userClient = null,
  method = 'razorpay_checkout'
}) {
  if (!razorpayOrderId || !razorpayPaymentId) {
    throw new AppError(400, 'MISSING_PAYMENT_FIELDS', 'razorpay_order_id and razorpay_payment_id are required.');
  }

  const db = getDbClient(userClient);

  // Idempotency: check if this order is already captured
  if (db) {
    try {
      const { data: existing } = await db
        .from('payments')
        .select('*')
        .eq('razorpay_order_id', razorpayOrderId)
        .maybeSingle();

      if (existing && existing.status === 'captured') {
        return {
          verified: true,
          alreadyCaptured: true,
          orderId: razorpayOrderId,
          paymentId: existing.razorpay_payment_id,
          amount: existing.amount,
          status: 'captured'
        };
      }
    } catch (err) {
      console.warn('Supabase read warning during payment verify:', err?.message);
    }
  }

  let isSignatureValid = false;

  if (env.razorpayConfigured && razorpaySignature) {
    try {
      const generatedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      isSignatureValid = generatedSignature === razorpaySignature;
    } catch (cryptoErr) {
      console.error('Signature computation error:', cryptoErr);
    }
  }

  // Allow simulated / test signatures in development for test orders or mock signatures
  if (!isSignatureValid && env.NODE_ENV === 'development') {
    if (
      razorpayOrderId.startsWith('order_test_') ||
      razorpayOrderId.startsWith('order_mock_') ||
      razorpayPaymentId.startsWith('pay_test_') ||
      razorpayPaymentId.startsWith('pay_mock_') ||
      razorpaySignature === 'mock_signature'
    ) {
      isSignatureValid = true;
    }
  }

  if (!isSignatureValid) {
    // Record failed payment attempt
    if (db) {
      try {
        await db.from('payments').update({
          status: 'failed',
          razorpay_payment_id: razorpayPaymentId,
          error_code: 'BAD_SIGNATURE',
          error_description: 'Cryptographic signature mismatch.',
          updated_at: new Date().toISOString()
        }).eq('razorpay_order_id', razorpayOrderId);
      } catch {}
    }
    throw new AppError(400, 'INVALID_SIGNATURE', 'Payment signature verification failed.');
  }

  // Update Supabase payment record to 'captured'
  let updatedPayment = null;
  if (db) {
    try {
      const { data } = await db.from('payments').upsert({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        status: 'captured',
        payment_method: method,
        ride_id: rideId || null,
        user_id: userId || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'razorpay_order_id' }).select().maybeSingle();

      updatedPayment = data;

      // Update ride record
      if (rideId) {
        await db.from('rides').update({
          payment_status: 'paid',
          payment_id: data?.id || null
        }).eq('id', rideId);

        // Record ride event
        await db.from('ride_events').insert({
          ride_id: rideId,
          actor_id: userId || null,
          event_type: 'payment_completed',
          note: `Payment captured successfully via Razorpay (Payment ID: ${razorpayPaymentId})`
        });
      }
    } catch (dbErr) {
      console.warn('Supabase update warning after payment verification:', dbErr?.message);
    }
  }

  return {
    verified: true,
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    status: 'captured',
    paymentRecord: updatedPayment
  };
}

/**
 * Handle incoming Razorpay Webhook events
 */
export async function processWebhook({ rawBody, signature, payload }) {
  if (!signature && env.NODE_ENV !== 'development') {
    throw new AppError(400, 'MISSING_WEBHOOK_SIGNATURE', 'X-Razorpay-Signature header is missing.');
  }

  // Verify webhook signature
  if (env.RAZORPAY_WEBHOOK_SECRET && rawBody) {
    const expectedSig = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSig !== signature && env.NODE_ENV !== 'development') {
      throw new AppError(400, 'INVALID_WEBHOOK_SIGNATURE', 'Webhook signature verification failed.');
    }
  }

  const db = getDbClient();
  const eventName = payload?.event;
  const paymentEntity = payload?.payload?.payment?.entity;
  const orderEntity = payload?.payload?.order?.entity;

  console.log(`Razorpay Webhook received: ${eventName}`);

  if (!db || !paymentEntity) {
    return { received: true, event: eventName };
  }

  const orderId = paymentEntity.order_id || orderEntity?.id;
  const paymentId = paymentEntity.id;
  const method = paymentEntity.method;
  const amount = paymentEntity.amount ? paymentEntity.amount / 100 : undefined;

  try {
    switch (eventName) {
      case 'payment.authorized':
      case 'payment.captured': {
        await db.from('payments').upsert({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          amount,
          status: 'captured',
          payment_method: method,
          vpa: paymentEntity.vpa || null,
          bank: paymentEntity.bank || null,
          wallet: paymentEntity.wallet || null,
          email: paymentEntity.email || null,
          contact: paymentEntity.contact || null,
          raw_response: payload,
          updated_at: new Date().toISOString()
        }, { onConflict: 'razorpay_order_id' });

        const rideId = paymentEntity.notes?.ride_id;
        if (rideId) {
          await db.from('rides').update({ payment_status: 'paid' }).eq('id', rideId);
        }
        break;
      }

      case 'payment.failed': {
        await db.from('payments').upsert({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          status: 'failed',
          error_code: paymentEntity.error_code || 'FAILED',
          error_description: paymentEntity.error_description || 'Payment failed on Razorpay',
          raw_response: payload,
          updated_at: new Date().toISOString()
        }, { onConflict: 'razorpay_order_id' });
        break;
      }

      default:
        console.log(`Unhandled Razorpay event: ${eventName}`);
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
  }

  return { received: true, event: eventName };
}

/**
 * Get payment status by Razorpay Order ID or Ride ID
 */
export async function getPaymentStatus(orderId, userClient = null) {
  const db = getDbClient(userClient);
  if (!db) {
    return { orderId, status: 'unknown' };
  }

  const { data, error } = await db
    .from('payments')
    .select('*, rides(id, pickup_label, drop_label, fare, status)')
    .eq('razorpay_order_id', orderId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'DB_ERROR', 'Could not retrieve payment status.');
  }

  if (!data) {
    throw new AppError(404, 'NOT_FOUND', 'Payment order not found.');
  }

  return data;
}
