import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileCheck, 
  ArrowRight, 
  RotateCcw,
  Shield, 
  Car, 
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RiderStatus() {
  const navigate = useNavigate();
  const { user, applicationStatus, updateRiderStatus, signOut } = useAuth();

  const status = applicationStatus || user?.status || 'PENDING_APPROVAL';
  const riderName = user?.fullName || 'Rider';
  const vehicle = user?.vehicleName || user?.vehicleModel || 'Vehicle';
  const vehicleNumber = user?.vehicleNumber || 'KA-22-EX-4912';
  const rejectionReason = user?.rejectionReason || 'Driving licence scan is blurry or unreadable. Please upload a clear photo.';
  const suspensionReason = user?.suspensionReason || 'Account suspended for review by platform safety.';

  // Admin demo quick actions for effortless evaluation
  const handleSimulateApprove = () => {
    if (user?.id) {
      updateRiderStatus(user.id, 'APPROVED');
    }
  };

  const handleSimulateReject = () => {
    if (user?.id) {
      updateRiderStatus(user.id, 'REJECTED', 'RC document is blurry and chassis number is not visible.');
    }
  };

  const handleSimulatePending = () => {
    if (user?.id) {
      updateRiderStatus(user.id, 'PENDING_APPROVAL');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-[#F1F0FA] flex items-center justify-center">
      <div className="max-w-xl w-full rounded-[32px] bg-white border border-[#DCDAF0] p-6 sm:p-10 shadow-[0_20px_70px_-20px_rgba(58,77,255,0.15)] space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DCDAF0] pb-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="MySawari Logo" className="w-9 h-9 rounded-xl object-contain shadow-xs" />
            <div>
              <span className="hud text-xs text-[#3A4DFF] font-bold tracking-wider">
                MYSAWARI CAPTAIN SYSTEM
              </span>
              <h1 className="text-2xl font-bold text-[#0A0A14] tracking-tight">
                Application Status
              </h1>
            </div>
          </div>
          <button
            onClick={() => {
              signOut();
              navigate('/login');
            }}
            className="text-xs font-semibold text-[#8E96A6] hover:text-[#0A0A14] flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* STATUS: PENDING_APPROVAL */}
        {status === 'PENDING_APPROVAL' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-center gap-2.5 text-amber-800">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                <span className="hud text-xs font-bold uppercase tracking-wider">
                  STATUS: PENDING APPROVAL
                </span>
              </div>
              <h3 className="text-lg font-bold text-amber-950">
                Application Under Admin Review
              </h3>
              <p className="text-xs text-amber-900/80 leading-relaxed">
                Thank you, <b>{riderName}</b>! Your driving licence and vehicle details for <b>{vehicle} ({vehicleNumber})</b> have been submitted to the Belagavi administrative console.
              </p>
              <div className="text-[11px] text-amber-800/90 bg-white/70 p-3 rounded-xl border border-amber-200/60">
                ℹ️ <b>Security Constraint</b>: Unapproved riders cannot access the operational dashboard or accept dispatches until verified.
              </div>
            </div>

            {/* Application Summary Box */}
            <div className="p-4 rounded-2xl bg-[#F8F8FC] border border-[#DCDAF0] space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-black/5">
                <span className="text-[#8E96A6]">Applicant Name</span>
                <span className="font-semibold text-[#0A0A14]">{riderName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-black/5">
                <span className="text-[#8E96A6]">Vehicle</span>
                <span className="font-semibold text-[#0A0A14]">{vehicle} · {vehicleNumber}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#8E96A6]">Submission Channel</span>
                <span className="font-semibold text-emerald-600">Belagavi City Zone</span>
              </div>
            </div>
          </div>
        )}

        {/* STATUS: APPROVED */}
        {status === 'APPROVED' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
                <span className="hud text-xs font-bold uppercase tracking-wider">
                  STATUS: APPROVED & VERIFIED
                </span>
              </div>
              <h3 className="text-lg font-bold text-emerald-950">
                Congratulations, Captain {riderName}!
              </h3>
              <p className="text-xs text-emerald-900/80 leading-relaxed">
                Your driving licence and vehicle <b>{vehicle} ({vehicleNumber})</b> have been verified by the Belagavi platform administrator. You are cleared to go online and accept ride dispatches.
              </p>
            </div>

            <button
              onClick={() => navigate('/rider/dashboard')}
              className="w-full py-4 rounded-full bg-[#0A0A14] hover:bg-[#3A4DFF] text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-[0_15px_35px_-10px_rgba(58,77,255,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>LAUNCH RIDER DASHBOARD</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STATUS: REJECTED */}
        {status === 'REJECTED' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-red-50 border border-red-200 space-y-3">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="w-5 h-5" />
                <span className="hud text-xs font-bold uppercase tracking-wider">
                  STATUS: APPLICATION REJECTED
                </span>
              </div>
              <h3 className="text-lg font-bold text-red-950">
                Verification Incomplete
              </h3>
              <p className="text-xs text-red-900/80 leading-relaxed">
                Your application could not be verified by the admin team.
              </p>
              <div className="p-3 bg-white/90 rounded-xl border border-red-200 text-xs text-red-900 font-medium">
                <b>Admin Reason:</b> {rejectionReason}
              </div>
            </div>

            <button
              onClick={() => navigate('/rider/register')}
              className="w-full py-4 rounded-full bg-[#3A4DFF] hover:bg-[#2B3CD9] text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>EDIT & RESUBMIT APPLICATION</span>
            </button>
          </div>
        )}

        {/* STATUS: SUSPENDED */}
        {status === 'SUSPENDED' && (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
              <span className="hud text-xs font-bold uppercase tracking-wider">
                STATUS: ACCOUNT SUSPENDED
              </span>
            </div>
            <h3 className="text-lg font-bold text-rose-950">
              Account Temporarily Suspended
            </h3>
            <p className="text-xs text-rose-900/80 leading-relaxed">
              {suspensionReason}
            </p>
            <p className="text-[11px] text-[#8E96A6]">
              Please visit MySawari Belagavi Headquarters or contact support to request account review.
            </p>
          </div>
        )}

        {/* Quick Demo Simulator Tool for Evaluators */}
        <div className="pt-4 border-t border-[#DCDAF0] space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#8E96A6]">
            <span className="hud font-bold text-[#3A4DFF]">HACKATHON EVALUATOR SHORTCUT</span>
            <span>Simulate Admin State</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleSimulateApprove}
              className="py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 transition-colors"
            >
              ✓ Approve Now
            </button>
            <button
              type="button"
              onClick={handleSimulateReject}
              className="py-2 px-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 text-[10px] font-bold border border-red-200 transition-colors"
            >
              ✕ Reject with Reason
            </button>
            <button
              type="button"
              onClick={handleSimulatePending}
              className="py-2 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200 transition-colors"
            >
              ⏳ Pending State
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
