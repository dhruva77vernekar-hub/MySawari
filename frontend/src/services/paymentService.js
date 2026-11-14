/**
 * MySawari Razorpay Payment Service
 * Seamless frontend integration for Razorpay Standard Checkout
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const DEFAULT_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TzfBO7UYhGdDs8';

/**
 * Dynamically load Razorpay checkout script
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load Razorpay checkout.js script.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Create order via Express backend
 */
export async function createOrder({ amount, rideId = null, notes = {} }) {
  const token = localStorage.getItem('mysawari_token') || 'demo-rider-token';
  const res = await fetch(`${API_BASE}/api/payments/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      amount: Number(amount),
      currency: 'INR',
      rideId,
      notes
    })
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || 'Failed to initialize payment order');
  }
  return json.data;
}

/**
 * Verify payment signature on backend
 */
export async function verifyPayment({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  ride_id = null,
  method = 'upi'
}) {
  const token = localStorage.getItem('mysawari_token') || 'demo-rider-token';
  const res = await fetch(`${API_BASE}/api/payments/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      ride_id,
      method
    })
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || 'Payment signature verification failed');
  }
  return json.data;
}

/**
 * Launch Razorpay Standard Checkout
 */
export async function startRazorpayCheckout({
  amount,
  rideId = null,
  userDetails = {},
  onSuccess,
  onFailure,
  onDismiss
}) {
  try {
    // 1. Create order on backend
    const orderData = await createOrder({
      amount,
      rideId,
      notes: { ride_name: 'MySawari Belagavi Ride' }
    });

    const isLoaded = await loadRazorpayScript();

    // If Razorpay SDK loaded and not in mock forced mode
    if (isLoaded && window.Razorpay && !orderData.isMock) {
      const options = {
        key: orderData.keyId || DEFAULT_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'MySawari Ride Dispatch',
        description: `Belagavi Urban Transport · ₹${amount}`,
        image: 'https://cdn-icons-png.flaticon.com/512/3063/3063823.png',
        order_id: orderData.orderId,
        prefill: {
          name: userDetails.name || 'MySawari Commuter',
          email: userDetails.email || 'commuter@mysawari.in',
          contact: userDetails.phone || '+919876543210'
        },
        theme: {
          color: '#3A4DFF'
        },
        handler: async (response) => {
          try {
            const verification = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              ride_id: rideId,
              method: 'razorpay_standard_checkout'
            });
            onSuccess?.({
              ...verification,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              amount
            });
          } catch (err) {
            onFailure?.(err);
          }
        },
        modal: {
          ondismiss: () => {
            onDismiss?.();
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        onFailure?.(new Error(response.error?.description || 'Payment transaction failed'));
      });
      rzp.open();
      return;
    }

    // 2. Fallback / Test Mode Interactive Modal (for local sandbox / demo environments)
    console.log('Using MySawari Razorpay Test Simulator for Order:', orderData.orderId);
    
    // Simulate instant test checkout completion
    const testPaymentId = `pay_test_${Math.random().toString(36).slice(2, 10)}`;
    const verification = await verifyPayment({
      razorpay_order_id: orderData.orderId,
      razorpay_payment_id: testPaymentId,
      razorpay_signature: 'mock_signature',
      ride_id: rideId,
      method: 'upi_test'
    });

    onSuccess?.({
      ...verification,
      orderId: orderData.orderId,
      paymentId: testPaymentId,
      amount,
      isSimulated: true
    });
  } catch (err) {
    console.error('Razorpay checkout error:', err);
    onFailure?.(err);
  }
}

export default {
  loadRazorpayScript,
  createOrder,
  verifyPayment,
  startRazorpayCheckout
};
