import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  AlertTriangle, 
  RefreshCw, 
  Send, 
  User, 
  KeyRound,
  Sparkles
} from 'lucide-react';
import api from '../../services/api';

export default function EmergencyContactsModal({ isOpen, onClose }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    contact_name: '',
    phone_number: '+91 ',
    relationship: 'Parent',
    is_primary: false
  });
  const [submitting, setSubmitting] = useState(false);

  // OTP Verification State
  const [otpModalContact, setOtpModalContact] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [otpDevHint, setOtpDevHint] = useState(null);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const data = await api.getEmergencyContacts();
      setContacts(data);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.addEmergencyContact(formData);
      setSuccessMsg('Emergency contact added successfully.');
      setFormData({ contact_name: '', phone_number: '+91 ', relationship: 'Parent', is_primary: false });
      setShowAddForm(false);
      await fetchContacts();
    } catch (err) {
      setError(err.message || 'Failed to add emergency contact.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (contactId) => {
    if (!window.confirm('Are you sure you want to remove this emergency contact?')) return;
    try {
      await api.deleteEmergencyContact(contactId);
      setSuccessMsg('Contact removed.');
      await fetchContacts();
    } catch (err) {
      setError(err.message || 'Failed to delete contact.');
    }
  };

  const handleOpenOtpModal = async (contact) => {
    setOtpModalContact(contact);
    setEnteredOtp('');
    setOtpError(null);
    setOtpDevHint(null);
    setOtpSending(true);
    try {
      const res = await api.sendContactOtp(contact.id);
      if (res?.devOtpCode) {
        setOtpDevHint(res.devOtpCode);
      }
    } catch (err) {
      setOtpError(err.message || 'Failed to send verification OTP via SMS.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!enteredOtp) return;
    setOtpVerifying(true);
    setOtpError(null);
    try {
      await api.verifyContactOtp(otpModalContact.id, enteredOtp);
      setOtpModalContact(null);
      setSuccessMsg(`Phone number verified successfully! Contact is now active for SOS alerts.`);
      await fetchContacts();
    } catch (err) {
      setOtpError(err.message || 'Incorrect verification code.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const verifiedCount = contacts.filter(c => c.is_verified).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#090C16] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-[#0C1021] to-[#080B15] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Emergency Contacts
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono font-bold">
                  SMS & WHATSAPP
                </span>
              </h3>
              <p className="text-xs text-[#8E96A6]">
                Add up to 5 verified contacts to receive real-time SOS alerts with your GPS location.
              </p>
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
          {/* Status Banners */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-2xl text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Info Badge */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
            <div>
              <span className="text-[#8E96A6] block">Active Verified Receivers:</span>
              <span className="text-base font-bold font-mono text-white">
                {verifiedCount} / 5 Contacts
              </span>
            </div>
            <div className="text-right">
              <span className="text-[#8E96A6] block">Notification Channels:</span>
              <span className="text-xs font-mono font-bold text-[#45E0F2]">
                Real SMS + WhatsApp
              </span>
            </div>
          </div>

          {/* Contacts List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Registered Emergency Contacts ({contacts.length}/5)
              </h4>
              {contacts.length < 5 && !showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-3 py-1.5 bg-[#3A4DFF] hover:bg-[#2c3ee0] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Contact</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-[#8E96A6] flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#45E0F2]" />
                <span>Loading emergency contacts...</span>
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-6 rounded-2xl bg-black/40 border border-white/5 text-center space-y-2">
                <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto opacity-80" />
                <p className="text-sm font-bold text-white">No emergency contacts registered</p>
                <p className="text-xs text-[#8E96A6]">
                  Add your family members or close friends so they receive automatic SMS and WhatsApp alerts in an emergency.
                </p>
              </div>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{contact.contact_name}</span>
                      {contact.is_primary && (
                        <span className="px-2 py-0.5 rounded-full bg-[#3A4DFF]/20 text-[#45E0F2] border border-[#3A4DFF]/30 text-[10px] font-bold font-mono">
                          PRIMARY
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-[#8E96A6] text-[10px] font-mono">
                        {contact.relationship}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-[#8E96A6]">
                      <Phone className="w-3.5 h-3.5 text-[#45E0F2]" />
                      <span>{contact.phone_number}</span>
                    </div>
                  </div>

                  {/* Verification Status & Actions */}
                  <div className="flex items-center gap-2.5 self-end sm:self-auto">
                    {contact.is_verified ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        VERIFIED
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenOtpModal(contact)}
                        className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Verify Phone</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="p-1.5 text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                      title="Remove Contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Contact Form (Collapsible) */}
          {showAddForm && (
            <form onSubmit={handleAddSubmit} className="p-5 rounded-2xl bg-[#0B0F1E] border border-[#3A4DFF]/30 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <User className="w-4 h-4 text-[#45E0F2]" /> Add New Emergency Contact
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-[#8E96A6] hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[#8E96A6] font-bold">Contact Full Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Patil"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#3A4DFF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#8E96A6] font-bold">Mobile Number (with Country Code):</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-[#3A4DFF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#8E96A6] font-bold">Relationship:</label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full bg-[#0E1325] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#3A4DFF]"
                  >
                    <option value="Parent">Parent</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Friend</option>
                    <option value="Relative">Relative</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="is_primary"
                    checked={formData.is_primary}
                    onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                    className="accent-[#3A4DFF] w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="is_primary" className="text-white text-xs cursor-pointer font-bold">
                    Set as Primary Contact
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#3A4DFF] hover:bg-[#2c3ee0] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>{submitting ? 'Saving...' : 'Save Emergency Contact'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#0B0D16] border-t border-white/10 flex items-center justify-between text-xs text-[#8E96A6]">
          <span>Protected with international E.164 normalization</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* SUB-MODAL: OTP VERIFICATION DIALOG */}
      {otpModalContact && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#0C1021] border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <KeyRound className="w-4 h-4 text-[#45E0F2]" />
                <span>Verify Emergency Contact</span>
              </div>
              <button onClick={() => setOtpModalContact(null)} className="text-[#8E96A6] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#8E96A6]">
              A 6-digit OTP verification code was sent via MSG91 SMS gateway to <strong className="text-white font-mono">{otpModalContact.phone_number}</strong>.
            </p>

            {otpDevHint && (
              <div className="p-2.5 bg-[#3A4DFF]/20 border border-[#3A4DFF]/40 rounded-xl text-xs text-[#45E0F2] font-mono flex items-center justify-between">
                <span>SMS Delivery Code:</span>
                <span className="font-bold text-base tracking-widest text-white">{otpDevHint}</span>
              </div>
            )}

            {otpError && (
              <div className="p-2.5 bg-red-500/20 border border-red-500/30 rounded-xl text-xs text-red-300">
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                autoFocus
                placeholder="000000"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold bg-white/5 border border-white/20 rounded-2xl py-3 text-white outline-none focus:border-[#45E0F2]"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenOtpModal(otpModalContact)}
                  disabled={otpSending}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-[#8E96A6] hover:text-white text-xs font-bold rounded-xl transition-all"
                >
                  {otpSending ? 'Resending...' : 'Resend OTP'}
                </button>
                <button
                  type="submit"
                  disabled={otpVerifying || enteredOtp.length < 4}
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  {otpVerifying ? 'Verifying...' : 'Verify & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
