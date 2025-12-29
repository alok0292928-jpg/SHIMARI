
import React from 'react';
import { GAME_MODES } from '../constants';

interface HomeViewProps {
  onEnterGame: (fee: number) => void;
  balance: number;
}

const HomeView: React.FC<HomeViewProps> = ({ onEnterGame, balance }) => {
  return (
    <div className="flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="relative h-56 mx-4 mt-6 rounded-3xl overflow-hidden group shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
        <img src="https://images.unsplash.com/photo-1614728263952-84ea206f99b6?auto=format&fit=crop&q=80&w=800" alt="Arena" className="absolute inset-0 w-full h-full object-cover grayscale opacity-60 group-hover:scale-105 transition-transform duration-1000" />
        <div className="absolute inset-0 z-20 p-8 flex flex-col justify-center">
          <div className="bg-[#d4af37] text-black text-[10px] font-black uppercase tracking-tighter w-fit px-2 py-0.5 rounded mb-2">SEASON 1</div>
          <h2 className="text-4xl font-orbitron font-black text-white italic leading-tight">SHIKAAR<span className="text-[#d4af37]">.AI</span></h2>
          <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Hunt Rivals • Loot Cash • Conquer</p>
        </div>
      </div>

      <div className="px-4 space-y-4">
        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] px-1">Select Entry Fee</h3>
        <div className="grid grid-cols-2 gap-3">
          {GAME_MODES.map(fee => (
            <button
              key={fee}
              onClick={() => onEnterGame(fee)}
              className="bg-[#161d2b] border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 hover:border-[#d4af37]/50 active:scale-95 transition-all group"
            >
              <span className="text-2xl font-orbitron font-black text-white group-hover:text-[#d4af37]">₹{fee}</span>
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">ENTER ARENA</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-4 pt-4">
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Active Hunters</p>
          <p className="text-xl font-orbitron font-black text-white">2,814</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Daily Payouts</p>
          <p className="text-xl font-orbitron font-black text-green-400">₹1,42,850</p>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
