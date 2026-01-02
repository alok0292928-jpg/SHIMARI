
import React, { useState, useEffect, useRef } from 'react';
import { db, ref, onValue, off, adjustUserBalance } from '../services/firebase';

interface AviatorGameProps {
  fee: number;
  userLuck: number;
  onFinish: (earnings: number) => void;
  userPhone: string;
  userBalance: number;
}

interface BetState {
  amount: number;
  isPlaced: boolean;
  isCashedOut: boolean;
  cashoutMult: number;
  autoBet: boolean;
  autoCashout: boolean;
  autoCashoutValue: number;
}

const AviatorGame: React.FC<AviatorGameProps> = ({ userPhone, userBalance, onFinish }) => {
  const [multiplier, setMultiplier] = useState(1.00);
  const [status, setStatus] = useState<'WAITING' | 'FLYING' | 'CRASHED'>('WAITING');
  const [history, setHistory] = useState<number[]>([]);
  const [timeToStart, setTimeToStart] = useState(0);
  
  const [bet1, setBet1] = useState<BetState>({
    amount: 10, isPlaced: false, isCashedOut: false, cashoutMult: 0,
    autoBet: false, autoCashout: false, autoCashoutValue: 2.0
  });
  const [bet2, setBet2] = useState<BetState>({
    amount: 10, isPlaced: false, isCashedOut: false, cashoutMult: 0,
    autoBet: false, autoCashout: false, autoCashoutValue: 2.0
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<any>(null);

  useEffect(() => {
    const globalRef = ref(db, 'aviator/state');
    const unsubscribe = onValue(globalRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      stateRef.current = data;
      setHistory(data.history || []);
      
      // Sync global status to local
      if (data.status !== status) {
        setStatus(data.status);
        if (data.status === 'WAITING') {
          // Reset for new round
          setBet1(prev => ({ ...prev, isPlaced: prev.autoBet, isCashedOut: false, cashoutMult: 0 }));
          setBet2(prev => ({ ...prev, isPlaced: prev.autoBet, isCashedOut: false, cashoutMult: 0 }));
          
          // Auto-bet logic: deduct balance if auto-bet is on
          if (bet1.autoBet) handlePlaceBet(1, true);
          if (bet2.autoBet) handlePlaceBet(2, true);
          
          setMultiplier(1.00);
        }
      }

      if (data.status === 'WAITING') {
        const remaining = Math.max(0, Math.ceil((data.startTime - Date.now()) / 1000));
        setTimeToStart(remaining);
      } else if (data.status === 'CRASHED') {
        setMultiplier(data.crashPoint || 1.00);
      }
    });

    return () => off(globalRef, 'value', unsubscribe);
  }, [status, bet1.autoBet, bet2.autoBet]);

  // High-precision Game Loop (30ms)
  useEffect(() => {
    let interval: number;
    if (status === 'FLYING') {
      interval = window.setInterval(() => {
        if (!stateRef.current?.startTime) return;
        
        const now = Date.now();
        const elapsed = (now - stateRef.current.startTime) / 1000;
        const currentMult = Math.pow(1.08, elapsed);
        const crashP = stateRef.current.crashPoint || 1.00;
        
        // CRITICAL: Strict Check. If multiplier hits limit, kill interactivity instantly
        if (currentMult >= crashP) {
          setMultiplier(crashP);
          setStatus('CRASHED'); // Force local state to crashed to block buttons
          clearInterval(interval);
          return;
        }

        setMultiplier(currentMult);

        // Auto Cashout Logic (Must be BEFORE status check to ensure success)
        if (bet1.isPlaced && !bet1.isCashedOut && bet1.autoCashout && currentMult >= bet1.autoCashoutValue) {
          handleCashOut(1, currentMult);
        }
        if (bet2.isPlaced && !bet2.isCashedOut && bet2.autoCashout && currentMult >= bet2.autoCashoutValue) {
          handleCashOut(2, currentMult);
        }
      }, 30);
    }
    return () => clearInterval(interval);
  }, [status, bet1, bet2]);

  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath(); ctx.moveTo((w/10)*i, 0); ctx.lineTo((w/10)*i, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, (h/10)*i); ctx.lineTo(w, (h/10)*i); ctx.stroke();
      }

      if (status === 'FLYING' || status === 'CRASHED') {
        const mult = multiplier || 1.0;
        const progress = Math.min(1, (mult - 1) / 5);
        const cx = 40 + (w - 120) * progress;
        const cy = h - 40 - (h - 150) * Math.pow(progress, 1.5);

        const grad = ctx.createLinearGradient(0, h, cx, cy);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, status === 'CRASHED' ? 'rgba(211, 47, 47, 0.3)' : 'rgba(233, 30, 99, 0.3)');

        ctx.beginPath();
        ctx.strokeStyle = status === 'CRASHED' ? '#d32f2f' : '#e91e63';
        ctx.lineWidth = 4;
        ctx.moveTo(40, h - 40);
        ctx.quadraticCurveTo(w * 0.3, h - 30, cx, cy);
        ctx.stroke();

        ctx.lineTo(cx, h - 40);
        ctx.lineTo(40, h - 40);
        ctx.fillStyle = grad;
        ctx.fill();

        if (status === 'FLYING') {
          ctx.fillStyle = '#ff0000';
          ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI*2); ctx.fill();
        }
      }
      frame = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(frame);
  }, [status, multiplier]);

  const handlePlaceBet = async (num: 1 | 2, isAuto: boolean = false) => {
    // Only allow bets during WAITING phase
    if (stateRef.current?.status !== 'WAITING') return;
    const bet = num === 1 ? bet1 : bet2;
    if (userBalance < bet.amount) return;
    
    await adjustUserBalance(userPhone, -bet.amount);
    if (num === 1) setBet1(prev => ({ ...prev, isPlaced: true }));
    else setBet2(prev => ({ ...prev, isPlaced: true }));
  };

  const handleCashOut = (num: 1 | 2, forcedMult?: number) => {
    // CRITICAL: Block cashout if status is not strictly FLYING
    if (status !== 'FLYING') return;
    
    const bet = num === 1 ? bet1 : bet2;
    if (bet.isCashedOut || !bet.isPlaced) return;

    const finalMult = forcedMult || multiplier;
    
    // Double-check: ensure the multiplier used for payout hasn't exceeded the crash point
    if (stateRef.current?.crashPoint && finalMult >= stateRef.current.crashPoint) {
      // Too late! The local calculation was just behind the crash
      return;
    }

    const win = bet.amount * finalMult;
    
    if (num === 1) setBet1(prev => ({ ...prev, isCashedOut: true, cashoutMult: finalMult }));
    else setBet2(prev => ({ ...prev, isCashedOut: true, cashoutMult: finalMult }));
    
    onFinish(win);
  };

  return (
    <div className="fixed inset-0 bg-[#1b1c1d] flex flex-col z-50 text-white overflow-hidden font-inter">
      {/* Header */}
      <div className="bg-[#1b1c1d] px-4 py-3 flex justify-between items-center border-b border-white/5">
        <span className="text-[#e91e63] italic font-black text-2xl">Aviator</span>
        <div className="bg-black/40 rounded-xl px-4 py-1 flex items-center gap-2 border border-white/5">
          <span className="text-[#ff9800] text-xs">₹</span>
          <span className="text-sm font-black">{userBalance.toLocaleString()}</span>
        </div>
      </div>

      {/* Multiplier Display */}
      <div className="relative h-[35vh] m-3 bg-[#0e0f10] rounded-[2.5rem] flex flex-col items-center justify-center overflow-hidden border border-white/5">
        <canvas ref={canvasRef} width={800} height={400} className="absolute inset-0 w-full h-full opacity-40" />
        <div className="relative z-10 text-center">
          {status === 'FLYING' ? (
            <h1 className="text-7xl font-black italic tracking-tighter animate-in zoom-in duration-300">
              {multiplier.toFixed(2)}x
            </h1>
          ) : status === 'CRASHED' ? (
            <div className="animate-in zoom-in duration-150">
              <p className="text-[#e91e63] font-black text-xl italic uppercase">FLEW AWAY!</p>
              <h1 className="text-7xl font-black text-[#e91e63] italic tracking-tighter">{multiplier.toFixed(2)}x</h1>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-12 h-12 border-4 border-[#e91e63] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-3xl font-orbitron font-black">{timeToStart}s</p>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Wait for next round</p>
            </div>
          )}
        </div>
      </div>

      {/* History Ribbon */}
      <div className="flex gap-2 px-3 overflow-x-auto no-scrollbar pb-3">
        {history.slice(0, 10).map((h, i) => (
          <span key={i} className={`px-3 py-1 rounded-full text-[10px] font-black border border-white/5 shrink-0 ${h < 2 ? 'text-blue-400 bg-blue-500/10' : 'text-purple-400 bg-purple-500/10'}`}>{h.toFixed(2)}x</span>
        ))}
      </div>

      {/* Dual Bet Controls */}
      <div className="flex-1 px-3 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pb-10">
        {[1, 2].map(num => {
          const bet = num === 1 ? bet1 : bet2;
          const setBet = num === 1 ? setBet1 : setBet2;
          const canCashOut = status === 'FLYING' && bet.isPlaced && !bet.isCashedOut;
          
          return (
            <div key={num} className="bg-[#2c2d2e] p-4 rounded-[2rem] border border-white/10 space-y-4">
              <div className="flex justify-between items-center px-1">
                <div className="flex gap-2">
                  <button onClick={() => setBet(prev => ({...prev, autoBet: !prev.autoBet}))} className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${bet.autoBet ? 'bg-[#e91e63] text-white' : 'bg-white/5 text-white/30'}`}>Auto Bet</button>
                  <button onClick={() => setBet(prev => ({...prev, autoCashout: !prev.autoCashout}))} className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${bet.autoCashout ? 'bg-[#ff9800] text-black' : 'bg-white/5 text-white/30'}`}>Auto Out</button>
                </div>
                {bet.autoCashout && <input type="number" step="0.1" value={bet.autoCashoutValue} onChange={e => setBet(prev => ({...prev, autoCashoutValue: parseFloat(e.target.value)}))} className="w-12 bg-black/40 border border-white/5 rounded text-[10px] text-center font-black text-[#ff9800] outline-none" />}
              </div>

              <div className="flex gap-3 h-20">
                <div className="flex-1 bg-black/40 rounded-2xl flex flex-col items-center justify-center border border-white/5">
                   <div className="flex items-center gap-3">
                      <button disabled={status === 'FLYING' && bet.isPlaced} onClick={() => setBet(prev => ({...prev, amount: Math.max(10, prev.amount - 10)}))} className="text-white/30 font-black text-xl disabled:opacity-0">−</button>
                      <span className="text-xl font-black italic">₹{bet.amount}</span>
                      <button disabled={status === 'FLYING' && bet.isPlaced} onClick={() => setBet(prev => ({...prev, amount: prev.amount + 10}))} className="text-white/30 font-black text-xl disabled:opacity-0">+</button>
                   </div>
                </div>
                
                {bet.isCashedOut ? (
                  <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-2xl flex flex-col items-center justify-center animate-in zoom-in">
                    <span className="text-[8px] font-black text-green-500 uppercase">WON</span>
                    <span className="text-xl font-black text-green-500 italic">₹{(bet.amount * bet.cashoutMult).toFixed(1)}</span>
                  </div>
                ) : canCashOut ? (
                  <button onClick={() => handleCashOut(num as 1|2)} className="flex-1 bg-[#ff9800] border-b-4 border-[#cc7a00] text-black font-black rounded-2xl flex flex-col items-center justify-center active:translate-y-1 transition-all">
                    <span className="text-[9px] uppercase font-black">CASH OUT</span>
                    <span className="text-xl italic">₹{(bet.amount * multiplier).toFixed(1)}</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => handlePlaceBet(num as 1|2)} 
                    disabled={bet.isPlaced || stateRef.current?.status !== 'WAITING'} 
                    className={`flex-1 ${bet.isPlaced ? 'bg-[#d32f2f] border-[#b71c1c]' : 'bg-green-600 border-green-700'} text-white font-black rounded-2xl border-b-4 flex flex-col items-center justify-center transition-all disabled:opacity-50`}
                  >
                    <span className="text-xl font-black italic">{bet.isPlaced ? 'WAITING' : 'BET'}</span>
                    <span className="text-[9px] uppercase font-black tracking-widest">₹{bet.amount}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AviatorGame;
