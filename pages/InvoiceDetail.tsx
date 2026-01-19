
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Invoice, Entity } from '../types';
import { ChevronLeft, Printer, FileText, Calendar, User, MapPin, Phone, Mail, Stethoscope } from 'lucide-react';

interface Props {
  invoices: Invoice[];
  entities: Entity[];
}

const InvoiceDetail: React.FC<Props> = ({ invoices, entities }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const invoice = invoices.find(inv => inv.id === id);

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Invoice not found</h2>
        <button onClick={() => navigate('/invoices')} className="text-indigo-600 font-bold hover:underline flex items-center gap-2">
          <ChevronLeft size={20} /> Return to Ledger
        </button>
      </div>
    );
  }

  const entity = entities.find(e => e.id === invoice.entityId);

  return (
    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-20 lg:pb-0">
      <div className="no-print flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-800 transition-colors">
          <ChevronLeft size={20} />
          Back
        </button>
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-500/30"
          >
            <Printer size={18} />
            Print Invoice
          </button>
        </div>
      </div>

      <div className="bg-white p-8 lg:p-16 rounded-[2.5rem] shadow-2xl border border-slate-100 relative print:shadow-none print:border-none print:p-0">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-500 rounded-2xl text-white shadow-lg shadow-sky-500/20">
                <Stethoscope size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">DentaStock Nexus</h1>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Medical Supply Solutions</p>
              </div>
            </div>
            <div className="space-y-1 text-slate-500 text-xs font-bold leading-relaxed">
              <p>Clinical HQ, Dr. Jane Smith Practice</p>
              <p>42 Ortho Plaza, Algiers 16000</p>
              <p className="flex items-center gap-2"><Phone size={12} /> +213 555-0192</p>
              <p className="flex items-center gap-2"><Mail size={12} /> billing@dentastock.nexus</p>
            </div>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto space-y-2">
            <h2 className={`text-5xl font-black uppercase mb-4 opacity-10 ${invoice.type === 'sale' ? 'text-indigo-600' : 'text-emerald-600'}`}>
              {invoice.type === 'sale' ? 'Invoice' : 'Purchase'}
            </h2>
            <div className="inline-block px-4 py-2 bg-slate-50 rounded-xl">
              <div className="flex justify-between sm:justify-end gap-6 border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Number</span>
                <span className="font-black text-slate-900">{invoice.number}</span>
              </div>
              <div className="flex justify-between sm:justify-end gap-6 pt-2">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Issue Date</span>
                <span className="font-black text-slate-900">{new Date(invoice.date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Billing Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 mb-16 py-12 border-y border-slate-100">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Bill To</h3>
            <div className="space-y-3">
              <div className="text-2xl font-black text-slate-900">{invoice.entityName}</div>
              {entity && (
                <div className="space-y-2 text-slate-500 text-sm font-medium">
                  <p className="flex items-center gap-2"><Mail size={14} className="text-slate-300" /> {entity.email}</p>
                  <p className="flex items-center gap-2"><Phone size={14} className="text-slate-300" /> {entity.phone}</p>
                  <p className="flex items-start gap-2"><MapPin size={14} className="text-slate-300 mt-1 flex-shrink-0" /> {entity.address}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-end text-left sm:text-right space-y-4">
            <div>
              <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Status</h3>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                {invoice.status}
              </span>
            </div>
            <div>
              <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Due Amount (DA)</h3>
              <div className="text-4xl font-black text-slate-900 tracking-tighter">
                {invoice.total.toLocaleString()} DA
              </div>
            </div>
          </div>
        </div>

        {/* Table Items */}
        <div className="space-y-6">
          <div className="grid grid-cols-12 gap-4 border-b-2 border-slate-900 pb-4">
            <div className="col-span-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Description</div>
            <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</div>
            <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Rate</div>
            <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</div>
          </div>

          <div className="divide-y divide-slate-100">
            {invoice.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-4 py-6 hover:bg-slate-50 transition-colors">
                <div className="col-span-6">
                  <div className="font-bold text-slate-900">{item.productName}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Ref ID: {item.productId.slice(-6)}</div>
                </div>
                <div className="col-span-2 text-center font-black text-slate-700">{item.quantity}</div>
                <div className="col-span-2 text-right font-bold text-slate-600">{item.unitPrice.toLocaleString()} DA</div>
                <div className="col-span-2 text-right font-black text-slate-900">{item.total.toLocaleString()} DA</div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculation Summary */}
        <div className="mt-16 flex flex-col items-end border-t border-slate-100 pt-10">
          <div className="w-full sm:w-80 space-y-4">
            <div className="flex justify-between text-slate-500 font-bold text-sm">
              <span>Subtotal</span>
              <span className="text-slate-900">{invoice.subtotal.toLocaleString()} DA</span>
            </div>
            <div className="flex justify-between text-slate-500 font-bold text-sm">
              <span>Vat (10%)</span>
              <span className="text-slate-900">{invoice.tax.toLocaleString()} DA</span>
            </div>
            <div className="flex justify-between items-center pt-6 border-t border-slate-900">
              <span className="text-lg font-black text-slate-900 uppercase tracking-tight">Total Payable</span>
              <span className="text-3xl font-black text-indigo-600">{invoice.total.toLocaleString()} DA</span>
            </div>
          </div>
        </div>

        {/* Footer Terms */}
        <div className="mt-24 pt-10 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-12 text-[10px] text-slate-400 font-bold leading-relaxed">
          <div className="space-y-4">
            <h4 className="font-black text-slate-900 uppercase tracking-[0.2em]">Terms & Conditions</h4>
            <p>1. Please quote invoice number for all payment references.</p>
            <p>2. Payment is due within 30 days unless otherwise agreed.</p>
            <p>3. Medical supplies are non-returnable once seals are broken.</p>
          </div>
          <div className="flex flex-col items-center sm:items-end justify-end space-y-6">
            <div className="text-center sm:text-right">
              <div className="h-16 w-32 border-b-2 border-slate-200 mb-2"></div>
              <p className="uppercase tracking-[0.2em] font-black text-slate-900">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Branding */}
      <div className="text-center py-10 opacity-20 pointer-events-none no-print">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Generated by DentaStock Nexus Enterprise v2.5</p>
      </div>
    </div>
  );
};

export default InvoiceDetail;
