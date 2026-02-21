
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  Plus,
  AlertTriangle,
  FileText,
  Menu,
  X,
  Stethoscope,
  Layers,
  LogOut,
  Wallet,
  ShoppingCart
} from 'lucide-react';
import { Product, Entity, Invoice, AppState, Category, User as UserType } from './types';
import Dashboard from './pages/Dashboard';
import ProductsPage from './pages/Products';
import EntitiesPage from './pages/Entities';
import InvoicesPage from './pages/Invoices';
import InvoiceCreator from './pages/InvoiceCreator';
import CategoriesPage from './pages/Categories';
import InvoiceDetail from './pages/InvoiceDetail';
import LoginPage from './pages/Login';
import CashManagement from './pages/CashManagement';
import POS from './pages/POS';
import ConfirmDialog from './components/ConfirmDialog';
import { useLanguage } from './LanguageContext';
import { useAppContext } from './AppContext';

const App: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const {
    state, isLoading, isSyncing, logout, login,
    addProduct, updateProduct, deleteProduct,
    addEntity, updateEntity, deleteEntity,
    addCategory, updateCategory, deleteCategory,
    addInvoice, updateInvoice, addCashTransaction, deleteCashTransaction,
    showDialog, hideDialog, dialogConfig
  } = useAppContext();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="loader mx-auto"></div>
          <p className="text-slate-500 font-bold animate-pulse">{t('common.initializingPersistence')}</p>
        </div>
      </div>
    );
  }

  if (!state.user) return <LoginPage onLogin={login} />;

  const navGroups = [
    {
      title: t('nav.overview'),
      items: [
        { path: '/', label: t('common.dashboard'), icon: <LayoutDashboard size={20} /> },
      ]
    },
    {
      title: t('nav.inventory'),
      items: [
        { path: '/products', label: t('common.products'), icon: <Package size={20} /> },
        { path: '/categories', label: t('common.categories'), icon: <Layers size={20} /> },
      ]
    },
    {
      title: t('nav.relations'),
      items: [
        { path: '/clients', label: t('common.clients'), icon: <Users size={20} /> },
        { path: '/suppliers', label: t('common.suppliers'), icon: <Truck size={20} /> },
      ]
    },
    {
      title: t('nav.finance'),
      items: [
        { path: '/invoices', label: t('common.invoices'), icon: <FileText size={20} /> },
        { path: '/pos', label: 'Terminal', icon: <ShoppingCart size={20} /> },
        { path: '/cash', label: t('nav.cash'), icon: <Wallet size={20} /> },
      ]
    }
  ];

  const isActive = (path: string) => location.pathname === path;
  const userInitials = state.user.fullName.split(' ').map(n => n[0]).join('');

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-900 transition-colors duration-300 overflow-x-hidden">


      {/* Mobile Header */}
      <header className="lg:hidden h-16 bg-indigo-950 text-white flex items-center justify-between px-4 sticky top-0 z-50 no-print">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-sky-500 rounded-lg">
            <Stethoscope size={20} />
          </div>
          <span className="font-bold text-lg">DentaStock</span>
        </div>
        <div className="flex items-center gap-2">

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-white/10 rounded-lg">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-64 bg-indigo-950 text-white flex flex-col no-print transition-transform duration-300 transform
        lg:relative lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="hidden lg:flex p-6 border-b border-indigo-900 items-center gap-3">
          <div className="p-2 bg-sky-500 rounded-lg"><Stethoscope size={24} /></div>
          <span className="font-bold text-xl tracking-tight">DentaStock</span>
        </div>

        <nav className="flex-grow py-6 px-4 space-y-6 overflow-y-auto">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <h3 className="px-4 mb-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">{group.title}</h3>
              <div className="space-y-1">
                {group.items.map(item => (
                  <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(item.path) ? 'bg-sky-600 text-white shadow-lg' : 'text-indigo-300 hover:bg-indigo-900/50 hover:text-white'
                    }`}>
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 space-y-3 border-t border-indigo-900">
          <Link to="/invoice/new/sale" className="w-full flex items-center justify-center gap-2 bg-sky-50 text-indigo-950 px-4 py-4 rounded-xl font-bold hover:bg-white shadow-xl">
            <Plus size={18} /> {t('nav.newSale')}
          </Link>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 text-indigo-400 py-3 rounded-xl font-bold hover:text-white hover:bg-white/5 transition-all text-sm">
            <LogOut size={16} /> {t('nav.endSession')}
          </button>
        </div>
      </aside>

      {/* Backdrop */}
      {isMenuOpen && <div className="fixed inset-0 bg-black/50 z-[65] lg:hidden backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />}

      <main id="root-main" className="flex-grow flex flex-col min-w-0 min-h-screen">
        <header className="hidden lg:flex h-16 bg-white border-b border-slate-200 items-center justify-end px-8 no-print sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
              className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors border border-slate-100"
            >
              {language === 'en' ? 'FR' : 'EN'}
            </button>

            <div className="relative">
              <button
                onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                className={`p-2 rounded-xl transition-all relative ${isAlertsOpen ? 'bg-rose-50 text-rose-600' : 'text-slate-400 hover:text-sky-600 hover:bg-slate-50'}`}
              >
                <AlertTriangle size={22} />
                {state.products.some(p => p.stock <= p.minStock) && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>}
              </button>

              {isAlertsOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsAlertsOpen(false)} />
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-2 overflow-hidden z-40 animate-in fade-in zoom-in duration-200">
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{t('dashboard.clinicalAlerts')}</h3>
                      <span className="px-2 py-1 bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black">{state.products.filter(p => p.stock <= p.minStock).length} {t('common.products')}</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                      {state.products.filter(p => p.stock <= p.minStock).length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                          <Package size={32} className="mx-auto mb-2 opacity-20" />
                          <p className="text-xs font-bold">{t('common.allSuppliesStocked')}</p>
                        </div>
                      ) : (
                        state.products.filter(p => p.stock <= p.minStock).map(p => (
                          <div key={p.id} className="p-3 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all group">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-sm font-bold text-slate-800 line-clamp-1">{p.name}</span>
                              <span className="text-[10px] font-black text-rose-600">{p.stock} / {p.minStock}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{p.category}</span>
                              <Link
                                to={`/invoice/new/purchase`}
                                onClick={() => setIsAlertsOpen(false)}
                                className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                {t('common.add').toUpperCase()} NOW →
                              </Link>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
              <div className="text-right">
                <div className="text-xs font-black text-slate-900 leading-none">{state.user?.fullName}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{state.user?.role}</div>
              </div>
              <div className="h-10 w-10 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center font-bold">{userInitials}</div>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 flex-grow">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/clients" element={<EntitiesPage type="client" />} />
            <Route path="/suppliers" element={<EntitiesPage type="supplier" />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/invoice/new/:type" element={<InvoiceCreator />} />
            <Route path="/invoice/view/:id" element={<InvoiceDetail />} />
            <Route path="/cash" element={<CashManagement />} />
          </Routes>
        </div>
      </main>

      {/* Global Confirmation/Alert Dialog */}
      <ConfirmDialog
        isOpen={dialogConfig.isOpen}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText={dialogConfig.confirmText}
        cancelText={dialogConfig.cancelText}
        variant={dialogConfig.variant}
        isAlert={dialogConfig.isAlert}
        onConfirm={() => {
          dialogConfig.onConfirm();
          hideDialog();
        }}
        onCancel={() => {
          if (dialogConfig.onCancel) dialogConfig.onCancel();
          hideDialog();
        }}
      />

      {/* Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-slate-200 grid grid-cols-5 items-center px-2 z-50 shadow-lg no-print">
        <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-sky-600' : 'text-slate-400'}`}>
          <LayoutDashboard size={22} /><span className="text-[10px] font-black uppercase">Dash</span>
        </Link>
        <Link to="/products" className={`flex flex-col items-center gap-1 ${isActive('/products') ? 'text-sky-600' : 'text-slate-400'}`}>
          <Package size={22} /><span className="text-[10px] font-black uppercase">Stock</span>
        </Link>
        <div className="flex justify-center -mt-10 relative">
          <Link to="/invoice/new/sale" className="flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-sky-600 to-indigo-600 text-white rounded-full shadow-xl border-8 border-white active:scale-95 transition-all">
            <Plus size={32} strokeWidth={3} />
          </Link>
        </div>
        <Link to="/categories" className={`flex flex-col items-center gap-1 ${isActive('/categories') ? 'text-sky-600' : 'text-slate-400'}`}>
          <Layers size={22} /><span className="text-[10px] font-black uppercase">Cats</span>
        </Link>
        <Link to="/pos" className={`flex flex-col items-center gap-1 ${isActive('/pos') ? 'text-sky-600' : 'text-slate-400'}`}>
          <ShoppingCart size={22} /><span className="text-[10px] font-black uppercase">POS</span>
        </Link>
        <Link to="/invoices" className={`flex flex-col items-center gap-1 ${isActive('/invoices') ? 'text-sky-600' : 'text-slate-400'}`}>
          <FileText size={22} /><span className="text-[10px] font-black uppercase">Ledger</span>
        </Link>
      </nav>
    </div>
  );
};

export default App;
