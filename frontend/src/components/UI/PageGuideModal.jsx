import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  CheckCircle2, 
  Lightbulb, 
  ShieldCheck, 
  Sparkles,
  User,
  Shield,
  Users,
  Briefcase,
  Calculator,
  Check
} from 'lucide-react';

const GUIDE_DATA = {
  '/dashboard': {
    title: 'Dashboard Overview & Analytics Guide',
    subtitle: 'Real-time corporate spending metrics, financial trends, and risk monitoring.',
    badge: 'Executive View',
    overview: 'The Dashboard gives administrators, financial auditors, and managers a high-level view of company expenditures, active fraud alerts, and department budget allocations.',
    features: [
      { name: 'Total Audited Spend (₹)', desc: 'Cumulative financial total of all claims marked as Approved in Rupees.' },
      { name: 'Pending Approvals Counter', desc: 'Number of employee claims awaiting manager, HR, or auditor review.' },
      { name: 'Open Fraud Cases', desc: 'Active high-risk alerts flagged by the automated AI fraud detection engine.' },
      { name: 'Department Breakdown Chart', desc: 'Visual distribution of corporate budget spent across departments.' },
      { name: 'Monthly Spending Trends', desc: 'Historical 6-month timeline tracking spending patterns and seasonal spikes.' }
    ],
    howTo: [
      'Monitor top high-spending departments and key metrics at a glance.',
      'Check the Open Fraud Cases counter for immediate auditing priorities.',
      'Review the Risk Level Breakdown gauge to maintain high corporate compliance.'
    ],
    proTip: 'Consistently reviewing monthly trend charts helps identify department budget overruns before quarterly closing.'
  },

  '/expenses': {
    title: 'Expense Claims & Stepper Guide',
    subtitle: 'Submit manual claims, upload receipts for AI auto-scanning, and track 4-stage approval progress.',
    badge: 'Core Ledger',
    overview: 'The Expenses tab is your central ledger for logging company business expenses. Employees submit claims or upload receipt photos/PDFs for instant OCR text extraction.',
    features: [
      { name: 'Visual 4-Stage Stepper', desc: 'Track sequential progress (Submitted ➔ Manager ➔ HR ➔ Finance) with tick checkmarks on completed steps.' },
      { name: 'Automated OCR Receipt Scanning', desc: 'Upload PNG, JPG, or PDF receipts to automatically extract total cost in ₹, merchant name, transaction date, and line items.' },
      { name: 'Auditor Guardrails', desc: 'Financial Auditors conduct system audits and do not submit personal claims.' },
      { name: 'HR Expense Routing', desc: 'HR Manager expense claims route directly to Company Admin for approval.' }
    ],
    howTo: [
      'Click "+ New Expense Claim" in the top right corner.',
      'Choose "Upload Receipt (OCR Auto-Scan)" to automatically fill in merchant and amount, or choose "Manual Claim Entry".',
      'Fill in category, date in ₹, and description, then submit for approval.',
      'Click any claim row to view its live 4-stage progress bar and green checkmark ticks.'
    ],
    proTip: 'Uploading high-resolution receipts ensures 99%+ accuracy during automated OCR text extraction.'
  },

  '/policies': {
    title: 'Spending Policies & Controls Guide',
    subtitle: 'Define corporate threshold limits in Rupees (₹) and enforce compliance rulesets.',
    badge: 'Compliance Engine',
    overview: 'The Policies page allows Company Admins to create and manage spending guidelines. Every submitted claim is automatically audited against active policy limits.',
    features: [
      { name: 'Daily Expense Cap (₹)', desc: 'Set maximum daily limit in Rupees (₹) per claim.' },
      { name: 'Monthly Expense Cap (₹)', desc: 'Set maximum monthly cumulative threshold in Rupees (₹).' },
      { name: 'Approved Vendor Whitelists', desc: 'Specify approved corporate vendors (e.g. Uber, Hilton, Starbucks, Amazon) to auto-verify merchant legitimacy.' },
      { name: 'Pre-Approval Verification', desc: 'Require manager pre-approval for high-cost line items or specific categories.' }
    ],
    howTo: [
      'Click "Define Policy" to create a new corporate ruleset.',
      'Set Daily Cap (₹) and Monthly Cap (₹) (entering 0 means no threshold limit).',
      'Add comma-separated approved vendor names.',
      'Save the policy; it will automatically audit all newly submitted claims.'
    ],
    proTip: 'Setting reasonable Daily Caps (₹) prevents accidental budget overspending on business travel.'
  },

  '/users': {
    title: 'Employee Onboarding & Department Guide',
    subtitle: 'Manage team hierarchies, role permissions, and edit departments post-invite.',
    badge: 'User Management',
    overview: 'The Users page provides complete control over employee access, role permissions, and departmental organization across your company tenant.',
    features: [
      { name: 'Employee Invitations', desc: 'Invite team members via email with auto-generated temporary login credentials.' },
      { name: 'Role-Based Access Control', desc: 'Assign roles: Company Admin, HR Manager, Auditor, or Employee.' },
      { name: 'Department Editing Post-Invite', desc: 'Modify an employee\'s assigned department, role, or status anytime after inviting them.' },
      { name: 'Department Management', desc: 'Create internal departments and assign department heads/managers.' }
    ],
    howTo: [
      'Use the "Employees" tab to view all company accounts.',
      'Click "Invite Employee" to send credentials to new team members.',
      'Click the "Edit" button next to any employee row to change their assigned Department, Role, or Status.',
      'Switch to the "Departments" tab to create new organizational teams.'
    ],
    proTip: 'Assigning employees to their correct department ensures accurate budget tracking on the Dashboard.'
  },

  '/fraud': {
    title: 'Auditing & Fraud Detection Guide',
    subtitle: 'AI-driven risk scoring, policy breach detection, and audit trail verification.',
    badge: 'AI Guardrails',
    overview: 'The Auditing & Fraud page lists claims flagged by ExpensePilot\'s automated risk engine. Auditors and Admins can investigate policy breaches and resolve fraud flags.',
    features: [
      { name: 'Risk Scoring System (0 - 100)', desc: 'Every claim receives a risk score based on anomaly detection rules.' },
      { name: 'Duplicate Receipt Scanning', desc: 'Flags duplicate receipt uploads across the company network (+45 pts).' },
      { name: 'OCR Mismatch Flags', desc: 'Flags discrepancies between OCR scanned receipts and manual user inputs (+30 pts).' },
      { name: 'Audit Trail Logs', desc: 'Tracks historical approval and rejection decisions with IP address audit records.' }
    ],
    howTo: [
      'Review open fraud cases sorted by highest Risk Score severity.',
      'Click a fraud case to inspect full audit details, policy violations, and attached receipts.',
      'Approve legitimate claims or Reject fraudulent claims with auditor remarks.'
    ],
    proTip: 'Claims with a Risk Score above 70 indicate high-priority policy violations requiring immediate auditor review.'
  }
};

