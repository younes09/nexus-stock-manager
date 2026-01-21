
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, Entity, Invoice, InvoiceItem, InvoiceType } from '../types';
import { Plus, Trash2, Printer, Save, ChevronLeft, FileText, AlertCircle, Scan, X, Zap, ZapOff } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useLanguage } from '../LanguageContext';

interface Props {
  products: Product[];
  entities: Entity[];
  onSave: (inv: Invoice) => void;
}

const InvoiceCreator: React.FC<Props> = ({ products, entities, onSave }) => {
  const { t } = useLanguage();
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const invoiceType = (type === 'purchase' ? 'purchase' : 'sale') as InvoiceType;

  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [isScanning, setIsScanning] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  
  const filteredEntities = entities.filter(e => e.type === (invoiceType === 'sale' ? 'client' : 'supplier'));

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal;

  useEffect(() => {
    setPaidAmount(total);
  }, [total]);

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
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            playBeep();
            handleScanSuccess(decodedText);
            stopScanner();
          },
          () => {} 
        );

        try {
          const capabilities = scanner.getRunningTrackCapabilities();
          if ((capabilities as any).torch) {
            setHasTorch(true);
          }
        } catch (e) {
          console.debug("Torch not supported");
        }
      } catch (err) {
        console.error("Camera access failed", err);
        alert(t('invoiceCreator.cameraAccessFailed'));
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

  const handleScanSuccess = (sku: string) => {
    const product = products.find(p => p.sku.toLowerCase() === sku.toLowerCase());
    if (product) {
      const existingIdx = items.findIndex(i => i.productId === product.id);
      if (existingIdx !== -1) {
        updateItem(existingIdx, 'quantity', items[existingIdx].quantity + 1);
      } else {
        const newItem: InvoiceItem = {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: invoiceType === 'sale' ? product.price : product.cost,
          cost: product.cost,
          total: invoiceType === 'sale' ? product.price : product.cost
        };
        setItems([...items, newItem]);
      }
    } else {
      alert(t('invoiceCreator.scannedProductNotFound').replace('{sku}', sku));
    }
  };

  const addItem = () => {
    setItems([...items, { productId: '', productName: '', quantity: 1, unitPrice: 0, cost: 0, total: 0 }]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[idx] };

    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        item.productId = value;
        item.productName = prod.name;
        item.unitPrice = invoiceType === 'sale' ? prod.price : prod.cost;
        item.cost = prod.cost;
      }
    } else if (field === 'quantity') {
      item.quantity = Number(value);
    } else if (field === 'unitPrice') {
      item.unitPrice = Number(value);
    }

    item.total = item.quantity * item.unitPrice;
    newItems[idx] = item;
    setItems(newItems);
  };

  const handleSave = () => {
    if (!selectedEntityId || items.length === 0 || items.some(i => !i.productId)) {
      alert(t('common.entities') + " & " + t('common.products') + " " + t('common.loading'));
      return;
    }

    const entity = entities.find(e => e.id === selectedEntityId)!;
    
    const invoice: Invoice = {
      id: Date.now().toString(),
      number: invoiceNumber,
      date: new Date().toISOString(),
      type: invoiceType,
      entityId: selectedEntityId,
      entityName: entity.name,
      items,
      subtotal,
      total,
      paidAmount,
      status: paidAmount >= total ? 'paid' : 'pending'
    };

    onSave(invoice);
    navigate('/invoices');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20 lg:pb-0">
      <div className="no-print flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-800 transition-colors">
          <ChevronLeft size={20} />
          {t('common.back')}
        </button>
        <div className="flex gap-2 lg:gap-3">
          <button onClick={() => window.print()} className="hidden sm:flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl font-bold hover:bg-slate-50">
            <Printer size={18} />
            {t('common.print')}
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-6 lg:px-8 py-3.5 lg:py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-500/30">
            <Save size={18} />
            {invoiceType === 'sale' ? t('invoiceCreator.postSale') : t('invoiceCreator.postOrder')}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 lg:p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 relative">
        {isScanning && (
          <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute top-8 right-8 flex gap-3">
              {hasTorch && (
                <button 
                  onClick={toggleTorch}
                  className={`p-3 rounded-full backdrop-blur-md transition-all ${isTorchOn ? 'bg-amber-400 text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {isTorchOn ? <Zap size={24} /> : <ZapOff size={24} />}
                </button>
              )}
              <button 
                onClick={stopScanner}
                className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="w-full max-w-md space-y-8 text-center">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">{t('invoiceCreator.scanBarcode')}</h3>
                <p className="text-slate-400 text-sm font-medium">Align the product SKU within the box</p>
              </div>
              <div id="reader" className="overflow-hidden bg-slate-800 rounded-[2rem] aspect-square shadow-2xl border-4 border-indigo-500/30"></div>
              <div className="flex items-center justify-center gap-2 text-indigo-400 font-bold animate-pulse">
                <Scan size={20} />
                <span className="text-xs uppercase tracking-widest">Searching for SKU...</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-10 lg:mb-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                <FileText size={24} />
              </div>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">{t('invoiceCreator.system')}</h1>
            </div>
            <div className="space-y-1 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <p>Corporate Headquarters</p>
              <p>Innovation Center, Ste 402</p>
              <p>nexus@billing.sys</p>
            </div>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <h2 className={`text-4xl lg:text-5xl font-black uppercase mb-4 opacity-10 ${invoiceType === 'sale' ? 'text-indigo-600' : 'text-emerald-600'}`}>
              {invoiceType}
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between sm:justify-end gap-6 border-b border-slate-50 pb-2">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">No.</span>
                <span className="font-black text-slate-900">{invoiceNumber}</span>
              </div>
              <div className="flex justify-between sm:justify-end gap-6">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Date</span>
                <span className="font-black text-slate-900">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-10 border-t border-b border-slate-100 py-10 lg:py-12">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Billing Entity</h3>
            <div className="relative group">
              <select 
                value={selectedEntityId} 
                onChange={(e) => setSelectedEntityId(e.target.value)}
                className="w-full text-xl font-black text-slate-900 bg-slate-50 rounded-2xl border-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer py-4 px-5 appearance-none shadow-sm"
              >
                <option value="">{t('invoiceCreator.chooseEntity').replace('{type}', invoiceType === 'sale' ? t('common.clients') : t('common.suppliers'))}</option>
                {filteredEntities.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                <ChevronLeft className="-rotate-90" size={20} />
              </div>
            </div>
            {selectedEntityId && (
              <div className="bg-indigo-50/50 p-5 rounded-3xl space-y-2">
                <div className="text-xs font-bold text-slate-700">{entities.find(e => e.id === selectedEntityId)?.email}</div>
                <div className="text-xs text-slate-500">{entities.find(e => e.id === selectedEntityId)?.phone}</div>
                <div className="text-xs text-slate-500 italic">{entities.find(e => e.id === selectedEntityId)?.address}</div>
              </div>
            )}
          </div>
          <div className="text-left lg:text-right flex flex-col justify-center">
            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Final Total (DA)</h3>
            <div className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter">
              {total.toLocaleString()} DA
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:space-y-0">
          <div className="hidden lg:grid grid-cols-12 gap-4 border-b-2 border-slate-900 pb-4 mb-4">
            <div className="col-span-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('invoiceCreator.productItem')}</div>
            <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('invoiceCreator.quantity')}</div>
            <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('invoiceCreator.unitPrice')}</div>
            <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('invoiceCreator.lineTotal')}</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-4 lg:space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-col lg:grid lg:grid-cols-12 gap-4 bg-slate-50 lg:bg-transparent p-5 lg:p-0 rounded-3xl lg:rounded-none border border-slate-100 lg:border-none relative">
                <button 
                  onClick={() => removeItem(idx)} 
                  className="lg:hidden absolute top-4 right-4 p-2 text-rose-300 bg-white rounded-xl shadow-sm"
                >
                  <Trash2 size={18} />
                </button>

                <div className="lg:col-span-5">
                  <label className="lg:hidden text-[10px] font-black text-slate-400 uppercase mb-1 block">Product</label>
                  <select 
                    value={item.productId}
                    onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                    className="w-full bg-white lg:bg-slate-50 border-none rounded-2xl font-black text-slate-900 py-3.5 px-5 focus:ring-4 focus:ring-indigo-500/10 shadow-sm"
                  >
                    <option value="">{t('invoiceCreator.addProduct')}</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku}) • Stock: {p.stock}</option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-2 flex flex-col items-center">
                  <label className="lg:hidden text-[10px] font-black text-slate-400 uppercase mb-1 block w-full text-center">{t('invoiceCreator.quantity')}</label>
                  <input 
                    type="number" 
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                    className="w-full lg:w-24 text-center bg-white lg:bg-slate-50 border-none rounded-2xl font-black py-3.5 focus:ring-4 focus:ring-indigo-500/10 shadow-sm"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="lg:hidden text-[10px] font-black text-slate-400 uppercase mb-1 block text-right">{t('invoiceCreator.unitPrice')}</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                    className="w-full text-right bg-white lg:bg-slate-50 border-none rounded-2xl font-black py-3.5 px-5 focus:ring-4 focus:ring-indigo-500/10 shadow-sm"
                  />
                </div>

                <div className="lg:col-span-2 text-right flex flex-col justify-center">
                  <label className="lg:hidden text-[10px] font-black text-slate-400 uppercase mb-1 block">{t('invoiceCreator.lineTotal')}</label>
                  <div className="text-xl lg:text-lg font-black text-slate-900 pr-2">
                    {item.total.toLocaleString()} DA
                  </div>
                </div>

                <div className="hidden lg:flex lg:col-span-1 items-center justify-end">
                  <button onClick={() => removeItem(idx)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button 
            onClick={addItem}
            className="flex-grow flex items-center justify-center gap-3 border-4 border-dashed border-slate-100 text-slate-300 py-6 lg:py-8 rounded-[2.5rem] hover:border-indigo-200 hover:text-indigo-400 hover:bg-indigo-50/50 transition-all font-black uppercase text-xs tracking-widest no-print"
          >
            <Plus size={24} />
            {t('invoiceCreator.manualEntry')}
          </button>
          
          <button 
            onClick={startScanner}
            className="flex-grow flex items-center justify-center gap-3 border-4 border-dashed border-indigo-100 text-indigo-300 py-6 lg:py-8 rounded-[2.5rem] hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all font-black uppercase text-xs tracking-widest no-print"
          >
            <Scan size={24} />
            {t('invoiceCreator.scanBarcode')}
          </button>
        </div>

        <div className="mt-12 flex flex-col lg:flex-row lg:justify-end gap-10">
          <div className="flex-grow flex items-start gap-3 bg-amber-50 p-6 rounded-3xl border border-amber-100">
            <AlertCircle className="text-amber-500 flex-shrink-0" size={20} />
            <div className="text-xs text-amber-800 font-bold leading-relaxed">
              {t('invoiceCreator.verifyNotice')}
            </div>
          </div>

          <div className="w-full lg:w-96 space-y-5 bg-slate-50 p-8 rounded-[2.5rem]">
            <div className="flex justify-between text-slate-500 font-bold text-sm">
              <span>{t('invoiceCreator.subtotal')}</span>
              <span className="text-slate-900">{subtotal.toLocaleString()} DA</span>
            </div>
            <div className="flex justify-between items-center pt-6 border-t border-slate-200">
              <span className="text-lg font-black text-slate-900 uppercase tracking-tight">{t('invoiceCreator.netPayable')}</span>
              <span className="text-2xl lg:text-3xl font-black text-indigo-600">{total.toLocaleString()} DA</span>
            </div>
            <div className="pt-6 space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('invoiceCreator.amountPaid')}</label>
              <input 
                type="number" 
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="w-full text-right bg-white border border-slate-200 rounded-2xl font-black py-3 px-5 focus:ring-4 focus:ring-indigo-500/10 outline-none"
              />
              {paidAmount < total && (
                <div className="text-right text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                  {t('invoiceCreator.remainingDebt')}: {(total - paidAmount).toLocaleString()} DA
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-16 pt-10 border-t border-slate-100 text-center lg:text-left">
          <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Compliance Notice</h4>
          <p className="text-[10px] text-slate-300 font-bold leading-loose max-w-2xl">
            This invoice is generated electronically under NexusStock standard billing protocol. Please check local tax regulations for validity in your specific jurisdiction. System Reference: {Date.now()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCreator;
