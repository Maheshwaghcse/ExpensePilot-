import React from 'react';

const MetricCard = ({ title, value, icon: Icon, trend, trendType, color = 'indigo' }) => {
  const colorMap = {
    indigo: 'from-indigo-500/10 to-indigo-600/5 border-indigo-500/10 text-indigo-400 hover:border-indigo-500/20',
    rose: 'from-rose-500/10 to-rose-600/5 border-rose-500/10 text-rose-400 hover:border-rose-500/20',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/10 text-emerald-400 hover:border-emerald-500/20',
    amber: 'from-amber-500/10 to-amber-600/5 border-amber-500/10 text-amber-400 hover:border-amber-500/20'
  };

  return (
    <div className={`glass-card bg-gradient-to-br ${colorMap[color]} p-6 rounded-2xl border glass-card-hover flex flex-col justify-between h-36`}>
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm font-medium tracking-wide uppercase">{title}</span>
        <div className={`p-2.5 rounded-xl bg-slate-900/50 border border-white/5`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="flex items-baseline justify-between mt-2">
        <h3 className="text-3xl font-bold tracking-tight text-white">{value}</h3>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trendType === 'up' 
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' 
              : trendType === 'down'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                : 'bg-slate-500/10 text-slate-400 border border-slate-500/10'
          }`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
