
import React, { useState } from 'react';
import { Entity, EntityType } from '../types';
import { Plus, Edit2, Trash2, Mail, Phone, MapPin, X, User } from 'lucide-react';

interface Props {
  type: EntityType;
  entities: Entity[];
  onAdd: (e: Entity) => void;
  onUpdate: (e: Entity) => void;
  onDelete: (id: string) => void;
}

const EntitiesPage: React.FC<Props> = ({ type, entities, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const entity: Entity = {
      id: editingEntity?.id || Date.now().toString(),
      type,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
    };

    if (editingEntity) {
      onUpdate(entity);
    } else {
      onAdd(entity);
    }
    
    setIsModalOpen(false);
    setEditingEntity(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight capitalize">{type} Directory</h1>
          <p className="text-sm lg:text-base text-slate-500">Managing {entities.length} active {type} accounts.</p>
        </div>
        <button 
          onClick={() => { setEditingEntity(null); setIsModalOpen(true); }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3.5 lg:py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
        >
          <Plus size={20} />
          New {type}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 pb-20 lg:pb-0">
        {entities.map(e => (
          <div key={e.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[1.25rem] flex items-center justify-center font-black text-2xl shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                {e.name.charAt(0)}
              </div>
              <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingEntity(e); setIsModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-xl transition-all hover:bg-white shadow-sm"><Edit2 size={16} /></button>
                <button onClick={() => onDelete(e.id)} className="p-2.5 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-xl transition-all hover:bg-white shadow-sm"><Trash2 size={16} /></button>
              </div>
            </div>
            
            <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">{e.name}</h3>
            
            <div className="space-y-4 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-3 text-xs font-bold text-slate-500 overflow-hidden">
                <div className="p-1.5 bg-slate-100 rounded-lg"><Mail size={14} className="text-slate-400" /></div>
                <span className="truncate">{e.email}</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                <div className="p-1.5 bg-slate-100 rounded-lg"><Phone size={14} className="text-slate-400" /></div>
                <span>{e.phone}</span>
              </div>
              <div className="flex items-start gap-3 text-xs font-bold text-slate-500 leading-relaxed">
                <div className="p-1.5 bg-slate-100 rounded-lg mt-0.5"><MapPin size={14} className="text-slate-400 flex-shrink-0" /></div>
                <span className="line-clamp-2">{e.address}</span>
              </div>
            </div>

            {/* Decorative background circle */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl group-hover:bg-indigo-100/50 transition-colors"></div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-indigo-950/40 backdrop-blur-md p-0 sm:p-4">
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="sticky top-0 bg-white p-6 lg:p-8 border-b border-slate-100 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><User size={20} /></div>
                <h2 className="text-xl lg:text-2xl font-black text-slate-900 capitalize">{editingEntity ? `Edit ${type}` : `New ${type}`}</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Display Name</label>
                <input name="name" defaultValue={editingEntity?.name} required className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                  <input name="email" type="email" defaultValue={editingEntity?.email} required className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Primary Phone</label>
                  <input name="phone" defaultValue={editingEntity?.phone} required className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Physical Address</label>
                <textarea name="address" defaultValue={editingEntity?.address} required rows={3} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="w-full sm:w-auto px-10 py-3.5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/30 hover:bg-indigo-700">
                  Store {type}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntitiesPage;
