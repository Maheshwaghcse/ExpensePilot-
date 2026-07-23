import React, { useState, useEffect } from 'react';
import api from '../services/api';
import MetricCard from '../components/UI/MetricCard';
import { 
  TrendingUp, 
  Clock, 
  ShieldAlert, 
  FileSpreadsheet, 
  Loader2, 
  DollarSign, 
  Percent,
  CheckCircle2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';

const COLORS = ['#6366f1', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/dashboards/analytics');
      setData(res.data);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold max-w-lg mx-auto mt-12 text-center">
        {error}
      </div>
    );
  }

  const { metrics, categoryStats, departmentStats, trendData, topEmployees, riskStats } = data;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard 
          title="Total Audited Spend" 
          value={`$${metrics.totalSpent.toLocaleString()}`} 
          icon={DollarSign} 
          trend="+12.4% MoM" 
          trendType="down" // positive business trend (lower spend rate or green highlight)
          color="indigo"
        />
        <MetricCard 
          title="Pending Approvals" 
          value={metrics.pendingCount} 
          icon={Clock} 
          trend={`${metrics.totalClaims} total claims`} 
          trendType="neutral"
          color="amber"
        />
        <MetricCard 
          title="Open Fraud Cases" 
          value={metrics.fraudCount} 
          icon={ShieldAlert} 
          trend={metrics.fraudCount > 0 ? "Action required" : "All clear"} 
          trendType={metrics.fraudCount > 0 ? "up" : "down"}
          color="rose"
        />
        <MetricCard 
          title="Avg Risk Compliance" 
          value={`${Math.round(riskStats?.avgRisk || 0)}%`} 
          icon={Percent} 
          trend="Target < 20%" 
          trendType={(riskStats?.avgRisk || 0) > 20 ? "up" : "down"}
          color="emerald"
        />
      </div>

      {/* Grid of Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-white/5 bg-slate-900/40">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-white tracking-tight">Corporate Spending Trend</h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-white/5 text-slate-300 rounded-lg">Approved USD</span>
          </div>
          <div className="h-72">
            {trendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No monthly data recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }}
                    labelClassName="text-slate-400 text-xs font-bold"
                  />
                  <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSpend)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Breakdown Donut Chart */}
        <div className="glass-card rounded-2xl p-6 border border-white/5 bg-slate-900/40">
          <h3 className="text-base font-bold text-white tracking-tight mb-6">Spend by Category</h3>
          <div className="h-60 relative flex items-center justify-center">
            {categoryStats.length === 0 ? (
              <span className="text-slate-500 text-sm">No categories mapped.</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Legend Labels */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {categoryStats.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="text-slate-400 truncate">{item.name}</span>
                <span className="text-slate-300 font-bold ml-auto">${item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row of Secondary Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department spend Bar Chart */}
        <div className="glass-card rounded-2xl p-6 border border-white/5 bg-slate-900/40">
          <h3 className="text-base font-bold text-white tracking-tight mb-6">Spend by Department</h3>
          <div className="h-64">
            {departmentStats.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No department records yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }}
                  />
                  <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]}>
                    {departmentStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Unassigned' ? '#64748b' : '#a855f7'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Spenders (Employees) Table */}
        <div className="glass-card rounded-2xl p-6 border border-white/5 bg-slate-900/40">
          <h3 className="text-base font-bold text-white tracking-tight mb-4">Top Spenders</h3>
          <div className="divide-y divide-white/5">
            {topEmployees.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">No employee data found.</div>
            ) : (
              topEmployees.map((emp, index) => (
                <div key={emp.name} className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 bg-white/5 w-6 h-6 rounded-full flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-white">{emp.name}</span>
                  </div>
                  <span className="text-sm font-bold text-indigo-400">${emp.amount.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Compliance & Risk Profiling Summary */}
        <div className="glass-card rounded-2xl p-6 border border-white/5 bg-slate-900/40">
          <h3 className="text-base font-bold text-white tracking-tight mb-4">Risk Profile Audits</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-rose-400">High Risk Claims (&ge;70%)</span>
                <span className="text-white font-bold">{riskStats?.highRiskCount || 0}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2">
                <div 
                  className="bg-rose-500 h-2 rounded-full transition-all" 
                  style={{ width: `${(riskStats?.highRiskCount / (metrics.totalClaims || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-amber-400">Medium Risk Claims (40-69%)</span>
                <span className="text-white font-bold">{riskStats?.mediumRiskCount || 0}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2">
                <div 
                  className="bg-amber-500 h-2 rounded-full transition-all" 
                  style={{ width: `${(riskStats?.mediumRiskCount / (metrics.totalClaims || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-emerald-400">Low Risk Claims (&lt;40%)</span>
                <span className="text-white font-bold">{riskStats?.lowRiskCount || 0}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all" 
                  style={{ width: `${(riskStats?.lowRiskCount / (metrics.totalClaims || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center gap-2.5 text-xs text-slate-400 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Policies enforce active scanning for all tenants.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
