
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameID } from '../types';

interface PVPBattleArenaProps {
  gameId: GameID;
  fee: number;
  walletBalance: number;
  userLuck: number;
  onFinish: (payout: number, shouldExit?: boolean) => void;
}

const PVPBattleArena: React.FC<PVPBattleArenaProps> = ({ gameId, fee, walletBalance, userLuck, onFinish }) => {
  const [status, setStatus] = useState<'MATCHING' | 'INTERACTIVE' | 'WAITING_AI' | 'RESULT'>('MATCHING');
  const [opponent, setOpponent] = useState<{name: string, rating: number} | null>(null);
  const [userScore, setUserScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<{won: boolean, amount: number} | null>(null);
  
  // Game Specific States
  const [deck, setDeck] = useState<{user: string[], ai: string[]} | null>(null);
  const [dice, setDice] = useState<number[]>([]);
  const [quiz, setQuiz] = useState<{q: string, a: string[]} | null>(null);
  const [arcadeItems, setArcadeItems] = useState<{id: number, x: number, y: number, type: string}[]>([]);
  
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Phase 1: Matching (Cyberpunk feel)
    const matchTimer = setTimeout(() => {
      const bots = ['Viper_Bot', 'ShadowHunter', 'LootKing_AI', 'RogueShikari', 'NeonFang'];
      setOpponent({ name: bots[Math.floor(Math.random() * bots.length)], rating: 1100 + Math.floor(Math.random() * 600) });
      setStatus('INTERACTIVE');
      initGameMode();
    }, 2000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(matchTimer);
    };
  }, [gameId]);

  const initGameMode = () => {
    const cardGames = ['TEEN_PATTI', 'ANDAR_BAHAR', 'POKER', 'RUMMY', 'CALL_BREAK'];
    const diceGames = ['JHANDI_MUNDA', 'DICE_7', 'LUDO'];
    const quizGames = ['QUIZ'];

    if (cardGames.includes(gameId)) {
      const cards = ['A♠', 'K♦', 'Q♣', 'J♥', '10♠', '9♦', '2♥', 'J♣', 'K♠'];
      setDeck({
        user: Array.from({length: 3}, () => cards[Math.floor(Math.random()*cards.length)]),
        ai: Array.from({length: 3}, () => cards[Math.floor(Math.random()*cards.length)])
      });
      setTimeLeft(5);
    } else if (diceGames.includes(gameId)) {
      setTimeLeft(6);
    } else if (quizGames.includes(gameId)) {
      setQuiz({
        q: "Which state is known as the Land of 5 Rivers?",
        a: ["Punjab", "Haryana", "UP", "Bihar"]
      });
      setTimeLeft(8);
    } else {
      // Default Arcade
      spawnArcadeItems();
      setTimeLeft(12);
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleGameTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const spawnArcadeItems = useCallback(() => {
    const types = ['FRUIT', 'TARGET', 'COIN'];
    const newItems = Array.from({ length: 4 }, (_, i) => ({
      id: Date.now() + i,
      x: 15 + Math.random() * 70,
      y: 20 + Math.random() * 60,
      type: types[Math.floor(Math.random() * types.length)]
    }));
    setArcadeItems(newItems);
  }, []);

  const handleInteraction = (id: number) => {
    setUserScore(prev => prev + 15);
    setArcadeItems(prev => prev.filter(item => item.id !== id));
    if (arcadeItems.length <= 1) spawnArcadeItems();
  };

  const handleGameTimeout = () => {
    setStatus('WAITING_AI');
    
    // Simulate Result
    setTimeout(() => {
      const winProbability = 0.45 * (userLuck || 1);
      const won = Math.random() < winProbability || userScore > 50;
      const payout = won ? fee * 1.9 : 0;
      
      setAiScore(Math.floor(Math.random() * 100));
      setResult({ won, amount: payout });
      setStatus('RESULT');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center p-6 z-[100] font-inter">
      <div className="w-full max-w-sm h-full flex flex-col py-10 space-y-6">
        
        {/* Battle Header */}
        <div className="bg-[#161d2b] border border-white/5 p-5 rounded-[2rem] flex justify-between items-center shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#f39c12] to-transparent opacity-30" />
           <div className="text-left">
              <p className="text-[7px] text-white/30 uppercase font-black tracking-widest">Player 1</p>
              <h4 className="text-white font-black text-xs font-orbitron uppercase">You</h4>
              <p className="text-[10px] text-[#f39c12] font-black">₹{fee}</p>
           </div>
           <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#f39c12] flex items-center justify-center text-black font-black italic shadow-[0_0_20px_rgba(243,156,18,0.3)]">VS</div>
           </div>
           <div className="text-right">
              <p className="text-[7px] text-white/30 uppercase font-black tracking-widest">Rival Shikari</p>
              <h4 className="text-white font-black text-xs font-orbitron uppercase">{opponent?.name || '---'}</h4>
              <p className="text-[10px] text-white/40 font-black">₹{fee}</p>
           </div>
        </div>

        {/* Dynamic Game Stage */}
        <div className="flex-1 bg-[#111827]/50 rounded-[3rem] border border-white/5 relative overflow-hidden flex flex-col items-center justify-center p-6">
           
           {status === 'MATCHING' && (
              <div className="text-center space-y-6">
                 <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 border-4 border-[#f39c12]/10 rounded-full" />
                    <div className="absolute inset-0 border-4 border-[#f39c12] border-t-transparent rounded-full animate-spin" />
                    <div className="absolute inset-4 bg-[#f39c12]/5 rounded-full animate-pulse" />
                 </div>
                 <div className="space-y-1">
                    <p className="text-xs font-orbitron font-black text-white italic tracking-widest">LOCATING RIVAL...</p>
                    <p className="text-[8px] text-white/20 uppercase tracking-[0.4em]">Searching Shikaar Global Node</p>
                 </div>
              </div>
           )}

           {status === 'INTERACTIVE' && (
              <div className="w-full h-full flex flex-col">
                 <div className="flex justify-between items-center mb-6">
                    <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                       <p className="text-[8px] text-white/40 uppercase font-black">Time</p>
                       <p className="text-xl font-orbitron font-black text-white">{timeLeft}s</p>
                    </div>
                    <div className="text-right bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                       <p className="text-[8px] text-white/40 uppercase font-black">Stake Pot</p>
                       <p className="text-xl font-orbitron font-black text-[#f39c12]">₹{fee * 2}</p>
                    </div>
                 </div>

                 <div className="flex-1 relative flex flex-col items-center justify-center">
                    {/* Card Games UI */}
                    {['TEEN_PATTI', 'POKER', 'ANDAR_BAHAR'].includes(gameId) && deck && (
                      <div className="space-y-8 text-center animate-in fade-in zoom-in duration-500">
                         <div className="space-y-2">
                            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Your Cards</p>
                            <div className="flex gap-2">
                               {deck.user.map((c, i) => (
                                 <div key={i} className="w-16 h-24 bg-white rounded-xl shadow-2xl flex items-center justify-center text-black font-black text-2xl animate-in slide-in-from-bottom duration-500" style={{ animationDelay: `${i*100}ms` }}>{c}</div>
                               ))}
                            </div>
                         </div>
                         <div className="space-y-2 opacity-30 scale-75">
                            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Rival's Hand</p>
                            <div className="flex gap-2">
                               {Array(3).fill('?').map((_, i) => (
                                 <div key={i} className="w-16 h-24 bg-gradient-to-br from-[#161d2b] to-[#0d121c] border border-white/20 rounded-xl flex items-center justify-center text-white/10 font-black text-2xl italic">S</div>
                               ))}
                            </div>
                         </div>
                      </div>
                    )}

                    {/* Quiz Games UI */}
                    {gameId === 'QUIZ' && quiz && (
                       <div className="w-full space-y-6 animate-in fade-in duration-500">
                          <div className="bg-[#161d2b] p-6 rounded-3xl border border-[#f39c12]/30 shadow-xl">
                             <p className="text-white font-bold text-center leading-relaxed italic">{quiz.q}</p>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                             {quiz.a.map((opt, i) => (
                               <button key={opt} onClick={() => { setUserScore(i === 0 ? 100 : 0); setTimeLeft(1); }} className="w-full bg-white/5 hover:bg-[#f39c12] hover:text-black p-4 rounded-2xl text-[11px] font-black text-white/60 border border-white/10 transition-all text-left uppercase">
                                  {opt}
                               </button>
                             ))}
                          </div>
                       </div>
                    )}

                    {/* Dice Games UI */}
                    {['JHANDI_MUNDA', 'DICE_7', 'LUDO'].includes(gameId) && (
                       <div className="text-center space-y-8">
                          <div className="flex gap-4 animate-bounce">
                             <div className="w-20 h-20 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-black font-black text-4xl">⚂</div>
                             <div className="w-20 h-20 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-black font-black text-4xl">⚅</div>
                          </div>
                          <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.4em]">ROLLING FOR VICTORY...</p>
                       </div>
                    )}

                    {/* Arcade Games UI */}
                    {!['TEEN_PATTI', 'POKER', 'ANDAR_BAHAR', 'QUIZ', 'JHANDI_MUNDA', 'DICE_7', 'LUDO'].includes(gameId) && (
                       <div className="w-full h-full relative">
                          {arcadeItems.map(item => (
                            <button
                              key={item.id}
                              onClick={() => handleInteraction(item.id)}
                              style={{ left: `${item.x}%`, top: `${item.y}%` }}
                              className="absolute w-14 h-14 bg-gradient-to-br from-[#f39c12] to-yellow-700 rounded-full flex items-center justify-center shadow-xl active:scale-90 border-2 border-white/20 animate-in zoom-in duration-300"
                            >
                               <span className="text-black font-black text-[9px] uppercase">{item.type}</span>
                            </button>
                          ))}
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
                             <p className="text-[10px] text-white uppercase font-black tracking-[1em] -rotate-90">ARENA ACTION</p>
                          </div>
                       </div>
                    )}
                 </div>
              </div>
           )}

           {status === 'WAITING_AI' && (
              <div className="text-center space-y-3">
                 <div className="flex justify-center gap-1 mb-4">
                    <div className="w-2 h-2 bg-[#f39c12] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-[#f39c12] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-[#f39c12] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
                 <p className="text-sm font-orbitron font-black text-white italic uppercase tracking-widest">Analyzing Outcome</p>
                 <p className="text-[8px] text-white/20 uppercase tracking-[0.4em]">Verifying Player Skill vs AI</p>
              </div>
           )}

           {status === 'RESULT' && result && (
              <div className="text-center space-y-8 animate-in zoom-in duration-500 w-full">
                 <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center shadow-2xl relative ${result.won ? 'bg-green-500 shadow-green-500/30' : 'bg-red-500 shadow-red-500/30'}`}>
                    <svg className="w-16 h-16 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d={result.won ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} /></svg>
                    <div className="absolute -inset-2 border-2 border-white/10 rounded-full animate-ping" />
                 </div>
                 
                 <div className="space-y-1">
                    <h2 className={`text-4xl font-orbitron font-black italic tracking-tighter ${result.won ? 'text-green-400' : 'text-red-500'}`}>
                       {result.won ? 'ARENA WON' : 'STAKE LOST'}
                    </h2>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                       {result.won ? `Payout: ₹${result.amount.toFixed(2)}` : 'Rival secured the pot'}
                    </p>
                 </div>

                 <div className="bg-white/5 p-4 rounded-3xl border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/20">
                    Host Comm: ₹{(fee * 0.1).toFixed(2)} • Fair Play Node V2.1
                 </div>

                 <button onClick={() => onFinish(result.amount, true)} className="w-full bg-white text-black font-orbitron font-black py-5 rounded-[2.5rem] uppercase tracking-widest text-xs active:scale-95 transition-all shadow-xl">
                    Exit Battle Arena
                 </button>
              </div>
           )}
        </div>

        <p className="text-[8px] text-white/10 text-center uppercase tracking-[0.5em] font-black italic">SHIKAAR.AI • GLOBAL ARENA NODE</p>
      </div>
    </div>
  );
};

export default PVPBattleArena;
