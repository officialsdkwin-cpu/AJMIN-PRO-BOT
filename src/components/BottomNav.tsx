import React from 'react';
import { Home, Gamepad2, History, User } from 'lucide-react';
import { NavTab } from '../types';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs: Array<{ id: NavTab; label: string; subLabel: string; icon: React.ReactNode }> = [
    {
      id: 'home',
      label: 'HOME',
      subLabel: 'হোম',
      icon: <Home className="w-5 h-5" />
    },
    {
      id: 'game',
      label: 'GAME',
      subLabel: 'গেম',
      icon: <Gamepad2 className="w-5 h-5" />
    },
    {
      id: 'hestori',
      label: 'HESTORI',
      subLabel: 'হিস্টোরি',
      icon: <History className="w-5 h-5" />
    },
    {
      id: 'profile',
      label: 'PROFILE',
      subLabel: 'প্রোফাইল',
      icon: <User className="w-5 h-5" />
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c051a]/95 backdrop-blur-md border-t border-[#ff477e]/30 shadow-[0_-4px_25px_rgba(255,71,126,0.22)] flex justify-center">
      <div className="w-full max-w-[480px] grid grid-cols-4 px-2 py-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-white'
                  : 'text-purple-300/60 hover:text-purple-200'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-8 h-1 bg-gradient-to-r from-[#ff3366] via-[#c056d6] to-[#7928ca] rounded-full shadow-[0_0_10px_#ff3366]" />
              )}
              <div
                className={`p-1 rounded-lg transition-transform duration-200 ${
                  isActive
                    ? 'bg-gradient-to-tr from-[#ff3366] via-[#ba38ca] to-[#7928ca] text-white shadow-[0_0_14px_rgba(255,51,102,0.5)] scale-110'
                    : 'text-purple-400'
                }`}
              >
                {tab.icon}
              </div>
              <span
                className={`text-[11px] font-black tracking-wider uppercase mt-0.5 ${
                  isActive ? 'text-[#ff85c0] drop-shadow-[0_0_8px_rgba(255,133,192,0.6)]' : 'text-purple-300/70'
                }`}
              >
                {tab.label}
              </span>
              <span className="text-[9px] text-purple-400/60 leading-tight">
                {tab.subLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
