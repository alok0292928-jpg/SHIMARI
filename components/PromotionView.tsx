
import React from 'react';

interface PromotionViewProps {
  referralCode: string;
  invitedCount: number;
}

const PromotionView: React.FC<PromotionViewProps> = ({ referralCode, invitedCount }) => {
  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    alert("Referral Code Copied!");
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-orbitron font-black text-[#d4af37]">REFER & EARN</h2>
        <p className="text-white/60 text-sm">Friends get ₹10, You get ₹5 on their registration.</p>
      </div>

      <div className="bg-[#1e293b]/50 border border-[#d4af37]/20 p-8 rounded-3xl relative overflow-hidden text-center space-y-6">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#d4af37]/10 via-transparent to-transparent opacity-50" />
         <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Your Unique Reference Code</p>
         <div className="bg-black/40 border border-white/10 p-5 rounded-xl flex items-center justify-between gap-4">
            <span className="text-xl text-[#d4af37] font-orbitron font-black tracking-widest">{referralCode}</span>
            <button onClick={copyCode} className="bg-[#d4af37] text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase">COPY</button>
         </div>
         <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div>
              <p className="text-2xl font-orbitron font-black text-white">{invitedCount}</p>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Invited</p>
            </div>
            <div>
              <p className="text-2xl font-orbitron font-black text-green-400">₹{invitedCount * 5}</p>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Earned</p>
            </div>
         </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black text-white/40 uppercase tracking-widest px-1">How it works</h3>
        <div className="space-y-3">
          {[
            { step: 1, text: "Share your unique reference code." },
            { step: 2, text: "Friend registers with your code." },
            { step: 3, text: "Friend gets ₹10 bonus instantly." },
            { step: 4, text: "You get ₹5 reward for every join." }
          ].map((item) => (
            <div key={item.step} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37] font-bold text-xs">{item.step}</div>
              <p className="text-xs text-white/70 font-medium">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromotionView;
