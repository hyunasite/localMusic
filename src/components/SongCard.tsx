import React from 'react';
import { Play, Pause, Edit3, Trash2, Volume2 } from 'lucide-react';
import { Song } from '../types';
import { formatDuration } from '../utils/formatters';

interface SongCardProps {
  song: Song;
  isCurrentlyPlaying: boolean;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
  isAdminUnlocked?: boolean;
  onEdit?: (song: Song) => void;
  onDelete?: (song: Song) => void;
  layout?: 'list' | 'grid';
}

export const SongCard: React.FC<SongCardProps> = ({
  song,
  isCurrentlyPlaying,
  isPlaying,
  onPlay,
  isAdminUnlocked,
  onEdit,
  onDelete,
  layout = 'list',
}) => {
  if (layout === 'grid') {
    return (
      <div
        onClick={() => onPlay(song)}
        className="group relative bg-[#181818] border border-[#242424] hover:border-[#7C3AED]/40 p-3.5 rounded-2xl transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] cursor-pointer flex flex-col"
      >
        {/* Artwork */}
        <div className="relative aspect-square w-full rounded-[4px] overflow-hidden bg-[#222222] mb-3 border border-white/5">
          <img
            src={song.artworkUrl}
            alt={song.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Hover Play overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay(song);
              }}
              className="w-12 h-12 rounded-full bg-[#7C3AED] hover:bg-[#A855F7] text-white flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
            >
              {isCurrentlyPlaying && isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>
          </div>

          {/* Currently playing badge */}
          {isCurrentlyPlaying && (
            <div className="absolute top-2 right-2 bg-[#7C3AED] text-white p-1.5 rounded-full shadow-lg">
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            </div>
          )}
        </div>

        {/* Info */}
        <h3 className="font-poppins font-normal text-sm text-white truncate group-hover:text-[#A855F7] transition-colors">
          {song.title}
        </h3>
        <p className="font-poppins text-xs text-zinc-400 truncate mt-0.5">{song.artist}</p>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/50 text-[11px] text-zinc-500 font-mono">
          <span>{formatDuration(song.duration)}</span>

          {isAdminUnlocked && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(song);
                  }}
                  className="p-1 hover:text-white text-zinc-400"
                  title="Edit song"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(song);
                  }}
                  className="p-1 hover:text-red-400 text-zinc-400"
                  title="Delete song"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // LIST LAYOUT (Mobile default vertical list)
  return (
    <div
      onClick={() => onPlay(song)}
      className={`group relative bg-[#181818] border border-[#222222] hover:border-[#7C3AED]/40 p-2.5 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 shadow-md active:scale-[0.99] ${
        isCurrentlyPlaying ? 'bg-[#1F1828] border-[#7C3AED]/50' : ''
      }`}
    >
      {/* Artwork */}
      <div className="relative w-14 h-14 rounded-[4px] overflow-hidden bg-[#222222] flex-shrink-0 border border-white/5">
        <img
          src={song.artworkUrl}
          alt={song.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        {isCurrentlyPlaying && (
          <div className="absolute inset-0 bg-[#7C3AED]/40 backdrop-blur-[1px] flex items-center justify-center">
            {isPlaying ? (
              <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
            ) : (
              <Play className="w-4 h-4 text-white fill-current" />
            )}
          </div>
        )}
      </div>

      {/* Info: Title & Artist */}
      <div className="min-w-0 flex-1">
        <h3 className={`font-poppins font-normal text-sm truncate ${isCurrentlyPlaying ? 'text-[#A855F7]' : 'text-white'}`}>
          {song.title}
        </h3>
        <p className="font-poppins text-xs text-zinc-400 truncate mt-0.5">{song.artist}</p>
      </div>

      {/* Duration */}
      <span className="text-xs text-zinc-500 font-mono flex-shrink-0">
        {formatDuration(song.duration)}
      </span>

      {/* Admin quick buttons if unlocked */}
      {isAdminUnlocked && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(song);
              }}
              className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5"
              title="Edit song"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(song);
              }}
              className="p-2 text-zinc-400 hover:text-red-400 rounded-full hover:bg-white/5"
              title="Delete song"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Play Button */}
      <button
        id={`song-play-btn-${song.id}`}
        onClick={(e) => {
          e.stopPropagation();
          onPlay(song);
        }}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-90 ${
          isCurrentlyPlaying
            ? 'bg-[#7C3AED] text-white shadow-[0_0_12px_rgba(124,58,237,0.5)]'
            : 'bg-[#242424] hover:bg-[#7C3AED] text-zinc-300 hover:text-white'
        }`}
        aria-label="Play song"
      >
        {isCurrentlyPlaying && isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>
    </div>
  );
};
