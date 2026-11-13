import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VehicleMorphCanvas from '../three/VehicleMorphCanvas';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, role } = useAuth();
  const [email, setEmail] = useState('dhruv@mysawari.app');
  const [password, setPassword] = useState('password123');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    signIn(email, password);
    setTimeout(() => {
      setLoading(false);
      navigate('/book');
    }, 400);
  };

  return (
    <div className="min-h-screen pt-20 pb-12 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 rounded-[28px] overflow-hidden bg-white border border-[#DCDAF0] shadow-2xl">
        {/* Left Side: Frosted Stage with 3D canvas */}
        <div className="hidden md:flex flex-col justify-between p-8 bg-gradient-to-br from-[#E9ECF2] to-[#F1F0FA] border-r border-[#DCDAF0]">
          <div>
            <span className="hud text-xs text-[#3A4DFF] font-bold">MYSAWARI URBAN FLEET</span>
            <h2 className="text-3xl font-bold tracking-tight text-[#0A0A14] mt-2">Welcome Back.</h2>
            <p className="text-xs text-[#5B5B73] mt-1">Belagavi's physical 3D ride booking platform.</p>
          </div>

          <div className="w-full h-56 my-auto">
            <VehicleMorphCanvas compact={true} />
          </div>

          <span className="hud text-[10px] text-[#8E96A6]">
            POWERED BY THREE.JS & SUPABASE
          </span>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center space-y-6">
          <div>
            <span className="hud text-xs text-[#3A4DFF] font-bold">AUTHENTICATION</span>
            <h1 className="text-3xl font-bold text-[#0A0A14] tracking-tight">Log in to account</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5B5B73] mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-13 px-4 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] outline-none text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5B5B73] mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-13 pl-4 pr-12 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] outline-none text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-3.5 text-[#5B5B73]"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full bg-[#0A0A14] hover:bg-[#3A4DFF] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 mt-4"
            >
              <span>{loading ? 'AUTHENTICATING...' : 'LOG IN TO MYSAWARI'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

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
