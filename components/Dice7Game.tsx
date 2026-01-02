
import React, { useState } from 'react';

interface Dice7GameProps {
  fee: number;
  walletBalance: number;
  userLuck: number;
  onFinish: (earnings: number, shouldExit?: boolean) => void;
}

const Dice7Game: React.FC<Dice7GameProps> = ({ fee, walletBalance, userLuck, onFinish }) => {
  const [bet, setBet] = useState<'UP' | 'DOWN' | '7' | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [dice, setDice] = useState<{ d1: number, d2: number } | null>(null);

  const roll = (side: 'UP' | 'DOWN' | '7') => {
    if (isRolling) return;
    setIsRolling(true);
    setBet(side);
    setDice(null);

    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      setDice({ d1, d2 });
      setIsRolling(false);
      
      const sum = d1 + d2;
      let won = false;
      let mult = 0;

      if (side === 'UP' && sum > 7) { won = true; mult = 2; }
      else if (side === 'DOWN' && sum < 7) { won = true; mult = 2; }
      else if (side === '7' && sum === 7) { won = true; mult = 5; }

      if (won) {
        onFinish(fee * mult - fee, false);
      } else {
        onFinish(-fee, false);
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0e17] flex flex-col items-center justify-center p-6 z-40">
      <div className="w-full max-w-sm space-y-12 animate-in fade-in duration-500">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-orbitron font-black text-white italic">7 UP<span className="text-[#d4af37]"> 7 DOWN</span></h2>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Sum the Dice • Big Wins</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-lg backdrop-blur-md">
            <span className="text-[#d4af37] font-black text-[10px]">₹</span>
            <span className="text-white font-black text-xs font-orbitron">{(walletBalance || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex justify-center gap-6 h-32 items-center">
           <div className={`w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-4xl font-black text-black shadow-2xl transition-all duration-500 ${isRolling ? 'animate-spin' : ''}`}>
              {dice?.d1 || '?'}
           </div>
           <span className="text-2xl font-black text-white/20">+</span>
           <div className={`w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-4xl font-black text-black shadow-2xl transition-all duration-500 ${isRolling ? 'animate-spin' : ''}`}>
              {dice?.d2 || '?'}
           </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
           <button 
            onClick={() => roll('DOWN')}
            disabled={isRolling}
            className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-2 ${bet === 'DOWN' && isRolling ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-white/5 border-white/5 text-white/40'}`}
           >
              <span className="text-[9px] font-black uppercase">Down</span>
              <span className="text-xl font-orbitron font-black">2-6</span>
              <span className="text-[9px] font-black text-white/20">2x Payout</span>
           </button>
           <button 
            onClick={() => roll('7')}
            disabled={isRolling}
            className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-2 ${bet === '7' && isRolling ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-white/5 border-white/5 text-white/40'}`}
           >
              <span className="text-[9px] font-black uppercase">Exact</span>
              <span className="text-xl font-orbitron font-black">7</span>
              <span className="text-[9px] font-black text-white/20">5x Payout</span>
           </button>
           <button 
            onClick={() => roll('UP')}
            disabled={isRolling}
            className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-2 ${bet === 'UP' && isRolling ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-white/5 border-white/5 text-white/40'}`}
           >
              <span className="text-[9px] font-black uppercase">Up</span>
              <span className="text-xl font-orbitron font-black">8-12</span>
              <span className="text-[9px] font-black text-white/20">2x Payout</span>
           </button>
        </div>

        <button 
          onClick={() => onFinish(0, true)}
          className="w-full bg-white/5 border border-white/10 text-white/30 font-orbitron font-black py-4 rounded-2xl uppercase tracking-widest text-[9px] active:scale-95 transition-all"
        >
          Exit to Lobby
        </button>
      </div>
    </div>
  );
};

export default Dice7Game;
