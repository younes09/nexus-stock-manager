
import React, { useMemo, useState } from 'react';
import { CashTransaction } from '../types';
import { useLanguage } from '../LanguageContext';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Plus, 
  Trash2, 
  Calendar,
  Filter,
  Search
} from 'lucide-react';

interface Props {
  transactions: CashTransaction[];
  onAdd: (t: CashTransaction) => void;
  onDelete: (id: string) => void;
}

const CashManagement: React.FC<Props> = ({ transactions, onAdd, onDelete }) => {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<Partial<CashTransaction>>({
    type: 'expense',
    category: 'Général',
    date: new Date().toISOString().split('T')[0]
  });

  const stats = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => filterType === 'all' || t.type === filterType)
      .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    onAdd({
      id: crypto.randomUUID(),
      description: formData.description,
      amount: Number(formData.amount),
      type: formData.type as 'income' | 'expense',
      category: formData.category || 'Général',
      date: formData.date || new Date().toISOString().split('T')[0]
    });

    setShowModal(false);
    setFormData({
      type: 'expense',
      category: 'Général',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const formatDA = (val: number) => `${val.toLocaleString()} DA`;

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">{t('cash.title')}</h1>
          <p className="text-sm lg:text-base text-slate-500">{t('cash.subtitle')}</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30"
        >
          <Plus size={20} />
          {t('cash.addTransaction')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-200">
          <div className="flex items-center gap-3 mb-4 opacity-80">
            <Wallet size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">{t('cash.balance')}</span>
          </div>
          <div className="text-3xl lg:text-4xl font-black">{formatDA(stats.balance)}</div>
          <div className="mt-6 flex gap-4">
            <div className="flex-1 bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
                <div className="text-[10px] text-indigo-100 font-bold uppercase mb-1">{t('cash.income')}</div>
                <div className="font-bold flex items-center gap-1 text-emerald-300">
                    <ArrowUpRight size={14} /> {formatDA(stats.income)}
                </div>
            </div>
            <div className="flex-1 bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
                <div className="text-[10px] text-indigo-100 font-bold uppercase mb-1">{t('cash.expense')}</div>
                <div className="font-bold flex items-center gap-1 text-rose-300">
                    <ArrowDownRight size={14} /> {formatDA(stats.expenses)}
                </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-lg font-bold text-slate-800">{t('cash.transactions')}</h2>
                <div className="flex items-center gap-2">
                    <div className="relative flex-grow sm:flex-grow-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder={t('common.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-48 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none"
                    >
                        <option value="all">Tous</option>
                        <option value="income">{t('cash.income')}</option>
                        <option value="expense">{t('cash.expense')}</option>
                    </select>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto max-h-[400px] space-y-3 pr-2 custom-scrollbar">
                {filteredTransactions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <Calendar size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="font-bold text-sm">{t('cash.noTransactions')}</p>
                    </div>
                ) : (
                    filteredTransactions.map(t_item => (
                        <div key={t_item.id} className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50 transition-all">
                            <div className={`p-3 rounded-xl ${t_item.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {t_item.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                            </div>
                            <div className="flex-grow min-w-0">
                                <div className="font-bold text-slate-800 truncate">{t_item.description}</div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                    <span>{t_item.date}</span>
                                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                    <span>{t_item.category}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`font-black ${t_item.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                    {t_item.type === 'income' ? '+' : '-'}{formatDA(t_item.amount)}
                                </div>
                                <button 
                                    onClick={() => onDelete(t_item.id)}
                                    className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                <div className="p-8 border-b border-slate-100">
                    <h3 className="text-xl font-black text-slate-900">{t('cash.addTransaction')}</h3>
                    <p className="text-sm text-slate-500 font-medium">{t('cash.subtitle')}</p>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('cash.type')}</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setFormData({...formData, type: 'income'})}
                                    className={`py-3 rounded-2xl font-bold transition-all border-2 ${
                                        formData.type === 'income' 
                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg shadow-emerald-500/10' 
                                            : 'bg-slate-50 border-transparent text-slate-400'
                                    }`}
                                >
                                    {t('cash.income')}
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setFormData({...formData, type: 'expense'})}
                                    className={`py-3 rounded-2xl font-bold transition-all border-2 ${
                                        formData.type === 'expense' 
                                            ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-lg shadow-rose-500/10' 
                                            : 'bg-slate-50 border-transparent text-slate-400'
                                    }`}
                                >
                                    {t('cash.expense')}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('cash.description')}</label>
                                <input 
                                    required
                                    type="text" 
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-medium outline-none"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('cash.amount')}</label>
                                    <input 
                                        required
                                        type="number" 
                                        value={formData.amount || ''}
                                        onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-black outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('cash.date')}</label>
                                    <input 
                                        required
                                        type="date" 
                                        value={formData.date || ''}
                                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('cash.category')}</label>
                                <select 
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold outline-none"
                                >
                                    <option value="Général">Général</option>
                                    <option value="Fournitures">Fournitures</option>
                                    <option value="Loyer">Loyer</option>
                                    <option value="Électricité">Électricité</option>
                                    <option value="Salaire">Salaire</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Autre">Autre</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button 
                            type="button" 
                            onClick={() => setShowModal(false)}
                            className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold hover:bg-slate-100 transition-all"
                        >
                            {t('common.cancel')}
                        </button>
                        <button 
                            type="submit" 
                            className="flex-2 flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/30"
                        >
                            <Plus size={20} />
                            {t('common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default CashManagement;
