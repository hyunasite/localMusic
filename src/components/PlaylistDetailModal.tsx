import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  Shuffle,
  MoreHorizontal,
  Clock,
  Edit3,
  Trash2,
  Music,
  Plus,
  PlusCircle,
  Search,
  Check,
  X,
} from 'lucide-react';
import { Playlist, Song } from '../types';
import { formatDuration } from '../utils/formatters';

interface PlaylistDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: Playlist | null;
  allSongs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onOpenPlayingNow?: () => void;
  onEditPlaylist: (playlist: Playlist) => void;
  onUpdatePlaylist?: (playlistId: string, updatedFields: Partial<Playlist>) => void;
  onDeletePlaylist: (playlistId: string) => void;
  isAdminUnlocked?: boolean;
  onEditSong?: (song: Song) => void;
  onDeleteSong?: (song: Song) => void;
}

// Fallback hash color when image cross-origin prevents canvas reading
function fallbackHashColor(str: string): { from: string; to: string } {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    from: `hsl(${hue}, 40%, 18%)`,
    to: `hsl(${hue}, 45%, 8%)`,
  };
}

export const PlaylistDetailModal: React.FC<PlaylistDetailModalProps> = ({
  isOpen,
  onClose,
  playlist,
  allSongs,
  currentSong,
  isPlaying,
  onPlaySong,
  onOpenPlayingNow,
  onEditPlaylist,
  onUpdatePlaylist,
  onDeletePlaylist,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showAddSongsModal, setShowAddSongsModal] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [bgColors, setBgColors] = useState<{ from: string; to: string }>({
    from: '#35251E',
    to: '#18100C',
  });

  // Dynamically extract dominant color from playlist cover image
  useEffect(() => {
    if (!playlist?.coverUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = playlist.coverUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 20;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 20, 20);
          const data = ctx.getImageData(0, 0, 20, 20).data;

          let r = 0,
            g = 0,
            b = 0,
            count = 0;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 128) {
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
              count++;
            }
          }

          if (count > 0) {
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);

            // Darken slightly for ultra high contrast and readability
            const darkR = Math.round(r * 0.45);
            const darkG = Math.round(g * 0.45);
            const darkB = Math.round(b * 0.45);

            const deepR = Math.round(r * 0.18);
            const deepG = Math.round(g * 0.18);
            const deepB = Math.round(b * 0.18);

            setBgColors({
              from: `rgb(${darkR}, ${darkG}, ${darkB})`,
              to: `rgb(${deepR}, ${deepG}, ${deepB})`,
            });
            return;
          }
        }
      } catch {
        // Canvas pixel extraction error fallback
      }
      setBgColors(fallbackHashColor(playlist.coverUrl));
    };

    img.onerror = () => {
      setBgColors(fallbackHashColor(playlist.coverUrl));
    };
  }, [playlist?.coverUrl]);

  if (!isOpen || !playlist) return null;

  // Filter songs that belong to this playlist
  const playlistSongs = playlist.songIds
    .map((id) => allSongs.find((s) => s.id === id))
    .filter((s): s is Song => s !== undefined);

  const handleSongClick = (song: Song) => {
    onPlaySong(song);
    if (onOpenPlayingNow) {
      onOpenPlayingNow();
    }
  };

  const handlePlayAll = () => {
    if (playlistSongs.length > 0) {
      handleSongClick(playlistSongs[0]);
    }
  };

  const handleShufflePlay = () => {
    if (playlistSongs.length > 0) {
      const randomIndex = Math.floor(Math.random() * playlistSongs.length);
      handleSongClick(playlistSongs[randomIndex]);
    }
  };

  const handleToggleSongInPlaylist = (songId: string) => {
    const isAlreadyIn = playlist.songIds.includes(songId);
    let newSongIds: string[];
    if (isAlreadyIn) {
      newSongIds = playlist.songIds.filter((id) => id !== songId);
    } else {
      newSongIds = [...playlist.songIds, songId];
    }

    if (onUpdatePlaylist) {
      onUpdatePlaylist(playlist.id, { songIds: newSongIds });
    }
  };

  const filteredAddSongs = allSongs.filter(
    (s) =>
      s.title.toLowerCase().includes(addSearchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(addSearchQuery.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-30 text-white overflow-y-auto custom-scrollbar flex flex-col transition-colors duration-500"
      style={{
        background: `linear-gradient(180deg, ${bgColors.from} 0%, ${bgColors.to} 100%)`,
      }}
    >
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex-1 flex flex-col">
        {/* Mobile View: Large Image with Chevron Down Top-Left and Playlist Name inside Bottom-Left */}
        <div className="block sm:hidden mb-6">
          <div className="relative w-full aspect-square max-h-[380px] rounded-3xl overflow-hidden shadow-2xl bg-black/30 border border-white/10">
            <img
              src={playlist.coverUrl}
              alt={playlist.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />

            {/* Back Button Overlay Top-Left */}
            <button
              onClick={onClose}
              className="absolute top-3 left-3 p-2 text-white bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full transition-all cursor-pointer z-10"
              title="Back to Library"
            >
              <ChevronDown className="w-6 h-6" />
            </button>

            {/* Bottom-Left Overlay inside Playlist Image */}
            <div className="absolute inset-x-0 bottom-0 pt-16 pb-4 px-5 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end">
              <h1 className="font-poppins text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-tight drop-shadow-md">
                {playlist.name}
              </h1>
              <p className="text-xs font-medium text-white/80 mt-1">
                {playlistSongs.length} {playlistSongs.length === 1 ? 'song' : 'songs'}
              </p>
            </div>
          </div>
        </div>

        {/* Desktop View (sm and up): Top Back Button & Side-by-Side Hero Header */}
        <div className="hidden sm:block">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={onClose}
              className="p-2 text-zinc-300 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-all cursor-pointer"
              title="Back to Library"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-end gap-8 mb-8">
            <div className="w-56 h-56 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex-shrink-0 bg-black/30">
              <img
                src={playlist.coverUrl}
                alt={playlist.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex-1 space-y-2">
              <h1 className="font-poppins text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
                {playlist.name}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-white/80">
                {playlistSongs.length} {playlistSongs.length === 1 ? 'song' : 'songs'}
              </p>
            </div>
          </div>
        </div>

        {/* Controls Bar: Play (slightly decreased size), Shuffle, 3-Dots, Plus Circle */}
        <div className="flex items-center justify-between mb-4 gap-4 relative">
          {/* Left Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Play Button */}
            <button
              onClick={handlePlayAll}
              disabled={playlistSongs.length === 0}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl disabled:opacity-40 cursor-pointer"
              title="Play All"
            >
              {currentSong && playlist.songIds.includes(currentSong.id) && isPlaying ? (
                <Pause className="w-4 h-4 fill-black" />
              ) : (
                <Play className="w-4 h-4 fill-black ml-0.5" />
              )}
            </button>

            {/* Shuffle Button */}
            <button
              onClick={handleShufflePlay}
              disabled={playlistSongs.length === 0}
              className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 cursor-pointer"
              title="Shuffle Play"
            >
              <Shuffle className="w-5 h-5" />
            </button>

            {/* 3-Dots Options Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="More Options"
              >
                <MoreHorizontal className="w-6 h-6" />
              </button>

              {/* Dropdown Menu Popup */}
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute left-0 mt-2 w-48 bg-black/80 border border-white/15 rounded-2xl shadow-2xl z-20 py-1.5 overflow-hidden backdrop-blur-xl">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEditPlaylist(playlist);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-zinc-200 hover:text-white hover:bg-white/15 flex items-center gap-2.5 transition-colors"
                    >
                      <Edit3 className="w-4 h-4 text-amber-400" />
                      <span>Edit Playlist Details</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        if (confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
                          onDeletePlaylist(playlist.id);
                          onClose();
                        }
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-rose-400 hover:bg-rose-500/15 flex items-center gap-2.5 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      <span>Delete Playlist</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Controls: Plus Circle (Add Music to Playlist) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddSongsModal(true)}
              className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Add Music to Playlist"
            >
              <PlusCircle className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Divider Line */}
        <div className="w-full h-px bg-white/10 mb-6" />

        {/* Playlist Songs Table/List View */}
        <div className="flex-1 space-y-2.5 pb-36 sm:pb-32">
          {playlistSongs.length === 0 ? (
            <div className="p-12 text-center bg-black/20 border border-white/10 rounded-2xl">
              <Music className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-zinc-300">
                No songs in this playlist yet.
              </p>
              <button
                onClick={() => setShowAddSongsModal(true)}
                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Songs to Playlist</span>
              </button>
            </div>
          ) : (
            playlistSongs.map((song) => {
              const isSelectedSong = currentSong?.id === song.id;
              return (
                <div
                  key={`pl-row-${song.id}`}
                  onClick={() => handleSongClick(song)}
                  className={`group flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelectedSong
                      ? 'bg-white/20 border-white/40 text-white shadow-lg'
                      : 'bg-black/20 hover:bg-black/40 border-white/5 text-zinc-200'
                  }`}
                >
                  {/* Left Column: Thumbnail Artwork + Title & Artist Name stacked */}
                  <div className="flex items-center gap-3.5 overflow-hidden flex-1 mr-4">
                    <div className="relative w-12 h-12 rounded-[4px] overflow-hidden bg-black/40 flex-shrink-0 border border-white/10">
                      <img
                        src={song.artworkUrl}
                        alt={song.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {isSelectedSong && isPlaying && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                        </div>
                      )}
                    </div>

                    <div className="truncate">
                      <p
                        className={`font-poppins text-sm font-normal truncate ${
                          isSelectedSong ? 'text-white' : 'text-zinc-100'
                        }`}
                      >
                        {song.title}
                      </p>
                      <p className="font-poppins text-xs text-white/70 font-medium truncate mt-0.5">
                        {song.artist}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Clock Icon + Duration */}
                  <div className="flex items-center justify-end gap-1.5 text-xs text-white/80 font-mono font-medium flex-shrink-0 ml-2">
                    <Clock className="w-3.5 h-3.5 text-white/60" />
                    <span>{formatDuration(song.duration)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Songs Modal Overlay */}
      {showAddSongsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#181818] border border-white/15 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Add Songs to Playlist</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Select songs from your library to add to "{playlist.name}"
                </p>
              </div>
              <button
                onClick={() => setShowAddSongsModal(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={addSearchQuery}
                  onChange={(e) => setAddSearchQuery(e.target.value)}
                  placeholder="Search title or artist..."
                  className="bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none w-full"
                />
                {addSearchQuery && (
                  <button onClick={() => setAddSearchQuery('')} className="text-zinc-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Songs List */}
            <div className="p-5 pt-2 flex-1 overflow-y-auto space-y-2 custom-scrollbar">
              {filteredAddSongs.length === 0 ? (
                <p className="text-center text-xs text-zinc-500 py-8">
                  {addSearchQuery ? 'No matching songs found.' : 'No songs available in library.'}
                </p>
              ) : (
                filteredAddSongs.map((song) => {
                  const isAdded = playlist.songIds.includes(song.id);
                  return (
                    <div
                      key={`add-song-${song.id}`}
                      onClick={() => handleToggleSongInPlaylist(song.id)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                          : 'bg-black/30 hover:bg-black/50 border-white/5 text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden mr-3">
                        <img
                          src={song.artworkUrl}
                          alt={song.title}
                          className="w-10 h-10 rounded-[4px] object-cover flex-shrink-0 border border-white/10"
                          referrerPolicy="no-referrer"
                        />
                        <div className="truncate">
                          <p className="text-xs font-bold truncate text-white">{song.title}</p>
                          <p className="text-[11px] text-zinc-400 truncate">{song.artist}</p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSongInPlaylist(song.id);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all flex-shrink-0 ${
                          isAdded
                            ? 'bg-emerald-500 text-black shadow-md'
                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowAddSongsModal(false)}
                className="px-5 py-2 bg-[#7C3AED] hover:bg-[#A855F7] text-white rounded-xl text-xs font-semibold shadow-lg transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
