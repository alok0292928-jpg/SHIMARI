
import React, { useState } from 'react';

interface LimboGameProps {
  fee: number;
  walletBalance: number;
  userLuck: number;
  onFinish: (payout: number, shouldExit?: boolean) => void;
}

const LimboGame: React.FC<LimboGameProps> = ({ fee, walletBalance, userLuck, onFinish }) => {
  const [target, setTarget] = useState(2.0);
  const [result, setResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [lastWin, setLastWin] = useState<boolean | null>(null);

  const handleRoll = () => {
    if (isRolling) return;
    if (walletBalance < fee) { alert("Insufficient balance!"); return; }
    
    setIsRolling(true);
    setResult(null);
    onFinish(-fee, false);

    setTimeout(() => {
      const rand = Math.random();
      let roll: number;
      
      // Luck Bias Adjustment
      // base formula provides a house edge skewed result
      const baseRoll = 0.98 / (1 - Math.random()); 
      
      if (userLuck < 1.0) {
         // Force under-target crash if luck is low
         if (rand > userLuck) {
            roll = 1.0 + Math.random() * (target - 1.01);
         } else {
            roll = baseRoll;
         }
      } else if (userLuck > 1.0) {
         // Boost roll if luck is high
         roll = baseRoll * userLuck;
      } else {
         roll = baseRoll;
      }
      
      const finalRoll = Math.max(1, parseFloat(roll.toFixed(2)));
      setResult(finalRoll);
      setIsRolling(false);
      
      const won = finalRoll >= target;
      setLastWin(won);
      
      if (won) {
        onFinish(fee * target, false); 
      } else {
        onFinish(0, false); 
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0e17] flex flex-col items-center justify-center p-6 z-40 overflow-hidden">
      <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-orbitron font-black text-white italic">LIMBO<span className="text-[#00e5ff]"> FAST</span></h2>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-black">Multi-Instant Pay</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-xl backdrop-blur-md">
            <span className="text-[#d4af37] font-black text-[10px]">₹</span>
            <span className="text-white font-black text-sm font-orbitron">{(walletBalance || 0).toLocaleString()}</span>
          </div>
        </div>
        <div className="bg-[#161d2b] aspect-video rounded-[3rem] border border-white/5 flex items-center justify-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
          {isRolling ? (
             <div className="text-6xl font-orbitron font-black text-white/20 animate-pulse italic">ROLLING...</div>
          ) : result ? (
             <div className={`text-7xl font-orbitron font-black italic drop-shadow-2xl animate-in zoom-in duration-300 ${lastWin ? 'text-green-400' : 'text-red-500'}`}>
                {result.toFixed(2)}x
             </div>
          ) : (
             <div className="text-7xl font-orbitron font-black text-white/5 italic">1.00x</div>
          )}
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] text-white/30 uppercase font-black tracking-widest px-1">Target Multi</label>
              <div className="relative">
                 <input type="number" step="0.1" min="1.1" value={target} onChange={(e) => setTarget(parseFloat(e.target.value) || 1.1)} className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-orbitron font-black text-2xl focus:border-cyan-500 outline-none transition-all text-center" />
                 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 font-black">x</span>
              </div>
            </div>
            <div className="space-y-2 text-right">
              <label className="text-[10px] text-white/30 uppercase font-black tracking-widest px-1">Win Chance</label>
              <div className="p-5 bg-black/40 border border-white/5 rounded-3xl flex items-center justify-center">
                 <span className="text-2xl font-orbitron font-black text-cyan-400">{( (98 * userLuck) / target).toFixed(2)}%</span>
              </div>
            </div>
          </div>
          <button onClick={handleRoll} disabled={isRolling} className="w-full bg-cyan-500 text-black font-orbitron font-black py-6 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,229,255,0.2)] active:scale-95 transition-all text-sm uppercase tracking-[0.2em] disabled:opacity-20">
            {isRolling ? 'BETTING...' : `BET ₹${fee}`}
          </button>
          <button onClick={() => onFinish(0, true)} className="w-full bg-white/5 border border-white/10 text-white/40 font-orbitron font-black py-4 rounded-2xl uppercase tracking-widest text-[9px] active:scale-95 transition-all">Exit Lobby</button>
        </div>
      </div>
    </div>
  );
};

export default LimboGame;
