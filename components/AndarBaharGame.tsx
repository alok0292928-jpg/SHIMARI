import React, { useState, useEffect } from 'react';

interface AndarBaharGameProps {
  fee: number;
  walletBalance: number;
  userLuck: number;
  onFinish: (payout: number, shouldExit?: boolean) => void;
}

const CARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const AndarBaharGame: React.FC<AndarBaharGameProps> = ({ fee, walletBalance, userLuck, onFinish }) => {
  const [joker, setJoker] = useState<string | null>(null);
  const [andarCards, setAndarCards] = useState<string[]>([]);
  const [baharCards, setBaharCards] = useState<string[]>([]);
  const [isDealing, setIsDealing] = useState(false);
  const [betSide, setBetSide] = useState<'ANDAR' | 'BAHAR' | null>(null);
  const [winner, setWinner] = useState<'ANDAR' | 'BAHAR' | null>(null);

  useEffect(() => {
    setJoker(CARDS[Math.floor(Math.random() * CARDS.length)]);
  }, []);

  const startRound = (side: 'ANDAR' | 'BAHAR') => {
    if (isDealing) return;
    setBetSide(side);
    setIsDealing(true);
    setAndarCards([]);
    setBaharCards([]);
    setWinner(null);

    let currentAndar: string[] = [];
    let currentBahar: string[] = [];
    let turn = 0;

    const deal = () => {
      const nextCard = CARDS[Math.floor(Math.random() * CARDS.length)];
      const isAndarTurn = turn % 2 === 0;

      if (isAndarTurn) {
        currentAndar = [nextCard, ...currentAndar];
        setAndarCards([...currentAndar]);
      } else {
        currentBahar = [nextCard, ...currentBahar];
        setBaharCards([...currentBahar]);
      }

      if (nextCard === joker) {
        const winSide = isAndarTurn ? 'ANDAR' : 'BAHAR';
        setWinner(winSide);
        setIsDealing(false);
        const won = side === winSide;
        if (won) {
          const mult = winSide === 'ANDAR' ? 1.9 : 2.0;
          onFinish(fee * mult, false); // Returns stake * mult
        } else {
          onFinish(0, false); // Returns 0
        }
      } else {
        turn++;
        setTimeout(deal, 600);
      }
    };

    setTimeout(deal, 800);
  };

  const reset = () => {
    setJoker(CARDS[Math.floor(Math.random() * CARDS.length)]);
    setAndarCards([]);
    setBaharCards([]);
    setWinner(null);
    setBetSide(null);
  };

  // Fixed: Close component and add default export
  return (
    <div className="fixed inset-0 bg-[#0a0e17] flex flex-col items-center justify-center p-6 z-40">
      <div className="w-full max-sm space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-orbitron font-black text-white italic">ANDAR<span className="text-[#d4af37]"> BAHAR</span></h2>
          <div className="bg-white/5 border border-white/10 rounded-full px-3 py-1 flex items-center gap-2 shadow-lg backdrop-blur-md">
            <span className="text-[#d4af37] font-black text-[10px]">₹</span>
            <span className="text-white font-black text-xs font-orbitron">{(walletBalance || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
           <div className="w-24 h-36 bg-[#161d2b] rounded-2xl border-4 border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.2)] flex items-center justify-center">
              <span className="text-4xl font-orbitron font-black text-white">{joker || '?'}</span>
           </div>
           <p className="text-[10px] text-[#d4af37] font-black uppercase tracking-widest">Middle Card</p>
        </div>

        <div className="grid grid-cols-2 gap-4 h-48">
           <div className={`rounded-3xl border-2 flex flex-col items-center p-3 overflow-hidden ${winner === 'ANDAR' ? 'border-green-500 bg-green-500/10' : 'border-white/5 bg-white/5'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Andar</span>
              <div className="flex flex-wrap gap-1 justify-center overflow-y-auto no-scrollbar">
                {andarCards.map((c, i) => (
                  <div key={i} className={`w-8 h-12 rounded bg-white flex items-center justify-center text-[10px] font-black text-black animate-in slide-in-from-top-2 ${c === joker ? 'ring-2 ring-red-500' : ''}`}>{c}</div>
                ))}
              </div>
           </div>
           <div className={`rounded-3xl border-2 flex flex-col items-center p-3 overflow-hidden ${winner === 'BAHAR' ? 'border-green-500 bg-green-500/10' : 'border-white/5 bg-white/5'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Bahar</span>
              <div className="flex flex-wrap gap-1 justify-center overflow-y-auto no-scrollbar">
                {baharCards.map((c, i) => (
                  <div key={i} className={`w-8 h-12 rounded bg-white flex items-center justify-center text-[10px] font-black text-black animate-in slide-in-from-top-2 ${c === joker ? 'ring-2 ring-red-500' : ''}`}>{c}</div>
                ))}
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <button 
            onClick={() => startRound('ANDAR')}
            disabled={isDealing}
            className={`py-6 rounded-3xl border transition-all flex flex-col items-center gap-1 ${betSide === 'ANDAR' ? 'bg-[#d4af37] border-[#d4af37] text-black' : 'bg-white/5 border-white/10 text-white'}`}
           >
              <span className="text-xs font-black uppercase">ANDAR</span>
              <span className="text-[8px] font-bold opacity-60">1.9x Payout</span>
           </button>
           <button 
            onClick={() => startRound('BAHAR')}
            disabled={isDealing}
            className={`py-6 rounded-3xl border transition-all flex flex-col items-center gap-1 ${betSide === 'BAHAR' ? 'bg-[#d4af37] border-[#d4af37] text-black' : 'bg-white/5 border-white/10 text-white'}`}
           >
              <span className="text-xs font-black uppercase">BAHAR</span>
              <span className="text-[8px] font-bold opacity-60">2.0x Payout</span>
           </button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
           <button onClick={reset} disabled={isDealing} className="bg-white/5 text-white/40 py-4 rounded-2xl uppercase font-black text-[9px] tracking-widest border border-white/10">New Joker</button>
           <button onClick={() => onFinish(0, true)} className="bg-white/5 text-white/40 py-4 rounded-2xl uppercase font-black text-[9px] tracking-widest border border-white/10">Exit</button>
        </div>
      </div>
    </div>
  );
};

export default AndarBaharGame;