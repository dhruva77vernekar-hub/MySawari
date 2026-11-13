import React, { useState } from 'react';
import { 
  Users, 
  Car, 
  DollarSign, 
  Activity, 
  Play, 
  RotateCcw, 
  ShieldCheck, 
  Search,
  Filter
} from 'lucide-react';
import Card from '../components/ui/Card';

export default function AdminDashboard() {
  const [simulatorStatus, setSimulatorStatus] = useState('Idle');
  const [rides, setRides] = useState([
    { id: 'R-701', rider: 'Dhruv (Demo)', captain: 'Suresh Patil', vehicle: 'Bike Taxi', fare: 35, status: 'in_progress', time: '2m ago' },
    { id: 'R-700', rider: 'Ayesha Khan', captain: 'Basavaraj M', vehicle: 'Cab', fare: 98, status: 'completed', time: '14m ago' },
    { id: 'R-699', rider: 'Kiran Naik', captain: 'Praveen K', vehicle: 'Scooter / Auto', fare: 45, status: 'completed', time: '28m ago' },
    { id: 'R-698', rider: 'Rahul Joshi', captain: 'Unassigned', vehicle: 'Bike Taxi', fare: 30, status: 'requested', time: '35m ago' },
    { id: 'R-697', rider: 'Sneha More', captain: 'Suresh Patil', vehicle: 'Bike Taxi', fare: 40, status: 'completed', time: '1h ago' }
  ]);

  const handleSpawnCaptains = () => {
    setSimulatorStatus('Active: 3 Simulated Captains Driving');
  };

  const handleResetData = () => {
    setSimulatorStatus('Idle');
  };

  return (
    <div className="min-h-screen bg-[#0B0D14] text-white pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
        <div>
          <span className="hud text-xs text-[#45E0F2] tracking-widest font-bold">
            PLATFORM OPERATIONS CONSOLE
          </span>
          <h1 className="text-3xl font-bold tracking-tight">Admin Fleet Dashboard</h1>
          <p className="text-xs text-[#8E96A6] mt-0.5">Belagavi City Zone · All Systems Operational</p>
        </div>

        {/* Demo Simulator Panel (Section 4.D) */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-2xl">
          <button
            onClick={handleSpawnCaptains}
            className="px-4 py-2 bg-[#3A4DFF] hover:bg-[#2c3be0] text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shadow-md"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Spawn 3 Demo Captains</span>
          </button>
          <button
            onClick={handleResetData}
            className="p-2 hover:bg-white/10 rounded-xl text-[#8E96A6] hover:text-white transition-colors"
            title="Reset simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {simulatorStatus !== 'Idle' && (
        <div className="p-3 bg-[#3A4DFF]/20 border border-[#3A4DFF] rounded-xl text-xs text-[#45E0F2] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#45E0F2] animate-ping" />
          <span>{simulatorStatus} around KLE Tech and Chennamma Circle coordinates.</span>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card dark={true} className="p-6 space-y-2">
          <div className="flex items-center justify-between text-[#8E96A6]">
            <span className="hud text-xs">TOTAL RIDES</span>
            <Car className="w-4 h-4 text-[#3A4DFF]" />
          </div>
          <p className="text-3xl font-bold font-mono">1,248</p>
          <span className="text-[11px] text-emerald-400 font-semibold">+24% this week</span>
        </Card>

        <Card dark={true} className="p-6 space-y-2">
          <div className="flex items-center justify-between text-[#8E96A6]">
            <span className="hud text-xs">ACTIVE RIDES</span>
            <Activity className="w-4 h-4 text-[#FFC21A]" />
          </div>
          <p className="text-3xl font-bold font-mono">18</p>
          <span className="text-[11px] text-[#8E96A6]">3 requested, 15 on route</span>
        </Card>

        <Card dark={true} className="p-6 space-y-2">
          <div className="flex items-center justify-between text-[#8E96A6]">
            <span className="hud text-xs">NET REVENUE (INR)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold font-mono">₹62,450</p>
          <span className="text-[11px] text-emerald-400 font-semibold">+15% surge avg</span>
        </Card>

        <Card dark={true} className="p-6 space-y-2">
          <div className="flex items-center justify-between text-[#8E96A6]">
            <span className="hud text-xs">CAPTAINS ONLINE</span>
            <Users className="w-4 h-4 text-[#45E0F2]" />
          </div>
          <p className="text-3xl font-bold font-mono">42</p>
          <span className="text-[11px] text-[#8E96A6]">Belagavi Hub Active</span>
        </Card>
      </div>

      {/* Rides Table */}
      <Card dark={true} className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold">Realtime Rides Activity</h3>
            <p className="text-xs text-[#8E96A6]">Live feed of ride dispatches and statuses</p>
          </div>
          <span className="hud text-xs text-[#8E96A6]">AUTO-REFRESH: 5S</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[#8E96A6] hud">
                <th className="py-3 px-2">TRIP ID</th>
                <th className="py-3 px-2">RIDER</th>
                <th className="py-3 px-2">CAPTAIN</th>
                <th className="py-3 px-2">VEHICLE</th>
                <th className="py-3 px-2">FARE</th>
                <th className="py-3 px-2">STATUS</th>
                <th className="py-3 px-2">TIME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rides.map((r) => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-2 font-mono font-semibold text-[#45E0F2]">{r.id}</td>
                  <td className="py-3.5 px-2 font-medium">{r.rider}</td>
                  <td className="py-3.5 px-2 text-[#C9CFDA]">{r.captain}</td>
                  <td className="py-3.5 px-2">{r.vehicle}</td>
                  <td className="py-3.5 px-2 font-mono font-bold text-[#FFC21A]">₹{r.fare}</td>
                  <td className="py-3.5 px-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        r.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : r.status === 'in_progress'
                          ? 'bg-[#3A4DFF]/20 text-[#45E0F2]'
                          : 'bg-[#FFC21A]/20 text-[#FFC21A]'
                      }`}
                    >
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-[#8E96A6]">{r.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
