import React, { useMemo, useState } from 'react';
import { AppState, Product } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Activity, CalendarOff, ShieldAlert, Package, Layers, Plus, ShoppingCart, Truck } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { Link } from 'react-router-dom';
import { useAppContext } from '../AppContext';

interface Props { }

const Dashboard: React.FC<Props> = () => {
  const { t } = useLanguage();
  const { state } = useAppContext();

  const metrics = useMemo(() => {
    const totalSales = state.invoices.data
      .filter(i => i.type === 'sale')
      .reduce((sum, i) => sum + i.total, 0);

    const totalPurchases = state.invoices.data
      .filter(i => i.type === 'purchase')
      .reduce((sum, i) => sum + i.total, 0);

    const lowStockItems = state.products.filter(p => p.stock <= p.minStock).length;

    // Calculate profit (Revenue - COGS)
    let cogs = 0;
    state.invoices.data.filter(i => i.type === 'sale').forEach(inv => {
      inv.items.forEach(item => {
        cogs += (item.cost * item.quantity);
      });
    });

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringItems = state.products.filter(p => p.expiryDate && new Date(p.expiryDate) <= thirtyDaysFromNow);

    return { totalSales, totalPurchases, lowStockItems, expiringCount: expiringItems.length, profit: totalSales - cogs, totalProducts: state.products.length };
  }, [state]);

  const salesData = useMemo(() => {
    return state.invoices.data
      .filter(i => i.type === 'sale')
      .slice(-7)
      .reverse()
      .map(i => ({ date: i.date.split('T')[0], amount: i.total }));
  }, [state.invoices.data]);

  const stockDistribution = useMemo(() => {
    return state.products.slice(0, 5).map(p => ({ name: p.name, stock: p.stock }));
  }, [state.products]);



  const COLORS = ['#0284c7', '#38bdf8', '#bae6fd', '#0ea5e9', '#0369a1'];

  const formatDA = (val: number) => {
    return `${val.toLocaleString()} DA`;
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">{t('dashboard.overview')}</h1>
        <p className="text-sm lg:text-base text-slate-500">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard title={t('dashboard.revenue')} value={formatDA(metrics.totalSales)} icon={<TrendingUp size={24} />} trend="+12%" color="bg-emerald-50 text-emerald-600" />
        <StatCard title={t('dashboard.profit')} value={formatDA(metrics.profit)} icon={<Activity size={24} />} trend="+8.4%" color="bg-indigo-50 text-indigo-600" />
        <StatCard title={t('dashboard.safetyAlerts')} value={metrics.expiringCount.toString()} icon={<CalendarOff size={24} />} color={metrics.expiringCount > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400"} subValue={t('dashboard.expiringSoon')} />
        <StatCard title={t('dashboard.clinicalAlerts')} value={metrics.lowStockItems.toString()} icon={<ShieldAlert size={24} />} color="bg-amber-50 text-amber-600" subValue={t('dashboard.ofLines').replace('{total}', metrics.totalProducts.toString())} />
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{t('dashboard.quickActions')}</h3>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/invoice/new/sale"
            className="flex-1 min-w-[160px] flex items-center gap-4 p-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-2xl transition-all group"
          >
            <div className="p-3 bg-indigo-600 text-white rounded-xl group-hover:scale-110 transition-transform">
              <ShoppingCart size={20} />
            </div>
            <div>
              <div className="font-black text-indigo-900 leading-tight">{t('dashboard.newSale')}</div>
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{t('nav.newSale')}</div>
            </div>
            <Plus className="ml-auto text-indigo-300" size={18} />
          </Link>

          <Link
            to="/invoice/new/purchase"
            className="flex-1 min-w-[160px] flex items-center gap-4 p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-2xl transition-all group"
          >
            <div className="p-3 bg-emerald-600 text-white rounded-xl group-hover:scale-110 transition-transform">
              <Truck size={20} />
            </div>
            <div>
              <div className="font-black text-emerald-900 leading-tight">{t('dashboard.newPurchase')}</div>
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Stock Restock</div>
            </div>
            <Plus className="ml-auto text-emerald-300" size={18} />
          </Link>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 bg-white p-4 lg:p-6 rounded-3xl shadow-sm border border-slate-200 transition-colors">
          <h3 className="text-lg font-bold mb-6 text-slate-800">{t('dashboard.financialPerformance')}</h3>
          <div className="h-64 lg:h-80 w-full min-h-[16rem]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={1}>
              <AreaChart data={salesData} margin={{ left: 10 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
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
          <h3 className="text-lg font-bold mb-6 text-slate-800">{t('dashboard.supplyDistribution')}</h3>
          <div className="h-56 lg:h-80 w-full min-h-[14rem]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={1}>
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