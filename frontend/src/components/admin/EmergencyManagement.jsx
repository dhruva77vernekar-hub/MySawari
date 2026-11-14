import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  ExternalLink, 
  RefreshCw, 
  Check, 
  Clock, 
  Car, 
  RotateCcw, 
  Search, 
  Filter, 
  Eye, 
  MessageSquare,
  ShieldCheck,
  Send
} from 'lucide-react';
import Card from '../ui/Card';
import api from '../../services/api';

export default function EmergencyManagement() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, OPEN, ACKNOWLEDGED, RESOLVED
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [resolveModalIncident, setResolveModalIncident] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminSosIncidents();
      setIncidents(data);
      if (data.length > 0 && !selectedIncident) {
        setSelectedIncident(data[0]);
      } else if (selectedIncident) {
        const updated = data.find(i => i.id === selectedIncident.id);
        if (updated) setSelectedIncident(updated);
      }
    } catch (err) {
      console.error('Failed to load SOS incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleAcknowledge = async (incidentId) => {
    setActionLoading(true);
    try {
      await api.acknowledgeSosIncident(incidentId);
      setSuccessMsg('Incident acknowledged by Admin.');
      await fetchIncidents();
    } catch (err) {
      alert(err.message || 'Failed to acknowledge incident.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolveModalIncident) return;
    setActionLoading(true);
    try {
      await api.resolveSosIncident(resolveModalIncident.id, resolutionNotes);
      setResolveModalIncident(null);
      setResolutionNotes('');
      setSuccessMsg('Incident marked as RESOLVED.');
      await fetchIncidents();
    } catch (err) {
      alert(err.message || 'Failed to resolve incident.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryNotification = async (notifId) => {
    try {
      await api.retrySosNotification(notifId);
      setSuccessMsg('Notification retried with gateway.');
      await fetchIncidents();
    } catch (err) {
      alert(err.message || 'Retry failed.');
    }
  };

  const filteredIncidents = incidents.filter(i => {
    if (statusFilter === 'ALL') return true;
    return i.status === statusFilter;
  });

  const openCount = incidents.filter(i => i.status === 'OPEN').length;
  const ackCount = incidents.filter(i => i.status === 'ACKNOWLEDGED').length;
  const resolvedCount = incidents.filter(i => i.status === 'RESOLVED').length;

  return (
    <div className="space-y-8">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="hud text-xs text-red-400 font-bold">SAFETY DISPATCH DESK</span>
            {openCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 font-mono text-[10px] font-bold animate-pulse">
                {openCount} ACTIVE EMERGENCY ALERT(S)
              </span>
            )}
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white mt-1 flex items-center gap-2">
            Emergency Management Console
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </h2>
          <p className="text-xs text-[#8E96A6] mt-0.5">
            Real-time audit and resolution console for customer SOS activations across SMS and WhatsApp channels.
          </p>
        </div>

        <button
          onClick={fetchIncidents}
          disabled={loading}
          className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#45E0F2] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Incidents</span>
        </button>
      </div>

      {/* 4 PRIMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card dark={true} className="p-5 border-red-500/30">
          <div className="flex items-center justify-between text-[#8E96A6]">
            <span className="hud text-[11px] font-bold text-red-400">ACTIVE OPEN SOS</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white">{openCount}</span>
            {openCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            )}
          </div>
          <p className="text-[11px] text-[#8E96A6] mt-1">Requires immediate operator review.</p>
        </Card>

        <Card dark={true} className="p-5">
          <div className="flex items-center justify-between text-[#8E96A6]">
            <span className="hud text-[11px] font-bold text-amber-400">ACKNOWLEDGED</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold font-mono text-white">{ackCount}</span>
          </div>
          <p className="text-[11px] text-[#8E96A6] mt-1">Under active safety protocol.</p>
        </Card>

        <Card dark={true} className="p-5">
          <div className="flex items-center justify-between text-[#8E96A6]">
            <span className="hud text-[11px] font-bold text-emerald-400">RESOLVED INCIDENTS</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold font-mono text-white">{resolvedCount}</span>
          </div>
          <p className="text-[11px] text-[#8E96A6] mt-1">Verified safe and closed.</p>
        </Card>

        <Card dark={true} className="p-5">
          <div className="flex items-center justify-between text-[#8E96A6]">
            <span className="hud text-[11px] font-bold text-[#45E0F2]">CHANNELS ACTIVE</span>
            <Send className="w-4 h-4 text-[#45E0F2]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-[#45E0F2]">SMS + WHATSAPP</span>
          </div>
          <p className="text-[11px] text-[#8E96A6] mt-1">Direct MSG91 & WhatsApp Outbound.</p>
        </Card>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs text-emerald-400 hover:text-white">Dismiss</button>
        </div>
      )}

      {/* FILTER TABS */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10 text-xs self-start">
        {['ALL', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED'].map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              statusFilter === f
                ? 'bg-[#3A4DFF] text-white shadow-md'
                : 'text-[#8E96A6] hover:text-white hover:bg-white/5'
            }`}
          >
            {f} {f === 'OPEN' && openCount > 0 ? `(${openCount})` : ''}
          </button>
        ))}
      </div>

      {/* INCIDENTS TABLE & DETAILS SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incidents List (Col 2) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#090C16] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Emergency SOS Incident Log</h3>
            <span className="text-xs text-[#8E96A6] font-mono">Total: {filteredIncidents.length}</span>
          </div>

          {filteredIncidents.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#8E96A6] space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
              <p className="font-bold text-white">No active incidents matching filter</p>
              <p>All Belagavi customer transit corridors operating normally.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[#8E96A6] uppercase hud border-b border-white/10">
                  <tr>
                    <th className="py-3 px-3">Incident</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Ride & Captain</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Delivery Breakdown</th>
                    <th className="py-3 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {filteredIncidents.map((inc) => {
                    const isSelected = selectedIncident?.id === inc.id;
                    const isOpen = inc.status === 'OPEN';

                    return (
                      <tr
                        key={inc.id}
                        onClick={() => setSelectedIncident(inc)}
                        className={`hover:bg-white/[0.03] transition-colors cursor-pointer ${
                          isSelected ? 'bg-[#3A4DFF]/15' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-bold text-white flex flex-col">
                          <span className="flex items-center gap-1.5">
                            {isOpen && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
                            {inc.id}
                          </span>
                          <span className="text-[10px] text-[#8E96A6]">
                            {new Date(inc.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-sans text-white font-bold">
                          {inc.customer_name || 'Customer'}
                        </td>

                        <td className="py-3 px-3 text-[#8E96A6]">
                          <span className="text-white block font-bold">{inc.ride_id}</span>
                          <span className="text-[10px] text-[#45E0F2]">{inc.captain_name} â€¢ {inc.vehicle_number}</span>
                        </td>

                        <td className="py-3 px-3 font-sans">
                          {inc.status === 'OPEN' && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold font-mono animate-pulse">
                              OPEN
                            </span>
                          )}
                          {inc.status === 'ACKNOWLEDGED' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold font-mono">
                              ACKNOWLEDGED
                            </span>
                          )}
                          {inc.status === 'RESOLVED' && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono">
                              RESOLVED
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-400">SMS: {inc.smsStatusSummary?.sent || 0} sent</span>
                            <span>â€¢</span>
                            <span className={inc.whatsappStatusSummary?.sent > 0 ? 'text-emerald-400' : 'text-amber-400'}>
                              WA: {inc.whatsappStatusSummary?.sent || 0} ok
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIncident(inc);
                            }}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[11px] font-bold"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Incident Telemetry & Action Drawer (Col 1) */}
        <div className="p-6 rounded-3xl bg-[#0B0E1B] border border-white/10 flex flex-col justify-between space-y-4">
          {selectedIncident ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="hud text-[10px] text-red-400 font-bold uppercase">
                    EMERGENCY TELEMETRY DOSSIER
                  </span>
                  <span className="font-mono text-xs text-[#8E96A6]">
                    {new Date(selectedIncident.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  Incident {selectedIncident.id}
                </h3>
                <p className="text-xs text-[#8E96A6]">
                  {selectedIncident.note || 'Passenger pressed in-ride emergency SOS button.'}
                </p>
              </div>

              {/* Location & Google Maps */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs">
                <span className="text-[#8E96A6] font-bold block">GPS Coordinates:</span>
                <p className="font-mono text-white text-sm">
                  [{selectedIncident.latitude}, {selectedIncident.longitude}]
                </p>
                <p className="text-[#8E96A6] text-[11px]">
                  {selectedIncident.address}
                </p>
                <a
                  href={selectedIncident.google_maps_url || `https://maps.google.com/?q=${selectedIncident.latitude},${selectedIncident.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3A4DFF]/20 hover:bg-[#3A4DFF]/30 border border-[#3A4DFF]/40 text-[#45E0F2] rounded-xl text-xs font-bold transition-all cursor-pointer mt-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Passenger & Captain Specs */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                  <span className="text-[#8E96A6] block text-[10px]">CUSTOMER:</span>
                  <span className="text-white font-bold">{selectedIncident.customer_name}</span>
                </div>
                <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                  <span className="text-[#8E96A6] block text-[10px]">CAPTAIN:</span>
                  <span className="text-[#45E0F2] font-bold">{selectedIncident.captain_name}</span>
                </div>
              </div>

              {/* Notifications Dispatched List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-white uppercase font-mono block">
                  Broadcast Records ({selectedIncident.notifications?.length || 0}):
                </span>

                <div className="space-y-2 max-h-52 overflow-y-auto font-mono text-xs">
                  {selectedIncident.notifications?.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-[11px]">{notif.channel} â€¢ {notif.contact_name}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          notif.status === 'SENT' || notif.status === 'ACCEPTED_BY_PROVIDER'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {notif.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#8E96A6]">
                        <span>{notif.phone_number}</span>
                        {notif.status === 'FAILED' && (
                          <button
                            onClick={() => handleRetryNotification(notif.id)}
                            className="text-[#45E0F2] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-2.5 h-2.5" /> Retry
                          </button>
                        )}
                      </div>
                      {notif.error_message && (
                        <p className="text-[10px] text-red-400 truncate" title={notif.error_message}>
                          Error: {notif.error_message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                {selectedIncident.status === 'OPEN' && (
                  <button
                    onClick={() => handleAcknowledge(selectedIncident.id)}
                    disabled={actionLoading}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Acknowledge Emergency Incident</span>
                  </button>
                )}

                {selectedIncident.status !== 'RESOLVED' && (
                  <button
                    onClick={() => setResolveModalIncident(selectedIncident)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Resolve & Close Incident</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[#8E96A6]">
              Select an incident from the table to view details.
            </div>
          )}
        </div>
      </div>

      {/* RESOLUTION DIALOG MODAL */}
      {resolveModalIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0C1021] border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Resolve Incident {resolveModalIncident.id}
            </h4>
            <p className="text-xs text-[#8E96A6]">
              Enter resolution notes detailing actions taken (e.g. police verified, rider arrived safely).
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <textarea
                required
                rows={3}
                placeholder="Enter safety resolution notes..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-white outline-none focus:border-emerald-400"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResolveModalIncident(null)}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  {actionLoading ? 'Saving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
