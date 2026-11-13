import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ShieldCheck, Lock, Mail, Sparkles, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VehicleMorphCanvas from '../three/VehicleMorphCanvas';
import DotGrid from '../components/ui/DotGrid';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('dhruv@mysawari.app');
  const [passcode, setPasscode] = useState('4912');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !passcode) {
      setError('Please provide both email and passcode.');
      return;
    }
    setError('');
    setLoading(true);
    await signIn(email, passcode);
    setLoading(false);
    // Redirect directly towards the main page
    navigate('/');
  };

  return (
    <div className="relative min-h-screen bg-[#F1F0FA] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background DotGrid (React Bits) */}
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
      <div className="relative z-10 max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 rounded-[32px] overflow-hidden bg-white/90 backdrop-blur-xl border border-[#DCDAF0] shadow-[0_30px_90px_-25px_rgba(58,77,255,0.25)]">
        
        {/* Left Side: 3D Vehicle Interactive Stage (7 cols) */}
        <div className="lg:col-span-7 bg-gradient-to-br from-[#E9ECF2] via-[#F1F0FA] to-[#C9CFDA]/40 p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#DCDAF0] relative overflow-hidden">
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

            <div className="w-full h-64 sm:h-72 mt-2">
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

        {/* Right Side: Sleek Login Form (5 cols) */}
        <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between space-y-8 bg-white">
          <div>
            <div className="space-y-1 mb-6">
              <span className="hud text-xs text-[#3A4DFF] font-bold">RIDER & CAPTAIN ACCESS</span>
              <h1 className="text-3xl font-bold text-[#0A0A14] tracking-tight">Welcome Back</h1>
              <p className="text-xs text-[#5B5B73]">
                Enter your registered credentials to launch your MySawari account.
              </p>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#5B5B73] uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-[#8E96A6] pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full h-14 pl-11 pr-4 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] focus:bg-white text-sm font-medium text-[#0A0A14] outline-none transition-all placeholder:text-[#8E96A6]"
                  />
                </div>
              </div>

              {/* Passcode / PIN */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#5B5B73] uppercase tracking-wider">
                    Passcode / PIN
                  </label>
                  <span className="text-[11px] text-[#3A4DFF] hover:underline cursor-pointer font-medium">
                    Forgot?
                  </span>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-[#8E96A6] pointer-events-none">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter your 4 or 6 digit passcode"
                    className="w-full h-14 pl-11 pr-12 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] focus:bg-white text-sm font-medium text-[#0A0A14] outline-none transition-all placeholder:text-[#8E96A6]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 text-[#8E96A6] hover:text-[#0A0A14] transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-full bg-[#0A0A14] hover:bg-[#3A4DFF] text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-[0_15px_35px_-10px_rgba(58,77,255,0.5)] transition-all transform active:scale-98 flex items-center justify-center gap-2 select-none cursor-pointer mt-6"
              >
                <span>{loading ? 'AUTHENTICATING...' : 'LOG IN & ENTER MYSAWARI'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Hint */}
            <div className="mt-4 p-3 rounded-2xl bg-[#F1F0FA] border border-[#DCDAF0] text-center">
              <span className="hud text-[10px] text-[#8E96A6] block">HACKATHON QUICK DEMO LOGIN</span>
              <p className="text-xs text-[#0A0A14] font-medium mt-0.5">
                Pre-filled: <code>dhruv@mysawari.app</code> · PIN: <code>4912</code>
              </p>
            </div>
          </div>

          <p className="text-xs text-center text-[#5B5B73]">
            New to MySawari?{' '}
            <Link to="/register" className="font-semibold text-[#3A4DFF] hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
