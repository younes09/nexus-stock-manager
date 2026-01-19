
import React, { useState } from 'react';
import { Category } from '../types';
import { Plus, Edit2, Trash2, Layers, X, Folder } from 'lucide-react';

interface Props {
  categories: Category[];
  onAdd: (c: Category) => void;
  onUpdate: (c: Category) => void;
  onDelete: (id: string) => void;
}

const CategoriesPage: React.FC<Props> = ({ categories, onAdd, onUpdate, onDelete }) => {
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
      onUpdate(category);
    } else {
      onAdd(category);
    }
    
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">Supply Categories</h1>
          <p className="text-sm lg:text-base text-slate-500">Organize your clinical inventory into manageable groups.</p>
        </div>
        <button 
          onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3.5 lg:py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 pb-20 lg:pb-0">
        {categories.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner group-hover:bg-sky-600 group-hover:text-white transition-colors duration-300">
                <Folder size={20} />
              </div>
              <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingCategory(c); setIsModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-xl transition-all hover:bg-white shadow-sm"><Edit2 size={16} /></button>
                <button onClick={() => onDelete(c.id)} className="p-2.5 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-xl transition-all hover:bg-white shadow-sm"><Trash2 size={16} /></button>
              </div>
            </div>
            
            <h3 className="text-lg font-black text-slate-900 tracking-tight">{c.name}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Classification ID: {c.id}</p>

            {/* Decorative background circle */}
            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-sky-50/50 rounded-full blur-2xl group-hover:bg-sky-100/50 transition-colors"></div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center flex flex-col items-center gap-4">
            <div className="p-4 bg-slate-50 rounded-full text-slate-300"><Layers size={48} strokeWidth={1} /></div>
            <p className="text-slate-400 font-bold">No categories defined yet. Add your first one to organize stock.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-indigo-950/40 backdrop-blur-md p-0 sm:p-4">
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="sticky top-0 bg-white p-6 lg:p-8 border-b border-slate-100 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-100 text-sky-600 rounded-xl"><Layers size={20} /></div>
                <h2 className="text-xl lg:text-2xl font-black text-slate-900">{editingCategory ? 'Edit Category' : 'New Category'}</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Category Name</label>
                <input 
                    name="name" 
                    defaultValue={editingCategory?.name} 
                    required 
                    placeholder="e.g., Clinical Disposables"
                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
                />
              </div>
              
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="w-full sm:w-auto px-10 py-3.5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/30 hover:bg-indigo-700">
                  Save Category
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
