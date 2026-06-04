import React, { useState, useEffect } from 'react';
import { analyticsService, exportService } from '../services/api';
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Download, 
  FileText, 
  PieChart, 
  Activity,
  ChevronRight,
  Loader2
} from 'lucide-react';

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await analyticsService.getSummary();
      setAnalytics(res.data);
    } catch (err) {
      console.error('Analytics failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const res = type === 'csv' ? await exportService.getCSV() : await exportService.getPDF();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `habit_report_${new Date().toISOString().split('T')[0]}.${type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-sky-500" size={40} />
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Pro Analytics</h2>
          <p className="text-slate-500 font-medium italic">Deep behavioral insights and productivity tracking.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-black text-sm text-slate-700 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {exporting === 'csv' ? <Loader2 size={18} className="animate-spin" /> : <Activity size={18} className="text-sky-500" />}
            Export CSV
          </button>
          <button 
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {exporting === 'pdf' ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} className="text-sky-300" />}
            Download PDF Report
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Consistency Score', value: `${analytics.consistencyScore}%`, icon: Target, color: 'text-sky-500', bg: 'bg-sky-50' },
          { label: 'Monthly Progress', value: `${analytics.monthlyProgress}%`, icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Best Week', value: analytics.bestWeek, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Weakest Day', value: analytics.weakestDay, icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50' },
        ].map((stat, i) => (
          <div key={i} className="glass p-8 rounded-[2.5rem] border border-white/50 shadow-sm group hover:border-sky-200 transition-all">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 shadow-inner`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Productivity Trend */}
        <div className="glass p-10 rounded-[3rem] border border-white/50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <TrendingUp className="text-sky-500" />
              Productivity Trend
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last 6 Weeks</span>
          </div>
          <div className="h-64 flex items-end justify-between gap-4 px-4">
            {analytics.trends.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                <div 
                  className="w-full bg-sky-500/5 rounded-xl relative group-hover:bg-sky-500/10 transition-all cursor-pointer flex flex-col justify-end overflow-hidden"
                  style={{ height: '100%' }}
                >
                  {/* Background Bar */}
                  <div 
                    className="w-full bg-gradient-to-t from-sky-600/80 to-sky-400/80 rounded-xl transition-all duration-1000 ease-out relative group"
                    style={{ height: `${(w.completions / Math.max(...analytics.trends.map(t => t.completions), 1)) * 100}%` }}
                  >
                    {/* Tooltip/Value */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-2 z-20">
                      <div className="bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-lg font-black shadow-xl whitespace-nowrap">
                        {w.completions} {w.completions === 1 ? 'Habit' : 'Habits'}
                      </div>
                      <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1"></div>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center h-8 flex items-center">{w.week}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Days Analysis */}
        <div className="glass p-10 rounded-[3rem] border border-white/50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <PieChart className="text-rose-500" />
              Weekday Performance
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency Rate</span>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {(analytics.allDays || analytics.weakDays).map((d, i) => (
              <div key={i} className="group p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-slate-700">{d.day}</span>
                    {d.rate === 0 && <span className="text-[8px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full uppercase">Needs Focus</span>}
                  </div>
                  <span className={`text-xs font-black ${d.rate < 40 ? 'text-rose-500' : 'text-sky-600'}`}>{d.rate}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`h-full transition-all duration-1000 shadow-sm ${d.rate < 40 ? 'bg-gradient-to-r from-rose-500 to-rose-400' : 'bg-gradient-to-r from-slate-900 to-slate-700'}`}
                    style={{ width: `${d.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
