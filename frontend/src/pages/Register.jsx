import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, ArrowRight, ShieldCheck, Mail, Phone, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { registerUser } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !phone || !email || !password) {
      setError('Please fill out all required fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await registerUser({ fullName, email, phone, password });
      setLoading(false);
      navigate('/');
    } catch (err) {
      setLoading(false);
      setError(err?.message || 'Failed to create account.');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-4 bg-[#F1F0FA]">
      <div className="max-w-xl w-full rounded-[32px] bg-white border border-[#DCDAF0] p-8 md:p-12 shadow-[0_20px_70px_-20px_rgba(58,77,255,0.15)] space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <span className="hud text-xs text-[#3A4DFF] font-bold tracking-wider">
              CUSTOMER REGISTRATION
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Belagavi City
            </span>
          </div>
          <div className="flex items-center gap-2.5 mt-1">
            <img src="/logo.png" alt="MySawari Logo" className="w-8 h-8 rounded-xl object-contain shadow-xs" />
            <h1 className="text-3xl font-bold text-[#0A0A14] tracking-tight">
              Create Customer Account
            </h1>
          </div>
          <p className="text-xs text-[#5B5B73] mt-1">
            Join MySawari for faster rides, transparent fares, and instant 3D vehicle booking.
          </p>
        </div>

        {/* Highlight Banner to Rider Registration */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#3A4DFF]/10 via-[#3A4DFF]/5 to-transparent border border-[#3A4DFF]/20 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#0A0A14]">Want to earn money driving?</p>
            <p className="text-[11px] text-[#5B5B73]">Register your Bike, Auto, or Cab as a Rider (Captain).</p>
          </div>
          <Link
            to="/rider/register"
            className="px-3.5 py-2 rounded-xl bg-[#0A0A14] hover:bg-[#3A4DFF] text-white text-[11px] font-bold tracking-wider uppercase transition-colors shrink-0"
          >
            Rider Register →
          </Link>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#5B5B73] mb-1.5 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 w-4 h-4 text-[#8E96A6]" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dhruv Patil"
                className="w-full h-12 pl-10 pr-4 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] focus:bg-white outline-none text-sm font-medium text-[#0A0A14]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5B5B73] mb-1.5 uppercase tracking-wider">
                Mobile Number
              </label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3.5 w-4 h-4 text-[#8E96A6]" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full h-12 pl-10 pr-4 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] focus:bg-white outline-none text-sm font-medium text-[#0A0A14]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5B5B73] mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-[#8E96A6]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full h-12 pl-10 pr-4 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] focus:bg-white outline-none text-sm font-medium text-[#0A0A14]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5B5B73] mb-1.5 uppercase tracking-wider">
              Create Password / Passcode
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-[#8E96A6]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a secure password"
                className="w-full h-12 pl-10 pr-4 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] focus:bg-white outline-none text-sm font-medium text-[#0A0A14]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full bg-[#0A0A14] hover:bg-[#3A4DFF] text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-[0_15px_35px_-10px_rgba(58,77,255,0.4)] transition-all flex items-center justify-center gap-2 select-none cursor-pointer mt-2"
          >
            <span>{loading ? 'CREATING ACCOUNT...' : 'REGISTER & START RIDING'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-xs text-center text-[#5B5B73] pt-2 border-t border-[#DCDAF0]">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#3A4DFF] hover:underline">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
