import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isAlert?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  variant = 'danger',
  isAlert = false
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const variants = {
    danger: {
      icon: <AlertCircle className="text-rose-600" size={32} />,
      btn: "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20",
      bg: "bg-rose-50"
    },
    warning: {
      icon: <AlertCircle className="text-amber-600" size={32} />,
      btn: "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20",
      bg: "bg-amber-50"
    },
    success: {
      icon: <AlertCircle className="text-emerald-600" size={32} />,
      btn: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20",
      bg: "bg-emerald-50"
    },
    info: {
      icon: <AlertCircle className="text-indigo-600" size={32} />,
      btn: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20",
      bg: "bg-indigo-50"
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 text-center">
          <div className={`w-20 h-20 ${variants[variant].bg} rounded-full flex items-center justify-center mx-auto mb-6`}>
            {variants[variant].icon}
          </div>
          
          <h3 className="text-2xl font-black text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-500 font-bold text-sm leading-relaxed mb-8">
            {message}
          </p>

          <div className="flex flex-col gap-3">
            <button 
              onClick={onConfirm}
              className={`w-full py-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] ${variants[variant].btn}`}
            >
              {confirmText || (isAlert ? t('common.dismiss') : t('common.confirm'))}
            </button>
            {!isAlert && (
              <button 
                onClick={onCancel}
                className="w-full py-4 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-[0.98]"
              >
                {cancelText || t('common.cancel')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
