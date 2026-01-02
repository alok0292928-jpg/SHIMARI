
import React, { useState } from 'react';
import { UserProfile, MatchHistory } from '../types';
import { redeemGiftCode } from '../services/firebase';

interface AccountViewProps {
  user: UserProfile;
  history: MatchHistory[];
  onLogout: () => void;
}

const AccountView: React.FC<AccountViewProps> = ({ user, history, onLogout }) => {
  const [giftCode, setGiftCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleRedeem = async () => {
    const code = giftCode.trim().toUpperCase();
    if (!code) return;
    
    setIsRedeeming(true);
    try {
      const amount = await redeemGiftCode(user.phone, code);
      alert(`Success! ₹${amount} added to your wallet.`);
      setGiftCode('');
    } catch (err: any) {
      alert(err.message || "Invalid or expired gift code.");
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 pb-24">
      {/* Profile Header */}
      <div className="flex items-center gap-4 p-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f39c12] to-yellow-600 flex items-center justify-center text-black font-black text-2xl font-orbitron shadow-xl shadow-[#f39c12]/20">
          {user.name ? user.name[0] : 'P'}
        </div>
        <div>
          <h2 className="text-xl font-orbitron font-black text-white italic">{user.name || 'Hunter'}</h2>
          <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">+91 {user.phone}</p>
        </div>
        <button onClick={onLogout} className="ml-auto text-white/20 hover:text-white transition-colors bg-white/5 p-3 rounded-xl border border-white/5 active:scale-90">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#161d2b] p-5 rounded-2xl border border-white/5 shadow-lg">
          <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-1">Total Won</p>
          <p className="text-2xl font-orbitron font-black text-green-400">₹{(user.totalWon || 0).toFixed(2)}</p>
        </div>
        <div className="bg-[#161d2b] p-5 rounded-2xl border border-white/5 shadow-lg">
          <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-1">Luck Bonus</p>
          <p className="text-2xl font-orbitron font-black text-[#f39c12]">{(user.luck || 1.0).toFixed(1)}x</p>
        </div>
      </div>

      {/* Gift Code Section - Now Fully Functional */}
      <div className="bg-gradient-to-br from-[#1e293b] to-[#161d2b] p-6 rounded-[2rem] border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#f39c12]/20 flex items-center justify-center text-[#f39c12]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 00-2 2h2z" /></svg>
          </div>
          <h3 className="text-xs font-black text-white uppercase tracking-widest">Redeem Gift Code</h3>
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Enter Code Here"
            value={giftCode}
            onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
            className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl text-white font-orbitron font-black text-sm outline-none focus:border-[#f39c12] transition-all"
          />
          <button 
            onClick={handleRedeem}
            disabled={isRedeeming || !giftCode.trim()}
            className="bg-[#f39c12] text-black font-black px-6 rounded-xl text-[10px] uppercase shadow-lg shadow-[#f39c12]/20 active:scale-95 transition-all disabled:opacity-30"
          >
            {isRedeeming ? '...' : 'REDEEM'}
          </button>
        </div>
        <p className="text-[8px] text-white/20 uppercase tracking-widest text-center">Codes are case-sensitive and single-use</p>
      </div>

      {/* Match History */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Battle History</h3>
        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((match) => (
              <div key={match.id} className="bg-[#161d2b] p-4 rounded-2xl border border-white/5 flex justify-between items-center group hover:border-[#f39c12]/30 transition-all shadow-md">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white italic font-orbitron uppercase tracking-tighter">{match.gameType || 'Arena Match'}</span>
                    <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded-full text-white/40 font-black uppercase">{match.duration || 'LIVE'}</span>
                  </div>
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-wider">{new Date(match.date).toLocaleDateString()} • {match.kills || 0} Kills</p>
                </div>
                <p className={`font-orbitron font-black text-sm ${(match.earnings || 0) >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                  {(match.earnings || 0) >= 0 ? '+' : ''}₹{(match.earnings || 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-white/20 text-[10px] uppercase font-black tracking-widest">No Matches Recorded</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountView;
