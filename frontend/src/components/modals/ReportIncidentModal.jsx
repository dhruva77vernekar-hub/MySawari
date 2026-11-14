import React, { useState } from 'react';
import { 
  AlertTriangle, 
  X, 
  MapPin, 
  CheckCircle2, 
  ShieldAlert, 
  Car, 
  Construction, 
  Flame, 
  Award,
  ArrowRight
} from 'lucide-react';
import incidentService from '../../services/incidentService';

const INCIDENT_CATEGORIES = [
  { id: 'accident', label: 'Accident / Crash', icon: Car, color: 'text-red-500 bg-red-50 border-red-200' },
  { id: 'roadblock', label: 'Roadblock / Construction', icon: Construction, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'traffic', label: 'Heavy Traffic Jam', icon: Flame, color: 'text-orange-500 bg-orange-50 border-orange-200' },
  { id: 'hazard', label: 'Waterlogging / Potholes', icon: ShieldAlert, color: 'text-blue-500 bg-blue-50 border-blue-200' }
];

export default function ReportIncidentModal({ isOpen, onClose, defaultLocation = '', onIncidentReported }) {
  const [category, setCategory] = useState('accident');
  const [locationText, setLocationText] = useState(defaultLocation || 'Chennamma Circle, Belagavi');
  const [severity, setSeverity] = useState('HIGH');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    const catObj = INCIDENT_CATEGORIES.find((c) => c.id === category) || INCIDENT_CATEGORIES[0];

    const report = {
      category: catObj.label,
      type: category,
      location: locationText,
      severity,
      description: description.trim(),
      reportedBy: 'You (Verified Rider)'
    };

    try {
      const created = await incidentService.reportIncident(report);
      setIsSuccess(true);
      if (onIncidentReported) onIncidentReported(created);
      setTimeout(() => {
        setIsSuccess(false);
        setDescription('');
        onClose();
      }, 2200);
    } catch (err) {
      console.warn('Report failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-[32px] border border-[#DCDAF0] shadow-2xl p-6 sm:p-7 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#DCDAF0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-[#EF2B3E] flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#0A0A14]">Report Road Hazard & Congestion</h3>
              <p className="text-xs text-[#5B5B73]">Alert Belagavi commuters and suggest safer routes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8E96A6] hover:bg-[#F1F0FA] hover:text-[#0A0A14] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-10 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-md animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-[#0A0A14]">Incident Reported Successfully!</h4>
              <p className="text-xs text-[#5B5B73] max-w-xs mx-auto mt-1">
                Your report has been broadcast to all riders and the Route Intelligence engine to divert traffic.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-amber-800 text-xs font-bold">
              <Award className="w-4 h-4 text-amber-600" />
              <span>+25 Safety Karma Points Awarded</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold text-[#5B5B73] uppercase mb-2">
                Incident Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {INCIDENT_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#3A4DFF] bg-[#F1F0FA] ring-2 ring-[#3A4DFF]/20 shadow-xs'
                          : 'border-[#DCDAF0] hover:bg-[#F8F9FD]'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cat.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-[#0A0A14]">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location Input */}
            <div>
              <label className="block text-xs font-bold text-[#5B5B73] uppercase mb-1">
                Location / Road
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-[#EF2B3E]" />
                <input
                  type="text"
                  required
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="e.g. CBT Flyover, Khade Bazar, Tilakwadi"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#DCDAF0] text-xs text-[#0A0A14] outline-none focus:border-[#3A4DFF] bg-[#F8F9FD] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Severity Radio Buttons */}
            <div>
              <label className="block text-xs font-bold text-[#5B5B73] uppercase mb-1">
                Hazard Severity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['MEDIUM', 'HIGH', 'CRITICAL'].map((sev) => (
                  <button
                    type="button"
                    key={sev}
                    onClick={() => setSeverity(sev)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                      severity === sev
                        ? sev === 'CRITICAL'
                          ? 'bg-red-600 text-white border-red-600 shadow-xs'
                          : sev === 'HIGH'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-[#3A4DFF] text-white border-[#3A4DFF] shadow-xs'
                        : 'border-[#DCDAF0] text-[#5B5B73] hover:bg-[#F1F0FA]'
                    }`}
                  >
                    {sev === 'CRITICAL' ? '🚨 Critical' : sev === 'HIGH' ? '⚠️ High' : '⚡ Moderate'}
                  </button>
                ))}
              </div>
            </div>

            {/* Description Textarea */}
            <div>
              <label className="block text-xs font-bold text-[#5B5B73] uppercase mb-1">
                Situation Description
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened: e.g. 'Truck axle broke in right lane, traffic backed up 20 mins, avoid flyover'..."
                className="w-full p-3 rounded-xl border border-[#DCDAF0] text-xs text-[#0A0A14] outline-none focus:border-[#3A4DFF] bg-[#F8F9FD] focus:bg-white transition-all resize-none font-medium"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="w-full py-3.5 rounded-full bg-[#EF2B3E] hover:bg-[#d92234] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Broadcasting Incident...</span>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>BROADCAST REPORT & EARN +25 KARMA</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
