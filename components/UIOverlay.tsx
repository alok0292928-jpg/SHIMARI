
import React from 'react';
import { KillEvent, Worm } from '../types';

interface UIOverlayProps {
  walletBalance: number;
  wormBalance: number;
  killFeed: KillEvent[];
  leaderboard: Worm[];
  status: string;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ walletBalance, wormBalance, killFeed, leaderboard, status }) => {
  return (
    <div className="fixed inset-0 pointer-events-none p-4 sm:p-6 flex flex-col justify-between z-40 select-none">
      {/* Top Section: Balance and Leaderboard */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          {/* Main Wallet Display */}
          <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl flex items-center gap-3 w-fit">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <div>
              <p className="text-[8px] text-white/40 font-orbitron uppercase tracking-[0.2em]">Total Wallet</p>
              <p className="text-xl font-orbitron font-black text-white leading-none">
                ₹{(walletBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Arena Loot Display */}
          <div className="bg-black/80 backdrop-blur-xl border border-[#d4af37]/30 p-3 rounded-2xl shadow-2xl flex items-center gap-3 w-fit animate-in slide-in-from-left duration-500">
            <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <div>
              <p className="text-[8px] text-[#d4af37]/70 font-orbitron uppercase tracking-[0.2em]">Match Loot</p>
              <p className="text-xl font-orbitron font-black text-[#d4af37] animate-loot leading-none">
                ₹{(wormBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl w-48 sm:w-64">
          <p className="text-[10px] text-white/40 font-orbitron uppercase mb-3 tracking-widest text-right">Arena Rankings</p>
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((worm, i) => (
              <div key={worm.id} className="flex justify-between items-center">
                <span className={`text-[10px] font-bold truncate max-w-[80px] sm:max-w-[120px] ${worm.isPlayer ? 'text-[#d4af37]' : 'text-white/70'}`}>
                  {i + 1}. {worm.name}
                </span>
                <span className="text-[10px] text-[#d4af37] font-mono">₹{(worm.balance || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Kill Feed */}
      <div className="max-w-xs space-y-2 overflow-hidden pb-32">
        {killFeed.map((kill) => (
          <div 
            key={kill.id} 
            className="bg-red-500/10 border-l-4 border-red-500/80 backdrop-blur-sm px-3 py-2 flex flex-col animate-in slide-in-from-left duration-300"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-white uppercase">{kill.killerName}</span>
              <span className="text-[10px] text-red-400/80">Looted</span>
              <span className="text-[10px] font-bold text-white uppercase">{kill.victimName}</span>
            </div>
            <span className="text-xs font-black text-green-400 font-orbitron">+ ₹{(kill.lootAmount || 0).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UIOverlay;
