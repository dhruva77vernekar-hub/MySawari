import React, { useState } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X,
  ExternalLink,
  Lock
} from 'lucide-react';
import { startRazorpayCheckout } from '../../services/paymentService';

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  rideId = null,
  rideDetails = {},
  onPaymentSuccess
}) {
  const [selectedMethod, setSelectedMethod] = useState('online'); // 'online' | 'cash'
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handlePayNow = async () => {
    setErrorMessage('');
    if (selectedMethod === 'cash') {
      // Direct cash confirmation
      onPaymentSuccess?.({
        method: 'cash',
        amount,
        status: 'pending_cash',
        orderId: `cash_${Date.now()}`
      });
      onClose();
      return;
    }

    // Razorpay Online Payment Flow
    setIsProcessing(true);
    try {
      await startRazorpayCheckout({
        amount,
        rideId,
        userDetails: {
          name: 'MySawari Commuter',
          email: 'rider@mysawari.in',
          phone: '+919876543210'
        },
        onSuccess: (data) => {
          setIsProcessing(false);
          setPaymentSuccessData(data);
          setTimeout(() => {
            onPaymentSuccess?.(data);
            onClose();
          }, 1800);
        },
        onFailure: (err) => {
          setIsProcessing(false);
          setErrorMessage(err.message || 'Payment could not be completed.');
        },
        onDismiss: () => {
          setIsProcessing(false);
        }
      });
    } catch (err) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Payment initiation failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-[28px] border border-[#DCDAF0] p-6 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-[#F1F0FA] text-[#5B5B73] transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Success Screen with High-End Verification Animation */}
        {paymentSuccessData ? (
          <div className="py-6 flex flex-col items-center text-center space-y-4 animate-scale-up">
            {/* Animated Pulsing Checkmark Ring */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center animate-pulse">
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              </div>
              <span className="absolute -top-1 -right-1 text-base animate-bounce">✨</span>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-bold text-xs">
                <span>ONLINE TRANSACTION VERIFIED</span>
              </div>
              <h3 className="text-2xl font-black text-[#0A0A14] tracking-tight mt-0.5">
                Payment Successful!
              </h3>
              <p className="text-xs text-[#5B5B73] mt-0.5">
                ₹{amount}.00 received via Razorpay Standard Gateway
              </p>
            </div>

            {/* Digital Transaction Receipt Card */}
            <div className="p-4 bg-[#F8F9FD] border border-[#DCDAF0] rounded-2xl w-full text-left font-mono text-xs space-y-2 text-[#5B5B73] shadow-xs">
              <div className="flex justify-between items-center pb-1.5 border-b border-black/5">
                <span className="text-[10px] uppercase text-[#8E96A6]">PAYMENT STATUS</span>
                <span className="hud text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  CAPTURED & SETTLED
                </span>
              </div>
              <div className="flex justify-between">
                <span>Payment ID:</span>
                <span className="font-bold text-[#0A0A14]">{paymentSuccessData.paymentId || 'pay_demo_success'}</span>
              </div>
              <div className="flex justify-between">
                <span>Order ID:</span>
                <span className="truncate max-w-[190px]">{paymentSuccessData.orderId || 'order_demo_success'}</span>
              </div>
              <div className="flex justify-between">
                <span>Method:</span>
                <span className="text-[#0A0A14] font-bold">UPI / GPay / Razorpay</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-black/5 text-[#0A0A14] font-bold">
                <span>Amount Paid:</span>
                <span className="text-emerald-700 text-sm">₹{amount}.00</span>
              </div>
            </div>

            <p className="text-[11px] text-[#8E96A6] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Redirecting to your active ride tracking...</span>
            </p>
          </div>
        ) : (
          /* Sleek Payment Form & Methods Area */
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="hud text-[10px] text-[#3A4DFF] font-bold">SECURE PAYMENT</span>
                <span className="hud text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                  256-BIT ENCRYPTED
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#0A0A14] mt-1">Select Payment Method</h3>
              <p className="text-xs text-[#5B5B73]">
                {rideDetails.pickup ? `${rideDetails.pickup} → ${rideDetails.drop}` : 'Urban ride booking in Belagavi'}
              </p>
            </div>

            {/* Total Fare Card */}
            <div className="p-3.5 rounded-2xl bg-[#F8F9FD] border border-[#DCDAF0] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#8E96A6] uppercase tracking-wider block">Total Payable Fare</span>
                <span className="text-2xl font-black font-mono text-[#0A0A14]">₹{amount}.00</span>
              </div>
              <div className="text-right">
                <span className="hud text-[10px] text-[#3A4DFF] font-bold block">RAZORPAY TEST MODE</span>
                <span className="text-[10px] font-mono text-[#8E96A6]">Key: rzp_test_TzfBO7...</span>
              </div>
            </div>

            {/* Enhanced Method Options */}
            <div className="space-y-2.5">
              {/* Razorpay Online Option */}
              <div
                onClick={() => setSelectedMethod('online')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selectedMethod === 'online'
                    ? 'border-[#3A4DFF] bg-[#3A4DFF]/5 shadow-sm ring-1 ring-[#3A4DFF]'
                    : 'border-[#DCDAF0] bg-white hover:border-[#5B5B73]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#3A4DFF] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-[#0A0A14]">Razorpay Instant Online</span>
                        <span className="hud text-[9px] bg-[#3A4DFF] text-white px-1.5 py-0.2 rounded font-bold">
                          RECOMMENDED
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5B5B73] mt-0.5">
                        Google Pay, PhonePe, Paytm, UPI ID, Cards, NetBanking
                      </p>
                      {/* Supported Brand Badges */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[9px] font-bold text-[#5B5B73]">
                        <span className="px-2 py-0.5 rounded bg-white border border-[#DCDAF0]">GPay</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-[#DCDAF0]">PhonePe</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-[#DCDAF0]">Paytm</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-[#DCDAF0]">UPI</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-[#DCDAF0]">Cards</span>
                      </div>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 mt-1 ${selectedMethod === 'online' ? 'border-[#3A4DFF] bg-[#3A4DFF]' : 'border-gray-300'}`}>
                    {selectedMethod === 'online' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </div>

              {/* Cash On Arrival (COD) Option */}
              <div
                onClick={() => setSelectedMethod('cash')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selectedMethod === 'cash'
                    ? 'border-[#3A4DFF] bg-[#3A4DFF]/5 shadow-sm ring-1 ring-[#3A4DFF]'
                    : 'border-[#DCDAF0] bg-white hover:border-[#5B5B73]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-[#0A0A14]">Cash on Arrival (COD)</span>
                        <span className="hud text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                          FLEXIBLE
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5B5B73] mt-0.5">
                        Pay captain directly in cash, or switch & <b>Pay Now Online</b> anytime during the ride!
                      </p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 mt-1 ${selectedMethod === 'cash' ? 'border-[#3A4DFF] bg-[#3A4DFF]' : 'border-gray-300'}`}>
                    {selectedMethod === 'cash' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handlePayNow}
              disabled={isProcessing}
              className="w-full py-4 rounded-full bg-[#FFC21A] hover:bg-[#e6ad12] text-[#0A0A14] font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0A0A14]" />
                  <span>Processing Razorpay Checkout...</span>
                </>
              ) : selectedMethod === 'online' ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-[#0A0A14]" />
                  <span>PAY ₹{amount} VIA RAZORPAY ONLINE</span>
                </>
              ) : (
                <span>CONFIRM CASH ON ARRIVAL · ₹{amount}</span>
              )}
            </button>

            {/* Trust Footer */}
            <div className="flex items-center justify-center gap-2 text-[10px] text-[#8E96A6]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Razorpay Verified Merchant · Instant Digital Receipt Guarantee</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
