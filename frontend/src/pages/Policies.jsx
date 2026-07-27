import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Plus, 
  Settings, 
  Trash2, 
  Check, 
  X, 
  Loader2, 
  BookOpen, 
  Info,
  CheckCircle2
} from 'lucide-react';

const Policies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [policyFormOpen, setPolicyFormOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    rules: {
      maxMealAmount: '0',
      maxTravelAmount: '0',
      dailyLimit: '0',
      monthlyLimit: '0',
      allowedVendors: '',
      requiresPreApproval: false
    },
    isActive: true
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/policies');
      setPolicies(res.data);
    } catch (err) {
      console.error('Failed to fetch policies:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleOpenCreate = () => {
    setEditingPolicy(null);
    setForm({
      name: '',
      description: '',
      rules: {
        maxMealAmount: '0',
        maxTravelAmount: '0',
        dailyLimit: '0',
        monthlyLimit: '0',
        allowedVendors: '',
        requiresPreApproval: false
      },
      isActive: true
    });
    setPolicyFormOpen(true);
  };

  const handleOpenEdit = (policy) => {
    setEditingPolicy(policy);
    setForm({
      name: policy.name,
      description: policy.description || '',
      rules: {
        maxMealAmount: String(policy.rules?.maxMealAmount || 0),
        maxTravelAmount: String(policy.rules?.maxTravelAmount || 0),
        dailyLimit: String(policy.rules?.dailyLimit || 0),
        monthlyLimit: String(policy.rules?.monthlyLimit || 0),
        allowedVendors: policy.rules?.allowedVendors?.join(', ') || '',
        requiresPreApproval: policy.rules?.requiresPreApproval || false
      },
      isActive: policy.isActive
    });
    setPolicyFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Parse vendors
    const vendorArray = form.rules.allowedVendors
      ? form.rules.allowedVendors.split(',').map(v => v.trim()).filter(Boolean)
      : [];

    const payload = {
      name: form.name,
      description: form.description,
      rules: {
        maxMealAmount: parseFloat(form.rules.maxMealAmount) || 0,
        maxTravelAmount: parseFloat(form.rules.maxTravelAmount) || 0,
        dailyLimit: parseFloat(form.rules.dailyLimit) || 0,
        monthlyLimit: parseFloat(form.rules.monthlyLimit) || 0,
        allowedVendors: vendorArray,
        requiresPreApproval: form.rules.requiresPreApproval
      },
      isActive: form.isActive
    };

    try {
      if (editingPolicy) {
        await api.put(`/policies/${editingPolicy._id}`, payload);
      } else {
        await api.post('/policies', payload);
      }
      setPolicyFormOpen(false);
      fetchPolicies();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit policy data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this policy ruleset?')) return;
    try {
      await api.delete(`/policies/${id}`);
      fetchPolicies();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400">Establish corporate threshold limits and auto-scan parameters.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="btn-gradient px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Define Policy
        </button>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      ) : policies.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-400 text-xs shadow-xl flex flex-col justify-center items-center gap-2 max-w-md mx-auto">
          <BookOpen className="w-8 h-8 text-slate-600" />
          <span>No spending policies configured. Define limits to trigger fraud engine alerts and auto-compliance checks.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {policies.map((policy) => (
            <div key={policy._id} className="glass-card rounded-2xl p-6 border border-white/5 bg-slate-900/40 shadow-xl flex flex-col justify-between hover:border-indigo-500/20 transition-all">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">{policy.name}</h3>
                    <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">Created by: {policy.createdBy?.name || 'Admin'}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    policy.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                  }`}>
                    {policy.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>

                {policy.description && (
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{policy.description}</p>
                )}

                {/* Rules Details */}
                <div className="border-t border-white/5 pt-4 space-y-2 text-xs font-semibold text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Max Meal Cost:</span>
                    <span>{policy.rules?.maxMealAmount > 0 ? `₹${policy.rules.maxMealAmount}` : 'Unlimited'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Max Travel Cost:</span>
                    <span>{policy.rules?.maxTravelAmount > 0 ? `₹${policy.rules.maxTravelAmount}` : 'Unlimited'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Daily Limit:</span>
                    <span>{policy.rules?.dailyLimit > 0 ? `₹${policy.rules.dailyLimit}` : 'Unlimited'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Monthly Limit:</span>
                    <span>{policy.rules?.monthlyLimit > 0 ? `₹${policy.rules.monthlyLimit}` : 'Unlimited'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Pre-approval Needed:</span>
                    <span className={policy.rules?.requiresPreApproval ? 'text-indigo-400' : 'text-slate-500'}>
                      {policy.rules?.requiresPreApproval ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {policy.rules?.allowedVendors?.length > 0 && (
                    <div className="pt-1.5">
                      <span className="text-slate-400 font-medium block mb-1">Approved Vendors:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {policy.rules.allowedVendors.map((vendor, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-950 text-[10px] font-bold text-slate-300 border border-white/5">
                            {vendor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2.5 mt-6 border-t border-white/5 pt-4">
                <button 
                  onClick={() => handleOpenEdit(policy)}
                  className="flex-1 py-2 rounded-xl border border-white/5 text-[10px] font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                >
                  Edit Configuration
                </button>
                <button 
                  onClick={() => handleDelete(policy._id)}
                  className="p-2 rounded-xl border border-rose-500/10 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/25 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creator/Editor Modal */}
      {policyFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 border border-white/10 bg-slate-900 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingPolicy ? 'Modify Spending Policy' : 'Create Spending Policy'}
              </h3>
              <button onClick={() => setPolicyFormOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1.5">Policy Title</label>
                  <input 
                    type="text" 
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Standard Travel Rules"
                    className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1.5">Active Status</label>
                  <select 
                    value={form.isActive ? 'true' : 'false'}
                    onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
                    className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5">Description</label>
                <textarea 
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Summarize the intent..."
                  rows="2"
                  className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="border-t border-white/5 pt-4">
                <h4 className="text-xs font-bold text-indigo-400 mb-3 uppercase tracking-wide">Threshold rules (0 means no limit)</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Max Meal Expense (₹)</label>
                    <input 
                      type="number" 
                      value={form.rules.maxMealAmount}
                      onChange={(e) => setForm({ 
                        ...form, 
                        rules: { ...form.rules, maxMealAmount: e.target.value } 
                      })}
                      className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Max Travel Expense (₹)</label>
                    <input 
                      type="number" 
                      value={form.rules.maxTravelAmount}
                      onChange={(e) => setForm({ 
                        ...form, 
                        rules: { ...form.rules, maxTravelAmount: e.target.value } 
                      })}
                      className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Daily Cap (₹)</label>
                    <input 
                      type="number" 
                      value={form.rules.dailyLimit}
                      onChange={(e) => setForm({ 
                        ...form, 
                        rules: { ...form.rules, dailyLimit: e.target.value } 
                      })}
                      className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Monthly Cap (₹)</label>
                    <input 
                      type="number" 
                      value={form.rules.monthlyLimit}
                      onChange={(e) => setForm({ 
                        ...form, 
                        rules: { ...form.rules, monthlyLimit: e.target.value } 
                      })}
                      className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Approved Vendors (Comma-separated)</label>
                <input 
                  type="text" 
                  value={form.rules.allowedVendors}
                  onChange={(e) => setForm({ 
                    ...form, 
                    rules: { ...form.rules, allowedVendors: e.target.value } 
                  })}
                  placeholder="e.g. Starbucks, Uber, Hilton, Amazon"
                  className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950 border border-white/5 mt-2">
                <input 
                  type="checkbox" 
                  id="requiresPreApproval"
                  checked={form.rules.requiresPreApproval}
                  onChange={(e) => setForm({ 
                    ...form, 
                    rules: { ...form.rules, requiresPreApproval: e.target.checked } 
                  })}
                  className="w-4.5 h-4.5 accent-indigo-600"
                />
                <label htmlFor="requiresPreApproval" className="text-slate-300 select-none cursor-pointer">
                  Requires Pre-approval verification
                </label>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="btn-gradient w-full py-3 rounded-xl font-bold flex items-center justify-center mt-6"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingPolicy ? 'Update Ruleset' : 'Save Ruleset')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Policies;
