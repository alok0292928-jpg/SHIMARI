
import React, { useState, useEffect, useRef } from 'react';
import { db, ref, onValue, off, updateGlobalPool } from '../services/firebase';

interface RedLightGameProps {
  walletBalance: number;
  userPhone: string;
  onFinish: (payout: number, shouldExit?: boolean) => void;
}

const CHIPS = [10, 50, 100, 500, 1000];

const RedLightGame: React.FC<RedLightGameProps> = ({ walletBalance, onFinish }) => {
  const [status, setStatus] = useState<'BETTING' | 'PLAYING' | 'RESULT'>('BETTING');
  const [lightState, setLightState] = useState<'GREEN' | 'RED'>('GREEN');
  const [roundId, setRoundId] = useState(0);
  const [timeToStart, setTimeToStart] = useState(0);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [globalPools, setGlobalPools] = useState<any>({});
  
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [selectedChip, setSelectedChip] = useState(10);
  const [myBet, setMyBet] = useState<{playerId: number, amount: number} | null>(null);
  const [progress, setProgress] = useState<number[]>(Array(5).fill(0));
  const [eliminated, setEliminated] = useState<boolean[]>(Array(5).fill(false));
  const [showCelebration, setShowCelebration] = useState(false);

  const processedRoundRef = useRef<number | null>(null);

  useEffect(() => {
    const stateRef = ref(db, 'redlight/state');
    const poolRef = ref(db, 'redlight/pools');
    
    const unsubState = onValue(stateRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      setRoundId(data.roundId);
      setWinnerId(data.winnerId);
      setLightState(data.lightState || 'GREEN');

      if (data.status === 'BETTING') {
        setStatus('BETTING'); setProgress(Array(5).fill(0)); setEliminated(Array(5).fill(false)); setShowCelebration(false);
        setTimeToStart(Math.max(0, Math.ceil((data.startTime - Date.now()) / 1000)));
      } else if (data.status === 'PLAYING') {
        setStatus('PLAYING');
      } else if (data.status === 'RESULT') {
        setStatus('RESULT');
        if (processedRoundRef.current !== data.roundId) {
          processedRoundRef.current = data.roundId;
          if (myBet && myBet.playerId === data.winnerId) {
             onFinish(myBet.amount * 4.5, false);
             setShowCelebration(true);
          }
          setTimeout(() => { setMyBet(null); setSelectedPlayer(null); }, 8000);
        }
      }
    });

    const unsubPool = onValue(poolRef, (snapshot) => {
       const data = snapshot.val();
       if (data) setGlobalPools(data);
    });

    return () => { off(stateRef); off(poolRef); };
  }, [myBet]);

  useEffect(() => {
    let interval: any;
    if (status === 'PLAYING') {
      interval = setInterval(() => {
        setProgress(prev => prev.map((p, i) => {
          const pId = i + 1;
          if (eliminated[i] || p >= 100) return p;
          if (lightState === 'RED' && Math.random() < 0.05 && pId !== winnerId) {
             setEliminated(prevE => { const n = [...prevE]; n[i] = true; return n; });
             return p;
          }
          if (lightState === 'GREEN') {
             const inc = pId === winnerId ? Math.random() * 6 + 4 : Math.random() * 5;
             return Math.min(100, p + inc);
          }
          return p;
        }));
      }, 300);
    }
    return () => clearInterval(interval);
  }, [status, lightState, winnerId, eliminated]);

  const placeBet = async (playerId: number) => {
    if (status !== 'BETTING' || timeToStart < 1 || walletBalance < selectedChip) return;
    setMyBet(prev => {
       const cur = (prev && prev.playerId === playerId) ? prev.amount : 0;
       return { playerId, amount: cur + selectedChip };
    });
    setSelectedPlayer(playerId);
    onFinish(-selectedChip, false);
    await updateGlobalPool('redlight', `P${playerId}`, selectedChip);
  };

  return (
    <div className="fixed inset-0 bg-[#d4a373] flex flex-col z-40 overflow-hidden font-inter">
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/sandpaper.png')"}} />
      
      {/* Pro Header */}
      <div className="bg-[#1a1a1a]/90 backdrop-blur-xl p-4 flex justify-between items-center border-b border-amber-600/30 shadow-2xl z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => onFinish(0, true)} className="p-2.5 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all">
             <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-xl font-orbitron font-black italic text-amber-500">RED LIGHT</h2>
        </div>
        <div className="bg-black/60 rounded-3xl px-5 py-2.5 flex items-center gap-3 border border-amber-600/20">
           <span className="text-white font-black text-sm">₹{(walletBalance || 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="flex-1 relative flex flex-col items-center">
         <div className="mt-12 text-center">
            <div className={`w-24 h-24 rounded-full border-4 transition-all duration-500 flex items-center justify-center text-5xl bg-[#332211] shadow-2xl ${lightState === 'RED' ? 'border-red-600 scale-110' : 'border-green-600 rotate-180 opacity-50'}`}>👧</div>
            <div className={`mt-4 px-8 py-2 rounded-full font-black uppercase tracking-[0.5em] text-[10px] shadow-2xl transition-all ${lightState === 'RED' ? 'bg-red-600' : 'bg-green-600'}`}>{lightState}</div>
         </div>

         <div className="flex-1 w-full flex justify-around items-end px-10 pb-10">
            {Array.from({length: 5}).map((_, i) => (
               <div key={i} className="flex flex-col items-center relative h-full w-12">
                  <div className="absolute bottom-0 w-full bg-black/10 rounded-full h-full mb-1 border-x border-black/5" />
                  <div className={`absolute w-12 h-16 transition-all duration-300 flex flex-col items-center`} style={{ bottom: `${progress[i]}%` }}>
                     {selectedPlayer === (i+1) && <div className="absolute -top-6 bg-amber-500 text-black text-[7px] font-black px-2 py-0.5 rounded-full">YOU</div>}
                     <div className={`w-10 h-14 bg-[#1b4332] rounded-2xl border-2 flex items-center justify-center relative shadow-2xl ${eliminated[i] ? 'grayscale opacity-30' : selectedPlayer === (i+1) ? 'border-amber-500' : 'border-white/10'}`}>
                        <span className="text-[8px] font-black text-white/30">#{i+1}</span>
                        {eliminated[i] && <div className="absolute inset-0 flex items-center justify-center text-red-600 font-black text-3xl">✕</div>}
                     </div>
                     <p className="text-[6px] font-black text-black/40 mt-1">₹{globalPools[`P${i+1}`] || 0}</p>
                  </div>
               </div>
            ))}
         </div>

         {status === 'BETTING' && (
           <div className="absolute inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-8 z-40">
              <div className="w-full max-w-sm bg-[#161d2b] rounded-[3rem] border border-white/10 p-8 shadow-2xl space-y-8">
                 <div className="text-center">
                    <p className="text-[10px] text-amber-500 font-black uppercase tracking-[0.3em] mb-2">Stakes Closing In</p>
                    <p className="text-4xl font-orbitron font-black">{timeToStart}s</p>
                 </div>
                 <div className="grid grid-cols-5 gap-2">
                    {[1,2,3,4,5].map(id => (
                       <button key={id} onClick={() => placeBet(id)} className={`aspect-square rounded-2xl border-2 transition-all flex flex-col items-center justify-center ${selectedPlayer === id ? 'bg-amber-600 border-white' : 'bg-white/5 border-white/5'}`}>
                          <span className="text-[11px] font-black">P{id}</span>
                          <span className="text-[7px] opacity-40">4.5x</span>
                       </button>
                    ))}
                 </div>
                 <div className="flex gap-3 overflow-x-auto no-scrollbar">
                    {CHIPS.map(c => (
                       <button key={c} onClick={() => setSelectedChip(c)} className={`w-14 h-14 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all shrink-0 ${selectedChip === c ? 'bg-amber-600 border-white scale-110' : 'bg-white/5 border-white/10'}`}>{c}</button>
                    ))}
                 </div>
                 <div className="bg-black/40 p-5 rounded-3xl border border-white/5 flex justify-between items-center">
                    <div><p className="text-[8px] text-white/30 uppercase font-black">Your Bet</p><p className="text-2xl font-orbitron font-black text-amber-500">₹{myBet?.amount || 0}</p></div>
                    <div className="text-right"><p className="text-[8px] text-white/30 uppercase font-black">Total Pool</p><p className="text-xl font-orbitron font-black text-white/50">₹{Object.values(globalPools).reduce((a:any,b:any)=>a+b, 0)}</p></div>
                 </div>
              </div>
           </div>
         )}
      </div>

      {showCelebration && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center animate-in zoom-in duration-500">
           <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.5)] mb-6 animate-bounce">
              <svg className="w-20 h-20 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" /></svg>
           </div>
           <h2 className="text-5xl font-orbitron font-black italic text-green-500">SURVIVED</h2>
           <p className="text-2xl font-black text-white mt-2 uppercase tracking-widest">+₹{(myBet!.amount * 4.5).toFixed(0)}</p>
        </div>
      )}
    </div>
  );
};

export default RedLightGame;
