
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db, ref, onValue, off, updateGlobalPool } from '../services/firebase';

interface CrowdBreakerProps {
  fee: number;
  walletBalance: number;
  userLuck: number;
  userPhone: string;
  onFinish: (payout: number, shouldExit?: boolean) => void;
}

const CHIPS = [10, 50, 100, 500, 1000, 5000];

const CrowdBreakerGame: React.FC<CrowdBreakerProps> = ({ walletBalance, onFinish }) => {
  const [status, setStatus] = useState<'BETTING' | 'RESULT'>('BETTING');
  const [roundId, setRoundId] = useState(0);
  const [timeToStart, setTimeToStart] = useState(30);
  const [history, setHistory] = useState<string[]>([]);
  const [winner, setWinner] = useState<'RED' | 'GREEN' | null>(null);
  const [globalPools, setGlobalPools] = useState({ RED: 0, GREEN: 0 });
  
  const [selectedChip, setSelectedChip] = useState(10);
  const [myBets, setMyBets] = useState({ RED: 0, GREEN: 0 });
  const [isPulling, setIsPulling] = useState(false);
  
  const processedRoundRef = useRef<number | null>(null);

  useEffect(() => {
    const stateRef = ref(db, 'crowdbreaker/state');
    const poolRef = ref(db, 'crowdbreaker/pools');

    const unsubState = onValue(stateRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      setRoundId(data.roundId);
      setHistory(data.history || []);
      if (data.status === 'BETTING') {
        setStatus('BETTING'); setIsPulling(false); setWinner(null);
        setTimeToStart(Math.max(0, Math.ceil((data.startTime - Date.now()) / 1000)));
      } else if (data.status === 'RESULT') {
        setStatus('RESULT'); setWinner(data.winner);
        setTimeout(() => setIsPulling(true), 500);
        if (processedRoundRef.current !== data.roundId) {
          processedRoundRef.current = data.roundId;
          handlePayout(data.winner);
        }
      }
    });

    const unsubPool = onValue(poolRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setGlobalPools(data);
    });

    return () => { off(stateRef); off(poolRef); };
  }, [myBets]);

  const handlePayout = (winSide: 'RED' | 'GREEN') => {
    let payout = 0;
    if (winSide === 'RED' && myBets.RED > 0) payout = myBets.RED * 2.0;
    if (winSide === 'GREEN' && myBets.GREEN > 0) payout = myBets.GREEN * 2.0;
    if (payout > 0) setTimeout(() => onFinish(payout, false), 4000);
    setTimeout(() => setMyBets({ RED: 0, GREEN: 0 }), 10000);
  };

  const placeBet = async (side: 'RED' | 'GREEN') => {
    if (status !== 'BETTING' || timeToStart <= 1 || walletBalance < selectedChip) return;
    setMyBets(prev => ({ ...prev, [side]: prev[side] + selectedChip }));
    onFinish(-selectedChip, false);
    await updateGlobalPool('crowdbreaker', side, selectedChip);
  };

  return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col z-40 overflow-hidden font-inter text-white">
      {/* Glassmorphic Header */}
      <div className="bg-[#111]/80 backdrop-blur-2xl p-4 flex justify-between items-center border-b border-white/5 shadow-2xl z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => onFinish(0, true)} className="p-2.5 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all">
             <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-xl font-orbitron font-black italic text-white leading-none">CROWD<span className="text-red-600">BREAKER</span></h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="px-1.5 py-0.5 bg-red-600/20 text-red-500 text-[8px] font-black uppercase rounded">MINORITY WINS</span>
            </div>
          </div>
        </div>
        <div className="bg-black/60 rounded-2xl px-5 py-2.5 flex items-center gap-3 border border-white/5">
           <div className="w-6 h-6 bg-[#f39c12] rounded-full flex items-center justify-center text-black font-black text-[10px]">₹</div>
           <span className="text-white font-black text-sm tracking-tight">{(walletBalance || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Arena Stage */}
      <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        
        {/* Tug of War Visual */}
        <div className="relative w-full max-w-lg h-96 flex items-center justify-between px-12 z-10">
           <div className={`flex flex-col items-center transition-all duration-[2000ms] ${isPulling && winner === 'GREEN' ? 'translate-x-[150px] opacity-0 scale-50' : ''}`}>
              <div className="w-20 h-28 bg-red-600/20 border-2 border-red-500 rounded-3xl flex items-center justify-center animate-pulse shadow-red-500/20 shadow-2xl">
                 <img src="https://cdn-icons-png.flaticon.com/512/3504/3504547.png" className="w-12 h-12" />
              </div>
              <p className="text-[10px] text-red-500 font-black uppercase mt-4 tracking-widest">Pool: ₹{globalPools.RED}</p>
           </div>

           <div className="flex-1 h-2 bg-white/5 mx-4 relative overflow-hidden rounded-full">
              <div className={`absolute top-0 bottom-0 w-8 bg-white border-2 border-black transition-all duration-[3000ms] ${isPulling && winner === 'RED' ? '-translate-x-[120px]' : isPulling && winner === 'GREEN' ? 'translate-x-[120px]' : 'left-1/2 -translate-x-1/2'}`}></div>
           </div>

           <div className={`flex flex-col items-center transition-all duration-[2000ms] ${isPulling && winner === 'RED' ? '-translate-x-[150px] opacity-0 scale-50' : ''}`}>
              <div className="w-20 h-28 bg-green-600/20 border-2 border-green-500 rounded-3xl flex items-center justify-center animate-pulse shadow-green-500/20 shadow-2xl">
                 <img src="https://cdn-icons-png.flaticon.com/512/3504/3504547.png" className="w-12 h-12" />
              </div>
              <p className="text-[10px] text-green-500 font-black uppercase mt-4 tracking-widest">Pool: ₹{globalPools.GREEN}</p>
           </div>
        </div>

        {/* Status HUD */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
           {status === 'BETTING' && (
              <div className="mt-[-300px] text-center">
                 <p className="text-6xl font-orbitron font-black text-white italic">{timeToStart}</p>
                 <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.4em] mt-2">Placing Stakes</p>
              </div>
           )}
           {status === 'RESULT' && (
              <div className="mt-[-250px] text-center animate-in zoom-in duration-500">
                 <h3 className={`text-6xl font-orbitron font-black italic uppercase ${winner === 'RED' ? 'text-red-500' : 'text-green-500'}`}>{winner} WINS</h3>
              </div>
           )}
        </div>
      </div>

      {/* Betting Panel */}
      <div className="bg-[#111] p-8 pb-14 space-y-6 rounded-t-[3.5rem] border-t border-white/5 shadow-2xl">
        <div className="grid grid-cols-2 gap-5">
           <button onClick={() => placeBet('RED')} className={`h-28 rounded-[2.5rem] border-2 flex flex-col items-center justify-center active:scale-95 ${myBets.RED > 0 ? 'bg-red-600 border-red-400' : 'bg-[#181818] border-white/5'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest mb-1">TEAM RED</span>
              <span className="text-3xl font-orbitron font-black italic">₹{myBets.RED}</span>
           </button>
           <button onClick={() => placeBet('GREEN')} className={`h-28 rounded-[2.5rem] border-2 flex flex-col items-center justify-center active:scale-95 ${myBets.GREEN > 0 ? 'bg-green-600 border-green-400' : 'bg-[#181818] border-white/5'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest mb-1">TEAM GREEN</span>
              <span className="text-3xl font-orbitron font-black italic">₹{myBets.GREEN}</span>
           </button>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
          {CHIPS.map(chip => (
            <button key={chip} onClick={() => setSelectedChip(chip)} className={`w-14 h-14 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all shrink-0 ${selectedChip === chip ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white/40'}`}>
              {chip >= 1000 ? (chip/1000)+'K' : chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CrowdBreakerGame;