const ROLE_INFO = [
  {
    role: 'Employee',
    icon: User,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    desc: 'Submits manual expense claims or uploads receipt photos/PDFs. Tracks approval status via the live 4-stage stepper.'
  },
  {
    role: 'HR Manager',
    icon: Users,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    desc: 'Invites new employees, manages department teams, and reviews Stage 2/3 claims. HR Manager\'s own claims route directly to Company Admin.'
  },
  {
    role: 'Auditor',
    icon: ShieldCheck,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    desc: 'Conducts system financial audits, reviews risk scores, and resolves fraud flags. Auditors do not submit personal claims.'
  },
  {
    role: 'Company Admin',
    icon: Shield,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    desc: 'Full tenant authority. Configures spending policies (₹ caps), manages user permissions, and can approve or override claims at any stage.'
  }
];

const PageGuideModal = ({ isOpen, onClose, currentPath }) => {
  const [activeTab, setActiveTab] = useState('page'); // 'page' | 'roles' | 'risk'

  if (!isOpen) return null;

  const guide = GUIDE_DATA[currentPath] || GUIDE_DATA['/dashboard'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 bg-slate-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">{guide.title}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {guide.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">{guide.subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex gap-2 border-b border-white/5 pb-2">
          <button 
            onClick={() => setActiveTab('page')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'page' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            📖 Page Features
          </button>
          <button 
            onClick={() => setActiveTab('roles')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'roles' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            👥 Role Permissions
          </button>
          <button 
            onClick={() => setActiveTab('risk')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'risk' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            🧮 Risk Score Formula
          </button>
        </div>

        {activeTab === 'page' && (
          <>
            {/* Overview Box */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wide">
                <Sparkles className="w-4 h-4" /> Overview & Purpose
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {guide.overview}
              </p>
            </div>

            {/* Key Features */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Key Capabilities & Tools</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {guide.features.map((feature, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-950/40 border border-white/5 hover:border-indigo-500/20 transition-all">
                    <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {feature.name}
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium leading-normal">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* How to use */}
            <div className="space-y-2.5 border-t border-white/5 pt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">How to Use This Page</h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-300">
                {guide.howTo.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold border border-indigo-500/30">
                      {idx + 1}
                    </span>
                    <span className="mt-0.5">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {activeTab === 'roles' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Role Permissions & Responsibilities</h4>
            <div className="grid grid-cols-1 gap-3">
              {ROLE_INFO.map((r, i) => {
                const Icon = r.icon;
                return (
                  <div key={i} className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg border ${r.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h5 className="text-xs font-bold text-white">{r.role}</h5>
                    </div>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed pl-8">
                      {r.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'risk' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wide">
              <Calculator className="w-4 h-4" /> Risk Score Calculation Formula (0 - 100 Points)
            </div>
            
            <div className="grid grid-cols-1 gap-2.5 text-xs font-semibold">
              <div className="p-3 rounded-xl bg-slate-950 border border-white/5 flex justify-between items-center">
                <span className="text-slate-300">🔁 Duplicate Claim (Matching amount, merchant & date)</span>
                <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">+45 Points</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-white/5 flex justify-between items-center">
                <span className="text-slate-300">🤖 OCR Amount Mismatch (Manually entered amount vs scanned OCR)</span>
                <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">+30 Points</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-white/5 flex justify-between items-center">
                <span className="text-slate-300">📜 Policy Cap Violation (Exceeds Daily/Monthly Cap in ₹)</span>
                <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">+25 Points</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-white/5 flex justify-between items-center">
                <span className="text-slate-300">📉 Submission Cluster (3+ claims hovering just under limits)</span>
                <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">+20 Points</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-white/5 flex justify-between items-center">
                <span className="text-slate-300">🚫 Unapproved Merchant (Not in Approved Vendor Whitelist)</span>
                <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">+15 Points</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold space-y-1">
              <span className="font-bold text-indigo-400 block">Risk Severity Badges:</span>
              <p>🟢 0 - 39: Low Risk • 🟡 40 - 69: Medium Risk • 🔴 70 - 100: High Risk (Logged in Fraud Cases)</p>
            </div>
          </div>
        )}

        {/* Pro Tip Box */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold flex items-start gap-3">
          <Lightbulb className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-bold block text-amber-400 uppercase tracking-wide text-[10px] mb-0.5">Pro Tip & Best Practice</span>
            <p className="font-medium text-amber-200/90 leading-relaxed">{guide.proTip}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-white/5">
          <button 
            onClick={onClose}
            className="btn-gradient px-6 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all"
          >
            Got it, thanks!
          </button>
        </div>

      </div>
    </div>
  );
};

export default PageGuideModal;
