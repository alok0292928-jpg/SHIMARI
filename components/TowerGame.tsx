
import React, { useState, useEffect, useCallback } from 'react';

interface TowerGameProps {
  fee: number;
  walletBalance: number;
  userLuck: number;
  onFinish: (earnings: number, shouldExit?: boolean) => void;
  onRestart: (fee: number) => void;
}

const ROWS = 9;
const TILES_PER_ROW = 4;

const TowerGame: React.FC<TowerGameProps> = ({ fee, walletBalance, userLuck, onFinish, onRestart }) => {
  const [currentRow, setCurrentRow] = useState(0);
  const [grid, setGrid] = useState<number[][]>([]);
  const [selectedInRows, setSelectedInRows] = useState<(number | null)[]>(Array(ROWS).fill(null));
  const [isGameOver, setIsGameOver] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [multiplier, setMultiplier] = useState(1.0);

  const rowMultipliers = [1.32, 1.78, 2.45, 3.56, 5.12, 8.44, 12.80, 24.50, 52.00];

  const initRound = useCallback(() => {
    const newGrid: number[][] = [];
    for (let i = 0; i < ROWS; i++) {
      const bombIndex = Math.floor(Math.random() * TILES_PER_ROW);
      newGrid.push([bombIndex]);
    }
    setGrid(newGrid);
    setCurrentRow(0);
    setSelectedInRows(Array(ROWS).fill(null));
    setIsGameOver(false);
    setIsFinished(false);
    setMultiplier(1.0);
  }, []);

  useEffect(() => {
    initRound();
  }, [initRound]);

  const handleRestartClick = () => {
    if (walletBalance < fee) {
      alert("Insufficient Balance for new round!");
      return;
    }
    onRestart(fee);
  };

  const handleTileClick = (rowIndex: number, tileIndex: number) => {
    if (isGameOver || isFinished || rowIndex !== currentRow || selectedInRows[rowIndex] !== null) return;

    const newSelections = [...selectedInRows];
    newSelections[rowIndex] = tileIndex;
    setSelectedInRows(newSelections);

    const isBomb = grid[rowIndex].includes(tileIndex);

    if (isBomb) {
      setIsGameOver(true);
      setIsFinished(true);
      onFinish(0, false); // Just end with 0 payout
    } else {
      setMultiplier(rowMultipliers[rowIndex]);
      if (rowIndex === ROWS - 1) {
        setIsFinished(true);
        onFinish((fee || 0) * rowMultipliers[rowIndex], false);
      } else {
        setCurrentRow(prev => prev + 1);
      }
    }
  };

  const handleCashOut = () => {
    if (currentRow === 0 || isGameOver || isFinished) return;
    setIsFinished(true);
    onFinish((fee || 0) * multiplier, false);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0e17] flex flex-col items-center justify-center p-4 z-40 overflow-hidden">
      <div className="w-full max-w-sm flex flex-col h-full py-10">
        <div className="flex justify-between items-start mb-4">
           <div>
             <h2 className="text-xl font-orbitron font-black text-white italic">TOWER<span className="text-[#f39c12]"> QUEST</span></h2>
             <p className="text-[8px] text-white/40 uppercase tracking-widest font-black">Climb the steps</p>
           </div>
           <div className="flex flex-col items-end gap-1">
             <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-lg backdrop-blur-md">
                <span className="text-[#f39c12] font-black text-[10px]">₹</span>
                <span className="text-white font-black text-xs font-orbitron">{(walletBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
             </div>
             <div className="text-right mt-1">
               <p className="text-3xl font-orbitron font-black text-[#f39c12] leading-none">{multiplier.toFixed(2)}x</p>
               <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Multiplier</p>
             </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 px-2 flex flex-col-reverse">
          {Array.from({ length: ROWS }).map((_, rIndex) => (
            <div 
              key={rIndex} 
              className={`flex gap-2 p-2 rounded-2xl border transition-all ${
                rIndex === currentRow ? 'bg-[#f39c12]/5 border-[#f39c12]/40 shadow-[0_0_20px_rgba(243,156,18,0.1)]' : 
                rIndex < currentRow ? 'bg-green-500/5 border-green-500/10 opacity-50' : 'bg-black/40 border-white/5 opacity-20'
              }`}
            >
               <div className="w-6 text-[8px] font-black text-white/20 flex items-center justify-center">{rowMultipliers[rIndex]}x</div>
               <div className="flex-1 grid grid-cols-4 gap-2">
                 {Array.from({ length: TILES_PER_ROW }).map((_, tIndex) => {
                   const isSelected = selectedInRows[rIndex] === tIndex;
                   const isBomb = grid[rIndex]?.includes(tIndex);
                   const showBomb = isFinished && isBomb;

                   return (
                     <button
                        key={tIndex}
                        onClick={() => handleTileClick(rIndex, tIndex)}
                        className={`aspect-square rounded-xl border transition-all flex items-center justify-center text-sm ${
                          isSelected && isBomb ? 'bg-red-500 border-red-400' :
                          isSelected && !isBomb ? 'bg-green-500 border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]' :
                          showBomb ? 'bg-red-500/20 border-red-500/40 text-red-500 opacity-100' :
                          rIndex === currentRow ? 'bg-[#1c2636] border-white/10 hover:bg-[#253247]' : 'bg-black/20 border-white/5'
                        }`}
                     >
                        {isSelected && !isBomb && '💎'}
                        {(isSelected && isBomb) || showBomb ? '💣' : ''}
                     </button>
                   );
                 })}
               </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {isFinished ? (
            <div className="space-y-3 animate-in slide-in-from-bottom duration-400">
               <div className={`p-5 rounded-2xl text-center border-2 ${isGameOver ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                  <p className="font-orbitron font-black text-xs uppercase tracking-widest italic leading-tight">
                    {isGameOver ? 'BOMB DETONATED! GAME OVER' : `VICTORY! ₹${((fee || 0) * multiplier).toFixed(2)} SECURED`}
                  </p>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleRestartClick} className="bg-[#f39c12] text-black font-orbitron font-black py-5 rounded-xl uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all">Replay</button>
                  <button onClick={() => onFinish(0, true)} className="bg-white/5 border border-white/10 text-white font-orbitron font-black py-5 rounded-xl uppercase tracking-widest text-[10px] active:scale-95 transition-all">Exit</button>
               </div>
            </div>
          ) : (
            <button 
              onClick={handleCashOut}
              disabled={currentRow === 0 || isGameOver}
              className="w-full bg-[#f39c12] text-black font-orbitron font-black py-5 rounded-2xl shadow-xl disabled:opacity-20 transition-all text-xs tracking-widest uppercase"
            >
              CASH OUT ₹{((fee || 0) * multiplier).toFixed(2)}
            </button>
          )}
          <p className="text-[8px] text-white/20 text-center font-black uppercase tracking-widest italic">Climb higher for legendary loot</p>
        </div>
      </div>
    </div>
  );
};

export default TowerGame;
