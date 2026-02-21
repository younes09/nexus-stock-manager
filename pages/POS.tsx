
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Minus,
    Trash2,
    ShoppingCart,
    Scan,
    Search,
    X,
    Zap,
    ZapOff,
    User,
    CreditCard,
    ChevronRight,
    Package
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useLanguage } from '../LanguageContext';
import { useAppContext } from '../AppContext';
import { Product, InvoiceItem, Invoice } from '../types';

const POS: React.FC = () => {
    const { t } = useLanguage();
    const { state, addInvoice, showDialog } = useAppContext();
    const { products, entities, categories } = state;
    const navigate = useNavigate();

    const [cart, setCart] = useState<InvoiceItem[]>([]);
    const [selectedEntityId, setSelectedEntityId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isScanning, setIsScanning] = useState(false);
    const [isTorchOn, setIsTorchOn] = useState(false);
    const [hasTorch, setHasTorch] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    const clients = entities.filter(e => e.type === 'client');

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
            return matchSearch && matchCategory;
        });
    }, [products, searchTerm, selectedCategory]);

    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal;

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

    const addToCart = (product: Product) => {
        const existingIdx = cart.findIndex(item => item.productId === product.id);
        if (existingIdx !== -1) {
            updateCartItemQuantity(existingIdx, cart[existingIdx].quantity + 1);
        } else {
            const newItem: InvoiceItem = {
                productId: product.id,
                productName: product.name,
                quantity: 1,
                unitPrice: product.price,
                cost: product.cost,
                total: product.price
            };
            setCart([...cart, newItem]);
        }
        playBeep();
    };

    const updateCartItemQuantity = (idx: number, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(idx);
            return;
        }
        const newCart = [...cart];
        newCart[idx] = {
            ...newCart[idx],
            quantity,
            total: quantity * newCart[idx].unitPrice
        };
        setCart(newCart);
    };

    const removeFromCart = (idx: number) => {
        setCart(cart.filter((_, i) => i !== idx));
    };

    const startScanner = async () => {
        setIsScanning(true);
        setTimeout(async () => {
            try {
                const scanner = new Html5Qrcode("pos-reader");
                scannerRef.current = scanner;
                await scanner.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText) => {
                        handleScanSuccess(decodedText);
                        stopScanner();
                    },
                    () => { }
                );
                try {
                    const capabilities = scanner.getRunningTrackCapabilities();
                    if ((capabilities as any).torch) setHasTorch(true);
                } catch (e) { }
            } catch (err) {
                setIsScanning(false);
            }
        }, 100);
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            await scannerRef.current.stop();
            scannerRef.current = null;
        }
        setIsScanning(false);
    };

    const handleScanSuccess = (sku: string) => {
        const product = products.find(p => p.sku.toLowerCase() === sku.toLowerCase());
        if (product) {
            addToCart(product);
        } else {
            showDialog({
                title: "Product Not Found",
                message: "No product matches the scanned SKU.",
                onConfirm: () => { },
                isAlert: true,
                variant: 'warning'
            });
        }
    };

    const handleCheckout = () => {
        if (!selectedEntityId || cart.length === 0) {
            showDialog({
                title: "Checkout Error",
                message: "Select a client and add products before checkout.",
                onConfirm: () => { },
                isAlert: true,
                variant: 'warning'
            });
            return;
        }

        const entity = clients.find(e => e.id === selectedEntityId)!;
        const invoice: Invoice = {
            id: Date.now().toString(),
            number: `POS-${Math.floor(1000 + Math.random() * 9000)}`,
            date: new Date().toISOString(),
            type: 'sale',
            entityId: selectedEntityId,
            entityName: entity.name,
            items: cart,
            subtotal,
            total,
            paidAmount: total,
            status: 'paid'
        };

        addInvoice(invoice);
        showDialog({
            title: "Success",
            message: "Sale completed successfully.",
            onConfirm: () => navigate('/invoices'),
            isAlert: true,
            variant: 'success'
        });
    };

    return (
        <div className="h-[calc(100vh-80px)] lg:h-[calc(100vh-64px)] flex overflow-hidden -m-4 lg:-m-8">
            {/* Product Grid Area */}
            <div className="flex-grow flex flex-col min-w-0 bg-slate-50 relative">
                <div className="p-4 lg:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="relative flex-grow w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder={t('common.search')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                            />
                        </div>
                        <button
                            onClick={startScanner}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                        >
                            <Scan size={18} />
                            <span className="hidden sm:inline">SCAN</span>
                        </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-6 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${selectedCategory === 'all'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                                }`}
                        >
                            All Supplies
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.name)}
                                className={`px-6 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${selectedCategory === cat.name
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-4 lg:p-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6 auto-rows-max">
                    {filteredProducts.map(p => (
                        <button
                            key={p.id}
                            onClick={() => addToCart(p)}
                            disabled={p.stock <= 0}
                            className="group bg-white rounded-3xl p-5 border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all text-left flex flex-col h-full active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                        >
                            <div className="p-3 bg-slate-50 rounded-2xl text-indigo-600 mb-4 group-hover:bg-indigo-50 transition-colors w-fit">
                                <Package size={24} />
                            </div>
                            <h3 className="font-black text-slate-900 leading-tight mb-2 line-clamp-2">{p.name}</h3>
                            <div className="flex justify-between items-end mt-auto pt-4">
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('common.price')}</div>
                                    <div className="text-sm font-black text-indigo-600">{p.price.toLocaleString()} DA</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Stock</div>
                                    <div className={`text-xs font-bold ${p.stock <= p.minStock ? 'text-rose-500' : 'text-slate-500'}`}>{p.stock}</div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {isScanning && (
                    <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
                        <button onClick={stopScanner} className="absolute top-8 right-8 p-3 bg-white/10 text-white rounded-full"><X size={24} /></button>
                        <div id="pos-reader" className="w-full max-w-sm aspect-square bg-slate-900 rounded-[2rem] border-4 border-indigo-500/30 overflow-hidden"></div>
                        <p className="mt-8 text-indigo-400 font-bold animate-pulse">Scanning SKU...</p>
                    </div>
                )}
            </div>

            {/* Cart Sidebar */}
            <div className="w-full sm:w-[400px] flex-shrink-0 bg-white border-l border-slate-200 flex flex-col z-10 shadow-2xl">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg"><ShoppingCart size={20} /></div>
                        <h2 className="font-black text-slate-900 tracking-tight text-xl">Current Session</h2>
                        <span className="ml-auto px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-xs font-black">{cart.length}</span>
                    </div>

                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            value={selectedEntityId}
                            onChange={(e) => setSelectedEntityId(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm font-bold text-slate-700 appearance-none"
                        >
                            <option value="">{t('invoiceCreator.chooseEntity').replace('{type}', t('common.clients'))}</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-20 pointer-events-none p-8">
                            <ShoppingCart size={64} className="mb-4" />
                            <p className="font-black uppercase tracking-widest text-xs">Waiting for scanned clinical items...</p>
                        </div>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 group animate-in slide-in-from-right-4 duration-300">
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-black text-slate-800 text-sm leading-tight line-clamp-1">{item.productName}</h4>
                                    <button onClick={() => removeFromCart(idx)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                                        <button onClick={() => updateCartItemQuantity(idx, item.quantity - 1)} className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"><Minus size={14} /></button>
                                        <span className="px-3 font-black text-slate-700 min-w-8 text-center">{item.quantity}</span>
                                        <button onClick={() => updateCartItemQuantity(idx, item.quantity + 1)} className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"><Plus size={14} /></button>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-black text-slate-900">{item.total.toLocaleString()} DA</div>
                                        <div className="text-[10px] text-slate-400 font-bold">{item.unitPrice.toLocaleString()} / unit</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-white border-t border-slate-200 space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm font-bold text-slate-500">
                            <span>Subtotal</span>
                            <span>{subtotal.toLocaleString()} DA</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                            <span className="text-xl font-black text-slate-900 tracking-tight uppercase">Net Total</span>
                            <span className="text-3xl font-black text-indigo-600 tracking-tighter">{total.toLocaleString()} DA</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className="w-full bg-slate-900 text-white rounded-[1.5rem] py-5 font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/40 hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:active:scale-100"
                    >
                        <CreditCard size={20} />
                        Complete Payment
                        <ChevronRight size={18} className="opacity-40" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default POS;
