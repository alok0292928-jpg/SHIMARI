
import React, { useState, useEffect } from 'react';
import { db, ref, onValue, off, updatePaymentSettings } from '../services/firebase';

const AdminView: React.FC = () => {
  const [upiId, setUpiId] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
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

  const handleSave = async () => {
    if (!upiId) {
      setMessage({ type: 'error', text: 'UPI ID is required.' });
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      await updatePaymentSettings({ upiId, qrUrl });
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2">
        <h2 className="text-3xl font-orbitron font-black text-[#d4af37]">ADMIN PANEL</h2>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Manage Payment Infrastructure</p>
      </div>

      <div className="bg-[#161d2b] border border-white/5 p-8 rounded-3xl shadow-2xl space-y-6">
        {message && (
          <div className={`p-4 rounded-xl text-[10px] text-center font-bold uppercase tracking-widest ${
            message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-white/40 uppercase font-black tracking-widest px-1">Merchant UPI ID</label>
            <input 
              type="text" 
              placeholder="e.g. shikaar@upi" 
              className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-[#d4af37] transition-all font-mono" 
              value={upiId} 
              onChange={(e) => setUpiId(e.target.value)} 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-white/40 uppercase font-black tracking-widest px-1">QR Code Image URL (Optional)</label>
            <input 
              type="text" 
              placeholder="Leave empty to use auto-generated QR" 
              className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-[#d4af37] transition-all text-xs" 
              value={qrUrl} 
              onChange={(e) => setQrUrl(e.target.value)} 
            />
            <p className="text-[9px] text-white/20 italic mt-1 px-1">If empty, the app will generate a UPI QR dynamically using the UPI ID above.</p>
          </div>

          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full bg-[#d4af37] text-black font-orbitron font-black py-4 rounded-xl shadow-lg shadow-[#d4af37]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 uppercase tracking-widest text-xs"
          >
            {isSaving ? 'UPDATING...' : 'SAVE SETTINGS'}
          </button>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Preview</h4>
        <div className="flex flex-col items-center space-y-3">
          <div className="w-40 h-40 bg-white p-2 rounded-xl flex items-center justify-center overflow-hidden">
            <img 
              src={qrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${upiId || 'merchant@upi'}&am=100`} 
              alt="QR Preview" 
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-white/60 font-mono text-[10px]">{upiId || 'merchant@upi'}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
