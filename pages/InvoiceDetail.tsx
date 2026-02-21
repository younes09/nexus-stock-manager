
import React from 'react';
import { useLanguage } from '../LanguageContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Invoice, Entity } from '../types';
import { ChevronLeft, Printer, FileText, Calendar, User, MapPin, Phone, Mail, Stethoscope } from 'lucide-react';
import { useAppContext } from '../AppContext';

interface Props { }

const InvoiceDetail: React.FC<Props> = () => {
  const { t } = useLanguage();
  const { state, updateInvoice } = useAppContext();
  const { invoices, entities } = {
    invoices: state.invoices.data,
    entities: state.entities
  };
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const invoice = invoices.find(inv => inv.id === id);
  const [paymentAmount, setPaymentAmount] = React.useState(0);
  const [isPaying, setIsPaying] = React.useState(false);
  const [isProforma, setIsProforma] = React.useState(invoice?.type === 'sale' && invoice?.status !== 'paid');

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">{t('invoiceDetail.notFound')}</h2>
        <button onClick={() => navigate('/invoices')} className="text-indigo-600 font-bold hover:underline flex items-center gap-2">
          <ChevronLeft size={20} /> {t('invoiceDetail.returnLedger')}
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
          {t('common.back')}
        </button>
        <div className="flex gap-2">
          {invoice.type === 'sale' && (
            <button
              onClick={() => setIsProforma(!isProforma)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all border-2 ${isProforma
                  ? 'bg-amber-50 border-amber-200 text-amber-600'
                  : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}
            >
              <FileText size={18} />
              {t('invoices.proforma')}
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-500/30"
          >
            <Printer size={18} />
            {t('invoiceDetail.printInvoice')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden print:shadow-none print:border-none print:rounded-none relative print:min-h-0">
        {/* Modern Header Band */}
        <div className="bg-sky-50 print:bg-sky-50/50 p-8 lg:p-12 border-b border-sky-100 flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-sky-600 rounded-2xl text-white shadow-lg shadow-sky-600/20">
              <Stethoscope size={36} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">DentaStock Nexus</h1>
              <p className="text-[10px] text-sky-600 font-black uppercase tracking-[0.2em]">{t('invoiceDetail.medicalSupplySolutions')}</p>
            </div>
          </div>
          <div className="text-slate-500 text-[10px] md:text-sm font-bold md:text-right leading-relaxed flex-1">
            <p className="text-slate-900 font-black">{t('invoiceDetail.practiceName')}</p>
            <p>{t('invoiceDetail.practiceAddress')}</p>
            <p className="flex items-center md:justify-end gap-2"><Phone size={12} className="text-sky-500" /> +213 555-0192</p>
            <p className="flex items-center md:justify-end gap-2"><Mail size={12} className="text-sky-500" /> billing@dentastock.nexus</p>
          </div>
        </div>

        <div className="p-8 lg:p-12 space-y-12">
          {/* Invoice Meta & Entity */}
          <div className="flex flex-row justify-between items-start gap-6 sm:gap-12">
            <div className="space-y-6 flex-1">
              <div>
                <h3 className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-3">{t('invoiceDetail.billTo')}</h3>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">{invoice.entityName}</div>
                {entity && (
                  <div className="mt-4 space-y-2 text-slate-500 text-sm font-bold">
                    <p className="flex items-center gap-2"><Phone size={14} className="text-slate-300" /> {entity.phone}</p>
                    <p className="flex items-start gap-2 max-w-[200px] sm:max-w-xs"><MapPin size={14} className="text-slate-300 mt-1 flex-shrink-0" /> {entity.address}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-4 sm:gap-y-6 bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-100 min-w-fit">
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('common.status')}</span>
                <span className={`inline-flex items-center gap-2 font-black text-[10px] sm:text-xs uppercase tracking-widest ${invoice.status === 'paid' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${invoice.status === 'paid' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  {t('common.' + invoice.status)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('common.date')}</span>
                <span className="font-black text-slate-900 text-xs sm:text-sm">{new Date(invoice.date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('invoices.reference')}</span>
                <span className="font-black text-slate-900 text-xs sm:text-sm">{invoice.number}</span>
              </div>
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('common.type')}</span>
                <span className="font-black text-slate-900 text-[10px] sm:text-xs uppercase">
                  {invoice.type === 'purchase' ? t('invoices.supplyOrders') : t('invoices.practiceSales')}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Prompt (No Print) */}
          {!isProforma && invoice.paidAmount < invoice.total && (
            <div className="no-print bg-rose-50 border border-rose-100 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                  <FileText size={24} />
                </div>
                <div>
                  <h4 className="font-black text-rose-900">{t('invoiceDetail.balanceDue')}</h4>
                  <p className="text-sm text-rose-600 font-bold">{(invoice.total - invoice.paidAmount).toLocaleString()} {t('common.currency')} {t('invoiceDetail.remaining')}</p>
                </div>
              </div>
              <button
                onClick={() => { setPaymentAmount(invoice.total - invoice.paidAmount); setIsPaying(true); }}
                className="w-full sm:w-auto px-8 py-3 bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 shadow-lg shadow-rose-500/20 transition-all"
              >
                {t('invoiceDetail.recordPayment')}
              </button>
            </div>
          )}

          {/* Minimalist Table */}
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-slate-900/5 uppercase leading-none mb-[-2rem] print:hidden">
              {invoice.type === 'purchase' ? t('invoices.purchaseOrder') : (isProforma ? t('invoices.proforma') : t('invoices.finalInvoice'))}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white print:bg-slate-100 print:text-slate-900">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">{t('invoiceCreator.productItem')}</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">{t('invoiceCreator.quantity')}</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">{t('invoiceCreator.unitPrice')}</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">{t('common.total')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-black text-slate-900">{item.productName}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">{t('common.ref')} {item.productId.slice(-8).toUpperCase()}</div>
                      </td>
                      <td className="px-6 py-4 text-center font-black text-slate-700">{item.quantity}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-600">{item.unitPrice.toLocaleString()} {t('common.currency')}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">{item.total.toLocaleString()} {t('common.currency')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* New Highlighted Total Section */}
          <div className="flex flex-col items-end gap-6 pt-6">
            <div className="w-full sm:w-80 space-y-3">
              <div className="flex justify-between text-slate-500 font-bold text-sm px-2">
                <span>{t('invoiceCreator.subtotal')}</span>
                <span className="text-slate-900 font-black">{invoice.subtotal.toLocaleString()} {t('common.currency')}</span>
              </div>
              <div className="bg-slate-900 text-white print:bg-white print:text-slate-900 print:border-y-2 print:border-slate-900 p-6 rounded-3xl flex items-center justify-between shadow-xl shadow-slate-900/10">
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t('invoiceDetail.totalPayable')}</span>
                <span className="text-3xl font-black tracking-tighter">{invoice.total.toLocaleString()} {t('common.currency')}</span>
              </div>
            </div>
          </div>

          {/* Refined Footer Pinned to Bottom */}
          <div className="invoice-footer pt-12 border-t border-slate-100 flex flex-row justify-between items-end gap-12 print:absolute print:bottom-8 print:left-8 print:right-8 print:border-t-0 print:pt-0">
            <div className="max-w-md space-y-4">
              <h4 className="text-[10px] font-black text-sky-600 uppercase tracking-[0.2em]">{t('invoiceDetail.termsAndConditions')}</h4>
              <div className="text-[10px] text-slate-400 font-bold leading-relaxed space-y-1">
                <p>{t('invoiceDetail.term1')}</p>
                <p>{t('invoiceDetail.term2')}</p>
                <p>{t('invoiceDetail.term3')}</p>
              </div>
            </div>
            <div className="text-left min-w-[200px]">
              <div className="h-16 w-48 border-b-2 border-slate-100 mb-4 ml-auto"></div>
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-wide">{t('invoiceDetail.authorizedSignature')}</p>
              <p className="text-[8px] text-slate-300 font-bold uppercase mt-1 tracking-tighter">{t('invoiceDetail.cachetEtSignature')}</p>
            </div>
          </div>
        </div>
      </div>

      {isPaying && (
        <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 lg:p-12 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-900 mb-2">{t('invoiceDetail.settleBalance')}</h3>
            <p className="text-slate-500 text-sm font-bold mb-8">{t('invoiceDetail.recordPayment')} - {invoice.number}</p>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">{t('common.paid')} (DA)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  max={invoice.total - invoice.paidAmount}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-xl font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setIsPaying(false)} className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition-all">{t('common.cancel')}</button>
                <button
                  onClick={() => {
                    const newPaid = invoice.paidAmount + paymentAmount;
                    updateInvoice({
                      ...invoice,
                      paidAmount: newPaid,
                      status: newPaid >= invoice.total ? 'paid' : 'pending'
                    });
                    setIsPaying(false);
                  }}
                  className="flex-2 py-4 px-8 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest"
                >
                  {t('invoiceDetail.postPayment')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 6mm;
          }
          body { 
            background: white !important; 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-size: 8pt !important;
          }
          .no-print { display: none !important; }
          #root-main { padding: 0 !important; margin: 0 !important; }
          
          .bg-white { 
            border: none !important; 
            box-shadow: none !important; 
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .rounded-3xl, .rounded-2xl { border-radius: 0.5rem !important; }
          .bg-sky-50 { background-color: #f0f9ff !important; border-bottom: 1px solid #e0f2fe !important; }
          .bg-slate-50 { background-color: #f8fafc !important; }
          .bg-slate-900 { background-color: #0f172a !important; color: white !important; }
          
          .text-indigo-600, .text-sky-600 { color: #0284c7 !important; }
          .text-slate-900 { color: #0f172a !important; }
          .text-slate-400 { color: #94a3b8 !important; }
          
          /* Compression */
          .p-8, .p-12 { padding: 0.5rem !important; }
          .gap-12 { gap: 0.25rem !important; }
          .space-y-12 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.5rem !important; }
          .py-4 { padding-top: 0.1rem !important; padding-bottom: 0.1rem !important; }
          .px-6 { padding-left: 0.25rem !important; padding-right: 0.25rem !important; }
          .pt-12 { padding-top: 0.5rem !important; }
          .pt-6 { padding-top: 0.25rem !important; }
          
          /* Footer Specific */
          .invoice-footer { 
            position: relative !important; 
            margin-top: 0.5rem !important;
            border-top-width: 1px !important;
            padding-right: 0.5rem !important; /* Extra safety for right side */
          }
          
          /* Visibility */
          .shadow-xl, .shadow-lg { box-shadow: none !important; }
          .opacity-20, .decorative-branding { display: none !important; }
        }
      `}</style>

      {/* Decorative Branding */}
      <div className="text-center py-10 opacity-20 pointer-events-none no-print">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">{t('invoiceDetail.generatedBy')}</p>
      </div>
    </div>
  );
};

export default InvoiceDetail;
