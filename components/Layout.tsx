
import React from 'react';
import { AppTab } from '../types';

interface LayoutProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  children: React.ReactNode;
  isAdmin?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children, isAdmin }) => {
  // Removed PROMOTION tab as requested
  const tabs: { id: AppTab; label: string; icon: string }[] = [
    { id: 'HOME', label: 'Lobby', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'ACTIVITY', label: 'Wallet', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'ACCOUNT', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  if (activeTab === 'GAME') return <>{children}</>;

  return (
    <div className="h-screen bg-[#0a0e17] text-white flex flex-col overflow-hidden font-inter">
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
        {children}
        <div className="h-28 shrink-0" />
      </div>
      
      {/* Dark Theme Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#161d2b]/90 backdrop-blur-xl border-t border-white/5 flex justify-around items-center h-24 px-4 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center space-y-1.5 transition-all flex-1 py-1 ${
              activeTab === tab.id ? 'text-[#f39c12]' : 'text-white/30'
            }`}
          >
            <div className={`p-2 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-[#f39c12]/10 scale-110 shadow-[0_0_20px_rgba(243,156,18,0.1)]' : ''}`}>
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === tab.id ? 2.5 : 2} d={tab.icon} />
              </svg>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === tab.id ? 'font-bold' : ''}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
