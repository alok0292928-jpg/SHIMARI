
import React, { useState, useEffect } from 'react';

interface HiLoGameProps {
  fee: number;
  walletBalance: number;
  userLuck: number;
  onFinish: (payout: number, shouldExit?: boolean) => void;
}

const CARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const CARD_VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

const HiLoGame: React.FC<HiLoGameProps> = ({ walletBalance, onFinish }) => {
  const [currentCard, setCurrentCard] = useState<string>('7');
  const [nextCard, setNextCard] = useState<string | null>(null);
  const [multiplier, setMultiplier] = useState(1.0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [betAmount, setBetAmount] = useState(10);
  const [isDealing, setIsDealing] = useState(false);
  const [lastAction, setLastAction] = useState<'HI' | 'LO' | null>(null);

  const getRandomCard = () => CARDS[Math.floor(Math.random() * CARDS.length)];

  useEffect(() => {
    setCurrentCard(getRandomCard());
  }, []);

  const calculateOdds = (type: 'HI' | 'LO') => {
    const curVal = CARD_VALUES[currentCard as keyof typeof CARD_VALUES];
    let higherCount = 0;
    let lowerCount = 0;
    CARDS.forEach(c => {
      const val = CARD_VALUES[c as keyof typeof CARD_VALUES];
      if (val > curVal) higherCount++;
      if (val < curVal) lowerCount++;
    });

    const total = CARDS.length;
    if (type === 'HI') return higherCount === 0 ? 0 : (total / higherCount) * 0.98;
    return lowerCount === 0 ? 0 : (total / lowerCount) * 0.98;
  };

  const handleGuess = (guess: 'HI' | 'LO') => {
    if (isDealing || walletBalance < betAmount) {
      if (walletBalance < betAmount) alert("Insufficient balance!");
      return;
    }
    
    setIsDealing(true);
    setLastAction(guess);
    onFinish(-betAmount, false); // Deduct stake

    setTimeout(() => {
      const next = getRandomCard();
      setNextCard(next);
      const nextVal = CARD_VALUES[next as keyof typeof CARD_VALUES];
      const curVal = CARD_VALUES[currentCard as keyof typeof CARD_VALUES];
      
      let won = false;
      if (guess === 'HI' && nextVal > curVal) won = true;
      if (guess === 'LO' && nextVal < curVal) won = true;

      if (won) {
        const odds = calculateOdds(guess);
        const payout = betAmount * odds;
        setTimeout(() => {
          onFinish(payout, false);
          setCurrentCard(next);
          setNextCard(null);
          setIsDealing(false);
        }, 800);
      } else {
        setIsGameOver(true);
        setTimeout(() => {
          setIsGameOver(false);
          setIsDealing(false);
          setNextCard(null);
          setCurrentCard(getRandomCard());
        }, 1500);
      }
    }, 800);
  };

  const adjustBet = (delta: number) => {
    if (isDealing) return;
    setBetAmount(prev => Math.max(10, prev + delta));
  };

  const hiOdds = calculateOdds('HI');
  const loOdds = calculateOdds('LO');

  return (
    <div className="fixed inset-0 bg-[#f39c12] bg-gradient-to-b from-[#f39c12] to-[#d35400] flex flex-col z-40 overflow-hidden font-inter">
      {/* Top Bar */}
      <div className="p-4 flex justify-between items-center bg-black/10 backdrop-blur-md">
        <button onClick={() => onFinish(0, true)} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-xl font-orbitron font-black text-white italic tracking-widest">HILO</h2>
        <div className="bg-black/40 rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/10">
           <span className="text-white font-black text-sm">₹{(walletBalance || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Game ID / Info */}
      <div className="px-6 py-2">
         <div className="bg-black/10 rounded-lg p-2 flex justify-between items-center">
            <span className="text-[10px] font-black text-white/60 uppercase">Game ID:</span>
            <span className="text-[10px] font-black text-white">#{(Date.now() % 1000000)}</span>
         </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 flex flex-col items-center justify-center gap-12 p-6">
        <div className="relative flex items-center gap-6">
           {/* Higher / Lower Indicators */}
           <div className="flex flex-col gap-4">
              <button 
                onClick={() => handleGuess('HI')}
                className={`w-12 h-12 rounded-lg bg-white/20 flex flex-col items-center justify-center border-2 transition-all ${hiOdds > 0 ? 'border-white/40' : 'opacity-20 border-transparent'}`}
              >
                 <span className="text-white font-black text-[10px]">A</span>
                 <span className="text-white text-lg leading-none">▲</span>
              </button>
              <button 
                onClick={() => handleGuess('LO')}
                className={`w-12 h-12 rounded-lg bg-white/20 flex flex-col items-center justify-center border-2 transition-all ${loOdds > 0 ? 'border-white/40' : 'opacity-20 border-transparent'}`}
              >
                 <span className="text-white text-lg leading-none">▼</span>
                 <span className="text-white font-black text-[10px]">2</span>
              </button>
           </div>

           {/* Cards Container */}
           <div className="flex gap-4">
              {/* Current Card */}
              <div className={`w-32 h-48 bg-white rounded-2xl shadow-2xl flex flex-col items-center justify-center transition-all ${isGameOver ? 'scale-95 opacity-50 grayscale' : ''}`}>
                 <span className={`text-6xl font-black ${['H', 'D'].includes(currentCard) ? 'text-red-500' : 'text-black'}`}>{currentCard}</span>
                 <span className="text-red-500 text-3xl">♥</span>
              </div>

              {/* Next Card Deck */}
              <div className="w-32 h-48 bg-blue-600 rounded-2xl border-4 border-white/40 shadow-2xl flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30"></div>
                 {nextCard ? (
                   <div className="absolute inset-0 bg-white flex flex-col items-center justify-center animate-in slide-in-from-right duration-300">
                      <span className="text-6xl font-black text-black">{nextCard}</span>
                      <span className="text-red-500 text-3xl">♥</span>
                   </div>
                 ) : (
                   <div className="w-20 h-28 border-2 border-white/20 rounded-xl" />
                 )}
              </div>
           </div>
        </div>

        {/* Multiplier / Profit Info */}
        <div className="text-center bg-black/20 p-4 rounded-3xl border border-white/10 w-full">
           <p className="text-[10px] font-black uppercase text-white/60 tracking-widest mb-1">Potential Payout</p>
           <p className="text-3xl font-orbitron font-black text-white">₹{(betAmount * (lastAction === 'HI' ? hiOdds : loOdds)).toFixed(2)}</p>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-black/20 p-6 space-y-4 shadow-2xl rounded-t-[3rem] border-t border-white/10 backdrop-blur-xl">
         <div className="flex items-center justify-center gap-6">
            <button onClick={() => adjustBet(-10)} className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white font-black text-xl bg-white/5 active:scale-90 transition-transform">−</button>
            <div className="flex-1 max-w-[200px] bg-white/10 rounded-2xl p-3 border border-white/20 flex flex-col items-center">
               <span className="text-[8px] font-black uppercase text-white/40 tracking-widest mb-1">Bet Amount</span>
               <div className="flex items-center gap-2">
                  <span className="text-white font-black">₹{betAmount}.00 INR</span>
               </div>
            </div>
            <button onClick={() => adjustBet(10)} className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white font-black text-xl bg-white/5 active:scale-90 transition-transform">+</button>
         </div>

         <div className="flex gap-4">
            <button 
              disabled={isDealing}
              onClick={() => handleGuess('LO')} 
              className="flex-1 bg-white/10 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] border border-white/10 active:scale-95 transition-all"
            >
              LOWER ({loOdds.toFixed(2)}x)
            </button>
            <button 
              disabled={isDealing}
              onClick={() => handleGuess('HI')} 
              className="flex-1 bg-green-500 text-black font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] shadow-[0_5px_20px_rgba(34,197,94,0.3)] active:scale-95 transition-all"
            >
              {isDealing ? 'WAITING...' : `BET HIGHER (${hiOdds.toFixed(2)}x)`}
            </button>
         </div>
      </div>
    </div>
  );
};

export default HiLoGame;
