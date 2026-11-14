import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Car, 
  SlidersHorizontal,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VehicleMorphCanvas from '../three/VehicleMorphCanvas';
import DotGrid from '../components/ui/DotGrid';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  // 3-Role selector: 'user' | 'rider' | 'admin'
  const [selectedRole, setSelectedRole] = useState('user');

  // Form states configured per role
  const roleCredentials = {
    user: {
      email: 'dhruv@mysawari.app',
      passcode: '4912',
      badge: 'CUSTOMER ACCESS',
      desc: 'Book bike, auto & cab rides with 3D reveal and transparent fares.',
      redirect: '/'
    },
    rider: {
      email: 'suresh.patil@mysawari.app',
      passcode: '4912',
      badge: 'RIDER / CAPTAIN PORTAL',
      desc: 'Accept ride dispatches, enter passenger OTP and earn reassignment rewards.',
      redirect: '/rider/dashboard'
    },
    admin: {
      email: 'admin@mysawari.app',
      passcode: 'admin2026',
      badge: 'ADMIN OPERATIONS HUB',
      desc: 'Smart dispatch, driver verification, automatic reassignment simulation.',
      redirect: '/admin'
    }
  };

  const [email, setEmail] = useState(roleCredentials.user.email);
  const [passcode, setPasscode] = useState(roleCredentials.user.passcode);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setEmail(roleCredentials[role].email);
    setPasscode(roleCredentials[role].passcode);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !passcode) {
      setError('Please provide both email and passcode.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const loggedUser = await signIn(email, passcode, selectedRole);
      setLoading(false);

      if (selectedRole === 'admin') {
        navigate('/admin');
      } else if (selectedRole === 'rider') {
        if (loggedUser.status === 'PENDING_APPROVAL' || loggedUser.applicationStatus === 'PENDING_APPROVAL') {
          navigate('/rider/application-status');
        } else if (loggedUser.status === 'REJECTED' || loggedUser.applicationStatus === 'REJECTED') {
          navigate('/rider/application-status');
        } else {
          navigate('/rider/dashboard');
        }
      } else {
        // Customer / User -> preserves read-only customer interface
        navigate('/');
      }
    } catch (err) {
      setLoading(false);
      setError(err?.message || 'Authentication failed. Please check credentials.');
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F1F0FA] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background DotGrid */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
        <DotGrid
          baseColor="#C9CFDA"
          activeColor="#3A4DFF"
          shape="circle"
          dotSize={4}
          gap={24}
          proximity={130}
          strength={1.1}
          glow={0.5}
        />
      </div>

      {/* Main 3D Glassmorphism Login Container */}
      <div className="relative z-10 max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 rounded-[32px] overflow-hidden bg-white/95 backdrop-blur-xl border border-[#DCDAF0] shadow-[0_30px_90px_-25px_rgba(58,77,255,0.25)]">
        
        {/* Left Side: 3D Vehicle Interactive Stage */}
        <div className="lg:col-span-6 bg-gradient-to-br from-[#E9ECF2] via-[#F1F0FA] to-[#C9CFDA]/40 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#DCDAF0] relative overflow-hidden">
          {/* Top Stage HUD */}
          <div className="flex items-center justify-between text-xs text-[#5B5B73]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3A4DFF] animate-pulse" />
              <span className="hud font-bold text-[#0A0A14] tracking-widest">MYSAWARI 3D GATEWAY</span>
            </div>
            <span className="hud px-2.5 py-1 rounded-full bg-white/80 border border-[#DCDAF0] text-[#3A4DFF] font-semibold">
              BELAGAVI HUB
            </span>
          </div>

          {/* Center 3D Vehicle Morph Visual */}
          <div className="my-auto py-4 flex flex-col items-center text-center">
            <span className="hud text-[11px] text-[#3A4DFF] tracking-[0.2em] font-bold block mb-1">
              PHYSICAL 3D RIDE REVEAL
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0A0A14]">
              One tap. Any ride.
            </h2>
            <p className="text-xs sm:text-sm text-[#5B5B73] max-w-xs mt-1">
              Morph into Cabs, Bike Taxis, and Autos with instant live fare transparency.
            </p>

            <div className="w-full h-56 sm:h-64 mt-2">
              <VehicleMorphCanvas compact={true} />
            </div>
          </div>

          {/* Bottom Stage Badge */}
          <div className="flex items-center justify-between text-[11px] text-[#8E96A6] pt-4 border-t border-black/5">
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% Encrypted Login
            </span>
            <span className="hud">VER 2.4 · 2026</span>
          </div>
        </div>

        {/* Right Side: 3-Role Login Form */}
        <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between space-y-6 bg-white">
          <div>
            <div className="space-y-1 mb-5">
              <span className="hud text-xs text-[#3A4DFF] font-bold tracking-wider">
                {roleCredentials[selectedRole].badge}
              </span>
              <div className="flex items-center gap-2.5">
                <img src="/logo.png" alt="MySawari Logo" className="w-8 h-8 rounded-xl object-contain shadow-xs" />
                <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0A14] tracking-tight">
                  Welcome to MySawari
                </h1>
              </div>
              <p className="text-xs text-[#5B5B73]">
                {roleCredentials[selectedRole].desc}
              </p>
            </div>

            {/* Clear 3-Role Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#F1F0FA] rounded-2xl border border-[#DCDAF0] mb-5">
              {/* User Tab */}
              <button
                type="button"
                onClick={() => handleRoleChange('user')}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
                  selectedRole === 'user'
                    ? 'bg-white text-[#3A4DFF] font-bold shadow-md border border-[#DCDAF0]/50'
                    : 'text-[#5B5B73] hover:text-[#0A0A14] font-medium'
                }`}
              >
                <User className="w-4 h-4 mb-1" />
                <span className="text-[11px] uppercase tracking-wider">User</span>
              </button>

              {/* Rider (Captain) Tab */}
              <button
                type="button"
                onClick={() => handleRoleChange('rider')}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
                  selectedRole === 'rider'
                    ? 'bg-white text-[#3A4DFF] font-bold shadow-md border border-[#DCDAF0]/50'
                    : 'text-[#5B5B73] hover:text-[#0A0A14] font-medium'
                }`}
              >
                <Car className="w-4 h-4 mb-1" />
                <span className="text-[11px] uppercase tracking-wider">Rider</span>
              </button>

              {/* Admin Tab */}
              <button
                type="button"
                onClick={() => handleRoleChange('admin')}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'bg-[#0A0A14] text-white font-bold shadow-md'
                    : 'text-[#5B5B73] hover:text-[#0A0A14] font-medium'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 mb-1" />
                <span className="text-[11px] uppercase tracking-wider">Admin</span>
              </button>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#5B5B73] uppercase tracking-wider">
                  {selectedRole === 'admin' ? 'Admin ID / Email' : 'Email Address'}
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-[#8E96A6] pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full h-12 pl-10 pr-4 bg-[#F1F0FA] rounded-xl border border-transparent focus:border-[#3A4DFF] focus:bg-white text-xs sm:text-sm font-medium text-[#0A0A14] outline-none transition-all placeholder:text-[#8E96A6]"
                  />
                </div>
              </div>

              {/* Passcode / PIN */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-[#5B5B73] uppercase tracking-wider">
                    {selectedRole === 'admin' ? 'Security Passcode' : 'Passcode / PIN'}
                  </label>
                  <span className="text-[10px] text-[#3A4DFF] hover:underline cursor-pointer font-medium">
                    Forgot?
                  </span>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-[#8E96A6] pointer-events-none">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter passcode"
                    className="w-full h-12 pl-10 pr-10 bg-[#F1F0FA] rounded-xl border border-transparent focus:border-[#3A4DFF] focus:bg-white text-xs sm:text-sm font-medium text-[#0A0A14] outline-none transition-all placeholder:text-[#8E96A6]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 text-[#8E96A6] hover:text-[#0A0A14] transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider shadow-lg transition-all transform active:scale-98 flex items-center justify-center gap-2 select-none cursor-pointer mt-4 ${
                  selectedRole === 'admin'
                    ? 'bg-[#0A0A14] hover:bg-[#1E1E2F] text-white shadow-black/20'
                    : 'bg-[#3A4DFF] hover:bg-[#2B3CD9] text-white shadow-[#3A4DFF]/30'
                }`}
              >
                <span>
                  {loading
                    ? 'AUTHENTICATING...'
                    : selectedRole === 'admin'
                    ? 'ENTER ADMIN CONSOLE'
                    : selectedRole === 'rider'
                    ? 'ENTER RIDER DASHBOARD'
                    : 'LOG IN & BOOK RIDE'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick 1-Click Role Fill Box */}
            <div className="mt-3.5 p-3 rounded-xl bg-[#F8F8FC] border border-[#DCDAF0] flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="hud text-[9px] text-[#8E96A6] uppercase">DEMO CREDENTIALS</span>
                <p className="font-mono text-[11px] text-[#0A0A14] font-semibold">
                  {roleCredentials[selectedRole].email} · {roleCredentials[selectedRole].passcode}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Auto-filled
              </span>
            </div>
          </div>

          {/* Links for separate registrations */}
          <div className="space-y-1.5 pt-2 border-t border-[#DCDAF0]/50 text-center text-xs text-[#5B5B73]">
            <p>
              New passenger?{' '}
              <Link to="/register" className="font-semibold text-[#3A4DFF] hover:underline">
                Create User Account
              </Link>
            </p>
            <p className="text-[11px]">
              Want to drive and earn?{' '}
              <Link to="/rider/register" className="font-semibold text-emerald-600 hover:underline">
                Register as Rider (Captain)
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
