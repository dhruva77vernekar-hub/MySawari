import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Car, 
  FileText, 
  Upload, 
  CheckCircle2, 
  ArrowRight, 
  AlertCircle,
  Bike,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RiderRegister() {
  const navigate = useNavigate();
  const { registerRider } = useAuth();

  // Multi-step tracking
  const [step, setStep] = useState(1); // 1: Personal, 2: DL, 3: Vehicle
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [formData, setFormData] = useState({
    // Step 1: Personal
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',

    // Step 2: Driving Licence
    dlNumber: '',
    dlExpiry: '',
    dlFileName: '',
    dlPreviewUrl: '',

    // Step 3: Vehicle Details
    vehicleType: 'bike', // bike, auto, cab, xl
    vehicleModel: '',
    vehicleNumber: '',
    rcFileName: '',
    rcPreviewUrl: ''
  });

  const vehicleTypes = [
    { id: 'bike', name: 'Bike Taxi', badge: 'High Demand', icon: '🛵', desc: 'Hero Splendor, Activa, Pulsar' },
    { id: 'auto', name: 'Auto Rickshaw', badge: 'City Commute', icon: '🛺', desc: 'Bajaj RE, Piaggio Ape' },
    { id: 'cab', name: 'Cab (Sedan / Hatch)', badge: 'Comfort', icon: '🚗', desc: 'Dzire, Etios, WagonR' },
    { id: 'xl', name: 'SUV / XL', badge: 'Group Trips', icon: '🚙', desc: 'Innova, Ertiga, Carens' }
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  // Mock document file upload simulation
  const handleFileUpload = (type, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'dl') {
        setFormData((prev) => ({
          ...prev,
          dlFileName: file.name,
          dlPreviewUrl: url
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          rcFileName: file.name,
          rcPreviewUrl: url
        }));
      }
    }
  };

  const handleNextStep = (e) => {
    e?.preventDefault();
    if (step === 1) {
      if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
        setError('Please fill in all personal account fields.');
        return;
      }
      if (formData.password.length < 4) {
        setError('Password should be at least 4 characters.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.dlNumber || !formData.dlExpiry) {
        setError('Please enter your Driving Licence Number and Expiry Date.');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!formData.vehicleModel || !formData.vehicleNumber) {
      setError('Please provide vehicle model and registration number.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await registerRider({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        dlNumber: formData.dlNumber,
        dlExpiry: formData.dlExpiry,
        dlDocUrl: formData.dlPreviewUrl || 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=400&q=80',
        vehicleType: formData.vehicleType,
        vehicleModel: formData.vehicleModel,
        vehicleNumber: formData.vehicleNumber.toUpperCase(),
        rcDocUrl: formData.rcPreviewUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80'
      });

      setLoading(false);
      // Navigate to dedicated application status page
      navigate('/rider/application-status');
    } catch (err) {
      setLoading(false);
      setError(err?.message || 'Registration failed. Please verify your details.');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-[#F1F0FA] flex items-center justify-center">
      <div className="max-w-2xl w-full rounded-[32px] bg-white border border-[#DCDAF0] p-6 sm:p-10 shadow-[0_20px_70px_-20px_rgba(58,77,255,0.15)] space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DCDAF0] pb-5">
          <div>
            <span className="hud text-xs text-[#3A4DFF] font-bold tracking-wider">
              CAPTAIN ONBOARDING
            </span>
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="MySawari Logo" className="w-8 h-8 rounded-xl object-contain shadow-xs" />
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0A14] tracking-tight">
                Register as MySawari Rider
              </h1>
            </div>
            <p className="text-xs text-[#5B5B73] mt-0.5">
              Drive in Belagavi, earn per ride, and get compensated for traffic detours.
            </p>
          </div>
          <span className="self-start sm:self-auto hud text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Step {step} of 3
          </span>
        </div>

        {/* Progress Stepper */}
        <div className="grid grid-cols-3 gap-2">
          <div className={`h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-[#3A4DFF]' : 'bg-[#DCDAF0]'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-[#3A4DFF]' : 'bg-[#DCDAF0]'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step >= 3 ? 'bg-[#3A4DFF]' : 'bg-[#DCDAF0]'}`} />
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-red-50 text-red-600 border border-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Personal Account Information */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-4">
            <div className="space-y-1">
              <span className="hud text-[11px] text-[#3A4DFF] font-bold">SECTION 1</span>
              <h3 className="text-base font-bold text-[#0A0A14]">Personal & Login Details</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5B5B73] mb-1 uppercase tracking-wider">
                Full Name (as per Driving Licence)
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="e.g. Suresh Patil"
                className="w-full h-12 px-4 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] focus:bg-white text-sm font-medium outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5B5B73] mb-1 uppercase tracking-wider">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+91 98450 12345"
                  className="w-full h-12 px-4 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] focus:bg-white text-sm font-medium outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B5B73] mb-1 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="suresh.patil@email.com"
                  className="w-full h-12 px-4 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] focus:bg-white text-sm font-medium outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5B5B73] mb-1 uppercase tracking-wider">
                Create Rider Passcode / Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter 4+ digit password"
                className="w-full h-12 px-4 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] focus:bg-white text-sm font-medium outline-none"
              />
            </div>

            <div className="pt-2 flex justify-between items-center">
              <Link to="/login" className="text-xs text-[#5B5B73] hover:underline">
                Already registered? Log in
              </Link>
              <button
                type="submit"
                className="px-6 py-3 rounded-full bg-[#0A0A14] hover:bg-[#3A4DFF] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <span>Continue to Licence Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Driving Licence Details */}
        {step === 2 && (
          <form onSubmit={handleNextStep} className="space-y-4">
            <div className="space-y-1">
              <span className="hud text-[11px] text-[#3A4DFF] font-bold">SECTION 2</span>
              <h3 className="text-base font-bold text-[#0A0A14]">Driving Licence Verification</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5B5B73] mb-1 uppercase tracking-wider">
                  Driving Licence Number
                </label>
                <input
                  type="text"
                  required
                  value={formData.dlNumber}
                  onChange={(e) => handleInputChange('dlNumber', e.target.value.toUpperCase())}
                  placeholder="e.g. KA-22-2020-0091823"
                  className="w-full h-12 px-4 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] focus:bg-white text-sm font-medium uppercase outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B5B73] mb-1 uppercase tracking-wider">
                  Licence Expiry Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.dlExpiry}
                  onChange={(e) => handleInputChange('dlExpiry', e.target.value)}
                  className="w-full h-12 px-4 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] focus:bg-white text-sm font-medium outline-none"
                />
              </div>
            </div>

            {/* DL Document Upload */}
            <div>
              <label className="block text-xs font-semibold text-[#5B5B73] mb-1 uppercase tracking-wider">
                Upload Driving Licence Photo (Front / Digilocker)
              </label>
              <div className="border-2 border-dashed border-[#DCDAF0] hover:border-[#3A4DFF] rounded-2xl p-4 text-center bg-[#F8F8FC] transition-colors relative cursor-pointer">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload('dl', e)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center space-y-1.5">
                  <Upload className="w-6 h-6 text-[#3A4DFF]" />
                  <p className="text-xs font-bold text-[#0A0A14]">
                    {formData.dlFileName || 'Click or drag licence copy here'}
                  </p>
                  <p className="text-[11px] text-[#8E96A6]">
                    PNG, JPG or PDF (Max 5MB) · Auto-verified in Admin
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-[#5B5B73] hover:text-[#0A0A14]"
              >
                ← Back
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-full bg-[#0A0A14] hover:bg-[#3A4DFF] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <span>Continue to Vehicle Info</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Vehicle Information & RC Upload */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <span className="hud text-[11px] text-[#3A4DFF] font-bold">SECTION 3</span>
              <h3 className="text-base font-bold text-[#0A0A14]">Vehicle & Registration Details</h3>
            </div>

            {/* Vehicle Type Choice */}
            <div>
              <label className="block text-xs font-semibold text-[#5B5B73] mb-2 uppercase tracking-wider">
                Vehicle Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {vehicleTypes.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => handleInputChange('vehicleType', v.id)}
                    className={`p-3 rounded-2xl border text-center cursor-pointer transition-all ${
                      formData.vehicleType === v.id
                        ? 'border-[#3A4DFF] bg-[#3A4DFF]/5 ring-2 ring-[#3A4DFF]/20'
                        : 'border-[#DCDAF0] bg-white hover:border-black/20'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{v.icon}</span>
                    <p className="text-xs font-bold text-[#0A0A14]">{v.name}</p>
                    <span className="text-[9px] hud text-[#3A4DFF]">{v.badge}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5B5B73] mb-1 uppercase tracking-wider">
                  Vehicle Registration Plate
                </label>
                <input
                  type="text"
                  required
                  value={formData.vehicleNumber}
                  onChange={(e) => handleInputChange('vehicleNumber', e.target.value.toUpperCase())}
                  placeholder="e.g. KA-22-EX-4912"
                  className="w-full h-12 px-4 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] focus:bg-white text-sm font-medium uppercase outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B5B73] mb-1 uppercase tracking-wider">
                  Vehicle Make & Model
                </label>
                <input
                  type="text"
                  required
                  value={formData.vehicleModel}
                  onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                  placeholder="e.g. Hero Splendor Plus / Dzire"
                  className="w-full h-12 px-4 bg-[#F1F0FA] rounded-2xl border border-transparent focus:border-[#3A4DFF] focus:bg-white text-sm font-medium outline-none"
                />
              </div>
            </div>

            {/* Vehicle RC Document Upload */}
            <div>
              <label className="block text-xs font-semibold text-[#5B5B73] mb-1 uppercase tracking-wider">
                Upload Vehicle Registration Certificate (RC)
              </label>
              <div className="border-2 border-dashed border-[#DCDAF0] hover:border-[#3A4DFF] rounded-2xl p-4 text-center bg-[#F8F8FC] transition-colors relative cursor-pointer">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload('rc', e)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center space-y-1.5">
                  <Upload className="w-6 h-6 text-[#3A4DFF]" />
                  <p className="text-xs font-bold text-[#0A0A14]">
                    {formData.rcFileName || 'Click or drag vehicle RC certificate here'}
                  </p>
                  <p className="text-[11px] text-[#8E96A6]">
                    Clear document showing owner name & chassis number
                  </p>
                </div>
              </div>
            </div>

            {/* Declaration */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                By submitting, you agree to background checks and platform terms. Applications enter <b>PENDING_APPROVAL</b> status until verified by our Belagavi administrator.
              </span>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-semibold text-[#5B5B73] hover:text-[#0A0A14]"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 rounded-full bg-[#3A4DFF] hover:bg-[#2B3CD9] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#3A4DFF]/30 active:scale-98"
              >
                <span>{loading ? 'SUBMITTING APPLICATION...' : 'SUBMIT RIDER APPLICATION'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
