import React from 'react';
import { Song } from '../../types';
import { Header } from '../Header';
import { SongCard } from '../SongCard';
import { Music, Plus, ShieldCheck } from 'lucide-react';

interface HomeViewProps {
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  isAdminUnlocked: boolean;
  onAdminClick: () => void;
  onEditSong?: (song: Song) => void;
  onDeleteSong?: (song: Song) => void;
  onOpenAdminUpload?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  songs,
  currentSong,
  isPlaying,
  onPlaySong,
  isAdminUnlocked,
  onAdminClick,
  onEditSong,
  onDeleteSong,
  onOpenAdminUpload,
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto pb-28 md:pb-28">
      {/* Top Bar Header (Welcome on left, Lock icon on right) */}
      <Header
        isAdminUnlocked={isAdminUnlocked}
        onAdminClick={onAdminClick}
        title="Welcome"
      />

      {/* Main Content Area */}
      <div className="px-4 md:px-8 pt-2">
        {/* Banner / Section Title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
              Imported Songs
            </h2>
            <span className="text-xs text-zinc-500 font-mono px-2 py-0.5 rounded-full bg-[#181818] border border-zinc-800">
              {songs.length}
            </span>
          </div>

          {isAdminUnlocked && onOpenAdminUpload && (
            <button
              id="home-admin-import-shortcut"
              onClick={onOpenAdminUpload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#7C3AED] hover:bg-[#A855F7] text-white text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Import Music</span>
            </button>
          )}
        </div>

        {/* Vertical List for Mobile / Grid for Desktop */}
        {songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-[#141414] border border-[#222222] rounded-2xl text-center my-6">
            <div className="w-12 h-12 rounded-full bg-[#181818] flex items-center justify-center text-zinc-500 mb-3">
              <Music className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">No Music Files Available</h3>
            <p className="text-xs text-zinc-400 max-w-xs mb-4">
              Tap the lock icon at the top right to verify as Admin and import downloaded music files.
            </p>
            <button
              onClick={onAdminClick}
              className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold shadow-lg hover:bg-[#A855F7] transition-all"
            >
              Unlock Admin
            </button>
          </div>
        ) : (
          <>
            {/* Mobile View: Vertical List */}
            <div className="md:hidden flex flex-col gap-2.5">
              {songs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  isCurrentlyPlaying={currentSong?.id === song.id}
                  isPlaying={isPlaying}
                  onPlay={onPlaySong}
                  isAdminUnlocked={isAdminUnlocked}
                  onEdit={onEditSong}
                  onDelete={onDeleteSong}
                  layout="list"
                />
              ))}
            </div>

            {/* Desktop / Tablet View: Grid Layout */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {songs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  isCurrentlyPlaying={currentSong?.id === song.id}
                  isPlaying={isPlaying}
                  onPlay={onPlaySong}
                  isAdminUnlocked={isAdminUnlocked}
                  onEdit={onEditSong}
                  onDelete={onDeleteSong}
                  layout="grid"
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
