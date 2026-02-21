
import React, { useState } from 'react';
import { Category } from '../types';
import { Plus, Edit2, Trash2, Layers, X, Folder } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useAppContext } from '../AppContext';

interface Props { }

const CategoriesPage: React.FC<Props> = () => {
  const { t } = useLanguage();
  const { state, addCategory, updateCategory, deleteCategory, showDialog } = useAppContext();
  const { categories } = state;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const category: Category = {
      id: editingCategory?.id || Date.now().toString(),
      name: formData.get('name') as string,
    };

    if (editingCategory) {
      updateCategory(category);
    } else {
      addCategory(category);
    }

    setIsModalOpen(false);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-8">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 p-6 rounded-[2.5rem] border border-white shadow-sm backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{t('categories.title')}</h1>
            <span className="bg-sky-100 text-sky-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest leading-none">
              {categories.length}
            </span>
          </div>
          <p className="text-sm font-bold text-slate-400">{t('categories.subtitle')}</p>
        </div>
        <button
          onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
          className="w-full sm:w-auto flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.1em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 transition-transform"
        >
          <div className="p-1 bg-white/20 rounded-lg">
            <Plus size={16} />
          </div>
          {t('categories.addCategory')}
        </button>
      </div>

      {/* Categories Grid/List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {categories.map(c => (
          <div key={c.id} className="bg-white p-5 sm:p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex items-center gap-5 relative overflow-hidden">
            {/* Medical-themed Icon Container */}
            <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center font-black shadow-inner group-hover:bg-sky-600 group-hover:text-white transition-all duration-500 flex-shrink-0">
              <Folder size={24} strokeWidth={2.5} />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-slate-900 truncate leading-tight">{c.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate flex items-center gap-2">
                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                ID: {c.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            {/* Tap-friendly Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditingCategory(c); setIsModalOpen(true); }}
                className="p-3 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"
                title={t('common.edit')}
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => showDialog({
                  title: t('common.confirmDelete'),
                  message: t('categories.deleteMessage'),
                  onConfirm: () => deleteCategory(c.id),
                  variant: 'danger'
                })}
                className="p-3 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                title={t('common.delete')}
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Abstract Background Detail */}
            <div className="absolute top-0 right-0 w-12 h-12 bg-sky-50/20 rounded-bl-full translate-x-6 -translate-y-6 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-500"></div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full bg-white p-12 sm:p-20 rounded-[3rem] border-2 border-dashed border-slate-100 text-center flex flex-col items-center gap-6">
            <div className="relative">
              <div className="p-8 bg-slate-50 rounded-full text-slate-200 animate-pulse">
                <Layers size={64} strokeWidth={1} />
              </div>
              <div className="absolute -bottom-2 -right-2 p-3 bg-white border border-slate-100 rounded-2xl shadow-lg text-sky-500">
                <Plus size={24} />
              </div>
            </div>
            <div className="max-w-xs">
              <p className="text-slate-900 font-black text-xl mb-2">{t('categories.noCategories')}</p>
              <p className="text-slate-400 text-sm font-bold">Start by adding your first product category to organize your inventory.</p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Modal (Native Bottom Sheet feel on mobile) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-950/40 backdrop-blur-md p-0 sm:p-4">
          <div
            className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Drag Handle for Mobile */}
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mt-4 mb-2 sm:hidden"></div>

            <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl shadow-inner">
                  <Folder size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">{editingCategory ? t('categories.editCategory') : t('categories.newCategory')}</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Medical Inventory</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-3 text-slate-400 hover:text-slate-900 bg-slate-50 rounded-full transition-all active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                    {t('common.name')}
                  </label>
                  <div className="relative group">
                    <input
                      name="name"
                      defaultValue={editingCategory?.name}
                      required
                      autoFocus
                      placeholder={`${t('common.name')}...`}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-4 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.98] transition-all"
                >
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

export default CategoriesPage;
