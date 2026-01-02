
import React, { useState, useEffect } from 'react';
import { db, ref, onValue, off, updatePaymentSettings, update } from '../services/firebase';
import { UserProfile } from '../types';

const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PAYMENTS' | 'USERS'>('PAYMENTS');
  const [upiId, setUpiId] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const settingsRef = ref(db, 'settings/payment');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUpiId(data.upiId || '');
        setQrUrl(data.qrUrl || '');
      }
    });
    return () => off(settingsRef, 'value', unsubscribe);
  }, []);

  const handleSavePayments = async () => {
    setIsSaving(true);
    try {
      await updatePaymentSettings({ upiId, qrUrl });
      setMessage({ type: 'success', text: 'Payment settings updated!' });
    } catch {
      setMessage({ type: 'error', text: 'Update failed.' });
    } finally {
      setIsSaving(false);
    }
  };

  const findUser = () => {
    if (searchPhone.length !== 10) return;
    const userRef = ref(db, `users/${searchPhone}`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setTargetUser(data);
      else setMessage({ type: 'error', text: 'User not found' });
    }, { onlyOnce: true });
  };

  const updateUserLuck = async (luck: number) => {
    if (!targetUser) return;
    const userRef = ref(db, `users/${targetUser.phone}`);
    await update(userRef, { luck });
    setTargetUser({ ...targetUser, luck });
    setMessage({ type: 'success', text: `Luck updated for ${targetUser.name}` });
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-300 pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-orbitron font-black text-[#d4af37]">ADMIN</h2>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Platform Control</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl">
           <button onClick={() => setActiveTab('PAYMENTS')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${activeTab === 'PAYMENTS' ? 'bg-[#d4af37] text-black' : 'text-white/40'}`}>Payments</button>
           <button onClick={() => setActiveTab('USERS')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${activeTab === 'USERS' ? 'bg-[#d4af37] text-black' : 'text-white/40'}`}>Users</button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-[10px] text-center font-bold uppercase tracking-widest border ${
          message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {message.text}
        </div>
      )}

      {activeTab === 'PAYMENTS' && (
        <div className="bg-[#161d2b] border border-white/5 p-8 rounded-3xl space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/40 uppercase font-black tracking-widest px-1">Merchant UPI ID</label>
              <input type="text" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-[#d4af37] font-mono" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/40 uppercase font-black tracking-widest px-1">Custom QR Image URL</label>
              <input type="text" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-[#d4af37]" value={qrUrl} onChange={(e) => setQrUrl(e.target.value)} />
            </div>
            <button onClick={handleSavePayments} disabled={isSaving} className="w-full bg-[#d4af37] text-black font-orbitron font-black py-4 rounded-xl uppercase tracking-widest text-xs">
              {isSaving ? 'UPDATING...' : 'SAVE PAYMENT SETTINGS'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'USERS' && (
        <div className="space-y-6">
          <div className="bg-[#161d2b] p-6 rounded-3xl border border-white/5 space-y-4">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Search & Control Luck</h3>
            <div className="flex gap-2">
              <input type="tel" placeholder="Phone Number" className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl text-white font-mono" value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} />
              <button onClick={findUser} className="bg-white text-black px-6 rounded-xl font-black text-[10px] uppercase">Find</button>
            </div>
          </div>

          {targetUser && (
            <div className="bg-[#161d2b] p-8 rounded-3xl border border-[#d4af37]/30 space-y-6 animate-in slide-in-from-top duration-300">
               <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xl font-orbitron font-black text-white">{targetUser.name}</h4>
                    <p className="text-[10px] text-white/40">+91 {targetUser.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-orbitron font-black text-[#d4af37]">₹{targetUser.balance.toFixed(2)}</p>
                    <p className="text-[8px] text-white/40 uppercase font-bold tracking-widest">Balance</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Luck Multiplier: <span className="text-white">{(targetUser.luck || 1.0).toFixed(1)}x</span></p>
                  <div className="grid grid-cols-5 gap-2">
                    {[0.1, 0.5, 1.0, 1.5, 2.0].map(l => (
                      <button 
                        key={l}
                        onClick={() => updateUserLuck(l)}
                        className={`py-3 rounded-xl font-black text-[10px] border transition-all ${
                          (targetUser.luck || 1.0) === l ? 'bg-[#d4af37] border-[#d4af37] text-black' : 'bg-white/5 border-white/10 text-white'
                        }`}
                      >
                        {l === 0.1 ? 'FAIL' : l === 2.0 ? 'GOD' : l+'x'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[8px] text-white/20 italic text-center">
                    0.1x = Mostly Lose | 1.0x = Fair Play | 2.0x = Mostly Win
                  </p>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminView;
