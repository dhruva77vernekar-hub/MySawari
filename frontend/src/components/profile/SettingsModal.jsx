import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  User, 
  Bookmark, 
  Info, 
  LogOut, 
  Trash2, 
  Check, 
  Plus, 
  AlertTriangle,
  MapPin,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SettingsModal({ isOpen, onClose }) {
  const { user, updateProfile, addShortcut, removeShortcut, signOut, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'shortcuts' | 'about' | 'danger'
  
  // Profile edit state
  const [fullName, setFullName] = useState(user?.fullName || 'Dhruv Patil');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [email, setEmail] = useState(user?.email || 'dhruv@mysawari.app');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Shortcut add state
  const [shortcutLabel, setShortcutLabel] = useState('');
  const [shortcutAddress, setShortcutAddress] = useState('');

  // Delete confirm state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile({ fullName, phone, email });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleAddShortcut = (e) => {
    e.preventDefault();
    if (!shortcutLabel.trim() || !shortcutAddress.trim()) return;
    addShortcut(shortcutLabel, shortcutAddress);
    setShortcutLabel('');
    setShortcutAddress('');
  };

  const handleLogout = () => {
    signOut();
    onClose();
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    deleteAccount();
    onClose();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[32px] border border-[#DCDAF0] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#DCDAF0] flex items-center justify-between">
          <div>
            <span className="hud text-xs text-[#3A4DFF] font-bold">MYSAWARI PREFERENCES</span>
            <h2 className="text-2xl font-bold text-[#0A0A14]">Settings & Account</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#F1F0FA] hover:bg-[#E9ECF2] flex items-center justify-center text-[#5B5B73] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#DCDAF0] px-6 gap-2 overflow-x-auto scrollbar-none bg-[#F1F0FA]/50">
          {[
            { id: 'profile', label: 'Profile Info', icon: User },
            { id: 'shortcuts', label: 'Saved Shortcuts', icon: Bookmark },
            { id: 'about', label: 'About MySawari', icon: Info },
            { id: 'danger', label: 'Account & Security', icon: ShieldAlert }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-[#3A4DFF] text-[#3A4DFF]'
                    : 'border-transparent text-[#5B5B73] hover:text-[#0A0A14]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: PROFILE INFO */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5B5B73] mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-12 px-4 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] focus:bg-white outline-none text-sm font-medium text-[#0A0A14]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B5B73] mb-1.5 uppercase tracking-wider">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-12 px-4 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] focus:bg-white outline-none text-sm font-medium text-[#0A0A14]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B5B73] mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] focus:bg-white outline-none text-sm font-medium text-[#0A0A14]"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                {saveSuccess ? (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Profile updated successfully!
                  </span>
                ) : (
                  <span className="text-xs text-[#8E96A6]">Changes apply to future rides</span>
                )}

                <button
                  type="submit"
                  className="px-6 py-3 rounded-full bg-[#0A0A14] hover:bg-[#3A4DFF] text-white text-xs font-bold uppercase transition-colors shadow-md"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SAVED SHORTCUTS */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-[#0A0A14]">Your Saved Destinations</h3>
                <p className="text-xs text-[#5B5B73]">Quick 1-tap booking shortcuts for your frequent places in Belagavi.</p>
                
                <div className="space-y-2 pt-2">
                  {user?.shortcuts?.map((sc) => (
                    <div
                      key={sc.id}
                      className="p-3.5 bg-[#F1F0FA] rounded-2xl flex items-center justify-between border border-[#DCDAF0]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#3A4DFF]">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-[#0A0A14]">{sc.label}</p>
                          <p className="text-[11px] text-[#5B5B73]">{sc.address}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeShortcut(sc.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title="Remove shortcut"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Shortcut Form */}
              <form onSubmit={handleAddShortcut} className="p-4 bg-white rounded-2xl border border-[#DCDAF0] space-y-3">
                <h4 className="font-bold text-xs text-[#3A4DFF] uppercase tracking-wider">
                  + Add New Shortcut
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    placeholder="Label (e.g. Gym, Library, Office)"
                    value={shortcutLabel}
                    onChange={(e) => setShortcutLabel(e.target.value)}
                    className="h-11 px-3 bg-[#F1F0FA] rounded-xl text-xs font-medium outline-none border border-transparent focus:border-[#3A4DFF]"
                  />
                  <input
                    placeholder="Address in Belagavi"
                    value={shortcutAddress}
                    onChange={(e) => setShortcutAddress(e.target.value)}
                    className="h-11 px-3 bg-[#F1F0FA] rounded-xl text-xs font-medium outline-none border border-transparent focus:border-[#3A4DFF]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#3A4DFF] hover:bg-[#2b3cee] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Save Shortcut
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-4 text-xs text-[#5B5B73]">
              <div className="p-4 bg-[#F1F0FA] rounded-2xl border border-[#DCDAF0] space-y-2">
                <span className="hud text-[10px] text-[#3A4DFF] font-bold">APPLICATION INFO</span>
                <h4 className="font-bold text-base text-[#0A0A14]">MySawari v2.4.0</h4>
                <p>
                  Belagavi's first physical 3D ride-hailing and multi-modal urban transit system. Built for speed, fare transparency, and student/commuter safety.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-xl border border-[#DCDAF0]">
                  <span className="font-bold text-[#0A0A14] block">Team</span>
                  <span>Polar Geeks (4 Members)</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#DCDAF0]">
                  <span className="font-bold text-[#0A0A14] block">Demo Center</span>
                  <span>Belagavi, Karnataka (15.8497, 74.4977)</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#DCDAF0]">
                  <span className="font-bold text-[#0A0A14] block">3D Engine</span>
                  <span>Three.js + React Three Fiber + Procedural Shaders</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#DCDAF0]">
                  <span className="font-bold text-[#0A0A14] block">Backend & Routing</span>
                  <span>Node/Express + Supabase + OSRM OpenStreetMap</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ACCOUNT ACTIONS */}
          {activeTab === 'danger' && (
            <div className="space-y-6">
              {/* Logout Option */}
              <div className="p-4 rounded-2xl border border-[#DCDAF0] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#0A0A14]">Log Out of Account</h4>
                  <p className="text-xs text-[#5B5B73]">Securely sign out of MySawari on this device.</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-5 py-2.5 rounded-full bg-[#0A0A14] hover:bg-black/80 text-white font-bold text-xs flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Log Out
                </button>
              </div>

              {/* Delete Account Option */}
              <div className="p-4 rounded-2xl border border-red-200 bg-red-50/50 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#EF2B3E] mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-[#EF2B3E]">Delete Account</h4>
                    <p className="text-xs text-[#5B5B73]">
                      Permanently delete your profile, saved shortcuts, and accumulated MySawari Coins balance. This action cannot be reversed.
                    </p>
                  </div>
                </div>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 rounded-xl bg-[#EF2B3E] hover:bg-[#d41c2e] text-white font-bold text-xs flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Request Account Deletion
                  </button>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-red-300 space-y-2 animate-fade-in">
                    <p className="text-xs font-bold text-red-700">Are you absolutely sure? You will lose all 120 MySawari Coins.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteAccount}
                        className="px-4 py-1.5 bg-[#EF2B3E] text-white font-bold text-xs rounded-lg hover:bg-red-700"
                      >
                        Yes, Delete Permanently
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-1.5 bg-gray-200 text-gray-800 font-bold text-xs rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
