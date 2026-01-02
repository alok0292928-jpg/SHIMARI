
import React, { useState } from 'react';

interface RedBlackGameProps {
  fee: number;
  walletBalance: number;
  userLuck: number;
  onFinish: (payout: number, shouldExit?: boolean) => void;
}

const RedBlackGame: React.FC<RedBlackGameProps> = ({ fee, walletBalance, userLuck, onFinish }) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<'RED' | 'BLACK' | null>(null);
  const [betSide, setBetSide] = useState<'RED' | 'BLACK' | null>(null);

  const handleFlip = (side: 'RED' | 'BLACK') => {
    if (isFlipping) return;
    setIsFlipping(true);
    setBetSide(side);
    setResult(null);

    setTimeout(() => {
      const outcome = Math.random() > 0.5 ? 'RED' : 'BLACK';
      setResult(outcome);
      setIsFlipping(false);

      if (side === outcome) {
        onFinish(fee * 2, false); // Returns stake * 2 (minus house edge logic in App if needed)
      } else {
        onFinish(0, false); // Returns 0
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0e17] flex flex-col items-center justify-center p-6 z-40">
      <div className="w-full max-w-sm space-y-12 animate-in fade-in duration-500">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-orbitron font-black text-white italic">RED VS<span className="text-red-500"> BLACK</span></h2>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Predict Color • 2.0x</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-full px-3 py-1 flex items-center gap-2 shadow-lg backdrop-blur-md">
            <span className="text-[#d4af37] font-black text-[10px]">₹</span>
            <span className="text-white font-black text-xs font-orbitron">{(walletBalance || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex justify-center h-48 items-center">
           <div className={`w-32 h-48 rounded-3xl border-4 transition-all duration-500 flex items-center justify-center shadow-2xl ${
             isFlipping ? 'animate-bounce border-white/20 bg-white/5' : 
             result === 'RED' ? 'border-red-500 bg-red-500/10' : 
             result === 'BLACK' ? 'border-gray-500 bg-gray-500/10' : 'border-white/5 bg-white/5'
           }`}>
              <span className={`text-6xl font-black ${result === 'RED' ? 'text-red-500' : 'text-white'}`}>
                {isFlipping ? '?' : result ? (result === 'RED' ? '♥' : '♠') : '♣'}
              </span>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <button 
            onClick={() => handleFlip('RED')}
            disabled={isFlipping}
            className={`p-10 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${betSide === 'RED' && isFlipping ? 'bg-red-500 border-red-400' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}
           >
              <span className="text-4xl">♥</span>
              <span className="text-xs font-black uppercase tracking-widest">Red</span>
           </button>
           <button 
            onClick={() => handleFlip('BLACK')}
            disabled={isFlipping}
            className={`p-10 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${betSide === 'BLACK' && isFlipping ? 'bg-gray-800 border-gray-600' : 'bg-gray-500/10 border-gray-500/20 text-gray-400'}`}
           >
              <span className="text-4xl">♠</span>
              <span className="text-xs font-black uppercase tracking-widest">Black</span>
           </button>
        </div>

        <button 
          onClick={() => onFinish(0, true)}
          className="w-full bg-white/5 border border-white/10 text-white/30 font-orbitron font-black py-4 rounded-2xl uppercase tracking-widest text-[9px] active:scale-95 transition-all"
        >
          Exit Game
        </button>
      </div>
    </div>
  );
};

export default RedBlackGame;
