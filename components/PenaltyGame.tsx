
import React, { useState } from 'react';

interface PenaltyGameProps {
  fee: number;
  walletBalance: number;
  userLuck: number;
  onFinish: (earnings: number, shouldExit?: boolean) => void;
}

const PenaltyGame: React.FC<PenaltyGameProps> = ({ fee, walletBalance, userLuck, onFinish }) => {
  const [selectedSpot, setSelectedSpot] = useState<number | null>(null);
  const [goalieSpot, setGoalieSpot] = useState<number | null>(null);
  const [isKicking, setIsKicking] = useState(false);
  const [status, setStatus] = useState<string>('Pick a spot to shoot!');

  const handleShoot = (spot: number) => {
    if (isKicking) return;
    setIsKicking(true);
    setSelectedSpot(spot);
    setGoalieSpot(null);
    setStatus('Ready... Shoot!');

    setTimeout(() => {
      const goalie = Math.floor(Math.random() * 5);
      setGoalieSpot(goalie);
      
      const scored = spot !== goalie;
      setIsKicking(false);

      if (scored) {
        setStatus('GOAL!!! YOU WON');
        onFinish(fee * 1.5 - fee, false); // Lower multiplier because 4/5 chance
      } else {
        setStatus('SAVED! KEEPER BLOCKED');
        onFinish(-fee, false);
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0e17] flex flex-col items-center justify-center p-6 z-40">
      <div className="w-full max-w-sm space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-orbitron font-black text-white italic">PENALTY<span className="text-green-500"> PRO</span></h2>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Score = 1.5x Pay</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-lg backdrop-blur-md">
            <span className="text-[#d4af37] font-black text-[10px]">₹</span>
            <span className="text-white font-black text-xs font-orbitron">{(walletBalance || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="relative aspect-[4/3] bg-gradient-to-b from-blue-900/20 to-green-900/40 rounded-[2rem] border-4 border-white/5 overflow-hidden flex flex-col justify-end p-4">
           {/* Goal Post */}
           <div className="absolute top-10 left-8 right-8 bottom-4 border-t-8 border-x-8 border-white/20 rounded-t-xl" />
           
           {/* Spots */}
           <div className="grid grid-cols-3 gap-2 h-40 relative z-10 mb-8 px-4">
              {[0, 1, 2, 3, 4].map((i) => (
                 <button
                    key={i}
                    onClick={() => handleShoot(i)}
                    disabled={isKicking}
                    className={`rounded-full border-2 transition-all flex items-center justify-center ${selectedSpot === i && isKicking ? 'scale-110 border-green-400 bg-green-400/20' : 'border-white/10 bg-white/5 hover:border-white/30'} ${i === 4 ? 'col-span-3 h-10 w-24 mx-auto' : 'aspect-square'}`}
                 >
                    {goalieSpot === i && <span className="text-2xl">🧤</span>}
                    {selectedSpot === i && !isKicking && goalieSpot !== i && <span className="text-2xl">⚽</span>}
                 </button>
              ))}
           </div>
           
           <div className="text-center">
              <p className={`text-xs font-black uppercase tracking-widest ${status.includes('GOAL') ? 'text-green-400' : status.includes('SAVED') ? 'text-red-500' : 'text-white/40'}`}>
                {status}
              </p>
           </div>
        </div>

        <button 
          onClick={() => onFinish(0, true)}
          className="w-full bg-white/5 border border-white/10 text-white/30 font-orbitron font-black py-4 rounded-2xl uppercase tracking-widest text-[9px] active:scale-95 transition-all"
        >
          Exit Stadium
        </button>
      </div>
    </div>
  );
};

export default PenaltyGame;
