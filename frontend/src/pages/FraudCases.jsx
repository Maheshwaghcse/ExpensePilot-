import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  ShieldAlert, 
  Check, 
  X, 
  Loader2, 
  AlertTriangle, 
  Clock,
  User,
  ShieldCheck,
  FileText,
  MessageSquare
} from 'lucide-react';

const FraudCases = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Investigation drawer states
  const [selectedCase, setSelectedCase] = useState(null);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fraud/cases');
      setCases(res.data);
    } catch (err) {
      console.error('Failed to load fraud incidents:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleSelectCase = (c) => {
    setSelectedCase(c);
    setNotes(c.analystNotes || '');
  };

  const handleResolve = async (status) => {
    setUpdating(true);
    try {
      await api.post(`/fraud/cases/${selectedCase._id}/resolve`, {
        status,
        analystNotes: notes
      });
      setSelectedCase(null);
      setNotes('');
      fetchCases();
    } catch (err) {
      alert(err.response?.data?.error || 'Resolution update failed');
    } finally {
      setUpdating(false);
    }
  };

  const getRiskColor = (level) => {
    if (level === 'High') return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (level === 'Medium') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  const getStatusColor = (status) => {
    if (status === 'Open') return 'bg-rose-500/10 text-rose-400 border border-rose-500/10';
    if (status === 'Resolved') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10';
    return 'bg-slate-500/10 text-slate-400 border border-slate-500/10';
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
      {/* List Cases */}
      <div className="xl:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-xs font-semibold text-slate-400">Review system-flagged spending anomalies, duplicate invoices, and category limits.</p>
        </div>

        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : cases.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center text-slate-400 text-xs shadow-xl flex flex-col justify-center items-center gap-2 max-w-md mx-auto">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
            <span className="font-bold text-white text-sm">No flagged issues!</span>
            <span>All expense claims comply with the configured company policies and duplicate checks.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {cases.map((c) => (
              <div 
                key={c._id} 
                onClick={() => handleSelectCase(c)}
                className={`glass-card rounded-2xl p-5 border cursor-pointer hover:border-indigo-500/30 transition-all ${
                  selectedCase?._id === c._id ? 'border-indigo-500 ring-1 ring-indigo-500/30 shadow-lg shadow-indigo-600/5' : 'border-white/5 bg-slate-900/40'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold ${getRiskColor(c.riskLevel)}`}>
                    {c.riskLevel} Risk Case
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusColor(c.status)}`}>
                    {c.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white truncate">{c.expenseId?.merchantName || 'Manual Submission'}</h4>
                  <p className="text-xs font-extrabold text-indigo-400">₹{c.expenseId?.amount}</p>
                  <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 mt-2">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    Submitted by: {c.expenseId?.employeeId?.name || 'Unknown'}
                  </p>
                </div>

                <div className="border-t border-white/5 mt-4 pt-3">
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Trigger alerts ({c.detectedRules?.length || 0}):</span>
                  <ul className="space-y-1 mt-1 text-[10px] text-slate-300 font-medium">
                    {c.detectedRules?.slice(0, 2).map((rule, idx) => (
                      <li key={idx} className="truncate flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                        <span>{rule}</span>
                      </li>
                    ))}
                    {c.detectedRules?.length > 2 && (
                      <li className="text-slate-500 font-semibold italic text-[9px]">+{c.detectedRules.length - 2} more violations...</li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Investigation Details Panel */}
      <div className="xl:col-span-1">
        {selectedCase ? (
          <div className="glass-card rounded-2xl p-6 border border-white/5 bg-slate-900/40 shadow-xl space-y-5">
            <div className="border-b border-white/5 pb-4">
              <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold ${getRiskColor(selectedCase.riskLevel)}`}>
                {selectedCase.riskLevel} Risk Profiler
              </span>
              <h3 className="text-sm font-bold text-white mt-3">{selectedCase.expenseId?.merchantName}</h3>
              <p className="text-xs font-semibold text-slate-400">Claim Amount: <span className="text-white font-extrabold">₹{selectedCase.expenseId?.amount}</span></p>
            </div>

            {/* Audit log details */}
            <div className="space-y-3.5 text-xs font-semibold text-slate-300 border-b border-white/5 pb-5">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Claim Category:</span>
                <span>{selectedCase.expenseId?.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Employee Submitter:</span>
                <span>{selectedCase.expenseId?.employeeId?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Submission Date:</span>
                <span>{new Date(selectedCase.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Triggered Policy rules */}
            <div className="space-y-2 border-b border-white/5 pb-5">
              <span className="text-xs text-slate-400 font-medium block">All System Flags</span>
              <ul className="space-y-2">
                {selectedCase.detectedRules?.map((rule, idx) => (
                  <li key={idx} className="p-3 bg-slate-950 border border-white/5 rounded-xl text-[10px] text-slate-300 font-semibold leading-normal flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Analyst Review Notes Form */}
            {selectedCase.status === 'Open' ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium block flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-indigo-400" /> Analyst Action Notes
                  </label>
                  <textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Document audit resolution justification..." 
                    rows="3"
                    className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  ></textarea>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleResolve('Resolved')}
                    disabled={updating}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                    Resolve Flags
                  </button>
                  <button 
                    onClick={() => handleResolve('Dismissed')}
                    disabled={updating}
                    className="flex-1 py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-4 h-4" />}
                    Dismiss Case
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-white/5 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Auditor Resolution Notes</span>
                <p className="text-xs text-slate-300 italic">"{selectedCase.analystNotes || 'No notes provided'}"</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-2 border-t border-white/5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Resolved by: {selectedCase.resolvedBy?.name}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8 border border-white/5 bg-slate-900/40 text-center text-slate-400 text-xs shadow-xl h-60 flex flex-col justify-center items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-slate-600" />
            <span>Select a fraud case card to inspect claim parameters, review policy violations, and issue resolutions.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FraudCases;
