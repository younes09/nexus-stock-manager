
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Truck, 
  Plus, 
  Search, 
  AlertTriangle,
  FileText,
  Menu,
  X,
  Stethoscope,
  Layers,
  LogOut,
  RefreshCcw,
  Cloud,
  Database
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
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY = 'dentastock_nexus_full_data';

const INITIAL_DATA: AppState = {
  products: [
    { id: '1', name: 'Composite Resin (A2 Shade)', sku: 'COMP-A2', category: 'Consumables', price: 8500, cost: 4500, stock: 24, minStock: 10 },
    { id: '2', name: 'Alginate Impression (Fast Set)', sku: 'ALG-FS', category: 'Prosthodontics', price: 3500, cost: 1800, stock: 8, minStock: 15 },
  ],
  entities: [
    { id: 'e1', name: 'City Dental Clinic', type: 'client', email: 'billing@citydental.com', phone: '555-0123', address: '789 Medical Plaza' },
  ],
  invoices: [],
  categories: [
    { id: 'c1', name: 'Consumables' },
    { id: 'c4', name: 'Prosthodontics' }
  ],
  user: null,
  syncQueue: [],
  isOnline: navigator.onLine
};

const SyncIndicator: React.FC<{ isSyncing: boolean; isSupabaseConfigured: boolean; isOnline: boolean; pendingCount: number; className?: string }> = ({ isSyncing, isSupabaseConfigured, isOnline, pendingCount, className }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    {isSyncing && (
      <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 animate-in slide-in-from-right duration-300">
        <RefreshCcw size={12} className="animate-spin text-indigo-600" />
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Updating...</span>
      </div>
    )}
    {pendingCount > 0 && (
      <div className="bg-amber-500 text-white px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 animate-pulse">
        <RefreshCcw size={12} />
        <span className="text-[9px] font-black uppercase tracking-widest">{pendingCount} Pending</span>
      </div>
    )}
    <div className={`px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 border ${
      isSupabaseConfigured ? (isOnline ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-rose-50 border-rose-100 text-rose-600') : 'bg-amber-50 border-amber-100 text-amber-600'
    }`}>
      {isSupabaseConfigured ? <Cloud size={12} /> : <Database size={12} />}
      <span className="text-[9px] font-black uppercase tracking-widest">
        {isSupabaseConfigured ? (isOnline ? 'Cloud On' : 'Offline') : 'Local'}
      </span>
    </div>
  </div>
);

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Load local state initially
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    const savedUser = localStorage.getItem('dentastock_nexus_user');
    
    let newState = savedState ? { ...INITIAL_DATA, ...JSON.parse(savedState) } : INITIAL_DATA;
    if (savedUser) newState.user = JSON.parse(savedUser);
    
    // Ensure syncQueue and isOnline are always present
    if (!newState.syncQueue) newState.syncQueue = [];
    newState.isOnline = navigator.onLine;

    setState(newState);
    
    // Online/Offline detection
    const handleStatusChange = () => {
      setState(prev => ({ ...prev, isOnline: navigator.onLine }));
    };
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    if (isSupabaseConfigured) {
      fetchData();
    } else {
      setIsLoading(false);
    }

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  // Sync state to local storage whenever it changes (fallback)
  useEffect(() => {
    if (state.user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...state,
        user: null // Don't store user in the main data blob for security
      }));
    }
  }, [state]);

  const fetchData = async (silent = false) => {
    if (!isSupabaseConfigured || !supabase) return;
    if (!silent) setIsLoading(true);
    try {
      const [
        { data: products },
        { data: categories },
        { data: entities },
        { data: invoices },
      ] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('categories').select('*').order('name'),
        supabase.from('entities').select('*').order('name'),
        supabase.from('invoices').select('*, invoice_items(*)').order('date', { ascending: false }),
      ]);

      setState(prev => ({
        ...prev,
        products: (products as any[])?.map(p => ({
          ...p,
          minStock: p.min_stock,
          expiryDate: p.expiry_date
        })) || [],
        categories: (categories as Category[]) || [],
        entities: (entities as Entity[]) || [],
        invoices: (invoices as any[])?.map(inv => ({
          ...inv,
          entityId: inv.entity_id,
          entityName: inv.entity_name,
          items: (inv.invoice_items as any[])?.map(item => ({
            ...item,
            productId: item.product_id,
            productName: item.product_name,
            unitPrice: item.unit_price
          })) || []
        })) || [],
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleLogin = (user: UserType) => {
    setState(prev => ({ ...prev, user }));
    localStorage.setItem('dentastock_nexus_user', JSON.stringify(user));
    navigate('/');
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, user: null }));
    localStorage.removeItem('dentastock_nexus_user');
    navigate('/');
  };

  // --- Sync Logic ---

  const queueTask = (task: any) => {
    setState(prev => ({ ...prev, syncQueue: [...prev.syncQueue, task] }));
  };

  const processSyncQueue = async () => {
    if (!state.isOnline || !isSupabaseConfigured || !supabase || state.syncQueue.length === 0) return;
    
    setIsSyncing(true);
    const queue = [...state.syncQueue];
    const successes: string[] = [];

    for (const task of queue) {
      try {
        let error = null;
        if (task.type === 'product') {
          if (task.action === 'insert') {
            const { id, ...p } = task.payload;
            const dbProduct = { ...p, min_stock: p.minStock, expiry_date: p.expiryDate || null };
            // @ts-ignore
            delete dbProduct.minStock; delete dbProduct.expiryDate;
            const { error: err } = await supabase.from('products').insert([dbProduct]);
            error = err;
          } else if (task.action === 'update') {
            const { id, ...p } = task.payload;
            const dbProduct = { ...p, min_stock: p.minStock, expiry_date: p.expiryDate || null };
            // @ts-ignore
            delete dbProduct.minStock; delete dbProduct.expiryDate;
            const { error: err } = await supabase.from('products').update(dbProduct).eq('id', task.payload.id);
            error = err;
          } else if (task.action === 'delete') {
            const { error: err } = await supabase.from('products').delete().eq('id', task.payload.id);
            error = err;
          }
        }
        // Similar blocks for category, entity, invoice...
        else if (task.type === 'category') {
           if (task.action === 'insert') {
             const { id, ...c } = task.payload;
             const { error: err } = await supabase.from('categories').insert([c]);
             error = err;
           } else if (task.action === 'update') {
             const { error: err } = await supabase.from('categories').update(task.payload).eq('id', task.payload.id);
             error = err;
           } else if (task.action === 'delete') {
             const { error: err } = await supabase.from('categories').delete().eq('id', task.payload.id);
             error = err;
           }
        }
        else if (task.type === 'entity') {
           if (task.action === 'insert') {
             const { id, ...e } = task.payload;
             const { error: err } = await supabase.from('entities').insert([e]);
             error = err;
           } else if (task.action === 'update') {
             const { error: err } = await supabase.from('entities').update(task.payload).eq('id', task.payload.id);
             error = err;
           } else if (task.action === 'delete') {
             const { error: err } = await supabase.from('entities').delete().eq('id', task.payload.id);
             error = err;
           }
        }
        else if (task.type === 'invoice') {
           if (task.action === 'insert') {
             const inv = task.payload;
             const { items, id, ...header } = inv;
             const dbHeader = { ...header, entity_id: inv.entityId, entity_name: inv.entityName };
             // @ts-ignore
             delete dbHeader.entityId; delete dbHeader.entityName;

             const { data: invData, error: invError } = await supabase.from('invoices').insert([dbHeader]).select();
             if (invError) { error = invError; }
             else {
               const itemsToInsert = items.map((item: any) => ({
                 invoice_id: invData[0].id,
                 product_id: item.productId,
                 product_name: item.productName,
                 quantity: item.quantity,
                 unit_price: item.unitPrice,
                 total: item.total
               }));
               const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);
               error = itemsError;
             }
           }
        }
        
        if (!error) successes.push(task.id);
      } catch (err) {
        console.error('Failed to sync task:', task, err);
      }
    }

    setState(prev => ({
      ...prev,
      syncQueue: prev.syncQueue.filter(t => !successes.includes(t.id))
    }));
    
    if (successes.length > 0) fetchData(true); // Silent refresh
    setIsSyncing(false);
  };

  useEffect(() => {
    if (state.isOnline) processSyncQueue();
  }, [state.isOnline]);

  // --- Storage Mutators ---

  const addProduct = async (p: Product) => {
    // Local update first for immediate UI response
    setState(prev => ({ ...prev, products: [...prev.products, p] }));

    if (state.isOnline && isSupabaseConfigured && supabase) {
      setIsSyncing(true);
      try {
        const { id, ...newProduct } = p;
        const dbProduct = { ...newProduct, min_stock: p.minStock, expiry_date: p.expiryDate || null };
        // @ts-ignore
        delete dbProduct.minStock; delete dbProduct.expiryDate;

        const { data, error } = await supabase.from('products').insert([dbProduct]).select();
        if (error) throw error;
        
        if (data) {
          const mappedProduct = { ...data[0], minStock: data[0].min_stock, expiryDate: data[0].expiry_date };
          setState(prev => ({ 
            ...prev, 
            products: prev.products.map(item => item.id === p.id ? mappedProduct : item) 
          }));
        }
      } catch (err) {
        console.error('Cloud Save Failed, Queuing:', err);
        queueTask({ id: Date.now().toString(), type: 'product', action: 'insert', payload: p, timestamp: Date.now() });
      } finally {
        setIsSyncing(false);
      }
    } else if (isSupabaseConfigured) {
      queueTask({ id: Date.now().toString(), type: 'product', action: 'insert', payload: p, timestamp: Date.now() });
    }
  };

  const updateProduct = async (p: Product) => {
    setState(prev => ({ ...prev, products: prev.products.map(item => item.id === p.id ? p : item) }));

    if (state.isOnline && isSupabaseConfigured && supabase) {
      setIsSyncing(true);
      try {
        const dbProduct = { ...p, min_stock: p.minStock, expiry_date: p.expiryDate || null };
        // @ts-ignore
        delete dbProduct.minStock; delete dbProduct.expiryDate;

        const { error } = await supabase.from('products').update(dbProduct).eq('id', p.id);
        if (error) throw error;
      } catch (err) {
        console.error('Cloud Update Failed, Queuing:', err);
        queueTask({ id: Date.now().toString(), type: 'product', action: 'update', payload: p, timestamp: Date.now() });
      } finally {
        setIsSyncing(false);
      }
    } else if (isSupabaseConfigured) {
      queueTask({ id: Date.now().toString(), type: 'product', action: 'update', payload: p, timestamp: Date.now() });
    }
  };

  const deleteProduct = async (id: string) => {
    setState(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));

    if (state.isOnline && isSupabaseConfigured && supabase) {
      setIsSyncing(true);
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Cloud Delete Failed, Queuing:', err);
        queueTask({ id: Date.now().toString(), type: 'product', action: 'delete', payload: { id }, timestamp: Date.now() });
      } finally {
        setIsSyncing(false);
      }
    } else if (isSupabaseConfigured) {
      queueTask({ id: Date.now().toString(), type: 'product', action: 'delete', payload: { id }, timestamp: Date.now() });
    }
  };

  const addEntity = async (e: Entity) => {
    setState(prev => ({ ...prev, entities: [...prev.entities, e] }));

    if (state.isOnline && isSupabaseConfigured && supabase) {
      setIsSyncing(true);
      try {
        const { id, ...newEntity } = e;
        const { data, error } = await supabase.from('entities').insert([newEntity]).select();
        if (error) throw error;
        if (data) setState(prev => ({ ...prev, entities: prev.entities.map(item => item.id === e.id ? (data[0] as Entity) : item) }));
      } catch (err) {
        console.error('Cloud Entity Add Failed:', err);
        queueTask({ id: Date.now().toString(), type: 'entity', action: 'insert', payload: e, timestamp: Date.now() });
      } finally {
        setIsSyncing(false);
      }
    } else if (isSupabaseConfigured) {
      queueTask({ id: Date.now().toString(), type: 'entity', action: 'insert', payload: e, timestamp: Date.now() });
    }
  };

  const updateEntity = async (e: Entity) => {
    setState(prev => ({ ...prev, entities: prev.entities.map(item => item.id === e.id ? e : item) }));

    if (state.isOnline && isSupabaseConfigured && supabase) {
      setIsSyncing(true);
      try {
        const { error } = await supabase.from('entities').update(e).eq('id', e.id);
        if (error) throw error;
      } catch (err) {
        console.error('Cloud Entity Update Failed:', err);
        queueTask({ id: Date.now().toString(), type: 'entity', action: 'update', payload: e, timestamp: Date.now() });
      } finally {
        setIsSyncing(false);
      }
    } else if (isSupabaseConfigured) {
      queueTask({ id: Date.now().toString(), type: 'entity', action: 'update', payload: e, timestamp: Date.now() });
    }
  };

  const deleteEntity = async (id: string) => {
    setState(prev => ({ ...prev, entities: prev.entities.filter(e => e.id !== id) }));

    if (state.isOnline && isSupabaseConfigured && supabase) {
      setIsSyncing(true);
      try {
        const { error } = await supabase.from('entities').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Cloud Entity Delete Failed:', err);
        queueTask({ id: Date.now().toString(), type: 'entity', action: 'delete', payload: { id }, timestamp: Date.now() });
      } finally {
        setIsSyncing(false);
      }
    } else if (isSupabaseConfigured) {
      queueTask({ id: Date.now().toString(), type: 'entity', action: 'delete', payload: { id }, timestamp: Date.now() });
    }
  };

  const addCategory = async (c: Category) => {
    setState(prev => ({ ...prev, categories: [...prev.categories, c] }));

    if (state.isOnline && isSupabaseConfigured && supabase) {
      setIsSyncing(true);
      try {
        const { id, ...newCategory } = c;
        const { data, error } = await supabase.from('categories').insert([newCategory]).select();
        if (error) throw error;
        if (data) setState(prev => ({ ...prev, categories: prev.categories.map(item => item.id === c.id ? data[0] : item) }));
      } catch (err) {
        console.error('Cloud Category Add Failed:', err);
        queueTask({ id: Date.now().toString(), type: 'category', action: 'insert', payload: c, timestamp: Date.now() });
      } finally {
        setIsSyncing(false);
      }
    } else if (isSupabaseConfigured) {
      queueTask({ id: Date.now().toString(), type: 'category', action: 'insert', payload: c, timestamp: Date.now() });
    }
  };

  const updateCategory = async (c: Category) => {
    setState(prev => ({ ...prev, categories: prev.categories.map(item => item.id === c.id ? c : item) }));

    if (state.isOnline && isSupabaseConfigured && supabase) {
      setIsSyncing(true);
      try {
        const { error } = await supabase.from('categories').update(c).eq('id', c.id);
        if (error) throw error;
      } catch (err) {
        console.error('Cloud Category Update Failed:', err);
        queueTask({ id: Date.now().toString(), type: 'category', action: 'update', payload: c, timestamp: Date.now() });
      } finally {
        setIsSyncing(false);
      }
    } else if (isSupabaseConfigured) {
      queueTask({ id: Date.now().toString(), type: 'category', action: 'update', payload: c, timestamp: Date.now() });
    }
  };

  const deleteCategory = async (id: string) => {
    setState(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }));

    if (state.isOnline && isSupabaseConfigured && supabase) {
      setIsSyncing(true);
      try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Cloud Category Delete Failed:', err);
        queueTask({ id: Date.now().toString(), type: 'category', action: 'delete', payload: { id }, timestamp: Date.now() });
      } finally {
        setIsSyncing(false);
      }
    } else if (isSupabaseConfigured) {
      queueTask({ id: Date.now().toString(), type: 'category', action: 'delete', payload: { id }, timestamp: Date.now() });
    }
  };

  const addInvoice = async (inv: Invoice) => {
    // Local Update First
    const updatedProducts = [...state.products];
    inv.items.forEach(item => {
      const prodIdx = updatedProducts.findIndex(p => p.id === item.productId);
      if (prodIdx !== -1) {
        updatedProducts[prodIdx].stock += (inv.type === 'sale' ? -item.quantity : item.quantity);
      }
    });

    setState(prev => ({
      ...prev,
      invoices: [inv, ...prev.invoices],
      products: updatedProducts
    }));

    if (state.isOnline && isSupabaseConfigured && supabase) {
      setIsSyncing(true);
      try {
        const { items, id, ...header } = inv;
        const dbHeader = { ...header, entity_id: inv.entityId, entity_name: inv.entityName };
        // @ts-ignore
        delete dbHeader.entityId; delete dbHeader.entityName;

        const { data: invData, error: invError } = await supabase.from('invoices').insert([dbHeader]).select();
        if (invError) throw invError;

        const itemsToInsert = items.map(item => ({
          invoice_id: invData[0].id,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.total
        }));
        
        const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;

        // Stock is already updated locally, Supabase stock should be updated too
        for (const item of items) {
          const prod = updatedProducts.find(p => p.id === item.productId);
          if (prod) {
            await supabase.from('products').update({ stock: prod.stock }).eq('id', prod.id);
          }
        }
      } catch (error) {
        console.error('Invoice Cloud Save Failed:', error);
        queueTask({ id: Date.now().toString(), type: 'invoice', action: 'insert', payload: inv, timestamp: Date.now() });
      } finally {
        setIsSyncing(false);
      }
    } else if (isSupabaseConfigured) {
      queueTask({ id: Date.now().toString(), type: 'invoice', action: 'insert', payload: inv, timestamp: Date.now() });
    }
  };

  if (!state.user) return <LoginPage onLogin={handleLogin} />;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="loader mx-auto"></div>
          <p className="text-slate-500 font-bold animate-pulse">Initializing Persistence...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: '/', label: 'Dash', icon: <LayoutDashboard size={20} /> },
    { path: '/products', label: 'Stock', icon: <Package size={20} /> },
    { path: '/categories', label: 'Categories', icon: <Layers size={20} /> },
    { path: '/clients', label: 'Practitioners', icon: <Users size={20} /> },
    { path: '/invoices', label: 'Ledger', icon: <FileText size={20} /> },
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
          <SyncIndicator 
            isSyncing={isSyncing} 
            isSupabaseConfigured={isSupabaseConfigured} 
            isOnline={state.isOnline} 
            pendingCount={state.syncQueue.length} 
          />
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
        
        <nav className="flex-grow py-6 px-4 space-y-2">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive(item.path) ? 'bg-sky-600 text-white shadow-lg' : 'text-indigo-300 hover:bg-indigo-900/50 hover:text-white'
            }`}>
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
          <Link to="/suppliers" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive('/suppliers') ? 'bg-sky-600 text-white shadow-lg' : 'text-indigo-300 hover:bg-indigo-900/50 hover:text-white'
          }`}>
            <Truck size={20} />
            <span className="font-medium">Supply Labs</span>
          </Link>
        </nav>

        <div className="p-4 space-y-3 border-t border-indigo-900">
          <Link to="/invoice/new/sale" className="w-full flex items-center justify-center gap-2 bg-sky-50 text-indigo-950 px-4 py-4 rounded-xl font-bold hover:bg-white shadow-xl">
            <Plus size={18} /> New Practice Sale
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-indigo-400 py-3 rounded-xl font-bold hover:text-white hover:bg-white/5 transition-all text-sm">
            <LogOut size={16} /> End Session
          </button>
        </div>
      </aside>

      {/* Backdrop */}
      {isMenuOpen && <div className="fixed inset-0 bg-black/50 z-[65] lg:hidden backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />}

      <main id="root-main" className="flex-grow flex flex-col min-w-0 min-h-screen">
        <header className="hidden lg:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 no-print sticky top-0 z-20">
          <div className="flex items-center gap-4 text-slate-500">
            <Search size={20} />
            <input type="text" placeholder="Search supplies..." className="bg-transparent outline-none w-64 focus:w-80 transition-all text-slate-700 font-medium" />
          </div>
          <div className="flex items-center gap-4">
            <SyncIndicator 
                isSyncing={isSyncing} 
                isSupabaseConfigured={isSupabaseConfigured} 
                isOnline={state.isOnline} 
                pendingCount={state.syncQueue.length} 
            />
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
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Low Stock Alerts</h3>
                      <span className="px-2 py-1 bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black">{state.products.filter(p => p.stock <= p.minStock).length} Items</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                      {state.products.filter(p => p.stock <= p.minStock).length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                          <Package size={32} className="mx-auto mb-2 opacity-20" />
                          <p className="text-xs font-bold">All supplies stocked!</p>
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
                                RESTOCK NOW →
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
            <Route path="/" element={<Dashboard state={state} />} />
            <Route path="/products" element={<ProductsPage products={state.products} categories={state.categories} onAdd={addProduct} onUpdate={updateProduct} onDelete={deleteProduct} />} />
            <Route path="/categories" element={<CategoriesPage categories={state.categories} onAdd={addCategory} onUpdate={updateCategory} onDelete={deleteCategory} />} />
            <Route path="/clients" element={<EntitiesPage type="client" entities={state.entities.filter(e => e.type === 'client')} onAdd={addEntity} onUpdate={updateEntity} onDelete={deleteEntity} />} />
            <Route path="/suppliers" element={<EntitiesPage type="supplier" entities={state.entities.filter(e => e.type === 'supplier')} onAdd={addEntity} onUpdate={updateEntity} onDelete={deleteEntity} />} />
            <Route path="/invoices" element={<InvoicesPage invoices={state.invoices} />} />
            <Route path="/invoice/new/:type" element={<InvoiceCreator products={state.products} entities={state.entities} onSave={addInvoice} />} />
            <Route path="/invoice/view/:id" element={<InvoiceDetail invoices={state.invoices} entities={state.entities} />} />
          </Routes>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-slate-200 grid grid-cols-5 items-center px-2 z-50 shadow-lg">
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
        <Link to="/invoices" className={`flex flex-col items-center gap-1 ${isActive('/invoices') ? 'text-sky-600' : 'text-slate-400'}`}>
          <FileText size={22} /><span className="text-[10px] font-black uppercase">Ledger</span>
        </Link>
      </nav>
    </div>
  );
};

export default App;
