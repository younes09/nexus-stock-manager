
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Product, Category } from '../types';
import { Plus, Edit2, Trash2, Search, X, Scan, Zap, ZapOff, ChevronDown, AlertTriangle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useLanguage } from '../LanguageContext';

interface Props {
  products: Product[];
  categories: Category[];
  onAdd: (p: Product) => void;
  onUpdate: (p: Product) => void;
  onDelete: (id: string) => void;
  showDialog: (config: any) => void;
}

const ProductsPage: React.FC<Props> = ({ products, categories, onAdd, onUpdate, onDelete, showDialog }) => {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  
  const [isScanning, setIsScanning] = useState(false);
  const [scannedSku, setScannedSku] = useState('');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied' | 'insecure'>('prompt');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Unified Filtering Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      
      let matchesStock = true;
      if (stockFilter === 'out') matchesStock = p.stock === 0;
      else if (stockFilter === 'low') matchesStock = p.stock > 0 && p.stock <= p.minStock;
      else if (stockFilter === 'in') matchesStock = p.stock > p.minStock;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, categoryFilter, stockFilter]);

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setStockFilter('all');
  };

  const getExpiryStatus = (date?: string) => {
    if (!date) return null;
    const expiry = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return { label: 'Expired', color: 'bg-rose-500 text-white' };
    if (diffDays <= 30) return { label: `${diffDays}d Left`, color: 'bg-amber-500 text-white' };
    return { label: `Exp: ${expiry.toLocaleDateString()}`, color: 'bg-slate-100 text-slate-500' };
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.error("Audio beep failed", e);
    }
  };

  useEffect(() => {
    if (editingProduct) {
      setScannedSku(editingProduct.sku);
    } else {
      setScannedSku('');
    }
  }, [editingProduct, isModalOpen]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = async () => {
    setIsScanning(true);
    setIsTorchOn(false);
    setHasTorch(false);
    
    // Safety check for mobile browsers (Camera requires HTTPS or localhost)
    const isSecure = window.isSecureContext;
    if (!isSecure && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setCameraPermission('insecure');
      return;
    }

    setCameraPermission('prompt');

    setTimeout(async () => {
      try {
        // Trigger permission prompt by requesting cameras
        await Html5Qrcode.getCameras();
        setCameraPermission('granted');

        const scanner = new Html5Qrcode("product-scanner");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            playBeep();
            setScannedSku(decodedText);
            stopScanner();
          },
          () => {} 
        );
        try {
          const capabilities = scanner.getRunningTrackCapabilities();
          // @ts-ignore
          if (capabilities.torch) setHasTorch(true);
        } catch (e) {
          console.debug("Torch not supported");
        }
      } catch (err) {
        console.error("Camera access failed", err);
        showDialog({
            title: "Camera Error",
            message: t('invoiceCreator.cameraAccessFailed'),
            onConfirm: () => {},
            isAlert: true,
            variant: 'danger'
        });
        setIsScanning(false);
      }
    }, 100);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (e) {
        console.error(e);
      }
    }
    setIsScanning(false);
  };

  const toggleTorch = async () => {
    if (scannerRef.current && hasTorch) {
      try {
        const newState = !isTorchOn;
        await scannerRef.current.applyVideoConstraints({
          //@ts-ignore
          advanced: [{ torch: newState }]
        });
        setIsTorchOn(newState);
      } catch (e) {
        console.error("Failed to toggle torch", e);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const product: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name: formData.get('name') as string,
      sku: scannedSku, 
      category: formData.get('category') as string,
      price: Number(formData.get('price')),
      cost: Number(formData.get('cost')),
      stock: Number(formData.get('stock')),
      minStock: Number(formData.get('minStock')),
      expiryDate: formData.get('expiryDate') as string || undefined,
    };

    if (product.category === "") {
        showDialog({
            title: t('common.category'),
            message: "Please select a valid medical category for this supply.",
            onConfirm: () => {},
            isAlert: true,
            variant: 'warning'
        });
        return;
    }

    if (editingProduct) onUpdate(product);
    else onAdd(product);
    
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setIsModalOpen(true);
  };

  const isFiltered = searchTerm || categoryFilter !== 'all' || stockFilter !== 'all';

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-24 lg:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">{t('products.title')}</h1>
          <p className="text-sm lg:text-base text-slate-500">{t('products.subtitle').replace('{count}', products.length.toString())}</p>
        </div>
        <button 
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3.5 lg:py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
        >
          <Plus size={20} />
          {t('products.registerNew')}
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4">
        <div className="relative flex-grow group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder={t('products.searchPlaceholder')} 
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 lg:flex gap-3">
          <div className="relative group lg:w-48">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-sm transition-all appearance-none cursor-pointer"
            >
              <option value="all">{t('products.allCategories')}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>

          <div className="relative group lg:w-48">
            <select 
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-sm transition-all appearance-none cursor-pointer"
            >
              <option value="all">{t('products.stockStatus')}</option>
              <option value="in">{t('products.inStock')}</option>
              <option value="low">{t('products.lowStock')}</option>
              <option value="out">{t('products.outOfStock')}</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>

        {isFiltered && (
          <button 
            onClick={resetFilters}
            className="w-full lg:w-auto px-6 py-3.5 text-rose-500 font-bold text-xs uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <X size={16} /> {t('common.clear')}
          </button>
        )}
      </div>

      {/* Mobile Grid */}
      <div className="lg:hidden space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] border-2 border-dashed border-slate-100 text-center flex flex-col items-center gap-4">
            <Search size={48} className="text-slate-200" />
            <p className="text-slate-400 font-bold">{t('products.noMatch')}</p>
          </div>
        ) : (
          filteredProducts.map(p => {
            const expiry = getExpiryStatus(p.expiryDate);
            return (
              <div key={p.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-lg">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight">{p.name}</h3>
                      <div className="text-xs text-slate-400 font-medium">{p.sku}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 size={18} /></button>
                    <button 
                      onClick={() => showDialog({
                        title: t('common.confirmDelete'),
                        message: `Are you sure you want to delete "${p.name}"? This will permanently remove its medical records.`,
                        onConfirm: () => onDelete(p.id),
                        variant: 'danger'
                      })} 
                      className="p-2 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">{t('products.stockLevel')}</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${p.stock <= p.minStock ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                      <span className={`text-lg font-black ${p.stock <= p.minStock ? 'text-rose-600' : 'text-slate-900'}`}>{p.stock}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">{t('common.price')} (DA)</span>
                    <div className="text-lg font-black text-slate-900">{p.price.toLocaleString()} DA</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-1">
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-tight">
                    {p.category}
                  </span>
                  {expiry && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight ${expiry.color}`}>
                      {expiry.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
            <tr>
              <th className="px-8 py-5">{t('products.productInfo')}</th>
              <th className="px-8 py-5">{t('products.classification')}</th>
              <th className="px-8 py-5">{t('products.financials')}</th>
              <th className="px-8 py-5">{t('common.stock')}</th>
              <th className="px-8 py-5">{t('products.safetyExpiry')}</th>
              <th className="px-8 py-5 text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-300">
                    <Search size={40} />
                    <p className="font-bold">{t('invoices.noResults')}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProducts.map(p => {
                const expiry = getExpiryStatus(p.expiryDate);
                return (
                  <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-white border border-slate-200 text-indigo-600 rounded-2xl flex items-center justify-center font-black shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-none mb-1">{p.name}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-tight">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm font-black text-slate-900">{p.price.toLocaleString()} DA</div>
                      <div className="text-[10px] text-slate-400 font-bold">{t('common.cost')}: {p.cost.toLocaleString()} DA</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <span className={`text-base font-black ${p.stock <= p.minStock ? 'text-rose-600' : 'text-slate-900'}`}>{p.stock}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${p.stock <= p.minStock ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {expiry ? (
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${expiry.color}`}>
                          {expiry.label}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[10px] font-bold italic">N/A</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-2 text-slate-400 hover:text-indigo-600 transition-all"><Edit2 size={16} /></button>
                        <button 
                          onClick={() => showDialog({
                            title: t('common.confirmDelete'),
                            message: `Are you sure you want to delete "${p.name}"? This action is clinicaly permanent.`,
                            onConfirm: () => onDelete(p.id),
                            variant: 'danger'
                          })} 
                          className="p-2 text-slate-400 hover:text-rose-600 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-indigo-950/40 backdrop-blur-md p-0 sm:p-4">
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="sticky top-0 bg-white p-6 lg:p-8 border-b border-slate-100 flex justify-between items-center z-10">
              <h2 className="text-xl lg:text-2xl font-black text-slate-900">{editingProduct ? t('products.updateTitle') : t('products.registerTitle')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-6">
              {isScanning && (
                <div className="relative bg-slate-900 rounded-3xl overflow-hidden aspect-video mb-6 border-4 border-indigo-500/20 shadow-inner flex flex-col items-center justify-center">
                  <div id="product-scanner" className={`w-full h-full ${cameraPermission !== 'granted' ? 'hidden' : ''}`}></div>
                  
                  {cameraPermission === 'prompt' && (
                    <div className="text-center p-6 space-y-3">
                      <div className="loader mx-auto border-t-indigo-400"></div>
                      <p className="text-white text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">{t('products.requestingCamera')}</p>
                    </div>
                  )}

                  {cameraPermission === 'denied' && (
                    <div className="text-center p-6 space-y-4">
                      <div className="w-14 h-14 bg-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                        <Scan size={24} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-white text-sm font-black uppercase tracking-tight">{t('products.accessRestricted')}</p>
                        <p className="text-white/50 text-[10px] leading-relaxed max-w-[220px] mx-auto font-medium">{t('products.scanNotice')}</p>
                      </div>
                      <button 
                        type="button"
                        onClick={startScanner}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-950/20"
                      >
                        {t('products.tryAgain')}
                      </button>
                    </div>
                  )}

                  {cameraPermission === 'insecure' && (
                    <div className="text-center p-6 space-y-4">
                      <div className="w-14 h-14 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                        <AlertTriangle size={24} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-white text-sm font-black uppercase tracking-tight">SSL Security Required</p>
                        <p className="text-white/50 text-[10px] leading-relaxed max-w-[220px] mx-auto font-medium">To use the camera on mobile via Network IP, you must use **HTTPS**. Accessing via HTTP (non-secure) is blocked by modern browsers.</p>
                      </div>
                      <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest">Connect via Localhost or use an HTTPS tunnel</p>
                    </div>
                  )}

                  {cameraPermission === 'granted' && (
                    <>
                      <div className="absolute top-4 right-4 flex gap-2 z-10">
                        {hasTorch && (
                          <button 
                            type="button"
                            onClick={toggleTorch}
                            className={`p-2 rounded-full backdrop-blur-md transition-all ${isTorchOn ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'bg-white/20 text-white hover:bg-white/40'}`}
                          >
                            {isTorchOn ? <Zap size={16} /> : <ZapOff size={16} />}
                          </button>
                        )}
                        <button 
                          type="button" 
                          onClick={stopScanner}
                          className="bg-white/20 text-white p-2 rounded-full backdrop-blur-md hover:bg-white/40 transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40 flex items-center justify-center">
                        <div className="w-56 h-56 border-2 border-indigo-400/40 rounded-3xl relative">
                          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-rose-500 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.8)]"></div>
                          {/* Corner accents */}
                          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg"></div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg"></div>
                          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg"></div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br-lg"></div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('products.clinicalName')}</label>
                  <input name="name" defaultValue={editingProduct?.name} required placeholder="e.g., Composite Resin A3" className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('products.skuId')}</label>
                  <div className="flex gap-2">
                    <input 
                      name="sku" 
                      value={scannedSku} 
                      onChange={(e) => setScannedSku(e.target.value)}
                      required 
                      placeholder={t('products.searchPlaceholder')}
                      className="flex-grow px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
                    />
                    <button 
                      type="button" 
                      onClick={isScanning ? stopScanner : startScanner}
                      className={`px-5 rounded-2xl flex items-center justify-center transition-all shadow-md ${
                        isScanning ? 'bg-rose-100 text-rose-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      <Scan size={20} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('common.category')}</label>
                  <select name="category" defaultValue={editingProduct?.category || ''} required className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold appearance-none">
                    <option value="" disabled>{t('common.category')}</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('products.expirySafety')}</label>
                  <input name="expiryDate" type="date" defaultValue={editingProduct?.expiryDate} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('products.retailPrice')}</label>
                  <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                </div>
                
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('products.purchaseCost')}</label>
                  <input name="cost" type="number" step="0.01" defaultValue={editingProduct?.cost} required className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('products.openingStock')}</label>
                  <input name="stock" type="number" defaultValue={editingProduct?.stock || 0} required className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('products.minAlert')}</label>
                  <input name="minStock" type="number" defaultValue={editingProduct?.minStock || 5} required className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-colors">{t('common.dismiss')}</button>
                <button type="submit" className="w-full sm:w-auto px-10 py-3.5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/30 hover:bg-indigo-700">
                  {editingProduct ? t('products.commitChanges') : t('products.completeRegistration')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
