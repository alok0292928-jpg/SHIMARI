
import React, { useState } from 'react';
import { registerUser, loginUser } from '../services/firebase';
import { UserProfile } from '../types';

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit number.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (mode === 'REGISTER') {
      if (!name.trim()) {
        setError("Please enter your Full Name.");
        return;
      }
    }

    setLoading(true);
    try {
      let userData;
      if (mode === 'REGISTER') {
        userData = await registerUser(name, phone, password);
      } else {
        userData = await loginUser(phone, password);
      }
      onLogin(userData);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0e17] flex flex-col items-center justify-center p-8 z-[100] overflow-y-auto">
      <div className="w-full max-w-sm py-12 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-orbitron font-black text-white italic tracking-tighter">
            SHIKAAR<span className="text-[#d4af37]">.AI</span>
          </h1>
          <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em]">
            {mode === 'LOGIN' ? 'Access The Arena' : 'Initialize Profile'}
          </p>
        </div>

        <div className="bg-[#161d2b] border border-white/5 p-8 rounded-3xl shadow-2xl space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-[10px] text-center font-bold uppercase tracking-widest">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'REGISTER' && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] text-white/40 uppercase font-black tracking-widest px-1">Full Name</label>
                <input type="text" placeholder="Your Legal Name" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-[#d4af37] transition-all text-sm" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] text-white/40 uppercase font-black tracking-widest px-1">Mobile Number</label>
              <div className="flex gap-2">
                <div className="bg-white/5 border border-white/10 px-4 py-4 rounded-xl text-white font-bold text-sm">+91</div>
                <input type="tel" placeholder="10-digit number" className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-[#d4af37] transition-all text-sm" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} disabled={loading} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-white/40 uppercase font-black tracking-widest px-1">Password</label>
              <input type="password" placeholder="••••••••" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-[#d4af37] transition-all" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#d4af37] text-black font-orbitron font-black py-4 rounded-xl shadow-lg shadow-[#d4af37]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30">
              {loading ? 'INITIALIZING...' : (mode === 'LOGIN' ? 'SIGN IN' : 'REGISTER')}
            </button>
          </form>

          <div className="text-center">
            <button onClick={() => { setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN'); setError(null); }} className="text-[10px] text-white/40 font-bold uppercase hover:text-[#d4af37] transition-colors" disabled={loading}>
              {mode === 'LOGIN' ? "Need account? Register now" : "Existing hunter? Login"}
            </button>
          </div>
        </div>

        <p className="text-[10px] text-white/20 text-center uppercase tracking-[0.2em] leading-relaxed">
          Secured by Shikaar AI Sentinel.<br/>Skill-based arena. 18+ only.
        </p>
      </div>
    </div>
  );
};

export default LoginView;
