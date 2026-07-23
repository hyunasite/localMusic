import React from 'react';
import { Home, Search, Library, Lock, Unlock, Headphones } from 'lucide-react';
import { TabType } from '../types';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isAdminUnlocked: boolean;
  onAdminClick: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  isAdminUnlocked,
  onAdminClick,
}) => {
  return (
    <>
      {/* MOBILE FIXED BOTTOM NAVIGATION (Fixed bottom navigation with only three tabs: Home, Search, Library) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0D0D0D]/95 backdrop-blur-md border-t border-[#1C1C1C] h-[64px] flex items-center justify-around px-2">
        <button
          id="nav-tab-home"
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
            activeTab === 'home' ? 'text-[#A855F7]' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Home className="w-5 h-5 stroke-[1.75]" />
          <span className="text-[11px] font-medium tracking-tight">Home</span>
        </button>

        <button
          id="nav-tab-search"
          onClick={() => onTabChange('search')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
            activeTab === 'search' ? 'text-[#A855F7]' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Search className="w-5 h-5 stroke-[1.75]" />
          <span className="text-[11px] font-medium tracking-tight">Search</span>
        </button>

        <button
          id="nav-tab-library"
          onClick={() => onTabChange('library')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
            activeTab === 'library' ? 'text-[#A855F7]' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Library className="w-5 h-5 stroke-[1.75]" />
          <span className="text-[11px] font-medium tracking-tight">Library</span>
        </button>
      </nav>

      {/* DESKTOP LEFT SIDEBAR NAVIGATION */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-[#0D0D0D] border-r border-[#1C1C1C] p-6 fixed top-0 left-0 z-30 select-none">
        {/* App Logo - Headphones Icon only */}
        <div className="flex items-center mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)]">
            <Headphones className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col gap-2 mb-8">
          <button
            id="desktop-sidebar-home"
            onClick={() => onTabChange('home')}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'home'
                ? 'bg-[#181818] text-white border border-[#2A2A2A] shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-[#141414]'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'home' ? 'text-[#A855F7]' : ''}`} />
            <span>Home</span>
          </button>

          <button
            id="desktop-sidebar-search"
            onClick={() => onTabChange('search')}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'search'
                ? 'bg-[#181818] text-white border border-[#2A2A2A] shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-[#141414]'
            }`}
          >
            <Search className={`w-5 h-5 ${activeTab === 'search' ? 'text-[#A855F7]' : ''}`} />
            <span>Search</span>
          </button>

          <button
            id="desktop-sidebar-library"
            onClick={() => onTabChange('library')}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'library'
                ? 'bg-[#181818] text-white border border-[#2A2A2A] shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-[#141414]'
            }`}
          >
            <Library className={`w-5 h-5 ${activeTab === 'library' ? 'text-[#A855F7]' : ''}`} />
            <span>Library</span>
          </button>
        </div>

        {/* Sidebar Admin Status Banner */}
        <div className="mt-auto pt-6 border-t border-[#1C1C1C]">
          <button
            id="desktop-sidebar-admin-btn"
            onClick={onAdminClick}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
              isAdminUnlocked
                ? 'bg-[#7C3AED]/10 border-[#7C3AED]/40 text-[#A855F7]'
                : 'bg-[#141414] border-[#222222] text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isAdminUnlocked ? (
                <Unlock className="w-4 h-4 text-[#A855F7]" />
              ) : (
                <Lock className="w-4 h-4 text-zinc-500" />
              )}
              <span className="text-xs font-semibold">
                {isAdminUnlocked ? 'Admin Active' : 'Admin Lock'}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-zinc-400">
              {isAdminUnlocked ? 'PIN Set' : 'Locked'}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
