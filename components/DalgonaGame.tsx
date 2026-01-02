
import React, { useState, useEffect, useRef } from 'react';
import { db, ref, onValue, off } from '../services/firebase';

interface DalgonaGameProps {
  walletBalance: number;
  userPhone: string;
  onFinish: (payout: number, shouldExit?: boolean) => void;
}

const CHIPS = [10, 50, 100, 500, 1000];

const DalgonaGame: React.FC<DalgonaGameProps> = ({ walletBalance, onFinish }) => {
  const [status, setStatus] = useState<'BETTING' | 'PLAYING' | 'RESULT'>('BETTING');
  const [roundId, setRoundId] = useState(0);
  const [timeToStart, setTimeToStart] = useState(0);
  const [players, setPlayers] = useState<any[]>([]);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [selectedChip, setSelectedChip] = useState(10);
  const [myBet, setMyBet] = useState<{playerId: number, amount: number} | null>(null);
  const [progress, setProgress] = useState<number[]>(Array(10).fill(0));
  const [eliminated, setEliminated] = useState<boolean[]>(Array(10).fill(false));
  const [showCelebration, setShowCelebration] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const processedRoundRef = useRef<number | null>(null);

  useEffect(() => {
    const stateRef = ref(db, 'dalgona/state');
    const unsubscribe = onValue(stateRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      setRoundId(data.roundId);
      setPlayers(data.players || []);
      setHistory(data.history || []);
      
      if (data.status === 'BETTING') {
        setStatus('BETTING');
        const remaining = Math.max(0, Math.ceil((data.startTime - Date.now()) / 1000));
        setTimeToStart(remaining);
        setWinnerId(null);
        setProgress(Array(10).fill(0));
        setEliminated(Array(10).fill(false));
        setShowCelebration(false);
      } else if (data.status === 'PLAYING') {
        setStatus('PLAYING');
        setWinnerId(data.winnerId);
      } else if (data.status === 'RESULT') {
        setStatus('RESULT');
        setWinnerId(data.winnerId);
        if (processedRoundRef.current !== data.roundId) {
          processedRoundRef.current = data.roundId;
          if (myBet && myBet.playerId === data.winnerId) {
             onFinish(myBet.amount * 9, false);
             setShowCelebration(true);
          }
          setTimeout(() => {
            setMyBet(null);
            setSelectedPlayer(null);
          }, 8000);
        }
      }
    });

    return () => off(stateRef, 'value', unsubscribe);
  }, [myBet]);

  // Animation logic for PLAYING phase
  useEffect(() => {
    let interval: any;
    if (status === 'PLAYING') {
      interval = setInterval(() => {
        setProgress(prev => prev.map((p, i) => {
          if (eliminated[i] || p >= 100) return p;
          const isWinner = (i + 1) === winnerId;
          const inc = isWinner ? Math.random() * 5 + 5 : Math.random() * 8;
          const newP = p + inc;
          
          if (!isWinner && newP > 60 && Math.random() < 0.05) {
             setEliminated(prevE => {
                const newE = [...prevE];
                newE[i] = true;
                return newE;
             });
             return p;
          }
          return Math.min(100, newP);
        }));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [status, winnerId, eliminated]);

  const placeBet = (playerId: number) => {
    if (status !== 'BETTING' || timeToStart < 1) return;
    if (walletBalance < selectedChip) {
      alert("Insufficient Balance!");
      return;
    }
    // Fixed: Allow multiple clicks (additive betting)
    setMyBet(prev => {
        const currentAmount = (prev && prev.playerId === playerId) ? prev.amount : 0;
        return { playerId, amount: currentAmount + selectedChip };
    });
    setSelectedPlayer(playerId);
    onFinish(-selectedChip, false);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col z-40 overflow-hidden font-inter text-white">
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-pink-600/20 backdrop-blur-sm animate-pulse" />
          <div className="relative z-10 text-center animate-in zoom-in duration-500">
             <h2 className="text-7xl font-orbitron font-black italic text-white drop-shadow-[0_0_20px_#db2777]">VICTORY</h2>
             <p className="text-2xl font-black text-pink-500 uppercase tracking-widest mt-2 animate-bounce">9x LOOT SECURED!</p>
          </div>
          {/* Simple CSS Confetti Particles */}
          {Array.from({length: 30}).map((_, i) => (
             <div 
                key={i} 
                className="absolute w-2 h-2 bg-pink-500 rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random() * 2}s`
                }}
             />
          ))}
        </div>
      )}

      {/* Premium Header */}
      <div className="bg-[#1a1a1a] p-4 flex justify-between items-center border-b border-pink-600/30 shadow-2xl z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => onFinish(0, true)} className="p-2 bg-white/5 rounded-xl border border-white/10 active:scale-90">
             <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-xl font-orbitron font-black italic text-pink-500">DALGONA <span className="text-white">SURVIVOR</span></h2>
            <p className="text-[8px] text-white/30 font-black tracking-widest uppercase">Round #{roundId}</p>
          </div>
        </div>
        <div className="bg-black/60 rounded-2xl px-5 py-2 flex items-center gap-3 border border-pink-600/20">
           <div className="w-6 h-6 bg-pink-600 rounded-full flex items-center justify-center text-white font-black text-[10px]">₹</div>
           <span className="text-white font-black text-sm tracking-tight">{(walletBalance || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Main Grid 2x5 */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
         {status === 'BETTING' && (
           <div className="text-center mb-4 py-2 bg-pink-600/10 w-full rounded-2xl border border-pink-600/20 animate-pulse">
              <p className="text-xs font-black uppercase text-pink-500 tracking-[0.3em]">Betting Phase: {timeToStart}s</p>
           </div>
         )}

         {/* History Bar */}
         <div className="w-full max-w-4xl flex gap-2 overflow-x-auto no-scrollbar mb-4 py-1">
            {history.map((h, i) => (
               <div key={i} className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-white/40 border border-white/5 shrink-0 uppercase tracking-tighter">
                  {h}
               </div>
            ))}
         </div>

         <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full max-w-4xl">
            {Array.from({length: 10}).map((_, i) => {
               const pId = i + 1;
               const player = players.find(p => p.id === pId);
               const isSelected = selectedPlayer === pId && myBet;
               const isWinner = status === 'RESULT' && winnerId === pId;

               return (
                 <button 
                  key={pId}
                  onClick={() => placeBet(pId)}
                  disabled={status !== 'BETTING' || (myBet !== null && myBet.playerId !== pId)}
                  className={`relative p-4 rounded-[2rem] border-2 flex flex-col items-center gap-2 transition-all duration-300 ${
                    isSelected ? 'border-pink-500 bg-pink-600/10 shadow-[0_0_20px_rgba(219,39,119,0.3)]' : 
                    isWinner ? 'border-green-500 bg-green-500/10 scale-105' : 
                    eliminated[i] ? 'opacity-40 grayscale border-red-900 bg-red-950/20' : 
                    'bg-[#1a1a1a] border-white/5 hover:border-pink-500/30'
                  }`}
                 >
                    <div className="absolute top-2 right-4 text-[9px] font-black text-white/20">#{pId < 10 ? '0'+pId : pId}</div>
                    
                    {/* Character Avatar */}
                    <div className="w-16 h-16 bg-[#2d3a31] rounded-2xl flex items-center justify-center border-t-2 border-white/10 shadow-lg relative">
                       <img src="https://cdn-icons-png.flaticon.com/512/3504/3504547.png" className={`w-10 h-10 object-contain ${eliminated[i] ? 'grayscale brightness-50' : ''}`} />
                       {eliminated[i] && <div className="absolute inset-0 flex items-center justify-center text-red-600 font-black text-4xl">✕</div>}
                    </div>

                    <div className="w-full space-y-1">
                       <div className="flex justify-between items-center px-1">
                          <span className="text-[9px] font-black text-white/40 uppercase">{player?.shape || '???'}</span>
                          <span className="text-[9px] font-black text-pink-500">9x</span>
                       </div>
                       <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${eliminated[i] ? 'bg-red-900' : 'bg-pink-600 shadow-[0_0_5px_#db2777]'}`} 
                            style={{ width: `${progress[i]}%` }} 
                          />
                       </div>
                    </div>
                    
                    {isWinner && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[7px] font-black px-3 py-1 rounded-full animate-bounce">WINNER</div>}
                 </button>
               );
            })}
         </div>

         {status === 'PLAYING' && (
           <div className="mt-8 flex flex-col items-center gap-2">
              <div className="flex gap-2">
                 <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" />
                 <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{animationDelay:'0.2s'}} />
                 <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{animationDelay:'0.4s'}} />
              </div>
              <p className="text-[10px] font-black uppercase text-pink-500 tracking-[0.4em] italic">Surviving Dalgona...</p>
           </div>
         )}
      </div>

      {/* Betting Controls */}
      <div className="bg-[#111] p-6 pb-12 space-y-6 rounded-t-[3rem] border-t border-white/5 shadow-2xl">
         <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
            {CHIPS.map(c => (
              <button 
                key={c}
                onClick={() => setSelectedChip(c)}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all shrink-0 ${
                  selectedChip === c ? 'bg-pink-600 border-white text-white scale-110 shadow-lg' : 'bg-white/5 border-white/10 text-white/40'
                }`}
              >
                {c >= 1000 ? (c/1000)+'K' : c}
              </button>
            ))}
         </div>

         <div className="flex items-center justify-between bg-black/40 rounded-3xl p-6 border border-white/5">
            <div className="flex flex-col">
               <span className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-1 italic">Active Bet</span>
               <span className="text-3xl font-orbitron font-black text-pink-500">₹{myBet ? myBet.amount : 0}</span>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-1 italic">Potential Loot</span>
               <span className="text-2xl font-black text-green-500">₹{myBet ? myBet.amount * 9 : selectedChip * 9}</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default DalgonaGame;
