import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import incidentService from '../services/incidentService';
import { 
  Users, 
  Car, 
  DollarSign, 
  Activity, 
  Play, 
  RotateCcw, 
  ShieldCheck, 
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Sliders,
  Layers,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
  RefreshCw,
  Coins,
  Settings,
  ChevronRight,
  UserCheck,
  Eye,
  AlertCircle,
  Award,
  Zap,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import DemandIntelligence from '../components/admin/DemandIntelligence';
import ZoneIntelligence from '../components/admin/ZoneIntelligence';
import DemandZoneDemo from '../components/admin/DemandZoneDemo';
import EmergencyManagement from '../components/admin/EmergencyManagement';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { ridersList, updateRiderStatus, addRiderRewardPoints, rewardLedger } = useAuth();

  // Active navigation sidebar tab
  const [activeTab, setActiveTab] = useState('overview');

  // RIDER MANAGEMENT STATE
  const [riderFilter, setRiderFilter] = useState('ALL'); // ALL, PENDING_APPROVAL, APPROVED, REJECTED, SUSPENDED
  const [selectedRiderForReview, setSelectedRiderForReview] = useState(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // AUTOMATIC REASSIGNMENT SIMULATION STATE
  const [simStep, setSimStep] = useState(0); 
  // 0: Initial ready state
  // 1: Captain A assigned (ETA 5 mins)
  // 2: Delay event triggered (ETA spikes to 22 mins)
  // 3: Reassignment detected & dispatched to Captain B (ETA 6 mins)
  // 4: Background reward points awarded to Captain A (18 pts)
  const [simRunning, setSimRunning] = useState(false);
  const [simLogs, setSimLogs] = useState([
    { time: '10:00:00', event: 'System initialized. Belagavi dispatch engine active.' }
  ]);

  // INCIDENT MANAGEMENT STATE
  const [incidents, setIncidents] = useState([
    {
      id: 'INC-201',
      category: 'Road Construction / Pipeline Burst',
      location: 'Khade Bazar Main Road, Belagavi',
      severity: 'HIGH',
      description: 'Major underground pipe burst. Road completely barricaded between vegetable market and corner.',
      status: 'VERIFIED',
      reportedAt: '15 mins ago',
      reportedBy: 'Dhruv Patil (Customer)',
      imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&auto=format&fit=crop&q=60'
    },
    {
      id: 'INC-202',
      category: 'Accident / Vehicle Breakdown',
      location: 'CBT Circle to Station Flyover Ascent',
      severity: 'CRITICAL',
      description: 'Heavy truck axle failure on single-lane flyover ascent causing 15+ min traffic backlog.',
      status: 'PENDING_REVIEW',
      reportedAt: '32 mins ago',
      reportedBy: 'Suresh Patil (Captain)',
      imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=300&auto=format&fit=crop&q=60'
    },
    {
      id: 'INC-203',
      category: 'Heavy Traffic Congestion',
      location: 'Bogarves Green Plaza Junction',
      severity: 'MEDIUM',
      description: 'Traffic signal malfunction. Vehicles moving at under 10 km/h.',
      status: 'VERIFIED',
      reportedAt: '1 hour ago',
      reportedBy: 'Basavaraj M (Captain)',
      imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=300&auto=format&fit=crop&q=60'
    }
  ]);

  useEffect(() => {
    incidentService.getIncidents().then((data) => {
      if (data && data.length > 0) setIncidents(data);
    });
    const unsub = incidentService.subscribe((data) => {
      if (data && data.length > 0) setIncidents(data);
    });
    return unsub;
  }, []);

  const pendingIncidentsCount = incidents.filter((i) => i.status === 'PENDING_REVIEW').length;

  const handleVerifyIncident = async (id) => {
    await incidentService.updateIncidentStatus(id, 'VERIFIED');
  };

  const handleRejectIncident = async (id) => {
    await incidentService.updateIncidentStatus(id, 'REJECTED');
  };

  const handleResolveIncident = async (id) => {
    await incidentService.updateIncidentStatus(id, 'RESOLVED');
  };

  // REWARD CONFIGURATION STATE
  const [rewardConfig, setRewardConfig] = useState({
    pointsPerKm: 10,
    minRedemption: 50,
    inrPerPoint: 1.0,
    autoCompensateOnDelay: true
  });
  const [payouts, setPayouts] = useState([
    { id: 'PAY-101', captain: 'Suresh Patil', points: 100, inr: 100, upi: 'suresh@oksbi', status: 'PAID' },
    { id: 'PAY-102', captain: 'Basavaraj M', points: 150, inr: 150, upi: 'basavaraj@icici', status: 'PENDING' }
  ]);

  // ZONE SURGE SLIDERS
  const [zones, setZones] = useState([
    { id: 'z-1', name: 'KLE Tech Campus & Udyambag', demand: 42, supply: 16, surge: 1.6, active: true },
    { id: 'z-2', name: 'Belagavi Railway Station & Bogarves', demand: 58, supply: 22, surge: 1.8, active: true },
    { id: 'z-3', name: 'Camp & Rani Chennamma Circle', demand: 28, supply: 30, surge: 1.0, active: true },
    { id: 'z-4', name: 'Tilakwadi Residential', demand: 19, supply: 24, surge: 1.0, active: true }
  ]);

  // CUSTOMER USERS LIST
  const [customers, setCustomers] = useState([
    { id: 'C-01', name: 'Dhruv Patil', phone: '+91 98765 43210', rides: 14, spent: '₹1,240', status: 'ACTIVE' },
    { id: 'C-02', name: 'Priya Sharma', phone: '+91 94481 22334', rides: 9, spent: '₹680', status: 'ACTIVE' },
    { id: 'C-03', name: 'Rohan Deshmukh', phone: '+91 91234 56789', rides: 22, spent: '₹2,180', status: 'ACTIVE' },
    { id: 'C-04', name: 'Ayesha Khan', phone: '+91 99887 76655', rides: 5, spent: '₹490', status: 'ACTIVE' }
  ]);

  // FIFO BOOKING QUEUE MOCK
  const [fifoQueue, setFifoQueue] = useState([
    { id: 'BK-901', customer: 'Priya Sharma', pickup: 'KLE Tech', drop: 'Chennamma Circle', timestamp: '10:14:02', eta: '4 min', status: 'ALLOCATING' },
    { id: 'BK-902', customer: 'Rohan Deshmukh', pickup: 'Belagavi Station', drop: 'Bogarves', timestamp: '10:14:18', eta: '6 min', status: 'QUEUED' },
    { id: 'BK-903', customer: 'Sneha More', pickup: 'Tilakwadi 2nd Gate', drop: 'Camp', timestamp: '10:14:35', eta: '8 min', status: 'QUEUED' }
  ]);

  // Filter riders based on current filter tab
  const filteredRiders = ridersList.filter((r) => {
    if (riderFilter === 'ALL') return true;
    return r.status === riderFilter;
  });

  const pendingCount = ridersList.filter((r) => r.status === 'PENDING_APPROVAL').length;

  // Approve rider
  const handleApproveRider = (riderId) => {
    updateRiderStatus(riderId, 'APPROVED');
    setSelectedRiderForReview(null);
  };

  // Reject rider
  const handleOpenReject = (rider) => {
    setSelectedRiderForReview(rider);
    setRejectReasonInput(rider.rejectionReason || 'Driving licence is expired or document copy unreadable.');
    setShowRejectModal(true);
  };

  const handleConfirmReject = () => {
    if (selectedRiderForReview) {
      updateRiderStatus(selectedRiderForReview.id, 'REJECTED', rejectReasonInput);
      setShowRejectModal(false);
      setSelectedRiderForReview(null);
    }
  };

  // Suspend rider
  const handleSuspendRider = (riderId) => {
    updateRiderStatus(riderId, 'SUSPENDED', 'Account suspended following safety compliance check.');
  };

  // Reactivate rider
  const handleReactivateRider = (riderId) => {
    updateRiderStatus(riderId, 'APPROVED');
  };

  // SIMULATION CONTROLLER (Automatic Reassignment Feature 5)
  const handleStartSimulation = async () => {
    setSimRunning(true);
    setSimStep(1);
    setSimLogs([
      { time: new Date().toLocaleTimeString(), event: 'Initial Request: Ride #704 created by Priya Sharma (KLE Tech → Station).' },
      { time: new Date().toLocaleTimeString(), event: 'FIFO Matcher assigned Captain A (Suresh Patil) · Initial ETA: 5 mins (Distance: 1.8 km).' }
    ]);

    // Delay 3s -> Spike ETA
    setTimeout(() => {
      setSimStep(2);
      setSimLogs((prev) => [
        { time: new Date().toLocaleTimeString(), event: '⚠️ DELAY EVENT: Heavy traffic jam detected on Khanapur Road. Captain A ETA spiked from 5 mins → 22 mins.' },
        { time: new Date().toLocaleTimeString(), event: '⚡ ETA breached 7-min threshold. Automatic Reassignment Engine triggered!' },
        ...prev
      ]);

      // Delay 3s -> Reassign to Captain B
      setTimeout(() => {
        setSimStep(3);
        setSimLogs((prev) => [
          { time: new Date().toLocaleTimeString(), event: '✓ ATOMIC REASSIGNMENT: Found closer Captain B (Basavaraj M) at 6 mins ETA.' },
          { time: new Date().toLocaleTimeString(), event: 'Customer Priya Sharma notified with new captain details (KA-22-MB-3011).' },
          ...prev
        ]);

        // Delay 2s -> Award Background Reward Points to Captain A
        setTimeout(() => {
          setSimStep(4);
          addRiderRewardPoints(
            'rider-suresh-1',
            18,
            'Auto-reassignment detour compensation for Ride #704 (1.8 km @ 10 pts/km)',
            'R-704'
          );
          setSimLogs((prev) => [
            { time: new Date().toLocaleTimeString(), event: '🎁 BACKGROUND REWARD LEDGER: Captain A (Suresh Patil) credited +18 Reward Points for 1.8 km verified travel!' },
            { time: new Date().toLocaleTimeString(), event: 'Reassignment cycle completed with 100% SLA adherence.' },
            ...prev
          ]);
          setSimRunning(false);
        }, 2500);
      }, 3000);
    }, 3000);
  };

  const handleResetSimulation = () => {
    setSimStep(0);
    setSimRunning(false);
    setSimLogs([
      { time: new Date().toLocaleTimeString(), event: 'Simulation reset. Ready for new scenario.' }
    ]);
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'operations', label: 'Live Operations', icon: MapPin },
    { id: 'riders', label: 'Rider Verification', icon: UserCheck, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'simulation', label: 'Auto-Reassignment Sim', icon: Zap, highlight: true },
    { id: 'demo', label: 'Demand & Zone Demo', icon: Sparkles, highlight: true },
    { id: 'sos', label: 'Emergency SOS Console', icon: ShieldAlert, highlight: true },
    { id: 'dispatch', label: 'Smart FIFO Dispatch', icon: Sliders },
    { id: 'incidents', label: 'Incident Management', icon: AlertTriangle, badge: pendingIncidentsCount > 0 ? pendingIncidentsCount : null },
    { id: 'demand', label: 'Demand Intelligence', icon: TrendingUp },
    { id: 'zones', label: 'Zone Surge Intel', icon: Layers },
    { id: 'pooling', label: 'Ride Pooling Engine', icon: Car },
    { id: 'rewards', label: 'Reward Management', icon: Coins },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'settings', label: 'Platform Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col pt-16">
      
      {/* Admin Top Navigation Header */}
      <header className="h-16 border-b border-white/10 bg-[#0B0D14]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="MySawari" className="w-8 h-8 rounded-xl object-contain shadow-xs" />
          <div>
            <span className="hud text-[10px] text-[#45E0F2] tracking-widest font-bold">
              MYSAWARI ADMIN CONSOLE
            </span>
            <h1 className="text-sm font-bold text-white">Belagavi Central Platform Operations</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>OSRM & Realtime Healthy</span>
          </span>
          <Link
            to="/"
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#8E96A6] hover:text-white transition-colors"
          >
            Switch to Customer View ↗
          </Link>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Navigation Sidebar */}
        <aside className="w-64 border-r border-white/10 bg-[#0B0D14] flex flex-col justify-between p-4 shrink-0 hidden md:flex">
          <div className="space-y-1">
            <span className="hud text-[10px] text-[#8E96A6] px-3 mb-2 block uppercase font-bold">
              Platform Modules
            </span>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#3A4DFF] text-white shadow-lg shadow-[#3A4DFF]/25'
                      : item.highlight
                      ? 'text-[#45E0F2] hover:bg-white/5'
                      : 'text-[#8E96A6] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-amber-500 text-black font-bold text-[10px] px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#45E0F2] animate-ping" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick System Info */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-[#8E96A6] space-y-1">
            <span className="hud text-[9px] text-[#45E0F2] block font-bold">BELAGAVI DISPATCH ENGINE</span>
            <p>SLA Window: 7.0 min</p>
            <p>Reward Rate: {rewardConfig.pointsPerKm} Pts / km</p>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          
          {/* ======================================================== */}
          {/* TAB 1: OVERVIEW */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <span className="hud text-xs text-[#45E0F2] font-bold">EXECUTIVE DASHBOARD</span>
                <h2 className="text-3xl font-bold tracking-tight text-white mt-0.5">Fleet Overview</h2>
                <p className="text-xs text-[#8E96A6] mt-0.5">Real-time telemetry across Belagavi City sectors.</p>
              </div>

              {/* 4 Primary KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card dark={true} className="p-6 space-y-2">
                  <div className="flex items-center justify-between text-[#8E96A6]">
                    <span className="hud text-xs">TOTAL ACTIVE RIDERS</span>
                    <Car className="w-4 h-4 text-[#3A4DFF]" />
                  </div>
                  <p className="text-3xl font-bold font-mono text-white">48</p>
                  <span className="text-[11px] text-emerald-400 font-semibold">32 online · 16 on trip</span>
                </Card>

                <Card dark={true} className="p-6 space-y-2">
                  <div className="flex items-center justify-between text-[#8E96A6]">
                    <span className="hud text-xs">PENDING APPROVALS</span>
                    <UserCheck className="w-4 h-4 text-[#FFC21A]" />
                  </div>
                  <p className="text-3xl font-bold font-mono text-[#FFC21A]">{pendingCount}</p>
                  <button
                    onClick={() => { setActiveTab('riders'); setRiderFilter('PENDING_APPROVAL'); }}
                    className="text-[11px] text-[#45E0F2] hover:underline block font-semibold"
                  >
                    Review documents →
                  </button>
                </Card>

                <Card dark={true} className="p-6 space-y-2">
                  <div className="flex items-center justify-between text-[#8E96A6]">
                    <span className="hud text-xs">DAILY GMV REVENUE</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-3xl font-bold font-mono text-emerald-400">₹64,280</p>
                  <span className="text-[11px] text-emerald-400 font-semibold">+22% weekly growth</span>
                </Card>

                <Card dark={true} className="p-6 space-y-2">
                  <div className="flex items-center justify-between text-[#8E96A6]">
                    <span className="hud text-xs">AUTO REASSIGNMENTS</span>
                    <Zap className="w-4 h-4 text-[#45E0F2]" />
                  </div>
                  <p className="text-3xl font-bold font-mono text-white">14</p>
                  <span className="text-[11px] text-[#45E0F2] font-semibold">100% saved trips</span>
                </Card>
              </div>

              {/* Quick Actions & Recent Live Dispatch */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-white">Live Ride Feed</h3>
                    <span className="hud text-xs text-[#45E0F2]">AUTOMATED DISPATCH QUEUE</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {fifoQueue.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-white">{item.customer} · <span className="font-mono text-[#45E0F2]">{item.id}</span></p>
                          <p className="text-[#8E96A6]">{item.pickup} → {item.drop}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2.5 py-1 rounded-full bg-[#3A4DFF]/20 text-[#45E0F2] font-mono font-bold">
                            ETA: {item.eta}
                          </span>
                          <p className="text-[10px] text-[#8E96A6] mt-1">{item.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-4 p-6 rounded-3xl bg-gradient-to-br from-[#3A4DFF]/20 via-white/5 to-white/5 border border-[#3A4DFF]/30 space-y-4">
                  <span className="hud text-xs text-[#45E0F2] font-bold">FEATURE DEMO SHORTCUT</span>
                  <h3 className="font-bold text-lg text-white">Interactive Reassignment Simulator</h3>
                  <p className="text-xs text-[#8E96A6] leading-relaxed">
                    Test the automatic reassignment engine when Captain A encounters a traffic delay, handing off to Captain B and awarding Captain A detour points.
                  </p>
                  <button
                    onClick={() => setActiveTab('simulation')}
                    className="w-full py-3 rounded-full bg-[#3A4DFF] hover:bg-[#2c3ee0] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    <span>Launch Simulator</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: LIVE OPERATIONS */}
          {/* ======================================================== */}
          {activeTab === 'operations' && (
            <div className="space-y-6">
              <div>
                <span className="hud text-xs text-[#45E0F2] font-bold">MAP & TELEMETRY</span>
                <h2 className="text-2xl font-bold tracking-tight text-white mt-0.5">Live Operations Console</h2>
                <p className="text-xs text-[#8E96A6]">Real-time captain locations and active trip telemetry across Belagavi.</p>
              </div>

              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                <div className="h-64 sm:h-80 rounded-2xl bg-black/40 border border-white/10 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(#3A4DFF_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                  
                  {/* Mock Map Markers for Belagavi */}
                  <div className="relative z-10 flex flex-col items-center text-center space-y-2">
                    <div className="p-3 bg-[#3A4DFF]/20 border border-[#3A4DFF] rounded-2xl text-xs text-[#45E0F2] flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#45E0F2] animate-ping" />
                      <span>Belagavi Fleet Grid: 32 Online Captains · 16 Active Trips</span>
                    </div>
                    <div className="flex gap-4 text-xs font-mono">
                      <span className="bg-black/60 px-3 py-1 rounded-xl border border-white/10 text-white">
                        📍 KLE Tech: 8 Captains
                      </span>
                      <span className="bg-black/60 px-3 py-1 rounded-xl border border-white/10 text-white">
                        📍 Railway Station: 12 Captains
                      </span>
                      <span className="bg-black/60 px-3 py-1 rounded-xl border border-white/10 text-white">
                        📍 Tilakwadi: 7 Captains
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-black/30 border border-white/5">
                    <span className="text-xs text-[#8E96A6] block">Average Dispatch Latency</span>
                    <p className="text-xl font-bold font-mono text-white">3.4 seconds</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/30 border border-white/5">
                    <span className="text-xs text-[#8E96A6] block">Average Pickup ETA</span>
                    <p className="text-xl font-bold font-mono text-emerald-400">4.8 minutes</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/30 border border-white/5">
                    <span className="text-xs text-[#8E96A6] block">Active Service Zones</span>
                    <p className="text-xl font-bold font-mono text-[#45E0F2]">4 Zones (Belagavi)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: RIDER VERIFICATION & MANAGEMENT */}
          {/* ======================================================== */}
          {activeTab === 'riders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="hud text-xs text-[#45E0F2] font-bold">RIDER GOVERNANCE</span>
                  <h2 className="text-2xl font-bold tracking-tight text-white mt-0.5">
                    Rider Verification & Fleet Management
                  </h2>
                  <p className="text-xs text-[#8E96A6]">
                    Review applicant documents (Driving Licence, Vehicle RC) and enforce compliance.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10 text-xs">
                  {['ALL', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setRiderFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                        riderFilter === filter
                          ? 'bg-[#3A4DFF] text-white shadow-md'
                          : 'text-[#8E96A6] hover:text-white'
                      }`}
                    >
                      {filter.replace('_', ' ')}
                      {filter === 'PENDING_APPROVAL' && pendingCount > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.2 bg-[#FFC21A] text-black rounded-full text-[10px]">
                          {pendingCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Riders Table */}
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[#8E96A6] uppercase hud border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">Rider Details</th>
                        <th className="py-3 px-4">Vehicle</th>
                        <th className="py-3 px-4">Driving Licence</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Submitted</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredRiders.map((rider) => (
                        <tr key={rider.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4">
                            <p className="font-bold text-white text-sm">{rider.fullName}</p>
                            <p className="text-[#8E96A6]">{rider.phone} · {rider.email}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-semibold text-white">{rider.vehicleName || rider.vehicleModel}</p>
                            <p className="text-[#8E96A6] font-mono">{rider.vehicleNumber} ({rider.vehicleType})</p>
                          </td>
                          <td className="py-4 px-4 font-mono">
                            <p className="text-white">{rider.dlNumber}</p>
                            <p className="text-[#8E96A6] text-[11px]">Exp: {rider.dlExpiry}</p>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                                rider.status === 'APPROVED'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : rider.status === 'PENDING_APPROVAL'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : rider.status === 'REJECTED'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {rider.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-[#8E96A6]">
                            {rider.submittedAt ? new Date(rider.submittedAt).toLocaleDateString() : 'Recent'}
                          </td>
                          <td className="py-4 px-4 text-right space-x-2">
                            {/* Document Review Inspection Modal */}
                            <button
                              onClick={() => setSelectedRiderForReview(rider)}
                              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
                            >
                              Review Docs
                            </button>

                            {rider.status === 'PENDING_APPROVAL' && (
                              <>
                                <button
                                  onClick={() => handleApproveRider(rider.id)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleOpenReject(rider)}
                                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {rider.status === 'APPROVED' && (
                              <button
                                onClick={() => handleSuspendRider(rider.id)}
                                className="px-3 py-1.5 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-rose-300 font-semibold transition-colors"
                              >
                                Suspend
                              </button>
                            )}

                            {rider.status === 'SUSPENDED' && (
                              <button
                                onClick={() => handleReactivateRider(rider.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
                              >
                                Reactivate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: AUTOMATIC REASSIGNMENT SIMULATION (CRITICAL REQUIREMENT) */}
          {/* ======================================================== */}
          {activeTab === 'simulation' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="hud text-xs text-[#45E0F2] font-bold">
                    HACKATHON FEATURE 5 DEMO
                  </span>
                  <h2 className="text-2xl font-bold tracking-tight text-white mt-0.5">
                    Dynamic Automatic Reassignment & Reward Simulation
                  </h2>
                  <p className="text-xs text-[#8E96A6]">
                    Demonstrates automated dispatch handoff when an ETA breach occurs, awarding detour compensation in real time.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleStartSimulation}
                    disabled={simRunning}
                    className="px-5 py-2.5 rounded-full bg-[#3A4DFF] hover:bg-[#2c3ee0] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#3A4DFF]/30 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{simRunning ? 'Simulation Running...' : 'Execute Full Simulation'}</span>
                  </button>

                  <button
                    onClick={handleResetSimulation}
                    disabled={simRunning}
                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-[#8E96A6] hover:text-white transition-colors"
                    title="Reset Simulation"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Simulation Architecture Stage */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Visual Workflow Steps (8 cols) */}
                <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <span className="hud text-xs text-[#8E96A6]">SIMULATED TRIP: RIDE #704</span>
                    <span className="text-xs font-mono text-[#45E0F2]">Passenger: Priya Sharma (KLE Tech)</span>
                  </div>

                  {/* Flow Comparison Nodes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Captain A Node */}
                    <div className={`p-5 rounded-2xl border transition-all ${
                      simStep >= 2
                        ? 'border-red-500/50 bg-red-500/10'
                        : simStep === 1
                        ? 'border-[#3A4DFF] bg-[#3A4DFF]/10'
                        : 'border-white/10 bg-black/40'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="hud text-[10px] text-[#8E96A6]">ORIGINAL ASSIGNMENT</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          simStep >= 3 ? 'bg-red-500/20 text-red-300' : 'bg-[#3A4DFF]/20 text-[#45E0F2]'
                        }`}>
                          {simStep >= 3 ? 'REASSIGNED' : 'ASSIGNED'}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-base">Captain A (Suresh Patil)</h4>
                      <p className="text-xs text-[#8E96A6]">Hero Splendor · KA-22-EX-4912</p>

                      <div className="mt-4 pt-3 border-t border-white/10 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#8E96A6]">Current ETA:</span>
                          <span className={`font-mono font-bold ${simStep >= 2 ? 'text-red-400 text-sm' : 'text-white'}`}>
                            {simStep >= 2 ? '22 mins (Delayed!)' : simStep >= 1 ? '5 mins' : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#8E96A6]">Distance Travelled:</span>
                          <span className="font-mono text-white">1.8 km towards pickup</span>
                        </div>
                        {simStep >= 4 && (
                          <div className="flex justify-between text-xs pt-1 text-emerald-400 font-bold">
                            <span>Compensation Awarded:</span>
                            <span>+18 Reward Points</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Captain B Node */}
                    <div className={`p-5 rounded-2xl border transition-all ${
                      simStep >= 3
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-white/10 bg-black/40 opacity-60'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="hud text-[10px] text-[#8E96A6]">NEW TARGET RIDER</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          simStep >= 3 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-[#8E96A6]'
                        }`}>
                          {simStep >= 3 ? 'ACTIVE DISPATCH' : 'STANDBY'}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-base">Captain B (Basavaraj M)</h4>
                      <p className="text-xs text-[#8E96A6]">Maruti Dzire · KA-22-MB-3011</p>

                      <div className="mt-4 pt-3 border-t border-white/10 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#8E96A6]">Target ETA:</span>
                          <span className={`font-mono font-bold ${simStep >= 3 ? 'text-emerald-400 text-sm' : 'text-[#8E96A6]'}`}>
                            {simStep >= 3 ? '6 mins (Optimal)' : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#8E96A6]">Proximity to Pickup:</span>
                          <span className="font-mono text-white">0.9 km (Station Road)</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#8E96A6]">Customer Status:</span>
                          <span className="text-[#45E0F2] font-semibold">
                            {simStep >= 3 ? 'Live Handoff Complete' : 'Waiting'}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Compensation Ledger Banner */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <Coins className="w-5 h-5 text-[#FFC21A]" />
                      <div>
                        <p className="font-bold text-white">Background Reward Guarantee</p>
                        <p className="text-[#8E96A6]">Rate: 10 Points / verified km travelled towards pickup.</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {simStep >= 4 ? '18 Pts Credited' : 'Standby'}
                    </span>
                  </div>
                </div>

                {/* Event Audit Log (4 cols) */}
                <div className="lg:col-span-4 p-6 rounded-3xl bg-white/5 border border-white/10 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <h4 className="font-bold text-sm text-white">Audit Event Stream</h4>
                      <span className="hud text-[10px] text-[#45E0F2]">LIVE LOGS</span>
                    </div>

                    <div className="mt-3 space-y-2.5 max-h-96 overflow-y-auto pr-1">
                      {simLogs.map((log, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] space-y-0.5">
                          <span className="font-mono text-[9px] text-[#8E96A6]">{log.time}</span>
                          <p className="text-white/90 leading-tight">{log.event}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 text-[10px] text-[#8E96A6]">
                    Deterministic OSRM road distance verified via Belagavi geographic grid.
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: SMART FIFO DISPATCH */}
          {/* ======================================================== */}
          {activeTab === 'dispatch' && (
            <div className="space-y-6">
              <div>
                <span className="hud text-xs text-[#45E0F2] font-bold">HACKATHON FEATURE 4</span>
                <h2 className="text-2xl font-bold tracking-tight text-white mt-0.5">
                  FIFO Priority Queue & Intelligent Allocation
                </h2>
                <p className="text-xs text-[#8E96A6]">
                  Strict arrival-time ordering ensures customer fairness; road-network routing prevents Euclidean detour errors.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* FIFO Booking Queue */}
                <div className="lg:col-span-7 p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white">Live FIFO Queue (Server Monotonic Order)</h3>
                    <span className="hud text-[10px] text-emerald-400">ORDER PRESERVED</span>
                  </div>

                  <div className="space-y-3">
                    {fifoQueue.map((item, idx) => (
                      <div key={item.id} className="p-4 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#3A4DFF]/20 text-[#45E0F2] font-mono font-bold flex items-center justify-center text-[10px]">
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-white">{item.customer} ({item.id})</p>
                            <p className="text-[#8E96A6]">{item.pickup} → {item.drop}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-emerald-400 font-bold">{item.eta}</span>
                          <p className="text-[10px] text-[#8E96A6]">{item.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Road-Network ETA vs Euclidean Comparison */}
                <div className="lg:col-span-5 p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                  <h3 className="font-bold text-sm text-white">Road Network (OSRM) vs Euclidean</h3>
                  
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3 text-xs">
                    <div className="flex justify-between py-1 border-b border-white/10">
                      <span className="text-[#8E96A6]">Euclidean (Straight Line)</span>
                      <span className="font-mono text-red-400 font-bold">1.2 km (Misleading)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/10">
                      <span className="text-[#8E96A6]">OSRM Road Network</span>
                      <span className="font-mono text-emerald-400 font-bold">2.8 km (Accurate)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#8E96A6]">Obstacle Detected</span>
                      <span className="text-white font-semibold">Belagavi Railway Overbridge</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#3A4DFF]/15 border border-[#3A4DFF]/30 text-xs text-white/90 space-y-1">
                    <span className="hud text-[10px] text-[#45E0F2] font-bold block">FAIRNESS FORMULA</span>
                    <p className="font-mono text-[11px] text-[#45E0F2]">
                      Score = 0.5 × (1/ETA) + 0.3 × (FairnessWeight) + 0.2 × (Rating)
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5.5: ROAD INCIDENT MANAGEMENT & MODERATION */}
          {/* ======================================================== */}
          {activeTab === 'incidents' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="hud text-xs text-[#45E0F2] font-bold">ROUTE HAZARDS & TRAFFIC MODERATION</span>
                  <h2 className="text-2xl font-bold tracking-tight text-white mt-0.5">
                    Incident Management & Verification
                  </h2>
                  <p className="text-xs text-[#8E96A6]">
                    Review crowdsourced road hazards in Belagavi. Verified incidents automatically inform Route Intelligence to divert traffic.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-500/30 font-bold">
                    {incidents.filter((i) => i.status === 'VERIFIED').length} Active Verified Hazards
                  </span>
                </div>
              </div>

              {/* Incidents Table */}
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[#8E96A6] uppercase hud border-b border-white/10">
                      <tr>
                        <th className="py-3 px-3">Hazard / Category</th>
                        <th className="py-3 px-3">Location</th>
                        <th className="py-3 px-3">Severity</th>
                        <th className="py-3 px-3">Photo Proof</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Reporter</th>
                        <th className="py-3 px-3 text-right">Moderation Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {incidents.map((inc) => (
                        <tr key={inc.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-3">
                            <span className="hud text-[10px] text-[#45E0F2] font-mono block">{inc.id}</span>
                            <p className="font-bold text-white text-sm mt-0.5">{inc.category}</p>
                            <p className="text-[#8E96A6] text-[11px] max-w-xs line-clamp-1">{inc.description}</p>
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-white">
                            {inc.location}
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                                inc.severity === 'CRITICAL'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : inc.severity === 'HIGH'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}
                            >
                              {inc.severity}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                              <img src={inc.imageUrl} alt="Hazard" className="w-full h-full object-cover" />
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                inc.status === 'VERIFIED'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : inc.status === 'PENDING_REVIEW'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                                  : inc.status === 'RESOLVED'
                                  ? 'bg-white/10 text-[#8E96A6]'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {inc.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-[#8E96A6]">
                            <p className="text-white font-medium">{inc.reportedBy}</p>
                            <p className="text-[10px]">{inc.reportedAt}</p>
                          </td>
                          <td className="py-3.5 px-3 text-right space-x-1.5">
                            {inc.status === 'PENDING_REVIEW' && (
                              <>
                                <button
                                  onClick={() => handleVerifyIncident(inc.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px]"
                                >
                                  Verify
                                </button>
                                <button
                                  onClick={() => handleRejectIncident(inc.id)}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-[10px]"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {inc.status === 'VERIFIED' && (
                              <button
                                onClick={() => handleResolveIncident(inc.id)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-[10px]"
                              >
                                Mark Resolved
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: REAL SOS EMERGENCY NOTIFICATIONS (SMS & WHATSAPP) */}
          {/* ======================================================== */}
          {activeTab === 'sos' && <EmergencyManagement />}

          {/* ======================================================== */}
          {/* TAB: DEMAND & ZONE INTELLIGENCE DEMO */}
          {/* ======================================================== */}
          {activeTab === 'demo' && <DemandZoneDemo />}

          {/* ======================================================== */}
          {/* TAB 6: DEMAND INTELLIGENCE */}
          {/* ======================================================== */}
          {activeTab === 'demand' && <DemandIntelligence />}

          {/* ======================================================== */}
          {/* TAB 7: ZONE INTELLIGENCE & SURGE */}
          {/* ======================================================== */}
          {activeTab === 'zones' && <ZoneIntelligence />}

          {/* ======================================================== */}
          {/* TAB 8: RIDE POOLING ENGINE */}
          {/* ======================================================== */}
          {activeTab === 'pooling' && (
            <div className="space-y-6">
              <div>
                <span className="hud text-xs text-[#45E0F2] font-bold">HACKATHON FEATURE 3</span>
                <h2 className="text-2xl font-bold tracking-tight text-white mt-0.5">
                  Multi-Passenger Ride Pooling Engine
                </h2>
                <p className="text-xs text-[#8E96A6]">
                  Calculates route overlaps, minimizes detours under 20%, and splits shared fares fairly.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                    <span className="hud text-[10px] text-[#45E0F2]">PASSENGER 1 (PRIMARY)</span>
                    <h4 className="font-bold text-white">Tilakwadi → KLE Tech Campus</h4>
                    <p className="text-xs text-[#8E96A6]">Original Solo Fare: ₹120.00</p>
                    <p className="text-xs text-emerald-400 font-bold">Pooled Fare: ₹84.00 (30% Discount!)</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                    <span className="hud text-[10px] text-[#45E0F2]">PASSENGER 2 (JOINING)</span>
                    <h4 className="font-bold text-white">3rd Gate → KLE Tech Campus</h4>
                    <p className="text-xs text-[#8E96A6]">Original Solo Fare: ₹90.00</p>
                    <p className="text-xs text-emerald-400 font-bold">Pooled Fare: ₹63.00 (30% Discount!)</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#3A4DFF]/15 border border-[#3A4DFF]/30 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[#8E96A6] block">Route Overlap</span>
                    <span className="text-lg font-bold font-mono text-[#45E0F2]">78.4% Match</span>
                  </div>
                  <div>
                    <span className="text-[#8E96A6] block">Added Detour</span>
                    <span className="text-lg font-bold font-mono text-white">+3.2 minutes</span>
                  </div>
                  <div>
                    <span className="text-[#8E96A6] block">Captain Total Earning</span>
                    <span className="text-lg font-bold font-mono text-emerald-400">₹147.00 (+22%)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 9: REWARD MANAGEMENT */}
          {/* ======================================================== */}
          {activeTab === 'rewards' && (
            <div className="space-y-6">
              <div>
                <span className="hud text-xs text-[#45E0F2] font-bold">PLATFORM INCENTIVES</span>
                <h2 className="text-2xl font-bold tracking-tight text-white mt-0.5">
                  Reward Points Configuration & Payouts
                </h2>
                <p className="text-xs text-[#8E96A6]">
                  Configure automatic reassignment compensation rates and approve driver payout requests.
                </p>
              </div>

              {/* Config Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card dark={true} className="p-6 space-y-3">
                  <span className="hud text-xs text-[#45E0F2]">COMPENSATION RATE</span>
                  <div className="flex items-baseline gap-2">
                    <input
                      type="number"
                      value={rewardConfig.pointsPerKm}
                      onChange={(e) => setRewardConfig({ ...rewardConfig, pointsPerKm: Number(e.target.value) })}
                      className="w-20 bg-white/10 rounded-xl px-3 py-1 font-mono text-xl font-bold text-white outline-none"
                    />
                    <span className="text-xs text-[#8E96A6]">Pts / verified km</span>
                  </div>
                  <p className="text-[11px] text-[#8E96A6]">Credited immediately upon automatic reassignment.</p>
                </Card>

                <Card dark={true} className="p-6 space-y-3">
                  <span className="hud text-xs text-[#45E0F2]">MINIMUM REDEMPTION</span>
                  <div className="flex items-baseline gap-2">
                    <input
                      type="number"
                      value={rewardConfig.minRedemption}
                      onChange={(e) => setRewardConfig({ ...rewardConfig, minRedemption: Number(e.target.value) })}
                      className="w-20 bg-white/10 rounded-xl px-3 py-1 font-mono text-xl font-bold text-white outline-none"
                    />
                    <span className="text-xs text-[#8E96A6]">Points</span>
                  </div>
                  <p className="text-[11px] text-[#8E96A6]">Threshold for captain cashout request.</p>
                </Card>

                <Card dark={true} className="p-6 space-y-3">
                  <span className="hud text-xs text-[#45E0F2]">CONVERSION VALUE</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold font-mono text-white">1 Point = ₹1.00</span>
                  </div>
                  <p className="text-[11px] text-emerald-400 font-semibold">100% INR direct bank payout.</p>
                </Card>
              </div>

              {/* Payout Approval Table */}
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                <h3 className="font-bold text-base text-white">Captain Payout Requests</h3>
                <table className="w-full text-xs text-left">
                  <thead className="text-[#8E96A6] uppercase hud border-b border-white/10">
                    <tr>
                      <th className="py-2.5 px-3">Payout ID</th>
                      <th className="py-2.5 px-3">Captain</th>
                      <th className="py-2.5 px-3">Points</th>
                      <th className="py-2.5 px-3">Amount (INR)</th>
                      <th className="py-2.5 px-3">UPI / Bank</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payouts.map((pay) => (
                      <tr key={pay.id} className="hover:bg-white/5">
                        <td className="py-3 px-3 font-mono text-[#45E0F2]">{pay.id}</td>
                        <td className="py-3 px-3 font-bold text-white">{pay.captain}</td>
                        <td className="py-3 px-3 font-mono">{pay.points} Pts</td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-400">₹{pay.inr}.00</td>
                        <td className="py-3 px-3 font-mono text-[#8E96A6]">{pay.upi}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            pay.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {pay.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {pay.status === 'PENDING' && (
                            <button
                              onClick={() => {
                                setPayouts((prev) => prev.map((p) => p.id === pay.id ? { ...p, status: 'PAID' } : p));
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[10px]"
                            >
                              Approve Payout
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 10: CUSTOMER MANAGEMENT */}
          {/* ======================================================== */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div>
                <span className="hud text-xs text-[#45E0F2] font-bold">USER REGISTRY</span>
                <h2 className="text-2xl font-bold tracking-tight text-white mt-0.5">Customer Accounts</h2>
                <p className="text-xs text-[#8E96A6]">Registered passengers in Belagavi City.</p>
              </div>

              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                <table className="w-full text-xs text-left">
                  <thead className="text-[#8E96A6] uppercase hud border-b border-white/10">
                    <tr>
                      <th className="py-2.5 px-3">User ID</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Mobile</th>
                      <th className="py-2.5 px-3">Completed Rides</th>
                      <th className="py-2.5 px-3">Total Spend</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-white/5">
                        <td className="py-3 px-3 font-mono text-[#45E0F2]">{c.id}</td>
                        <td className="py-3 px-3 font-bold text-white">{c.name}</td>
                        <td className="py-3 px-3 text-[#8E96A6]">{c.phone}</td>
                        <td className="py-3 px-3 font-mono">{c.rides}</td>
                        <td className="py-3 px-3 font-mono font-bold text-white">{c.spent}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 11: PLATFORM SETTINGS */}
          {/* ======================================================== */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <span className="hud text-xs text-[#45E0F2] font-bold">SYSTEM CONFIGURATION</span>
                <h2 className="text-2xl font-bold tracking-tight text-white mt-0.5">Platform Settings</h2>
                <p className="text-xs text-[#8E96A6]">Belagavi dispatch policies, geofences, and safety integrations.</p>
              </div>

              <div className="max-w-2xl p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-white/10">
                  <div>
                    <p className="font-bold text-white">Reassignment Trigger Threshold</p>
                    <p className="text-[#8E96A6]">Delay threshold before automated reassignment initiates.</p>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">7.0 Minutes</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/10">
                  <div>
                    <p className="font-bold text-white">Maximum Captain Search Radius</p>
                    <p className="text-[#8E96A6]">Maximum road distance to poll standby captains.</p>
                  </div>
                  <span className="font-mono font-bold text-white">5.0 Kilometers</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/10">
                  <div>
                    <p className="font-bold text-white">Emergency SOS Police Integration</p>
                    <p className="text-[#8E96A6]">Automatic push to Belagavi City Police control room.</p>
                  </div>
                  <span className="text-emerald-400 font-bold">ACTIVE (112)</span>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* DOCUMENT REVIEW MODAL */}
      {selectedRiderForReview && !showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-[#141724] border border-white/20 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="hud text-xs text-[#45E0F2] font-bold">DOCUMENT INSPECTION</span>
                <h3 className="text-xl font-bold text-white">{selectedRiderForReview.fullName}</h3>
                <p className="text-xs text-[#8E96A6]">ID: {selectedRiderForReview.id}</p>
              </div>
              <button
                onClick={() => setSelectedRiderForReview(null)}
                className="text-[#8E96A6] hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Document Review Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* DL Card */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <span className="hud text-[10px] text-[#45E0F2] font-bold">DRIVING LICENCE</span>
                <p className="font-mono text-white font-bold">{selectedRiderForReview.dlNumber}</p>
                <p className="text-[#8E96A6]">Expiry: {selectedRiderForReview.dlExpiry}</p>
                <div className="h-32 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8E96A6]">
                  <img
                    src={selectedRiderForReview.dlDocUrl}
                    alt="DL Document"
                    className="h-full w-full object-cover rounded-xl"
                  />
                </div>
              </div>

              {/* RC Card */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <span className="hud text-[10px] text-[#45E0F2] font-bold">VEHICLE REGISTRATION (RC)</span>
                <p className="font-mono text-white font-bold">{selectedRiderForReview.vehicleNumber}</p>
                <p className="text-[#8E96A6]">{selectedRiderForReview.vehicleName} ({selectedRiderForReview.vehicleType})</p>
                <div className="h-32 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8E96A6]">
                  <img
                    src={selectedRiderForReview.rcDocUrl}
                    alt="RC Document"
                    className="h-full w-full object-cover rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Decision Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="text-xs text-[#8E96A6]">
                Current status: <b>{selectedRiderForReview.status}</b>
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleOpenReject(selectedRiderForReview)}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Reject with Reason
                </button>
                <button
                  onClick={() => handleApproveRider(selectedRiderForReview.id)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg"
                >
                  Approve Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON PROMPT MODAL */}
      {showRejectModal && selectedRiderForReview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#141724] border border-red-500/30 rounded-3xl p-6 space-y-5">
            <h3 className="font-bold text-lg text-white">Specify Rejection Reason</h3>
            <p className="text-xs text-[#8E96A6]">
              This reason will be displayed on <b>{selectedRiderForReview.fullName}</b>'s application status screen so they can rectify and resubmit.
            </p>
            <textarea
              rows={3}
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              placeholder="e.g. Driving licence expired or vehicle RC unreadable."
              className="w-full p-3 bg-black/40 rounded-xl border border-white/20 text-xs text-white outline-none focus:border-red-400"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs text-[#8E96A6] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
