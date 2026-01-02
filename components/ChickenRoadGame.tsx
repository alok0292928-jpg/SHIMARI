
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { adjustUserBalance } from '../services/firebase';

interface ChickenRoadProps {
  userPhone: string;
  userBalance: number;
  onFinish: (payout: number, shouldExit?: boolean) => void;
  userLuck: number;
}

type Difficulty = 'Easy' | 'Medium' | 'Hard';

const ChickenRoadGame: React.FC<ChickenRoadProps> = ({ userPhone, userBalance, onFinish, userLuck }) => {
  const [stake, setStake] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [status, setStatus] = useState<'BETTING' | 'PLAYING' | 'CRASHED' | 'FINISHED'>('BETTING');
  const [currentStep, setCurrentStep] = useState(0);
  const [multiplier, setMultiplier] = useState(1.0);
  const [isJumping, setIsJumping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const difficultyConfig = {
    'Easy': { winRate: 0.90, growth: 1.05 },
    'Medium': { winRate: 0.75, growth: 1.25 },
    'Hard': { winRate: 0.45, growth: 2.20 },
  };

  const nextMultiplier = useMemo(() => {
    const config = difficultyConfig[difficulty];
    return parseFloat(Math.pow(config.growth, currentStep + 1).toFixed(2));
  }, [currentStep, difficulty]);

  const handlePlay = async () => {
    if (status === 'BETTING') {
      if (userBalance < stake) {
        alert("Insufficient Balance!");
        return;
      }
      await adjustUserBalance(userPhone, -stake);
      setStatus('PLAYING');
      setCurrentStep(0);
      setMultiplier(1.0);
    } else if (status === 'PLAYING') {
      // Step Forward
      setIsJumping(true);
      
      setTimeout(() => {
        const config = difficultyConfig[difficulty];
        const luckBoost = (userLuck - 1.0) * 0.1;
        const winChance = config.winRate + luckBoost;
        const roll = Math.random();

        if (roll < winChance) {
          const newStep = currentStep + 1;
          setCurrentStep(newStep);
          setMultiplier(parseFloat(Math.pow(config.growth, newStep).toFixed(2)));
          setIsJumping(false);
          // Scroll up
          if (scrollRef.current) {
            scrollRef.current.scrollTop -= 120;
          }
        } else {
          setStatus('CRASHED');
          setIsJumping(false);
        }
      }, 500);
    }
  };

  const handleCashout = async () => {
    if (status !== 'PLAYING' || currentStep === 0) return;
    const win = stake * multiplier;
    await adjustUserBalance(userPhone, win);
    setStatus('FINISHED');
    onFinish(win, false);
  };

  const resetGame = () => {
    setStatus('BETTING');
    setCurrentStep(0);
    setMultiplier(1.0);
  };

  return (
    <div className="fixed inset-0 bg-[#3a3a3a] flex flex-col z-50 text-white overflow-hidden select-none font-inter">
      {/* Header */}
      <div className="bg-[#1b1c1d] px-4 py-3 flex justify-between items-center border-b border-white/5 shadow-xl">
        <div className="flex items-center gap-2">
           <button onClick={() => onFinish(0, true)} className="p-2 bg-white/5 rounded-xl border border-white/10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
           </button>
           <h2 className="text-xl font-black italic tracking-tighter">CHICKEN <span className="text-red-500">2</span> ROAD</h2>
        </div>
        <div className="bg-black/60 rounded-2xl px-4 py-1.5 flex flex-col items-end border border-white/5">
           <span className="text-[7px] text-white/30 font-black uppercase tracking-widest">Balance</span>
           <span className="text-sm font-black text-white">₹{userBalance.toLocaleString()}</span>
        </div>
      </div>

      {/* Game Stage (The Road) */}
      <div className="flex-1 relative overflow-hidden bg-[#5a5a5a]">
        {/* Scrolling Road Container */}
        <div 
          ref={scrollRef}
          className="absolute inset-0 overflow-y-auto no-scrollbar pt-[200px] pb-[500px] transition-all duration-700"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="flex flex-col items-center gap-[60px] relative">
             {/* Road Markings / Manhole Covers */}
             {Array.from({ length: 50 }).map((_, i) => {
               const stepIndex = 50 - i;
               const isActive = stepIndex === currentStep + 1;
               const isPassed = stepIndex <= currentStep;
               
               return (
                 <div key={i} className="relative w-full flex justify-center">
                    {/* Road Paint */}
                    <div className="absolute w-2 h-16 bg-white/20 -top-8 left-1/2 -translate-x-1/2 rounded-full" />
                    
                    {/* Step Manhole */}
                    <div className={`relative w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-500 ${
                      isActive ? 'border-yellow-400 bg-yellow-400/20 scale-110 shadow-[0_0_20px_rgba(250,204,21,0.4)]' : 
                      isPassed ? 'border-green-500 bg-green-500/10' : 'border-black/40 bg-black/20'
                    }`}>
                      <div className="absolute inset-0 rounded-full border border-black/20 m-2" />
                      <span className={`text-xl font-black italic ${isActive ? 'text-yellow-400' : 'text-white/20'}`}>
                        {parseFloat(Math.pow(difficultyConfig[difficulty].growth, stepIndex).toFixed(2))}x
                      </span>
                    </div>
                 </div>
               );
             })}

             {/* The Chicken Character */}
             <div 
                className={`absolute left-1/2 -translate-x-1/2 transition-all duration-500 z-10 ${isJumping ? 'animate-bounce' : ''} ${status === 'CRASHED' ? 'rotate-90 grayscale opacity-50' : ''}`}
                style={{ 
                  bottom: `${currentStep * 148 + 40}px`
                }}
             >
                <div className="w-16 h-16 bg-white rounded-full flex flex-col items-center justify-center border-4 border-black/10 relative shadow-2xl">
                   <div className="flex gap-2 mb-1">
                      <div className="w-2 h-2 bg-black rounded-full" />
                      <div className="w-2 h-2 bg-black rounded-full" />
                   </div>
                   <div className="w-4 h-3 bg-red-500 rounded-full mb-1" />
                   <div className="absolute -top-3 w-6 h-4 bg-red-600 rounded-t-full" />
                </div>
                {status === 'CRASHED' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-red-600/50 rounded-full animate-ping" />
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* HUD Info */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none z-20">
           {status === 'PLAYING' && (
             <div className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 text-center animate-in zoom-in">
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Current Profit</p>
                <p className="text-3xl font-black text-yellow-400 italic">₹{(stake * multiplier).toFixed(2)}</p>
             </div>
           )}
           {status === 'CRASHED' && (
             <div className="bg-red-600 px-8 py-3 rounded-full border-4 border-white shadow-2xl animate-in zoom-in">
                <p className="text-xl font-black italic uppercase tracking-tighter">FLEW AWAY!</p>
             </div>
           )}
        </div>
      </div>

      {/* Betting Panel (Big Mumbai Style) */}
      <div className="bg-[#2b2b2b] p-6 pb-10 space-y-6 rounded-t-[3rem] border-t border-white/5 shadow-2xl relative z-30">
        <div className="flex justify-between items-center mb-2 px-1">
           <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">Bet ID:</span>
              <div className="bg-black/40 px-3 py-1 rounded-lg text-[10px] font-mono text-white/60">#{(Date.now() % 1000000)}</div>
           </div>
           <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>
           </div>
        </div>

        <div className="flex gap-3">
           {/* Stake Input */}
           <div className="flex-[2] space-y-2">
              <div className="flex items-center justify-between bg-black/40 rounded-2xl border border-white/10 p-4">
                 <button onClick={() => setStake(prev => Math.max(1, prev - 10))} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 font-black text-xl active:scale-90">−</button>
                 <div className="text-center">
                    <p className="text-[8px] text-white/20 font-black uppercase">Stake Amount</p>
                    <span className="text-lg font-black italic">₹{stake.toFixed(2)}</span>
                 </div>
                 <button onClick={() => setStake(prev => prev + 10)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 font-black text-xl active:scale-90">+</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                 <button onClick={() => setStake(prev => prev / 2)} className="bg-white/5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 text-white/40 active:scale-95">x0.5</button>
                 <button onClick={() => setStake(prev => prev * 2)} className="bg-white/5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 text-white/40 active:scale-95">x2.0</button>
              </div>
           </div>

           {/* Difficulty Selector */}
           <div className="flex-1 flex flex-col gap-2">
              <select 
                value={difficulty} 
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="h-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-black uppercase tracking-widest text-yellow-400 outline-none appearance-none text-center"
              >
                 <option value="Easy">Easy</option>
                 <option value="Medium">Medium</option>
                 <option value="Hard">Hard</option>
              </select>
           </div>
        </div>

        <div className="flex gap-3">
           {status === 'PLAYING' && currentStep > 0 && (
              <button 
                onClick={handleCashout}
                className="flex-1 bg-yellow-500 text-black font-black py-5 rounded-[2.5rem] shadow-xl shadow-yellow-500/20 active:scale-95 transition-all text-sm uppercase tracking-widest"
              >
                Cash Out
              </button>
           )}
           
           <button 
            onClick={status === 'CRASHED' || status === 'FINISHED' ? resetGame : handlePlay}
            disabled={isJumping}
            className={`flex-[2] ${status === 'CRASHED' || status === 'FINISHED' ? 'bg-white/10 text-white' : 'bg-green-600 text-white'} font-black py-5 rounded-[2.5rem] shadow-xl active:scale-95 transition-all text-sm uppercase tracking-widest`}
           >
            {status === 'BETTING' ? 'Play Now' : 
             status === 'PLAYING' ? `Step to ${nextMultiplier}x` : 
             status === 'CRASHED' ? 'Try Again' : 'New Bet'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default ChickenRoadGame;
