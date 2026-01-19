import React, { useState } from 'react';
import { Stethoscope, Lock, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { User as UserType } from '../types';

interface Props {
  onLogin: (user: UserType) => void;
}

const LoginPage: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (username === 'admin' && password === 'password123') {
        onLogin({
          id: '1',
          username: 'admin',
          fullName: 'Dr. Sarah Algiers',
          role: 'Lead Specialist'
        });
      } else {
        setError('Invalid clinical credentials. Please check your username or password.');
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
      
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.05] pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-500 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-500/40 mb-6">
            <Stethoscope size={48} strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">DentaStock Nexus</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Advanced Clinical Management</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white p-8 lg:p-10 rounded-[3rem] shadow-2xl space-y-8">
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900">Medical Gateway</h2>
            <p className="text-xs text-slate-400 font-medium">Please authorize your session to access inventory controls.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white font-bold transition-all text-slate-800 placeholder:text-slate-300"
                  placeholder="Clinical ID"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secret Key</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white font-bold transition-all text-slate-800 placeholder:text-slate-300"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold animate-in fade-in duration-300">
                <ShieldCheck size={16} />
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/30 disabled:opacity-50 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Establish Connection
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
              Demo Access: <span className="text-indigo-400">admin</span> / <span className="text-indigo-400">password123</span>
            </p>
          </div>
        </div>

        <p className="text-center mt-8 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] opacity-40">
          Secured by Nexus Crypto-Layer v4.0.2
        </p>
      </div>
    </div>
  );
};

export default LoginPage;