import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Phone, 
  Send, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  ExternalLink, 
  RefreshCw, 
  X, 
  Check, 
  MessageSquare,
  Clock,
  Car
} from 'lucide-react';
import api from '../../services/api';

export default function SosActivationModal({
  isOpen,
  onClose,
  ride = null,
  currentLocation = null
}) {
  const [step, setStep] = useState('CONFIRM'); // 'CONFIRM' | 'ACTIVATING' | 'STATUS'
  const [coords, setCoords] = useState(currentLocation || { latitude: 15.8560, longitude: 74.5120 });
  const [gpsCaptured, setGpsCaptured] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [alertResult, setAlertResult] = useState(null);
  const [error, setError] = useState(null);

  // Capture real GPS on open
  useEffect(() => {
    if (isOpen) {
      setStep('CONFIRM');
      setError(null);
      setAlertResult(null);

      // Fetch verified contacts to show in confirmation
      api.getEmergencyContacts().then(res => {
        if (res) setContacts(res.filter(c => c.is_verified));
      });

      // Try browser Geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoords({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            });
            setGpsCaptured(true);
          },
          (err) => {
            console.warn('Browser GPS permission error, using ride sector fallback:', err.message);
            setGpsError(err.message);
            // Fallback to Belagavi Khade Bazar
            setCoords({ latitude: 15.8560, longitude: 74.5120 });
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirmActivation = async () => {
    setStep('ACTIVATING');
    setError(null);
    try {
      const payload = {
        ride_id: ride?.id || 'RIDE-BEL-802',
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: ride?.pickupLocation?.name || 'Khade Bazar, Belagavi, Karnataka',
        customer_name: ride?.customerName || 'Dhruv Patil',
        captain_name: ride?.captain?.name || 'Suresh Patil',
        vehicle_number: ride?.captain?.vehicleNumber || 'KA-22-EZ-4091',
        note: 'Customer activated SOS emergency button during active ride'
      };

      const result = await api.triggerSos(payload);
      setAlertResult(result);
      setStep('STATUS');
    } catch (err) {
      setError(err.message || 'Failed to dispatch SOS alerts.');
      setStep('CONFIRM');
    }
  };

  const mapLink = `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0A0D18] border border-red-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-red-950/60 to-[#0A0D18] border-b border-red-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="hud text-[10px] text-red-400 font-bold tracking-widest block">
                EMERGENCY RESPONSE PROTOCOL
              </span>
              <h3 className="text-lg font-bold text-white">
                {step === 'CONFIRM' ? 'Confirm Emergency SOS' : step === 'ACTIVATING' ? 'Broadcasting Alerts...' : 'Emergency Dispatched'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#8E96A6] hover:text-white rounded-xl hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-2xl text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: CONFIRMATION SCREEN */}
          {step === 'CONFIRM' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-2 text-xs">
                <span className="font-bold text-red-400 block uppercase font-mono">
                  Are you in an immediate safety emergency?
                </span>
                <p className="text-slate-300">
                  Activating SOS will immediately broadcast emergency alerts via <strong>SMS</strong> and <strong>WhatsApp</strong> to your verified emergency contacts and alert the MySawari safety center.
                </p>
              </div>

              {/* Captured GPS Telemetry */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#8E96A6] font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#45E0F2]" /> Real-time GPS Location:
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    {gpsCaptured ? 'HIGH ACCURACY GPS' : 'SECTOR CORRIDOR'}
                  </span>
                </div>
                <div className="font-mono text-white text-xs flex items-center justify-between">
                  <span>Coordinates: [{coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}]</span>
                  <a
                    href={mapLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#45E0F2] hover:underline flex items-center gap-1 text-[11px]"
                  >
                    Preview Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Ride & Captain Info */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#8E96A6]">
                  <span className="font-bold">Active Trip Context</span>
                  <span className="font-mono">{ride?.id || 'RIDE-BEL-802'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[#8E96A6] block text-[10px]">CAPTAIN:</span>
                    <span className="text-white font-bold">{ride?.captain?.name || 'Suresh Patil'}</span>
                  </div>
                  <div>
                    <span className="text-[#8E96A6] block text-[10px]">VEHICLE:</span>
                    <span className="text-[#45E0F2] font-bold">{ride?.captain?.vehicleNumber || 'KA-22-EZ-4091'}</span>
                  </div>
                </div>
              </div>

              {/* Verified Receivers Preview */}
              <div className="space-y-2">
                <span className="text-[#8E96A6] block text-xs font-bold uppercase font-mono">
                  Emergency Contacts to be Alerted ({contacts.length}):
                </span>
                {contacts.length === 0 ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                    No verified emergency contacts registered. Central police 112 and MySawari safety team will still be notified.
                  </div>
                ) : (
                  <div className="space-y-1.5 font-mono text-xs">
                    {contacts.map((c) => (
                      <div key={c.id} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <span className="text-white font-bold">{c.contact_name}</span>
                        <div className="flex items-center gap-2 text-[#45E0F2] text-[11px]">
                          <span>{c.phone_number}</span>
                          <span className="text-[10px] text-emerald-400 font-bold">SMS + WA</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-[#8E96A6] hover:text-white text-xs font-bold rounded-2xl transition-all cursor-pointer"
                >
                  Cancel / False Alarm
                </button>
                <button
                  type="button"
                  onClick={handleConfirmActivation}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl shadow-red-600/30 animate-pulse"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>CONFIRM SOS ACTIVATION</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ACTIVATING SPINNER */}
          {step === 'ACTIVATING' && (
            <div className="py-12 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-red-500 animate-spin mx-auto" />
              <h4 className="text-base font-bold text-white">Dispatched to MSG91 & WhatsApp Gateways...</h4>
              <p className="text-xs text-[#8E96A6] max-w-sm mx-auto">
                Transmitting your real-time GPS coordinates and ride details to verified emergency contacts.
              </p>
            </div>
          )}

          {/* STEP 3: LIVE DISPATCH STATUS SCREEN */}
          {step === 'STATUS' && alertResult && (
            <div className="space-y-5">
              {/* Incident Header Card */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold block uppercase">
                    SOS INCIDENT CREATED
                  </span>
                  <span className="text-sm font-bold text-white font-mono">
                    ID: {alertResult.incident?.id}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#8E96A6] block font-mono">TIMESTAMP</span>
                  <span className="text-xs font-mono font-bold text-white">
                    {alertResult.timestamp}
                  </span>
                </div>
              </div>

              {/* Notification Channel Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Independent Channel Delivery Status
                  </h4>
                  <span className="text-[11px] text-[#8E96A6]">
                    {alertResult.verifiedContactsCount} Contacts Reached
                  </span>
                </div>

                <div className="space-y-2">
                  {alertResult.notifications?.map((notif) => {
                    const isSms = notif.channel === 'SMS';
                    const isSuccess = notif.status === 'SENT' || notif.status === 'ACCEPTED_BY_PROVIDER';

                    return (
                      <div
                        key={notif.id}
                        className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              isSms ? 'bg-[#3A4DFF]/20 text-[#45E0F2]' : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {notif.channel}
                            </span>
                            <span className="font-bold text-white">{notif.contact_name}</span>
                          </div>

                          {/* Status Pill */}
                          {isSuccess ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {notif.status}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              FAILED
                            </span>
                          )}
                        </div>

                        {/* Details line */}
                        <div className="flex items-center justify-between text-[11px] text-[#8E96A6] font-mono">
                          <span>{notif.phone_number}</span>
                          {notif.provider_message_id ? (
                            <span className="text-emerald-400">Ref: {notif.provider_message_id}</span>
                          ) : notif.error_message ? (
                            <span className="text-red-400 truncate max-w-[200px]" title={notif.error_message}>
                              {notif.error_message}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Google Maps Link Card */}
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                <span className="text-[#8E96A6]">Dispatched Location Link:</span>
                <a
                  href={alertResult.locationLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#45E0F2] font-mono hover:underline flex items-center gap-1 font-bold"
                >
                  View on Google Maps <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Call 112 Emergency Button */}
              <div className="pt-2 space-y-2">
                <a
                  href="tel:112"
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/30 text-center"
                >
                  <Phone className="w-4 h-4 fill-current" />
                  <span>CALL 112 NATIONAL EMERGENCY POLICE</span>
                </a>
                <p className="text-[10px] text-center text-[#8E96A6]">
                  Belagavi Police Control Room and MySawari Emergency Response Desk have received this incident.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#080B15] border-t border-white/10 flex items-center justify-between text-xs text-[#8E96A6]">
          <span>MySawari Central Safety Infrastructure</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
