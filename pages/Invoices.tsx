
import React, { useState, useMemo } from 'react';
import { Invoice } from '../types';
import { 
  FileText, 
  Eye, 
  Calendar, 
  User, 
  Filter, 
  X, 
  ArrowDownWideOverLow,
  ArrowUpNarrowWide,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  invoices: Invoice[];
}

const InvoicesPage: React.FC<Props> = ({ invoices }) => {
  // Filter States
  const [filterType, setFilterType] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Derived data for filters
  const entities = useMemo(() => {
    const names = new Set(invoices.map(inv => inv.entityName));
    return Array.from(names).sort();
  }, [invoices]);

  // Filtering Logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesType = filterType === 'all' || inv.type === filterType;
      const matchesEntity = filterEntity === 'all' || inv.entityName === filterEntity;
      const matchesSearch = inv.number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            inv.entityName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const invDate = new Date(inv.date);
      const matchesStart = !startDate || invDate >= new Date(startDate);
      const matchesEnd = !endDate || invDate <= new Date(endDate + 'T23:59:59');

      return matchesType && matchesEntity && matchesSearch && matchesStart && matchesEnd;
    });
  }, [invoices, filterType, filterEntity, searchTerm, startDate, endDate]);

  const resetFilters = () => {
    setFilterType('all');
    setFilterEntity('all');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  const isFiltered = filterType !== 'all' || filterEntity !== 'all' || startDate || endDate || searchTerm;

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-24 lg:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">Ledger & Invoices</h1>
          <p className="text-sm lg:text-base text-slate-500">Transaction history for your practice (Amounts in DA).</p>
        </div>
        <div className="flex w-full sm:w-auto gap-2 lg:gap-3">
          <Link 
            to="/invoice/new/purchase"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3.5 lg:py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm text-sm"
          >
            Buy Stock
          </Link>
          <Link 
            to="/invoice/new/sale"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3.5 lg:py-3 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 text-sm"
          >
            Sell Items
          </Link>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-5 lg:p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <Filter size={18} />
            <h2 className="text-xs font-black uppercase tracking-widest">Advanced Filters</h2>
          </div>
          {isFiltered && (
            <button 
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-rose-500 font-bold text-[10px] uppercase tracking-widest hover:text-rose-600 transition-colors"
            >
              <X size={14} /> Reset
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="space-y-2 lg:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Ledger</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
              <input 
                type="text"
                placeholder="INV-XXXX or Entity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-sm transition-all"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2 lg:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date Range</label>
            <div className="flex items-center gap-2">
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              />
              <span className="text-slate-300 font-bold">to</span>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Classification</label>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="sale">Practice Sales</option>
              <option value="purchase">Supply Orders</option>
            </select>
          </div>

          {/* Entity Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Billing Entity</label>
            <select 
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Entities</option>
              {entities.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Invoice Cards */}
      <div className="lg:hidden space-y-4">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] border-2 border-dashed border-slate-100 text-center flex flex-col items-center gap-4">
            <div className="p-4 bg-slate-50 rounded-full text-slate-300"><FileText size={48} strokeWidth={1} /></div>
            <p className="text-slate-400 font-bold text-sm">No results match your filters.</p>
            {isFiltered && (
              <button onClick={resetFilters} className="text-indigo-600 text-xs font-black uppercase">Clear Filters</button>
            )}
          </div>
        ) : (
          filteredInvoices.map(inv => (
            <div key={inv.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${inv.type === 'sale' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">{inv.number}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <Calendar size={10} /> {new Date(inv.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                  inv.type === 'sale' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {inv.type}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  <span className="text-sm font-bold text-slate-700 truncate max-w-[140px]">{inv.entityName}</span>
                </div>
                <div className="text-lg font-black text-slate-900">{inv.total.toLocaleString()} DA</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-[0.15em]">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  {inv.status}
                </div>
                <Link to={`/invoice/view/${inv.id}`} className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest px-4 py-2 bg-indigo-50 rounded-xl">
                  <Eye size={12} /> View
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
            <tr>
              <th className="px-8 py-5">Invoice Reference</th>
              <th className="px-8 py-5">Billing Entity</th>
              <th className="px-8 py-5">Classification</th>
              <th className="px-8 py-5">Settlement (DA)</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-300">
                    <FileText size={40} strokeWidth={1} />
                    <p className="text-sm font-bold">No transactions found matching your selection.</p>
                    {isFiltered && (
                      <button onClick={resetFilters} className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mt-2">Clear Filters</button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="font-black text-slate-900">{inv.number}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(inv.date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-8 py-5 font-bold text-slate-700">{inv.entityName}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                      inv.type === 'sale' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {inv.type}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-sm font-black text-slate-900">{inv.total.toLocaleString()} DA</div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <Link to={`/invoice/view/${inv.id}`} className="inline-flex p-2 text-slate-300 hover:text-indigo-600 bg-white border border-slate-100 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                      <Eye size={18} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoicesPage;
