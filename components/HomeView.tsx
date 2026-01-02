
import React, { useState } from 'react';
import { GAMES, CATEGORIES } from '../constants';
import { GameID, AppTab } from '../types';

interface HomeViewProps {
  onEnterGame: (gameId: GameID, fee: number, extra?: any) => void;
  onSwitchTab: (tab: AppTab, initialView?: 'MAIN' | 'DEPOSIT' | 'WITHDRAW') => void;
  balance: number;
}

const HomeView: React.FC<HomeViewProps> = ({ onEnterGame, onSwitchTab, balance }) => {
  const [activeCategory, setActiveCategory] = useState<string>('ARENA');

  const handleStartGame = (gameId: string) => {
    // Instant Entry: Default fee of 10. Stakes can be adjusted in-game where applicable.
    onEnterGame(gameId as GameID, 10);
  };

  const filteredGames = GAMES.filter(g => g.cat === activeCategory);

  return (
    <div className="flex flex-col min-h-full bg-[#0a0e17] animate-in fade-in duration-500 pb-32">
      {/* Brand Header */}
      <div className="bg-[#0a0e17] px-5 py-5 flex justify-between items-center sticky top-0 z-30 border-b border-white/5 backdrop-blur-md">
        <h1 className="text-2xl font-orbitron font-black text-white italic tracking-tighter">
          SHIKAAR<span className="text-[#f39c12]">.AI</span>
        </h1>
        <div className="flex items-center gap-4">
           <div className="bg-white/5 p-2 rounded-xl text-white/40">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 4.86 6 7.42 6 10.5V16l-2 2v1h16v-1l-2-2z"/></svg>
           </div>
           <div onClick={() => onSwitchTab('ACCOUNT')} className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f39c12] to-[#d35400] flex items-center justify-center text-black font-black shadow-lg shadow-[#f39c12]/20">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
           </div>
        </div>
      </div>

      {/* Wallet Card */}
      <div className="px-5 py-6">
        <div className="bg-gradient-to-br from-[#161d2b] to-[#0d121c] p-6 rounded-[2rem] border border-white/10 relative overflow-hidden">
          <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] mb-1">Total Wallet</p>
          <div className="flex items-baseline gap-2">
            <span className="text-[#f39c12] text-2xl font-black">₹</span>
            <span className="text-4xl font-black text-white italic tracking-tighter">{(balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="mt-4 flex gap-2">
             <button onClick={() => onSwitchTab('ACTIVITY', 'DEPOSIT')} className="flex-1 bg-[#f39c12] text-black text-[9px] font-black py-3 rounded-xl uppercase tracking-widest active:scale-95 transition-all">Deposit</button>
             <button onClick={() => onSwitchTab('ACTIVITY', 'WITHDRAW')} className="flex-1 bg-white/5 border border-white/10 text-white text-[9px] font-black py-3 rounded-xl uppercase tracking-widest active:scale-95 transition-all">Withdraw</button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-5 flex gap-2 overflow-x-auto no-scrollbar mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-5 py-3 rounded-2xl border transition-all flex items-center gap-2 whitespace-nowrap ${
              activeCategory === cat.id ? 'bg-[#f39c12] border-[#f39c12] text-black' : 'bg-white/5 border-white/10 text-white/40'
            }`}
          >
            <span className="text-sm">{cat.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-widest">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Grid - Instant Game Entry */}
      <div className="px-5 grid grid-cols-1 gap-4">
        {filteredGames.map((game) => (
          <button
            key={game.id}
            onClick={() => handleStartGame(game.id)}
            className="w-full relative active:scale-95 transition-all group"
          >
            <div className={`w-full bg-gradient-to-r ${game.color} rounded-[2rem] p-6 flex items-center justify-between border border-white/5 overflow-hidden h-32`}>
              <div className="relative z-10 space-y-1 text-left">
                {game.tag && (
                  <span className="bg-white/20 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                    {game.tag}
                  </span>
                )}
                <h4 className="text-xl font-black text-white italic font-orbitron tracking-tighter">{game.name}</h4>
                <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest">{game.description}</p>
              </div>
              <div className="relative z-10 w-20 h-20">
                <img src={game.image} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomeView;
