import React from 'react';
import { 
  X, 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  Lightbulb, 
  ShieldCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

const GUIDE_DATA = {
  '/dashboard': {
    title: 'Dashboard Overview & Analytics Guide',
    subtitle: 'Real-time corporate spending metrics, financial trends, and risk monitoring.',
    badge: 'Executive View',
    overview: 'The Dashboard gives administrators, financial auditors, and managers a high-level view of company expenditures, active fraud alerts, and department budget allocations.',
    features: [
      { name: 'Total Approved Spend', desc: 'Cumulative financial total of all claims marked as Approved.' },
      { name: 'Pending Approvals Counter', desc: 'Number of employee claims awaiting manager or auditor review.' },
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
    title: 'Expense Claims & OCR Processing Guide',
    subtitle: 'Submit manual claims, upload receipts for AI auto-scanning, and track status.',
    badge: 'Core Ledger',
    overview: 'The Expenses tab is your central ledger for logging company business expenses. Employees can submit new claims or upload receipt photos/PDFs for instant OCR data extraction.',
    features: [
      { name: 'Automated OCR Receipt Scanning', desc: 'Upload PNG, JPG, or PDF receipts to automatically extract total cost, merchant name, transaction date, and line items.' },
      { name: 'Manual Expense Submission', desc: 'Enter expense details manually if a physical receipt is unavailable.' },
      { name: 'Status Tracking', desc: 'Filter expenses by status: Submitted, Under Review, Approved, or Rejected.' },
      { name: 'Itemization View', desc: 'Click any claim to inspect itemized line items, tax breakdown, and attached receipt preview.' }
    ],
    howTo: [
      'Click "+ New Expense Claim" in the top right corner.',
      'Choose "Upload Receipt (OCR Auto-Scan)" to automatically fill in merchant and amount, or choose "Manual Claim Entry".',
      'Fill in category, date, and description, then submit for manager approval.'
    ],
    proTip: 'Uploading high-resolution receipts ensures 99%+ accuracy during automated OCR text extraction.'
  },

  '/policies': {
    title: 'Spending Policies & Controls Guide',
    subtitle: 'Define corporate threshold limits in Rupees (₹) and enforce compliance rulesets.',
    badge: 'Compliance Engine',
    overview: 'The Policies page allows Company Admins to create and manage spending guidelines. Every submitted claim is automatically audited against active policy limits.',
    features: [
      { name: 'Rupee (₹) Spending Caps', desc: 'Define maximum thresholds for Meal Expenses, Travel Costs, Daily Caps, and Monthly Limits in ₹.' },
      { name: 'Approved Vendor Whitelists', desc: 'Specify approved corporate vendors (e.g. Uber, Hilton, Starbucks, Amazon) to auto-verify merchant legitimacy.' },
      { name: 'Pre-Approval Verification', desc: 'Require manager pre-approval for high-cost line items or specific categories.' },
      { name: 'Policy Activation Toggle', desc: 'Instantly enable or disable policy rulesets without deleting configuration.' }
    ],
    howTo: [
      'Click "Define Policy" to create a new corporate ruleset.',
      'Set cap limits in Rupees (₹) (entering 0 means no threshold limit).',
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
      { name: 'Duplicate Receipt Scanning', desc: 'Flags duplicate receipt uploads across the company network.' },
      { name: 'Anomaly Flags', desc: 'Detects off-hours submissions, weekend expense spikes, unapproved merchant categories, or threshold limit breaches.' },
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

const PageGuideModal = ({ isOpen, onClose, currentPath }) => {
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
