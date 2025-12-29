
import React from 'react';
import { UserProfile, MatchHistory } from '../types';
import { COLORS } from '../constants';

interface AccountViewProps {
  user: UserProfile;
  history: MatchHistory[];
  onLogout: () => void;
}

const AccountView: React.FC<AccountViewProps> = ({ user, history, onLogout }) => {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Profile Header */}
      <div className="flex items-center gap-4 p-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d4af37] to-yellow-600 flex items-center justify-center text-black font-black text-2xl font-orbitron shadow-xl shadow-[#d4af37]/20">
          {user.name[0]}
        </div>
        <div>
          <h2 className="text-xl font-orbitron font-black text-white">{user.name}</h2>
          <p className="text-xs text-white/40">+91 {user.phone}</p>
        </div>
        <button onClick={onLogout} className="ml-auto text-white/20 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-[#161d2b] p-5 rounded-2xl border border-white/5">
          <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">Total Won</p>
          <p className="text-3xl font-orbitron font-black text-green-400">₹{user.totalWon.toFixed(2)}</p>
        </div>
      </div>

      {/* Match History */}
      <div className="space-y-4 pb-8">
        <h3 className="text-xs font-black text-white/40 uppercase tracking-widest px-1">Battle History</h3>
        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((match) => (
              <div key={match.id} className="bg-[#161d2b] p-4 rounded-2xl border border-white/5 flex justify-between items-center group hover:border-[#d4af37]/30 transition-all">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Shikaar Arena</span>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/40">{match.duration}</span>
                  </div>
                  <p className="text-[10px] text-white/30">{new Date(match.date).toLocaleDateString()} • {match.kills} Kills</p>
                </div>
                <p className={`font-mono font-bold ${match.earnings >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                  {match.earnings >= 0 ? '+' : ''}₹{match.earnings.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-white/20 text-xs uppercase font-bold tracking-widest">No Matches Played Yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountView;
