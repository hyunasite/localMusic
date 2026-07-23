import React, { useState } from 'react';
import { Song, Playlist } from '../../types';
import { SongCard } from '../SongCard';
import { History, Library as LibraryIcon, Music, ListMusic, Plus, Play, FolderPlus } from 'lucide-react';
import { getRecentlyListenedIds } from '../../utils/storage';
import { PlaylistModal } from '../PlaylistModal';
import { PlaylistDetailModal } from '../PlaylistDetailModal';

interface LibraryViewProps {
  songs: Song[];
  playlists: Playlist[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onOpenPlayingNow?: () => void;
  isAdminUnlocked: boolean;
  onEditSong?: (song: Song) => void;
  onDeleteSong?: (song: Song) => void;
  onCreatePlaylist: (playlistData: { name: string; coverUrl: string; songIds: string[] }) => void;
  onUpdatePlaylist: (playlistId: string, updatedFields: Partial<Playlist>) => void;
  onDeletePlaylist: (playlistId: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  songs,
  playlists,
  currentSong,
  isPlaying,
  onPlaySong,
  onOpenPlayingNow,
  isAdminUnlocked,
  onEditSong,
  onDeleteSong,
  onCreatePlaylist,
  onUpdatePlaylist,
  onDeletePlaylist,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [activeDetailPlaylist, setActiveDetailPlaylist] = useState<Playlist | null>(null);

  const recentlyListenedIds = getRecentlyListenedIds();

  // Find song objects corresponding to recently listened IDs
  const recentlyListenedSongs = recentlyListenedIds
    .map((id) => songs.find((s) => s.id === id))
    .filter((s): s is Song => s !== undefined);

  const handleOpenCreate = () => {
    setEditingPlaylist(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setIsModalOpen(true);
  };

  const handleSavePlaylist = (playlistData: { name: string; coverUrl: string; songIds: string[] }) => {
    if (editingPlaylist) {
      onUpdatePlaylist(editingPlaylist.id, playlistData);
      // Update local state if detail view is open
      if (activeDetailPlaylist && activeDetailPlaylist.id === editingPlaylist.id) {
        setActiveDetailPlaylist({
          ...activeDetailPlaylist,
          ...playlistData,
        });
      }
    } else {
      onCreatePlaylist(playlistData);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-28 md:pb-28">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between w-full mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
          Library
        </h1>
        <button
          onClick={handleOpenCreate}
          title="New Playlist"
          aria-label="New Playlist"
          className="w-9 h-9 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:opacity-95 text-white rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* 1. Playlists Section OVER Recently Listened */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-[#A855F7]" />
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
              Playlists ({playlists.length})
            </h2>
          </div>
        </div>

        {playlists.length === 0 ? (
          <div
            onClick={handleOpenCreate}
            className="group p-6 bg-[#141414] hover:bg-[#181818] border border-[#222222] border-dashed hover:border-[#A855F7]/50 rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
          >
            <div className="w-10 h-10 rounded-full bg-[#1F1F1F] group-hover:bg-[#A855F7]/20 text-zinc-400 group-hover:text-[#A855F7] flex items-center justify-center transition-colors">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-300 group-hover:text-white">Create your first playlist</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Name your playlist, pick a photo, and add your favorite music!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {playlists.map((playlist) => (
              <div
                key={`pl-card-${playlist.id}`}
                onClick={() => setActiveDetailPlaylist(playlist)}
                className="group relative bg-[#141414] hover:bg-[#1A1A1A] border border-[#222222] hover:border-[#A855F7]/40 rounded-2xl p-3 cursor-pointer transition-all duration-200 flex flex-col"
              >
                {/* Playlist Cover */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-900 mb-3 shadow-md">
                  <img
                    src={playlist.coverUrl}
                    alt={playlist.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-[#A855F7] text-white flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Playlist Name & Song Count */}
                <h3 className="font-poppins text-xs font-medium text-white truncate leading-tight group-hover:text-[#A855F7] transition-colors">
                  {playlist.name}
                </h3>
                <p className="text-[10px] text-zinc-500 font-medium mt-1">
                  {playlist.songIds?.length || 0} {(playlist.songIds?.length === 1) ? 'song' : 'songs'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Recently Listened Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-[#A855F7]" />
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            Recently Listened
          </h2>
        </div>

        {recentlyListenedSongs.length === 0 ? (
          <div className="p-6 bg-[#141414] border border-[#222222] rounded-2xl text-center text-xs text-zinc-500">
            No recently listened songs yet. Play any song to track listening history!
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {recentlyListenedSongs.map((song) => (
              <SongCard
                key={`recent-${song.id}`}
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
        )}
      </div>

      {/* 3. All Offline Library Songs Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <LibraryIcon className="w-4 h-4 text-[#A855F7]" />
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            All Local Library ({songs.length})
          </h2>
        </div>

        {songs.length === 0 ? (
          <div className="p-8 bg-[#141414] border border-[#222222] rounded-2xl text-center">
            <Music className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-400">Library is currently empty.</p>
          </div>
        ) : (
          <>
            <div className="md:hidden flex flex-col gap-2.5">
              {songs.map((song) => (
                <SongCard
                  key={`all-${song.id}`}
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

            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {songs.map((song) => (
                <SongCard
                  key={`all-grid-${song.id}`}
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

      {/* Modals */}
      <PlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        songs={songs}
        initialPlaylist={editingPlaylist}
        onSave={handleSavePlaylist}
      />

      <PlaylistDetailModal
        isOpen={!!activeDetailPlaylist}
        onClose={() => setActiveDetailPlaylist(null)}
        playlist={activeDetailPlaylist}
        allSongs={songs}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlaySong={onPlaySong}
        onOpenPlayingNow={onOpenPlayingNow}
        onEditPlaylist={handleOpenEdit}
        onUpdatePlaylist={onUpdatePlaylist}
        onDeletePlaylist={onDeletePlaylist}
        isAdminUnlocked={isAdminUnlocked}
        onEditSong={onEditSong}
        onDeleteSong={onDeleteSong}
      />
    </div>
  );
};
