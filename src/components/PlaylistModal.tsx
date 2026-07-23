import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Music, Check, Plus, Upload } from 'lucide-react';
import { Song, Playlist } from '../types';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  initialPlaylist?: Playlist | null;
  onSave: (playlistData: { name: string; coverUrl: string; songIds: string[] }) => void;
}

const DEFAULT_COVERS = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80',
];

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  songs,
  initialPlaylist,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [coverUrl, setCoverUrl] = useState(DEFAULT_COVERS[0]);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPlaylist) {
      setName(initialPlaylist.name);
      setCoverUrl(initialPlaylist.coverUrl || DEFAULT_COVERS[0]);
      setSelectedSongIds(initialPlaylist.songIds || []);
    } else {
      setName('');
      setCoverUrl(DEFAULT_COVERS[Math.floor(Math.random() * DEFAULT_COVERS.length)]);
      setSelectedSongIds([]);
    }
    setError(null);
  }, [initialPlaylist, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCoverUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSongSelection = (songId: string) => {
    setSelectedSongIds((prev) =>
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a playlist name.');
      return;
    }
    onSave({
      name: name.trim(),
      coverUrl,
      songIds: selectedSongIds,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#121212] border border-[#222222] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#181818]/60">
          <h2 className="text-lg font-bold text-white">
            {initialPlaylist ? 'Edit Playlist' : 'Create Playlist'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
              {error}
            </div>
          )}

          {/* Name & Cover Upload Section */}
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
            {/* Cover Photo Preview & Upload */}
            <div className="relative group w-32 h-32 flex-shrink-0 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 flex flex-col items-center justify-center">
              <img
                src={coverUrl}
                alt="Playlist cover preview"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white text-xs gap-1 font-medium">
                <Upload className="w-5 h-5" />
                <span>Upload Cover</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1 w-full space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Playlist Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. My Favorite Bangers"
                  className="font-poppins w-full px-4 py-2.5 bg-[#1A1A1A] border border-[#2B2B2B] rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#A855F7]"
                  autoFocus
                />
              </div>

              {/* Quick Cover Photo Presets */}
              <div>
                <span className="block text-[11px] font-medium text-zinc-500 mb-1.5">
                  Or pick a preset cover:
                </span>
                <div className="flex gap-2">
                  {DEFAULT_COVERS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCoverUrl(preset)}
                      className={`w-8 h-8 rounded-lg overflow-hidden border transition-all ${
                        coverUrl === preset ? 'border-[#A855F7] ring-2 ring-[#A855F7]/30' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Select Songs Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Select Favorite Music ({selectedSongIds.length} selected)
              </label>
              {selectedSongIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedSongIds([])}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Deselect all
                </button>
              )}
            </div>

            {songs.length === 0 ? (
              <div className="p-4 bg-[#181818] border border-[#242424] rounded-xl text-center text-xs text-zinc-500">
                No songs available to add. Import songs first!
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {songs.map((song) => {
                  const isSelected = selectedSongIds.includes(song.id);
                  return (
                    <div
                      key={`select-${song.id}`}
                      onClick={() => toggleSongSelection(song.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#A855F7]/10 border-[#A855F7]/50 text-white'
                          : 'bg-[#181818] border-[#222222] text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img
                          src={song.artworkUrl}
                          alt={song.title}
                          className="w-9 h-9 rounded-[4px] object-cover flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="truncate">
                          <p className="font-poppins text-xs font-normal truncate">{song.title}</p>
                          <p className="font-poppins text-[10px] text-zinc-400 truncate">{song.artist}</p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors flex-shrink-0 ${
                          isSelected
                            ? 'bg-[#A855F7] border-[#A855F7] text-white'
                            : 'border-zinc-700 bg-zinc-900 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:opacity-95 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{initialPlaylist ? 'Save Changes' : 'Create Playlist'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
