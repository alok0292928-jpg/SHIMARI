
import React, { useState } from 'react';

interface CoinFlipGameProps {
  fee: number;
  walletBalance: number;
  userLuck: number;
  onFinish: (earnings: number, shouldExit?: boolean) => void;
}

const CoinFlipGame: React.FC<CoinFlipGameProps> = ({ fee, walletBalance, userLuck, onFinish }) => {
  const [side, setSide] = useState<'HEADS' | 'TAILS' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<'HEADS' | 'TAILS' | null>(null);

  const flip = (choice: 'HEADS' | 'TAILS') => {
    if (isFlipping) return;
    setIsFlipping(true);
    setSide(choice);
    setResult(null);

    setTimeout(() => {
      const outcome = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
      setResult(outcome);
      setIsFlipping(false);

      if (choice === outcome) {
        onFinish(fee * 1.9 - fee, false);
      } else {
        onFinish(-fee, false);
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0e17] flex flex-col items-center justify-center p-6 z-40">
      <div className="w-full max-w-sm space-y-12 text-center animate-in fade-in duration-500">
        <div className="flex justify-between items-start text-left">
          <div>
            <h2 className="text-3xl font-orbitron font-black text-white italic">COIN<span className="text-[#d4af37]"> FLIP</span></h2>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Head or Tail • 1.9x Pay</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-lg backdrop-blur-md">
            <span className="text-[#d4af37] font-black text-[10px]">₹</span>
            <span className="text-white font-black text-xs font-orbitron">{(walletBalance || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="relative h-48 flex items-center justify-center">
           <div className={`w-32 h-32 rounded-full border-[8px] border-[#d4af37] bg-gradient-to-br from-[#d4af37] to-yellow-600 flex items-center justify-center shadow-[0_0_50px_rgba(212,175,55,0.4)] transition-all duration-700 ${isFlipping ? 'animate-bounce' : ''}`}>
              <span className="text-4xl font-orbitron font-black text-black">
                {isFlipping ? '?' : result ? result[0] : side ? side[0] : 'S'}
              </span>
           </div>
           {result && (
             <div className={`absolute -bottom-8 font-black text-xl uppercase tracking-widest ${result === side ? 'text-green-400' : 'text-red-500'}`}>
                {result === side ? 'YOU WON!' : 'YOU LOST'}
             </div>
           )}
        </div>

        <div className="grid grid-cols-2 gap-4">
           <button 
            onClick={() => flip('HEADS')}
            disabled={isFlipping}
            className={`p-8 rounded-[2rem] border transition-all ${side === 'HEADS' && isFlipping ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-white/5 border-white/10 text-white hover:border-[#d4af37]/50'}`}
           >
              <p className="text-xs font-black uppercase tracking-widest mb-1">Heads</p>
              <p className="text-2xl font-orbitron font-black italic">H</p>
           </button>
           <button 
            onClick={() => flip('TAILS')}
            disabled={isFlipping}
            className={`p-8 rounded-[2rem] border transition-all ${side === 'TAILS' && isFlipping ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-white/5 border-white/10 text-white hover:border-[#d4af37]/50'}`}
           >
              <p className="text-xs font-black uppercase tracking-widest mb-1">Tails</p>
              <p className="text-2xl font-orbitron font-black italic">T</p>
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

export default CoinFlipGame;
