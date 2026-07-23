import React, { useState, useMemo } from 'react';
import { Search, X, Music } from 'lucide-react';
import { Song } from '../../types';
import { SongCard } from '../SongCard';

interface SearchViewProps {
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  isAdminUnlocked: boolean;
  onEditSong?: (song: Song) => void;
  onDeleteSong?: (song: Song) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  songs,
  currentSong,
  isPlaying,
  onPlaySong,
  isAdminUnlocked,
  onEditSong,
  onDeleteSong,
}) => {
  const [query, setQuery] = useState('');

  const filteredSongs = useMemo(() => {
    if (!query.trim()) return songs;
    const q = query.toLowerCase().trim();
    return songs.filter(
      (song) =>
        song.title.toLowerCase().includes(q) ||
        song.artist.toLowerCase().includes(q) ||
        song.album.toLowerCase().includes(q)
    );
  }, [songs, query]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const clearQuery = () => {
    setQuery('');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-28 md:pb-28">
      {/* Search Header */}
      <h1 className="text-xl md:text-2xl font-bold text-white mb-4">Search</h1>

      {/* Search Input Bar */}
      <div className="relative w-full max-w-2xl mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input
          id="search-input"
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="Search by song title, artist, or album..."
          className="font-poppins w-full pl-12 pr-10 py-3.5 bg-[#181818] border border-[#282828] focus:border-[#7C3AED] text-white rounded-2xl placeholder-zinc-500 text-sm outline-none transition-all shadow-lg"
        />
        {query && (
          <button
            onClick={clearQuery}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white rounded-full bg-white/5"
            aria-label="Clear search query"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results Title */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          {query ? `Search Results (${filteredSongs.length})` : 'Imported Songs'}
        </h2>
      </div>

      {/* Song List / Grid */}
      {filteredSongs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-[#141414] border border-[#222222] rounded-2xl text-center my-4">
          <Music className="w-8 h-8 text-zinc-600 mb-2" />
          <p className="text-sm text-zinc-400">No songs found matching "{query}"</p>
        </div>
      ) : (
        <>
          {/* Mobile list */}
          <div className="md:hidden flex flex-col gap-2.5">
            {filteredSongs.map((song) => (
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

          {/* Desktop grid */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredSongs.map((song) => (
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
  );
};
