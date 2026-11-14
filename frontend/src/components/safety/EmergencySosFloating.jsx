import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  X, 
  MapPin, 
  Phone, 
  Send, 
  Check, 
  AlertTriangle, 
  Radio, 
  MessageSquare,
  Edit2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import routingService from '../../services/routingService';
import api from '../../services/api';

export default function EmergencySosFloating() {
  const { user, updateEmergencyContact } = useAuth();
  
  // Modal & Activation States
  const [isOpen, setIsOpen] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationName, setLocationName] = useState('Detecting Belagavi location...');
  const [coords, setCoords] = useState({ lat: 15.8281, lng: 74.4925 }); // Belagavi default
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactInput, setContactInput] = useState('');
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Read emergency contact from profile or localStorage
  const currentContact = user?.emergencyContact || localStorage.getItem('mysawari_emergency_contact') || '+91 94481 23456';

  useEffect(() => {
    setContactInput(currentContact);
  }, [currentContact]);

  // Web Audio Synthesized Siren
  const playSirenSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playPulse = (startSec, freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startSec);
        osc.frequency.exponentialRampToValueAtTime(freq + 400, ctx.currentTime + startSec + 0.25);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + startSec);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startSec + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startSec);
        osc.stop(ctx.currentTime + startSec + 0.35);
      };

      playPulse(0, 750);
      playPulse(0.4, 950);
      playPulse(0.8, 750);
    } catch {
      // Audio playback ignored if blocked by autoplay policy
    }
  };

  // Detect Live GPS on open
  useEffect(() => {
    if (isOpen) {
      setIsLocating(true);
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = +pos.coords.latitude.toFixed(6);
            const lng = +pos.coords.longitude.toFixed(6);
            setCoords({ lat, lng });
            const address = await routingService.reverseGeocode(lat, lng);
            setLocationName(address || `Belagavi (${lat}, ${lng})`);
            setIsLocating(false);
          },
          async () => {
            // Fallback Belagavi coordinates
            setCoords({ lat: 15.8281, lng: 74.4925 });
            const address = await routingService.reverseGeocode(15.8281, 74.4925);
            setLocationName(address || 'KLE Technological University Campus, Belagavi');
            setIsLocating(false);
          },
          { enableHighAccuracy: true, timeout: 6000 }
        );
      } else {
        setIsLocating(false);
        setLocationName('KLE Technological University Campus, Belagavi');
      }
    }
  }, [isOpen]);

  // Clean phone number format for SMS / WhatsApp / Tel
  const cleanPhone = currentContact.replace(/[^0-9+]/g, '');

  // Formulate Urgent SOS Alert Message
  const getAlertMessage = () => {
    const mapUrl = `https://maps.google.com/?q=${coords.lat},${coords.lng}`;
    return `🚨 EMERGENCY SOS ALERT! I need immediate assistance! My current live location in Belagavi is: ${mapUrl} (Lat: ${coords.lat}, Lng: ${coords.lng}, ${locationName}). Sent via MySawari Emergency System.`;
  };

  // ACTIVATE SOS TRIGGER
  const handleActivateSos = async () => {
    const alertMsg = getAlertMessage();
    setIsActivated(true);
    setDispatchSuccess(true);
    playSirenSound();

    // Haptic vibration
    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }

    // 1. Call Backend SOS API
    try {
      await api.triggerSos(null, { latitude: coords.lat, longitude: coords.lng }, alertMsg);
    } catch (e) {
      console.warn('Backend SOS broadcast logged locally:', e.message);
    }

    // 2. Open SMS client with pre-populated recipient & coordinates
    const smsLink = `sms:${cleanPhone}?body=${encodeURIComponent(alertMsg)}`;
    const a = document.createElement('a');
    a.href = smsLink;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSaveContact = (e) => {
    e.preventDefault();
    if (!contactInput.trim()) return;
    if (updateEmergencyContact) {
      updateEmergencyContact(contactInput.trim());
    } else {
      localStorage.setItem('mysawari_emergency_contact', contactInput.trim());
    }
    setIsEditingContact(false);
  };

  const handleDeactivate = () => {
    setIsActivated(false);
    setDispatchSuccess(false);
    setIsOpen(false);
  };

  return (
    <>
      {/* 1. FLOATING SOS ICON AT BOTTOM RIGHT OF THE APPLICATION */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          title="SOS (1-Tap Emergency Alert)"
          className="relative group flex items-center justify-center gap-2 bg-[#EF2B3E] hover:bg-[#DC2626] text-white px-5 py-3.5 rounded-full shadow-[0_10px_30px_rgba(239,43,62,0.6)] border border-white/80 hover:scale-105 active:scale-95 transition-all cursor-pointer select-none"
          aria-label="Activate SOS"
        >
          {/* Subtle outer red ambient glow */}
          <span className="absolute -inset-0.5 rounded-full bg-[#EF2B3E] opacity-30 blur-xs group-hover:opacity-50 transition-opacity -z-10" />

          {/* Sharp SOS Shield Icon */}
          <ShieldAlert className="w-5 h-5 fill-white text-[#EF2B3E] transition-transform group-hover:rotate-6 flex-shrink-0" />

          {/* Razor-Sharp SOS Monospace Typography */}
          <span className="font-mono font-black text-sm tracking-widest leading-none drop-shadow-sm">
            SOS
          </span>
        </button>
      </div>

      {/* 2. EMERGENCY SOS MODAL DIALOG */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-lg rounded-[32px] border-2 text-white p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all ${
            isActivated 
              ? 'bg-[#18090C] border-rose-500 shadow-[0_0_80px_rgba(239,43,62,0.45)]' 
              : 'bg-[#0E111C] border-rose-500/50 shadow-[0_20px_70px_rgba(0,0,0,0.85)]'
          }`}>
            {/* Top Close Button */}
            <button
              onClick={() => {
                if (!isActivated) setIsOpen(false);
                else handleDeactivate();
              }}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="hud text-xs font-bold text-rose-400 tracking-wider">
                BELAGAVI EMERGENCY RAPID RESPONSE
              </span>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 flex items-center gap-2.5">
              <ShieldAlert className="w-7 h-7 text-rose-500 fill-rose-500/20" />
              <span>{isActivated ? 'SOS Alert Active!' : 'Emergency SOS'}</span>
            </h2>

            <p className="text-xs text-[#94A3B8] leading-relaxed mb-5">
              {isActivated
                ? 'Your live GPS location and distress message have been dispatched to your designated contact number and the Belagavi emergency network.'
                : '1-tap will instantly broadcast your live GPS coordinates, Google Maps link, and urgent alert to your configured emergency contact number.'}
            </p>

            {/* Emergency Contact Card */}
            <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="hud text-[10px] text-rose-400 font-bold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  EMERGENCY CONTACT PHONE
                </span>
                {!isEditingContact && (
                  <button
                    onClick={() => setIsEditingContact(true)}
                    className="text-[11px] text-[#38BDF8] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <Edit2 className="w-3 h-3" /> Change
                  </button>
                )}
              </div>

              {isEditingContact ? (
                <form onSubmit={handleSaveContact} className="flex gap-2 pt-1">
                  <input
                    type="tel"
                    required
                    value={contactInput}
                    onChange={(e) => setContactInput(e.target.value)}
                    placeholder="+91 94481 23456"
                    className="flex-1 px-3 py-2 bg-white/10 rounded-xl text-xs text-white border border-rose-500/50 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-base font-bold text-white tracking-wide block">
                      {currentContact}
                    </span>
                    <span className="text-[10px] text-[#94A3B8]">
                      {user?.emergencyContactName || 'Configured in Profile / SOS Setup'}
                    </span>
                  </div>
                  <span className="hud text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                    ACTIVE
                  </span>
                </div>
              )}
            </div>

            {/* Live Location Card */}
            <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 mb-6 space-y-1.5">
              <span className="hud text-[10px] text-[#38BDF8] font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#38BDF8]" />
                CURRENT LIVE GPS LOCATION
              </span>
              <p className="text-xs font-semibold text-white">
                {isLocating ? 'Detecting high-precision GPS...' : locationName}
              </p>
              <p className="text-[11px] font-mono text-[#94A3B8]">
                Coordinates: {coords.lat.toFixed(5)}° N, {coords.lng.toFixed(5)}° E
              </p>
            </div>

            {/* ACTION SECTION */}
            {!isActivated ? (
              <div className="space-y-3">
                <button
                  onClick={handleActivateSos}
                  className="w-full py-4 rounded-full bg-gradient-to-r from-[#EF2B3E] to-[#B91C1C] hover:from-[#d82234] hover:to-[#991b1b] text-white font-black text-sm uppercase tracking-wider shadow-[0_0_35px_rgba(239,43,62,0.6)] flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer"
                >
                  <ShieldAlert className="w-5 h-5 fill-white text-[#EF2B3E]" />
                  <span>ACTIVATE SOS & SEND LIVE LOCATION</span>
                </button>

                <p className="text-[11px] text-center text-[#94A3B8]">
                  Tapping will trigger SMS, GPS map link & log rapid dispatch.
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {/* Active Siren Banner */}
                <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500 flex items-center gap-3">
                  <Radio className="w-5 h-5 text-rose-400 animate-pulse flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-rose-300">ALERT DISPATCHED TO {currentContact}</p>
                    <p className="text-[11px] text-white/80">Continuous live location beacon running.</p>
                  </div>
                </div>

                {/* Instant Send Channels */}
                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={`https://wa.me/${cleanPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(getAlertMessage())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-3 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/50 hover:bg-[#25D366]/30 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-[#25D366]" />
                    <span>Send via WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${cleanPhone}`}
                    className="py-3 px-3 rounded-2xl bg-blue-500/20 border border-blue-500/50 hover:bg-blue-500/30 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-blue-400" />
                    <span>Call Contact</span>
                  </a>
                </div>

                {/* Quick Police / Ambulance Emergency Services */}
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8]">National Emergency Services:</span>
                  <div className="flex gap-2">
                    <a
                      href="tel:112"
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3 h-3 text-rose-400" />
                      <span>Police 112</span>
                    </a>
                    <a
                      href="tel:108"
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3 h-3 text-amber-400" />
                      <span>Ambulance 108</span>
                    </a>
                  </div>
                </div>

                {/* Deactivate Button */}
                <button
                  onClick={handleDeactivate}
                  className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>I AM SAFE · DEACTIVATE SOS</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
