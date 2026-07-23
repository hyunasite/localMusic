import React from 'react';
import { Lock, Unlock, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  isAdminUnlocked: boolean;
  onAdminClick: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  isAdminUnlocked,
  onAdminClick,
  title = 'Welcome',
}) => {
  return (
    <header className="flex items-center justify-between w-full pt-4 pb-3 px-4 md:px-8 bg-[#0D0D0D]">
      {/* Left: Welcome */}
      <h1 
        className="text-2xl md:text-3xl font-semibold text-white tracking-tight"
        style={{ fontFamily: "'Object Sans', 'SF Pro Display', sans-serif" }}
      >
        {title}
      </h1>

      {/* Right: Lock icon button (Admin) - No other buttons */}
      <button
        id="topbar-admin-lock-btn"
        onClick={onAdminClick}
        className={`p-2.5 rounded-full transition-all flex items-center justify-center border ${
          isAdminUnlocked
            ? 'bg-[#7C3AED] border-[#A855F7] text-white shadow-[0_0_12px_rgba(124,58,237,0.4)] scale-105'
            : 'bg-[#181818] border-[#2A2A2A] text-zinc-300 hover:text-white hover:border-[#7C3AED]/50'
        }`}
        title={isAdminUnlocked ? 'Admin Mode Unlocked' : 'Admin Lock (Enter PIN)'}
        aria-label="Admin settings"
      >
        {isAdminUnlocked ? (
          <Unlock className="w-5 h-5" />
        ) : (
          <Lock className="w-5 h-5" />
        )}
      </button>
    </header>
  );
};
