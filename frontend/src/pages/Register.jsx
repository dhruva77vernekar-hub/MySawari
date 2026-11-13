import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { switchRole } = useAuth();
  const [role, setRole] = useState('rider'); // 'rider' | 'captain'
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    switchRole(role);
    if (role === 'captain') {
      navigate('/captain');
    } else {
      navigate('/book');
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 flex items-center justify-center px-4">
      <div className="max-w-xl w-full rounded-[28px] bg-white border border-[#DCDAF0] p-8 md:p-12 shadow-2xl space-y-6">
        <div>
          <span className="hud text-xs text-[#3A4DFF] font-bold">REGISTRATION</span>
          <h1 className="text-3xl font-bold text-[#0A0A14] tracking-tight">Create your account</h1>
          <p className="text-xs text-[#5B5B73] mt-1">Join MySawari for faster Belagavi rides or flexible captain earnings.</p>
        </div>

        {/* Role Selector Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div
            onClick={() => setRole('rider')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              role === 'rider'
                ? 'border-[#3A4DFF] bg-[#F1F0FA] ring-2 ring-[#3A4DFF]/20'
                : 'border-[#DCDAF0] hover:border-black/20'
            }`}
          >
            <User className={`w-6 h-6 mb-2 ${role === 'rider' ? 'text-[#3A4DFF]' : 'text-[#8E96A6]'}`} />
            <h4 className="font-bold text-sm text-[#0A0A14]">Rider</h4>
            <p className="text-[11px] text-[#5B5B73]">Book bike, cab & scooter</p>
          </div>

          <div
            onClick={() => setRole('captain')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              role === 'captain'
                ? 'border-[#3A4DFF] bg-[#F1F0FA] ring-2 ring-[#3A4DFF]/20'
                : 'border-[#DCDAF0] hover:border-black/20'
            }`}
          >
            <Shield className={`w-6 h-6 mb-2 ${role === 'captain' ? 'text-[#3A4DFF]' : 'text-[#8E96A6]'}`} />
            <h4 className="font-bold text-sm text-[#0A0A14]">Captain</h4>
            <p className="text-[11px] text-[#5B5B73]">Earn per trip in Belagavi</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#5B5B73] mb-1.5 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Dhruv Patil"
              className="w-full h-12 px-4 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] outline-none text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5B5B73] mb-1.5 uppercase tracking-wider">
                Mobile Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full h-12 px-4 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] outline-none text-sm font-medium"
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
                placeholder="name@email.com"
                className="w-full h-12 px-4 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] outline-none text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5B5B73] mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              className="w-full h-12 px-4 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] outline-none text-sm font-medium"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-full bg-[#0A0A14] hover:bg-[#3A4DFF] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 mt-4"
          >
            <span>JOIN AS {role.toUpperCase()}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-xs text-center text-[#5B5B73]">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#3A4DFF] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
