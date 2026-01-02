
import React, { useState, useEffect } from 'react';
import { DEPOSIT_AMOUNTS } from '../constants';
import { submitDepositRequest, db, ref, onValue, off } from '../services/firebase';
import { Transaction } from '../types';

interface WalletViewProps {
  balance: number;
  phone: string;
  initialView?: 'MAIN' | 'DEPOSIT' | 'WITHDRAW';
}

interface PaymentSettings {
  upiId: string;
  qrUrl: string;
}

const WalletView: React.FC<WalletViewProps> = ({ balance, phone, initialView = 'MAIN' }) => {
  const [view, setView] = useState<'MAIN' | 'DEPOSIT' | 'WITHDRAW'>(initialView);
  const [amount, setAmount] = useState(100);
  const [utr, setUtr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    upiId: 'loading...',
    qrUrl: ''
  });

  // Sync internal view with prop if it changes externally
  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  // Fetch Payment Settings (UPI/QR) from DB
  useEffect(() => {
    const settingsRef = ref(db, 'settings/payment');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPaymentSettings({
          upiId: data.upiId || 'shikaar.ai@ybl',
          qrUrl: data.qrUrl || ''
        });
      }
    });
    return () => off(settingsRef, 'value', unsubscribe);
  }, []);

  useEffect(() => {
    if (!phone) return;
    const transRef = ref(db, `transactions/${phone}`);
    const unsubscribe = onValue(transRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data) as Transaction[];
        setTransactions(list.sort((a, b) => b.date - a.date));
      }
    });
    return () => off(transRef, 'value', unsubscribe);
  }, [phone]);

  const handleDepositSubmit = async () => {
    if (utr.length !== 12) {
      alert("Please enter a valid 12-digit UTR number");
      return;
    }
    setIsSubmitting(true);
    try {
      await submitDepositRequest(phone, amount, utr);
      alert("Deposit request submitted! Status: PENDING. Balance will be updated after admin approval.");
      setView('MAIN');
      setUtr('');
    } catch (error) {
      alert("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-400 bg-green-400/10';
      case 'FAILED': return 'text-red-400 bg-red-400/10';
      default: return 'text-amber-400 bg-amber-400/10';
    }
  };

  // Generate dynamic QR if no custom URL is provided in DB
  const qrDisplayUrl = paymentSettings.qrUrl 
    ? paymentSettings.qrUrl 
    : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${paymentSettings.upiId}&am=${amount}&tn=SHIKAAR_${phone}`;

  if (view === 'DEPOSIT') {
    return (
      <div className="p-6 space-y-6 animate-in fade-in duration-300 pb-24">
        <button onClick={() => setView('MAIN')} className="text-gray-400 flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <h2 className="text-2xl font-orbitron font-black text-white italic tracking-tighter">DEPOSIT <span className="text-[#f39c12]">SENTINEL</span></h2>
        
        <div className="grid grid-cols-3 gap-3">
          {DEPOSIT_AMOUNTS.map(amt => (
            <button
              key={amt}
              onClick={() => setAmount(amt)}
              className={`py-3 rounded-xl font-black transition-all border text-xs tracking-widest ${
                amount === amt ? 'bg-[#f39c12] text-black border-[#f39c12]' : 'bg-white/5 border-white/10 text-white/40'
              }`}
            >
              ₹{amt}
            </button>
          ))}
        </div>

        <div className="bg-[#161d2b] p-6 rounded-3xl border border-white/5 flex flex-col items-center text-center space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#f39c12]/5 blur-[40px] rounded-full" />
          <div className="w-12 h-12 bg-[#f39c12]/20 rounded-full flex items-center justify-center text-[#f39c12]">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Official Merchant UPI</p>
            <p className="text-lg font-orbitron font-black text-white break-all px-2 tracking-tighter">{paymentSettings.upiId}</p>
          </div>
          <div className="w-48 h-48 bg-white p-3 rounded-2xl shadow-inner flex items-center justify-center overflow-hidden">
            <img 
              src={qrDisplayUrl} 
              alt="Payment QR" 
              className="w-full h-full object-contain"
              key={amount} // Force reload on amount change
            />
          </div>
          <p className="text-[9px] text-white/20 italic uppercase tracking-widest">Pay exact amount and copy 12-digit UTR</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5 px-1">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">12-Digit UTR Number</label>
            <input
              type="text"
              maxLength={12}
              value={utr}
              onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
              placeholder="Ex: 312548..."
              className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-orbitron font-black text-xl focus:border-[#f39c12] outline-none text-center tracking-[0.3em] shadow-inner"
            />
          </div>
          <button
            onClick={handleDepositSubmit}
            disabled={isSubmitting || utr.length !== 12}
            className="w-full bg-[#f39c12] text-black font-orbitron font-black py-5 rounded-[2.5rem] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 shadow-xl shadow-[#f39c12]/20 uppercase tracking-widest text-sm"
          >
            {isSubmitting ? 'VERIFYING...' : 'CONFIRM TRANSACTION'}
          </button>
        </div>
      </div>
    );
  }

  if (view === 'WITHDRAW') {
    return (
      <div className="p-6 space-y-6 animate-in fade-in duration-300 pb-24">
        <button onClick={() => setView('MAIN')} className="text-gray-400 flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <h2 className="text-2xl font-orbitron font-black text-white italic tracking-tighter">WITHDRAW <span className="text-red-500">Loot</span></h2>
        <div className="bg-[#161d2b] border border-white/5 p-7 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-red-500/5 blur-[40px] rounded-full" />
          <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">Available to Payout</p>
          <p className="text-4xl font-orbitron font-black text-[#f39c12] italic">₹{(balance || 0).toFixed(2)}</p>
        </div>
        <div className="space-y-5">
          <div className="space-y-1.5 px-1">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Amount to Withdraw</label>
            <input type="number" placeholder="Enter Amount" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-orbitron font-black outline-none focus:border-red-500 shadow-inner" />
          </div>
          <div className="space-y-1.5 px-1">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Receiver UPI ID</label>
            <input type="text" placeholder="example@upi" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-orbitron font-black outline-none focus:border-red-500 shadow-inner" />
          </div>
          <button className="w-full bg-white text-black font-orbitron font-black py-5 rounded-[2.5rem] uppercase tracking-widest text-sm shadow-xl shadow-white/10 active:scale-95 transition-all">Request Payout</button>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
             <p className="text-[9px] text-white/30 uppercase font-black tracking-[0.2em] leading-relaxed">Secure Node Processing<br/>ETA: 2-4 Hours • 24x7 Settlement</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-300 pb-20">
      <div className="bg-gradient-to-br from-[#1e293b] to-[#0a0e17] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#f39c12]/10 blur-[80px] rounded-full -mr-20 -mt-20" />
        <p className="text-[10px] text-white/40 font-orbitron uppercase font-black tracking-[0.3em] mb-2 italic">Active Assets</p>
        <h3 className="text-5xl font-orbitron font-black text-white italic tracking-tighter">
          <span className="text-[#f39c12]">₹</span>{(balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </h3>
        <div className="mt-8 flex gap-3">
          <button onClick={() => setView('DEPOSIT')} className="flex-1 bg-[#f39c12] text-black font-orbitron font-black py-5 rounded-2xl shadow-xl shadow-[#f39c12]/10 active:scale-95 transition-all uppercase tracking-widest text-[10px]">Deposit</button>
          <button onClick={() => setView('WITHDRAW')} className="flex-1 bg-white/5 border border-white/10 text-white font-orbitron font-black py-5 rounded-2xl active:scale-95 transition-all uppercase tracking-widest text-[10px]">Withdraw</button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end px-1">
           <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Transaction Ledger</h4>
           <span className="text-[9px] text-[#f39c12] font-black uppercase tracking-widest animate-pulse">Live</span>
        </div>
        <div className="space-y-3">
          {transactions.length > 0 ? (
            transactions.map(tx => (
              <div key={tx.id} className="bg-[#161d2b]/80 backdrop-blur-sm border border-white/5 p-5 rounded-3xl flex justify-between items-center group shadow-md">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${tx.type === 'DEPOSIT' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {tx.type === 'DEPOSIT' ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-black text-white uppercase tracking-wider italic font-orbitron">{tx.type}</p>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/30 font-black uppercase mt-0.5 tracking-tighter">{new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-orbitron font-black italic ${tx.type === 'DEPOSIT' ? 'text-blue-400' : 'text-red-400'}`}>
                    {tx.type === 'DEPOSIT' ? '+' : '-'}₹{(tx.amount || 0).toFixed(2)}
                  </p>
                  {tx.utr && <p className="text-[9px] text-white/10 font-mono tracking-tighter mt-1">ID: {tx.utr}</p>}
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/5 shadow-inner">
              <p className="text-white/20 text-[10px] uppercase font-black tracking-[0.4em]">Empty Ledger</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletView;
