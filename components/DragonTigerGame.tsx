
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db, ref, onValue, off, updateGlobalPool } from '../services/firebase';

interface DragonTigerGameProps {
  fee: number;
  walletBalance: number;
  userLuck: number;
  userPhone: string;
  onFinish: (payout: number, shouldExit?: boolean) => void;
}

const CARD_VALS: any = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
const CHIPS = [10, 50, 100, 500, 1000, 5000];

const DragonTigerGame: React.FC<DragonTigerGameProps> = ({ walletBalance, onFinish }) => {
  const [status, setStatus] = useState<'WAITING' | 'RESULT'>('WAITING');
  const [timeToStart, setTimeToStart] = useState(15);
  const [roundId, setRoundId] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [dragonCard, setDragonCard] = useState<string | null>(null);
  const [tigerCard, setTigerCard] = useState<string | null>(null);
  const [globalPools, setGlobalPools] = useState({ DRAGON: 0, TIGER: 0, TIE: 0 });
  
  const [selectedChip, setSelectedChip] = useState(10);
  const [myBets, setMyBets] = useState({ DRAGON: 0, TIGER: 0, TIE: 0 });
  
  const processedRoundRef = useRef<number | null>(null);

  useEffect(() => {
    const stateRef = ref(db, 'dragontiger/state');
    const poolRef = ref(db, 'dragontiger/pools');
    
    const unsubState = onValue(stateRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      setRoundId(data.roundId);
      setHistory(data.history || []);
      if (data.status === 'WAITING') {
        setStatus('WAITING');
        setTimeToStart(Math.max(0, Math.ceil((data.startTime - Date.now()) / 1000)));
        setDragonCard(null); setTigerCard(null);
      } else if (data.status === 'RESULT') {
        setStatus('RESULT');
        setDragonCard(data.dragonCard); setTigerCard(data.tigerCard);
        if (processedRoundRef.current !== data.roundId) {
          processedRoundRef.current = data.roundId;
          handleRoundPayout(data.winner, data.roundId);
        }
      }
    });

    const unsubPool = onValue(poolRef, (snapshot) => {
       const data = snapshot.val();
       if (data) setGlobalPools(data);
    });

    return () => { off(stateRef); off(poolRef); };
  }, [myBets]);

  const handleRoundPayout = (winner: string, rid: number) => {
    let payout = 0;
    if (winner === 'D' && myBets.DRAGON > 0) payout = myBets.DRAGON * 1.9;
    else if (winner === 'T' && myBets.TIGER > 0) payout = myBets.TIGER * 1.9;
    else if (winner === 'Tie' && myBets.TIE > 0) payout = myBets.TIE * 9;
    
    if (payout > 0) onFinish(payout, false);
    setTimeout(() => setMyBets({ DRAGON: 0, TIGER: 0, TIE: 0 }), 6000);
  };

  const placeBet = async (side: 'DRAGON' | 'TIGER' | 'TIE') => {
    if (status !== 'WAITING' || timeToStart <= 1 || walletBalance < selectedChip) return;
    setMyBets(prev => ({ ...prev, [side]: prev[side] + selectedChip }));
    onFinish(-selectedChip, false);
    await updateGlobalPool('dragontiger', side, selectedChip);
  };

  const totalMyBet = useMemo(() => myBets.DRAGON + myBets.TIGER + myBets.TIE, [myBets]);

  return (
    <div className="fixed inset-0 bg-[#0c0d1b] flex flex-col z-40 overflow-hidden font-inter text-white">
      {/* High-End Header */}
      <div className="bg-[#1a1c2e]/80 backdrop-blur-2xl p-4 flex justify-between items-center border-b border-white/5 shadow-2xl z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => onFinish(0, true)} className="p-2.5 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all">
             <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-xl font-orbitron font-black italic tracking-tighter leading-none">DRAGON<span className="text-red-500">TIGER</span></h2>
            <p className="text-[8px] text-white/30 font-black tracking-widest uppercase mt-1">Global Round #{roundId}</p>
          </div>
        </div>
        <div className="bg-black/60 rounded-3xl px-5 py-2.5 flex items-center gap-3 border border-white/5 shadow-inner">
           <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-black font-black text-[10px]">₹</div>
           <span className="text-white font-black text-sm tracking-tight">{(walletBalance || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* History Ribbon */}
      <div className="bg-[#080915] py-2.5 px-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-white/5">
        {history.map((h, i) => (
          <div key={i} className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0 shadow-lg border border-white/5 animate-in slide-in-from-right duration-300 ${
            h === 'D' ? 'bg-blue-600' : h === 'T' ? 'bg-red-600' : 'bg-green-600'
          }`}>
            {h[0]}
          </div>
        ))}
      </div>

      {/* Battleground */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a1c2e] via-[#0c0d1b] to-black">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

        {status === 'WAITING' && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 text-center">
             <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                   <circle cx="56" cy="56" r="52" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.05" />
                   <circle cx="56" cy="56" r="52" fill="none" stroke="#f39c12" strokeWidth="6" strokeDasharray="327" strokeDashoffset={327 - (327 * timeToStart) / 15} className="transition-all duration-1000 ease-linear" />
                </svg>
                <span className={`text-5xl font-orbitron font-black ${timeToStart <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeToStart}</span>
             </div>
             <p className="text-[10px] text-yellow-500 font-black uppercase tracking-[0.4em] mt-4 italic animate-pulse">Betting Open</p>
          </div>
        )}

        <div className={`flex justify-between items-center w-full max-w-md gap-10 transition-all duration-700 ${status === 'WAITING' ? 'opacity-20 blur-md scale-90' : 'opacity-100'}`}>
           <div className="flex-1 flex flex-col items-center gap-4">
              <div className={`w-full aspect-[2/3] max-h-48 rounded-3xl border-[3px] flex items-center justify-center bg-[#1a1c2e] shadow-2xl transition-all duration-500 ${dragonCard && CARD_VALS[dragonCard] > (tigerCard ? CARD_VALS[tigerCard] : 0) ? 'border-blue-500 scale-110 shadow-blue-500/40' : 'border-white/10'}`}>
                 <span className="text-7xl font-orbitron font-black text-white">{dragonCard || '?'}</span>
              </div>
              <span className="text-blue-500 font-black text-xs uppercase tracking-[0.3em]">Dragon</span>
           </div>
           <div className="text-5xl font-black text-white/5 italic font-orbitron -rotate-12">VS</div>
           <div className="flex-1 flex flex-col items-center gap-4">
              <div className={`w-full aspect-[2/3] max-h-48 rounded-3xl border-[3px] flex items-center justify-center bg-[#1a1c2e] shadow-2xl transition-all duration-500 ${tigerCard && CARD_VALS[tigerCard] > (dragonCard ? CARD_VALS[dragonCard] : 0) ? 'border-red-500 scale-110 shadow-red-500/40' : 'border-white/10'}`}>
                 <span className="text-7xl font-orbitron font-black text-white">{tigerCard || '?'}</span>
              </div>
              <span className="text-red-500 font-black text-xs uppercase tracking-[0.3em]">Tiger</span>
           </div>
        </div>
      </div>

      {/* Betting Zone */}
      <div className="bg-[#111] p-8 pb-14 space-y-7 rounded-t-[3.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/5 backdrop-blur-3xl z-40">
        <div className="grid grid-cols-2 gap-4">
           <button onClick={() => placeBet('DRAGON')} className={`h-32 rounded-[2rem] border-2 flex flex-col items-center justify-center transition-all relative overflow-hidden active:scale-95 ${myBets.DRAGON > 0 ? 'bg-blue-600 border-blue-400' : 'bg-[#181818] border-white/5'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Dragon 1.9x</span>
              <span className="text-4xl font-orbitron font-black italic">₹{myBets.DRAGON}</span>
              <div className="absolute bottom-2 text-[8px] font-black text-white/20 uppercase">Pool: ₹{globalPools.DRAGON}</div>
           </button>
           <button onClick={() => placeBet('TIGER')} className={`h-32 rounded-[2rem] border-2 flex flex-col items-center justify-center transition-all relative overflow-hidden active:scale-95 ${myBets.TIGER > 0 ? 'bg-red-600 border-red-400' : 'bg-[#181818] border-white/5'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Tiger 1.9x</span>
              <span className="text-4xl font-orbitron font-black italic">₹{myBets.TIGER}</span>
              <div className="absolute bottom-2 text-[8px] font-black text-white/20 uppercase">Pool: ₹{globalPools.TIGER}</div>
           </button>
        </div>

        <button onClick={() => placeBet('TIE')} className={`w-full h-16 rounded-2xl border-2 flex items-center justify-center transition-all active:scale-95 ${myBets.TIE > 0 ? 'bg-green-600 border-green-400' : 'bg-white/5 border-white/5'}`}>
           <span className="text-xs font-black uppercase tracking-[0.3em]">Tie (9x) • <span className="text-green-400">₹{myBets.TIE}</span></span>
        </button>

        {/* Chip Selection */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
          {CHIPS.map(chip => (
            <button key={chip} onClick={() => setSelectedChip(chip)} className={`w-16 h-16 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all shrink-0 active:scale-90 ${selectedChip === chip ? 'bg-white text-black border-white scale-110 shadow-lg' : 'bg-white/5 border-white/10 text-white/40'}`}>
              {chip >= 1000 ? (chip/1000)+'K' : chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DragonTigerGame;
