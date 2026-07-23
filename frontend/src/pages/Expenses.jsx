import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Upload, 
  FileText, 
  AlertTriangle, 
  Check, 
  X, 
  Loader2, 
  Search, 
  ChevronRight,
  User,
  Calendar,
  Layers,
  FileImage
} from 'lucide-react';

const Expenses = () => {
  const { user } = useAuth();
  
  // Data lists
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  
  // Loading & Filtering states
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  // Selected Detail Claim
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [approverComments, setApproverComments] = useState('');
  const [approving, setApproving] = useState(false);

  // Modal controls
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Manual Form States
  const [manualForm, setManualForm] = useState({
    amount: '',
    merchantName: '',
    category: 'Food',
    notes: '',
    expenseDate: new Date().toISOString().split('T')[0]
  });
  const [submittingManual, setSubmittingManual] = useState(false);

  // Upload Form States
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('Travel');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses', {
        params: {
          page,
          limit: 10,
          search,
          status: statusFilter || undefined,
          category: categoryFilter || undefined
        }
      });
      setExpenses(res.data.expenses);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to load expenses:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [page, statusFilter, categoryFilter]);

  // Load details and approval history
  const handleSelectExpense = async (expense) => {
    setSelectedExpense(expense);
    setApproverComments('');
    try {
      const res = await api.get(`/expenses/${expense._id}`);
      setApprovalHistory(res.data.history);
      // Update selected expense from latest API (to get latest populate / status)
      setSelectedExpense(res.data.expense);
    } catch (err) {
      console.error(err.message);
    }
  };

  // Submit manual expense claim
  const handleCreateManual = async (e) => {
    e.preventDefault();
    setSubmittingManual(true);
    try {
      await api.post('/expenses/manual', manualForm);
      setManualModalOpen(false);
      setManualForm({
        amount: '',
        merchantName: '',
        category: 'Food',
        notes: '',
        expenseDate: new Date().toISOString().split('T')[0]
      });
      fetchExpenses();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit expense');
    } finally {
      setSubmittingManual(false);
    }
  };

  // Upload receipt file and trigger background BullMQ OCR
  const handleUploadReceipt = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploadingReceipt(true);
    setUploadMessage('Uploading file & queueing processing job in BullMQ...');
    
    const formData = new FormData();
    formData.append('receipt', selectedFile);
    formData.append('category', uploadCategory);
    formData.append('notes', uploadNotes);

    try {
      await api.post('/receipts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadMessage('Processing successfully queued! Refresh list in a few seconds to see parsed values.');
      setSelectedFile(null);
      setUploadNotes('');
      setTimeout(() => {
        setUploadModalOpen(false);
        setUploadMessage('');
        fetchExpenses();
      }, 3000);
    } catch (err) {
      setUploadMessage(err.response?.data?.error || 'Failed to upload receipt');
    } finally {
      setUploadingReceipt(false);
    }
  };

  // Approve / Reject expense claims
  const handleApprove = async (action) => {
    setApproving(true);
    try {
      await api.post(`/expenses/${selectedExpense._id}/approve`, {
        action,
        comments: approverComments
      });
      setApproverComments('');
      // Reload details and main list
      fetchExpenses();
      handleSelectExpense(selectedExpense);
    } catch (err) {
      alert(err.response?.data?.error || 'Approval action failed');
    } finally {
      setApproving(false);
    }
  };

  // Check if current user is authorized to approve at the current stage
  const canApprove = () => {
    if (!selectedExpense || selectedExpense.status === 'Approved' || selectedExpense.status === 'Rejected') return false;
    
    const stage = selectedExpense.approvalStage;
    
    if (stage === 'Manager') {
      return ['Company Admin', 'HR Manager'].includes(user.role);
    }
    if (stage === 'HR') {
      return ['Company Admin', 'HR Manager'].includes(user.role);
    }
    if (stage === 'Finance') {
      return ['Company Admin', 'Auditor'].includes(user.role);
    }
    return false;
  };

  const getStatusStyle = (status) => {
    const styles = {
      Draft: 'bg-slate-500/10 text-slate-400 border border-slate-500/10',
      Submitted: 'bg-blue-500/10 text-blue-400 border border-blue-500/10',
      Under_Review: 'bg-amber-500/10 text-amber-400 border border-amber-500/10',
      Approved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10',
      Rejected: 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
    };
    return styles[status] || 'bg-slate-500/10 text-slate-400';
  };

  const getRiskStyle = (score) => {
    if (score >= 70) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (score >= 40) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
      {/* List Panel */}
      <div className="xl:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setUploadModalOpen(true)}
              className="btn-gradient px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide flex items-center gap-2 active:scale-95"
            >
              <Upload className="w-4 h-4" /> Upload Receipt
            </button>
            <button 
              onClick={() => setManualModalOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-indigo-500/20 text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Manual Claim
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder="Search merchant..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchExpenses()}
              className="w-full rounded-xl bg-slate-900 border border-white/5 px-4 py-2.5 pr-10 text-xs focus:outline-none focus:border-indigo-500"
            />
            <button onClick={fetchExpenses} className="absolute right-3 top-3 text-slate-400 hover:text-white">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center text-xs">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl bg-slate-900 border border-white/5 px-3.5 py-2 focus:outline-none focus:border-indigo-500 text-slate-300 font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Under_Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl bg-slate-900 border border-white/5 px-3.5 py-2 focus:outline-none focus:border-indigo-500 text-slate-300 font-semibold"
          >
            <option value="">All Categories</option>
            <option value="Travel">Travel</option>
            <option value="Food">Food</option>
            <option value="Accommodation">Accommodation</option>
            <option value="Fuel">Fuel</option>
            <option value="Office Supplies">Office Supplies</option>
            <option value="Training">Training</option>
          </select>
          
          <button onClick={fetchExpenses} className="px-3.5 py-2 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 font-bold hover:bg-indigo-600/20">
            Apply Filters
          </button>
        </div>

        {/* Claims Table */}
        <div className="glass-card rounded-2xl border border-white/5 bg-slate-900/40 overflow-hidden shadow-xl">
          {loading ? (
            <div className="flex py-20 items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No expense claims found matching search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-slate-950/20 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Merchant / Date</th>
                    <th className="py-4 px-6">Employee</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Risk</th>
                    <th className="py-4 px-6">Amount</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {expenses.map((expense) => (
                    <tr 
                      key={expense._id} 
                      onClick={() => handleSelectExpense(expense)}
                      className={`hover:bg-white/5 cursor-pointer transition-colors ${selectedExpense?._id === expense._id ? 'bg-indigo-600/10' : ''}`}
                    >
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white truncate max-w-[120px]">{expense.merchantName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{new Date(expense.expenseDate).toLocaleDateString()}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-slate-300 font-medium">{expense.employeeId?.name || 'Manual'}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{expense.departmentId?.name || 'No Dept'}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-300">{expense.category}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${getRiskStyle(expense.riskScore)}`}>
                          {expense.riskScore}%
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-white">${expense.amount.toLocaleString()}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusStyle(expense.status)}`}>
                          {expense.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        <ChevronRight className="w-4 h-4" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Details Side Panel */}
      <div className="xl:col-span-1 space-y-6">
        {selectedExpense ? (
          <div className="glass-card rounded-2xl p-6 border border-white/5 bg-slate-900/40 shadow-xl space-y-6">
            <div className="flex justify-between items-start border-b border-white/5 pb-4">
              <div>
                <h3 className="text-base font-bold text-white truncate max-w-[180px]">{selectedExpense.merchantName}</h3>
                <span className="text-xs text-indigo-400 font-semibold">{selectedExpense.category}</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusStyle(selectedExpense.status)}`}>
                {selectedExpense.status.replace('_', ' ')}
              </span>
            </div>

            {/* Risk Box */}
            <div className={`p-4 rounded-2xl border ${getRiskStyle(selectedExpense.riskScore)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Risk Profile Scan</span>
                <span className="text-sm font-extrabold">{selectedExpense.riskScore}% Risk</span>
              </div>
              {selectedExpense.fraudFlags?.length > 0 ? (
                <ul className="space-y-1.5 mt-2">
                  {selectedExpense.fraudFlags.map((flag, idx) => (
                    <li key={idx} className="text-[10px] font-semibold leading-normal flex items-start gap-1.5 text-slate-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[10px] text-slate-400 font-semibold mt-1">No compliance alerts detected.</p>
              )}
            </div>

            {/* Core details */}
            <div className="space-y-3.5 text-xs border-b border-white/5 pb-5">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Claim Amount</span>
                <span className="font-extrabold text-white text-sm">${selectedExpense.amount} {selectedExpense.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Employee Name</span>
                <span className="font-semibold text-slate-200">{selectedExpense.employeeId?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Expense Date</span>
                <span className="font-semibold text-slate-200">{new Date(selectedExpense.expenseDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Approval Stage</span>
                <span className="font-bold text-indigo-400">{selectedExpense.approvalStage}</span>
              </div>
              {selectedExpense.notes && (
                <div className="pt-2">
                  <span className="text-slate-400 font-medium block mb-1">Employee Notes:</span>
                  <div className="p-3 bg-slate-950 border border-white/5 rounded-xl text-[11px] text-slate-300 font-medium leading-relaxed italic">
                    "{selectedExpense.notes}"
                  </div>
                </div>
              )}
            </div>

            {/* Receipt Preview */}
            {selectedExpense.receiptId && (
              <div className="space-y-2 border-b border-white/5 pb-5">
                <span className="text-xs text-slate-400 font-medium block">Receipt Document</span>
                <a 
                  href={selectedExpense.receiptId.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-slate-950 hover:bg-white/5 transition-all text-xs font-semibold text-slate-200"
                >
                  {selectedExpense.receiptId.fileType?.includes('pdf') ? (
                    <FileText className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <FileImage className="w-5 h-5 text-indigo-400" />
                  )}
                  <span className="truncate flex-1">View Receipt Attachment</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            )}

            {/* Approval Logs */}
            <div className="space-y-3.5">
              <span className="text-xs text-slate-400 font-medium block">Decision Trail Log</span>
              <div className="space-y-3 relative border-l border-white/5 pl-4 ml-1">
                {approvalHistory.length === 0 ? (
                  <p className="text-[10px] text-slate-500 font-semibold italic">No actions recorded yet.</p>
                ) : (
                  approvalHistory.map((step, idx) => (
                    <div key={idx} className="relative text-xs">
                      {/* dot icon */}
                      <span className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                        step.action === 'Approve' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}></span>
                      <div className="font-bold text-white flex justify-between">
                        <span>{step.approverId?.name}</span>
                        <span className="text-[9px] text-slate-400 font-medium">
                          {new Date(step.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{step.roleAtTime} - {step.action}d</div>
                      {step.comments && (
                        <p className="text-[10px] text-slate-300 italic mt-1 font-medium bg-slate-950/40 p-2 rounded-lg border border-white/5">
                          "{step.comments}"
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Approver Decision Panels */}
            {canApprove() && (
              <div className="pt-4 border-t border-white/5 space-y-3">
                <textarea 
                  placeholder="Approver notes/comments..." 
                  value={approverComments} 
                  onChange={(e) => setApproverComments(e.target.value)}
                  rows="2"
                  className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                ></textarea>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleApprove('Approve')}
                    disabled={approving}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    {approving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                    Approve Claim
                  </button>
                  <button 
                    onClick={() => handleApprove('Reject')}
                    disabled={approving}
                    className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    {approving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-4 h-4" />}
                    Reject Claim
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8 border border-white/5 bg-slate-900/40 text-center text-slate-400 text-xs shadow-xl h-60 flex flex-col justify-center items-center gap-2">
            <Layers className="w-8 h-8 text-slate-600" />
            <span>Select an expense claim to audit receipt details, scan risk factors, and log workflow steps.</span>
          </div>
        )}
      </div>

      {/* Manual claim Modal */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 border border-white/10 bg-slate-900 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-white">Create Manual Claim</h3>
              <button onClick={() => setManualModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateManual} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-400 mb-1">Merchant Name</label>
                <input 
                  type="text" 
                  required
                  value={manualForm.merchantName}
                  onChange={(e) => setManualForm({ ...manualForm, merchantName: e.target.value })}
                  placeholder="e.g. Starbucks, Uber"
                  className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Amount (USD)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={manualForm.amount}
                    onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select 
                    value={manualForm.category}
                    onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    <option value="Food">Food</option>
                    <option value="Travel">Travel</option>
                    <option value="Accommodation">Accommodation</option>
                    <option value="Fuel">Fuel</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Training">Training</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Expense Date</label>
                <input 
                  type="date" 
                  value={manualForm.expenseDate}
                  onChange={(e) => setManualForm({ ...manualForm, expenseDate: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Claim Notes</label>
                <textarea 
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  placeholder="Describe details..."
                  rows="3"
                  className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={submittingManual}
                className="btn-gradient w-full py-3 rounded-xl font-bold flex items-center justify-center"
              >
                {submittingManual ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Claim'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Upload receipt Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 border border-white/10 bg-slate-900 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-white">Upload Receipt Document</h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUploadReceipt} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-400 mb-1.5">File Upload (JPEG, PNG, PDF)</label>
                <div className="border border-dashed border-white/10 rounded-2xl p-6 text-center bg-slate-950 hover:bg-white/5 transition-all relative">
                  <input 
                    type="file" 
                    required
                    accept="image/png, image/jpeg, image/jpg, application/pdf"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                  <span className="block text-slate-300 font-semibold mb-1">
                    {selectedFile ? selectedFile.name : 'Select or drop receipt file'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">File limit: 5MB</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Initial Category Choice</label>
                <select 
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="Food">Food</option>
                  <option value="Travel">Travel</option>
                  <option value="Accommodation">Accommodation</option>
                  <option value="Fuel">Fuel</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Training">Training</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notes (Optional)</label>
                <textarea 
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Brief details..."
                  rows="2"
                  className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              {uploadMessage && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/25 rounded-xl text-[10px] font-bold text-indigo-400">
                  {uploadMessage}
                </div>
              )}

              <button 
                type="submit" 
                disabled={uploadingReceipt || !selectedFile}
                className="btn-gradient w-full py-3 rounded-xl font-bold flex items-center justify-center"
              >
                {uploadingReceipt ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upload & Start Processing'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
