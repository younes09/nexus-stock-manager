import React, { useMemo, useState } from 'react';
import { AppState, Product } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Package, BrainCircuit, AlertCircle, ShieldAlert, Wallet, Activity, CalendarOff } from 'lucide-react';
import { getStockInsights } from '../geminiService';

interface Props {
  state: AppState;
}

const Dashboard: React.FC<Props> = ({ state }) => {
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const metrics = useMemo(() => {
    const totalSales = state.invoices
      .filter(i => i.type === 'sale')
      .reduce((sum, i) => sum + i.total, 0);
    
    const totalPurchases = state.invoices
      .filter(i => i.type === 'purchase')
      .reduce((sum, i) => sum + i.total, 0);

    const lowStockItems = state.products.filter(p => p.stock <= p.minStock).length;

    // Calculate profit (Revenue - COGS)
    let cogs = 0;
    state.invoices.filter(i => i.type === 'sale').forEach(inv => {
      inv.items.forEach(item => {
        const prod = state.products.find(p => p.id === item.productId);
        if (prod) cogs += (prod.cost * item.quantity);
      });
    });

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringItems = state.products.filter(p => p.expiryDate && new Date(p.expiryDate) <= thirtyDaysFromNow);
    
    return { totalSales, totalPurchases, lowStockItems, expiringCount: expiringItems.length, profit: totalSales - cogs, totalProducts: state.products.length };
  }, [state]);

  const salesData = useMemo(() => {
    return state.invoices
      .filter(i => i.type === 'sale')
      .slice(-7)
      .reverse()
      .map(i => ({ date: i.date.split('T')[0], amount: i.total }));
  }, [state.invoices]);

  const stockDistribution = useMemo(() => {
    return state.products.slice(0, 5).map(p => ({ name: p.name, stock: p.stock }));
  }, [state.products]);

  const runAiAnalysis = async () => {
    setLoadingAi(true);
    const result = await getStockInsights(state.products, state.invoices);
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  const COLORS = ['#0284c7', '#38bdf8', '#bae6fd', '#0ea5e9', '#0369a1'];

  const formatDA = (val: number) => {
    return `${val.toLocaleString()} DA`;
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">Practice Overview</h1>
          <p className="text-sm lg:text-base text-slate-500">Clinical supply levels and operational metrics.</p>
        </div>
        <button 
          onClick={runAiAnalysis}
          disabled={loadingAi}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-600 text-white px-6 py-3.5 lg:py-3 rounded-2xl font-bold hover:bg-sky-700 transition-all shadow-lg shadow-sky-500/30 disabled:opacity-50"
        >
          <BrainCircuit size={20} />
          {loadingAi ? 'Analyzing Clinical Data...' : 'AI Clinical Insights'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard title="Procedure Revenue" value={formatDA(metrics.totalSales)} icon={<TrendingUp size={24} />} trend="+12%" color="bg-emerald-50 text-emerald-600" />
        <StatCard title="Est. Clinical Profit" value={formatDA(metrics.profit)} icon={<Activity size={24} />} trend="+8.4%" color="bg-indigo-50 text-indigo-600" />
        <StatCard title="Safety Alerts" value={metrics.expiringCount.toString()} icon={<CalendarOff size={24} />} color={metrics.expiringCount > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400"} subValue="Expiring soon" />
        <StatCard title="Clinical Alerts" value={metrics.lowStockItems.toString()} icon={<ShieldAlert size={24} />} color="bg-amber-50 text-amber-600" subValue={`of ${metrics.totalProducts} lines`} />
      </div>

      {aiAnalysis && (
        <div className="bg-indigo-950 text-white p-6 lg:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden border border-white/5">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <BrainCircuit className="text-sky-400" />
                <h2 className="text-lg lg:text-xl font-bold">AI Clinical Analysis</h2>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white/10 rounded-full border border-white/10">Gemini 3.0 Engine</span>
            </div>
            <p className="text-sky-200 mb-8 max-w-2xl text-sm lg:text-base font-medium leading-relaxed">{aiAnalysis.summary}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aiAnalysis.restockSuggestions.map((s: any, i: number) => (
                <div key={i} className="bg-white/5 p-5 rounded-3xl border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-colors">
                  <div className={`text-[10px] font-black mb-2 uppercase tracking-[0.2em] ${
                    s.priority.toLowerCase() === 'high' ? 'text-rose-400' : 'text-sky-400'
                  }`}>
                    {s.priority} PRIORITY
                  </div>
                  <div className="font-black text-slate-50 mb-2 group-hover:text-sky-300 transition-colors">{s.product}</div>
                  <div className="text-xs text-sky-200/60 leading-relaxed font-medium">{s.reason}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full -mr-32 -mt-32 blur-[100px] pointer-events-none"></div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 bg-white p-4 lg:p-6 rounded-3xl shadow-sm border border-slate-200 transition-colors">
          <h3 className="text-lg font-bold mb-6 text-slate-800">Financial Performance (DA)</h3>
          <div className="h-64 lg:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ left: 10 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString()} DA`, 'Amount']}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#ffffff',
                    color: '#1e293b'
                  }}
                />
                <Area type="monotone" dataKey="amount" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-3xl shadow-sm border border-slate-200 transition-colors">
          <h3 className="text-lg font-bold mb-6 text-slate-800">Supply Distribution</h3>
          <div className="h-56 lg:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="stock"
                  stroke="none"
                >
                  {stockDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    backgroundColor: '#ffffff',
                    border: 'none',
                    color: '#1e293b'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {stockDistribution.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-xs lg:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-slate-600 truncate max-w-[120px] font-medium">{s.name}</span>
                </div>
                <span className="font-black text-slate-800">{s.stock}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, color, subValue }: any) => (
  <div className="bg-white p-5 lg:p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-all cursor-default group">
    <div className="flex justify-between items-start mb-3 lg:mb-4">
      <div className={`p-2.5 lg:p-3 rounded-2xl ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      {trend && (
        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trend}
        </span>
      )}
    </div>
    <div>
      <h4 className="text-slate-500 text-xs lg:text-sm font-bold mb-1 tracking-tight uppercase tracking-widest">{title}</h4>
      <div className="flex items-baseline flex-wrap gap-2">
        <span className="text-xl lg:text-2xl font-black text-slate-900 leading-none">{value}</span>
        {subValue && <span className="text-[10px] lg:text-xs text-slate-400 font-bold uppercase tracking-tight">{subValue}</span>}
      </div>
    </div>
  </div>
);

export default Dashboard;