
import React, { useState, useEffect, useCallback } from 'react';

interface MinesGameProps {
  fee: number;
  walletBalance: number;
  mineCount: number;
  userLuck: number;
  onFinish: (payout: number, shouldExit?: boolean) => void;
  onRestart: (fee: number, mineCount: number) => void;
}

const MinesGame: React.FC<MinesGameProps> = ({ fee, walletBalance, userLuck, onFinish, onRestart }) => {
  const [phase, setPhase] = useState<'SETUP' | 'PLAYING'>('SETUP');
  const [selectedMines, setSelectedMines] = useState(3);
  const [selectedStake, setSelectedStake] = useState(fee || 10);
  
  const [grid, setGrid] = useState<('IDLE' | 'GOLD' | 'MINE')[]>(Array(25).fill('IDLE'));
  const [mines, setMines] = useState<number[]>([]);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [foundGoldCount, setFoundGoldCount] = useState(0);

  const initRound = useCallback((stake: number, mCount: number) => {
    const m: number[] = [];
    while (m.length < mCount) {
      const r = Math.floor(Math.random() * 25);
      if (!m.includes(r)) m.push(r);
    }
    setMines(m);
    setGrid(Array(25).fill('IDLE'));
    setCurrentMultiplier(1.0);
    setIsGameOver(false);
    setIsFinished(false);
    setFoundGoldCount(0);
    setPhase('PLAYING');
    onFinish(-stake, false);
  }, [onFinish]);

  const handleStart = () => {
    if (walletBalance < selectedStake) {
      alert("Insufficient Balance!");
      return;
    }
    initRound(selectedStake, selectedMines);
  };

  const calculateNextMultiplier = (found: number) => {
    const totalTiles = 25;
    const remainingTiles = totalTiles - found;
    const probability = (remainingTiles - selectedMines) / remainingTiles;
    // Multiplier reflects the actual mathematical difficulty
    return (1 / (probability || 0.1)) * 0.95; 
  };

  const handleTileClick = (index: number) => {
    if (isGameOver || isFinished || grid[index] !== 'IDLE') return;

    // --- Server-Side Style Luck Logic ---
    const roll = Math.random();
    const isMine = mines.includes(index);
    
    // If luck is low (0.1), any move has a high chance to be forced into a MINE.
    // If luck is high (2.0), there's a safety buffer.
    let finalOutcomeIsMine = isMine;
    
    // Anti-User Rigging: If luck is very low, force a loss based on a high threshold
    if (userLuck <= 0.5 && roll > userLuck) {
       finalOutcomeIsMine = true;
    }
    // Pro-User Rigging: If luck is high, occasionally save them from a hit
    if (userLuck >= 1.5 && isMine && roll < 0.4) {
       finalOutcomeIsMine = false;
    }

    if (finalOutcomeIsMine) {
      const newGrid = [...grid];
      mines.forEach(m => newGrid[m] = 'MINE');
      newGrid[index] = 'MINE'; // Ensure current click shows as mine
      setGrid(newGrid);
      setIsGameOver(true);
      setIsFinished(true);
      onFinish(0, false); 
    } else {
      const newGrid = [...grid];
      newGrid[index] = 'GOLD';
      setGrid(newGrid);
      
      const nextGoldCount = foundGoldCount + 1;
      setFoundGoldCount(nextGoldCount);
      
      const stepMult = calculateNextMultiplier(foundGoldCount);
      setCurrentMultiplier(prevMult => prevMult * stepMult);
    }
  };

  const handleCashOut = () => {
    if (foundGoldCount === 0 || isGameOver || isFinished) return;
    setIsFinished(true);
    const payout = selectedStake * currentMultiplier;
    onFinish(payout, false);
  };

  if (phase === 'SETUP') {
    return (
      <div className="fixed inset-0 bg-[#0a0e17] flex flex-col items-center justify-center p-6 z-40">
        <div className="w-full max-w-sm bg-[#161d2b] border border-white/5 p-8 rounded-[3rem] shadow-2xl space-y-8 animate-in zoom-in duration-300">
           <div className="text-center space-y-2">
              <h2 className="text-3xl font-orbitron font-black text-white italic">MINES <span className="text-[#f39c12]">PRO</span></h2>
              <p className="text-[10px] text-white/30 uppercase font-black tracking-widest italic">Configure your session</p>
           </div>
           <div className="space-y-4">
              <div className="flex justify-between items-end px-1">
                 <label className="text-[10px] font-black text-white/40 uppercase tracking-widest italic">Mines Count</label>
                 <span className="text-xl font-orbitron font-black text-[#f39c12]">{selectedMines}</span>
              </div>
              <input type="range" min="1" max="24" value={selectedMines} onChange={(e) => setSelectedMines(parseInt(e.target.value))} className="w-full accent-[#f39c12] h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer" />
              <div className="grid grid-cols-4 gap-2">
                {[1, 3, 5, 13, 24].map(m => (
                  <button key={m} onClick={() => setSelectedMines(m)} className={`py-2 rounded-xl text-[10px] font-black border transition-all ${selectedMines === m ? 'bg-[#f39c12] border-[#f39c12] text-black' : 'bg-white/5 border-white/10 text-white/40'}`}>{m}</button>
                ))}
              </div>
           </div>
           <div className="space-y-4">
              <div className="flex justify-between items-end px-1">
                 <label className="text-[10px] font-black text-white/40 uppercase tracking-widest italic">Stake Amount</label>
                 <span className="text-xl font-orbitron font-black text-[#f39c12]">₹{selectedStake}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[10, 50, 100, 500, 1000, 5000].map(s => (
                  <button key={s} onClick={() => setSelectedStake(s)} className={`py-3 rounded-xl text-[10px] font-black border transition-all ${selectedStake === s ? 'bg-[#f39c12] border-[#f39c12] text-black' : 'bg-white/5 border-white/10 text-white/40'}`}>₹{s}</button>
                ))}
              </div>
           </div>
           <div className="flex gap-3">
              <button onClick={() => onFinish(0, true)} className="flex-1 bg-white/5 border border-white/10 text-white/40 font-black py-5 rounded-2xl uppercase tracking-widest text-[10px] active:scale-95 transition-all">Exit</button>
              <button onClick={handleStart} className="flex-[2] bg-[#f39c12] text-black font-orbitron font-black py-5 rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-[#f39c12]/20 active:scale-95 transition-all">Start Hunt</button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0a0e17] flex flex-col items-center justify-center p-6 z-40 overflow-hidden">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-between items-start">
           <div>
             <h2 className="text-2xl font-orbitron font-black text-white italic">MINES<span className="text-[#f39c12]"> PRO</span></h2>
             <div className="flex items-center gap-2 mt-1">
                <span className="text-[8px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{selectedMines} BOMBS</span>
                <span className="text-[8px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">₹{selectedStake} STAKE</span>
             </div>
           </div>
           <div className="flex flex-col items-end gap-1">
             <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-lg backdrop-blur-md">
                <span className="text-[#f39c12] font-black text-[10px]">₹</span>
                <span className="text-white font-black text-xs font-orbitron">{(walletBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
             </div>
             <div className="text-right mt-1">
               <p className="text-4xl font-orbitron font-black text-[#f39c12] leading-none drop-shadow-[0_0_15px_rgba(243,156,18,0.3)]">{currentMultiplier.toFixed(2)}x</p>
               <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">Multiplier</p>
             </div>
           </div>
        </div>
        <div className="grid grid-cols-5 gap-2 bg-[#161d2b] p-4 rounded-[2.5rem] border border-white/5 shadow-2xl relative">
          {grid.map((tile, i) => (
            <button key={i} onClick={() => handleTileClick(i)} className={`aspect-square rounded-2xl border transition-all flex items-center justify-center text-xl shadow-lg relative overflow-hidden group ${
                tile === 'IDLE' ? 'bg-[#1c2636] border-white/5 active:scale-90 hover:bg-[#253247]' :
                tile === 'GOLD' ? 'bg-green-500/20 border-green-500/40 text-green-400 animate-in zoom-in-50 duration-300' :
                'bg-red-500 border-red-400 text-white'
              }`}>
              {tile === 'IDLE' && <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-20" />}
              {tile === 'GOLD' && '💎'}
              {tile === 'MINE' && '💣'}
            </button>
          ))}
          {isGameOver && <div className="absolute inset-0 z-10 bg-red-900/10 pointer-events-none rounded-[2.5rem]" />}
        </div>
        <div className="space-y-4 pt-2">
          {isFinished ? (
            <div className="space-y-3 animate-in fade-in duration-500">
               <div className={`p-5 rounded-2xl text-center border-2 ${isGameOver ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                  <p className="font-orbitron font-black text-xs uppercase tracking-widest italic">
                    {isGameOver ? 'BOMB DETONATED!' : `LOOT SECURED: ₹${(selectedStake * currentMultiplier).toFixed(2)}`}
                  </p>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setPhase('SETUP')} className="bg-[#f39c12] text-black font-orbitron font-black py-5 rounded-2xl uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all">New Setup</button>
                  <button onClick={() => onFinish(0, true)} className="bg-white/5 border border-white/10 text-white font-orbitron font-black py-5 rounded-2xl uppercase tracking-widest text-[10px] active:scale-95 transition-all">Exit</button>
               </div>
            </div>
          ) : (
            <button onClick={handleCashOut} disabled={foundGoldCount === 0 || isGameOver} className="w-full bg-[#f39c12] text-black font-orbitron font-black py-6 rounded-[2.5rem] shadow-[0_15px_40px_rgba(243,156,18,0.2)] disabled:opacity-30 active:scale-95 transition-all text-sm uppercase tracking-[0.2em]">
              {foundGoldCount === 0 ? 'READY TO HUNT' : `CASH OUT • ₹${(selectedStake * currentMultiplier).toFixed(2)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MinesGame;
