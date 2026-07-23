import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Maximize2, Minimize2, ChevronDown, ChevronUp, Volume2, VolumeX, Repeat, Shuffle, Music } from 'lucide-react';
import { Song, RepeatMode } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { formatDuration } from '../utils/formatters';

interface PersistentPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onExpand: () => void;
}

export const PersistentPlayer: React.FC<PersistentPlayerProps> = ({
  currentSong,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  onExpand,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const update = () => {
      setCurrentTime(audioEngine.getCurrentTime());
      setDuration(audioEngine.getDuration());
      setVolume(audioEngine.getVolume());
      setRepeatMode(audioEngine.getRepeatMode());
      setIsShuffle(audioEngine.getIsShuffle());
    };
    update();
    const unsubscribe = audioEngine.subscribe(update);
    return () => unsubscribe();
  }, []);

  if (!currentSong) return null;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    audioEngine.seek(val);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    audioEngine.setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      audioEngine.setVolume(volume || 0.8);
      setIsMuted(false);
    } else {
      audioEngine.setVolume(0);
      setIsMuted(true);
    }
  };

  const toggleRepeat = () => {
    setRepeatMode(audioEngine.toggleRepeat());
  };

  const toggleShuffle = () => {
    setIsShuffle(audioEngine.toggleShuffle());
  };

  // IF MINIMIZED: Show floating song artwork on the bottom-left side
  if (isMinimized) {
    return (
      <div className="fixed bottom-[75px] md:bottom-6 left-4 md:left-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="group relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-[#181818] border-2 border-white/20 hover:border-[#7C3AED] shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center focus:outline-none"
          title={`Restore player - ${currentSong.title}`}
          aria-label="Restore music player"
        >
          <img
            src={currentSong.artworkUrl}
            alt={currentSong.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Playing overlay indicator */}
          {isPlaying && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-[#7C3AED] ring-4 ring-[#7C3AED]/40 animate-ping" />
            </div>
          )}

          {/* Hover overlay hint */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold tracking-wider uppercase transition-opacity p-1 text-center">
            Restore
          </div>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* MOBILE MINI PLAYER BAR (Appears above bottom navigation on mobile) */}
      <div className="md:hidden fixed bottom-[65px] left-3 right-3 z-50 bg-[#181818]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-3">
        {/* Progress thin bar at top of mini bar */}
        <div className="absolute top-0 left-3 right-3 h-[2px] bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all"
            style={{ width: `${((currentTime / (duration || 1)) * 100).toFixed(1)}%` }}
          />
        </div>

        {/* Artwork + Title (Clicking opens Playing Now) */}
        <div
          onClick={onExpand}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
        >
          <img
            src={currentSong.artworkUrl}
            alt={currentSong.title}
            referrerPolicy="no-referrer"
            className="w-11 h-11 rounded-[10px] object-cover flex-shrink-0 border border-white/5"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-poppins text-sm font-normal text-white truncate leading-tight">
              {currentSong.title}
            </h4>
            <p className="font-poppins text-xs text-zinc-400 truncate mt-0.5">
              {currentSong.artist}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            id="mobile-mini-play-btn"
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-full bg-[#7C3AED] hover:bg-[#A855F7] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            id="mobile-mini-expand-btn"
            onClick={onExpand}
            className="p-2 text-zinc-400 hover:text-white"
            title="Expand Fullscreen"
            aria-label="Expand player"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            id="mobile-mini-minimize-btn"
            onClick={() => setIsMinimized(true)}
            className="p-2 text-zinc-400 hover:text-white"
            title="Minimize Player"
            aria-label="Minimize player"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* DESKTOP / TABLET PERSISTENT BOTTOM PLAYER BAR */}
      <div className="hidden md:flex fixed bottom-0 left-0 right-0 z-50 h-22 bg-[#181818] border-t border-[#262626] px-6 items-center justify-between shadow-2xl">
        {/* Left: Song Artwork & Details */}
        <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
          <div
            onClick={onExpand}
            className="relative group cursor-pointer flex-shrink-0"
          >
            <img
              src={currentSong.artworkUrl}
              alt={currentSong.title}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-[10px] object-cover border border-white/5 shadow-md"
            />
            <div className="absolute inset-0 bg-black/40 rounded-[10px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="min-w-0">
            <h4
              onClick={onExpand}
              className="font-poppins text-sm font-normal text-white truncate hover:underline cursor-pointer"
            >
              {currentSong.title}
            </h4>
            <p className="font-poppins text-xs text-zinc-400 truncate mt-0.5">
              {currentSong.artist}
            </p>
          </div>
        </div>

        {/* Center: Controls & Progress */}
        <div className="flex flex-col items-center gap-2 w-2/4 max-w-xl">
          <div className="flex items-center gap-6">
            <button
              id="desktop-player-shuffle-btn"
              onClick={toggleShuffle}
              className={`p-1.5 rounded-full transition-colors ${
                isShuffle ? 'text-[#A855F7]' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              id="desktop-player-prev-btn"
              onClick={onPrev}
              className="text-zinc-300 hover:text-white active:scale-95 transition-transform"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              id="desktop-player-play-btn"
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-full bg-[#7C3AED] hover:bg-[#A855F7] text-white flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)] active:scale-95 transition-all"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              id="desktop-player-next-btn"
              onClick={onNext}
              className="text-zinc-300 hover:text-white active:scale-95 transition-transform"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              id="desktop-player-repeat-btn"
              onClick={toggleRepeat}
              className={`p-1.5 rounded-full transition-all relative ${
                repeatMode !== 'off'
                  ? 'text-[#A855F7] bg-[#7C3AED]/20 shadow-[0_0_10px_rgba(168,85,247,0.4)] ring-1 ring-[#A855F7]/30'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title={repeatMode === 'off' ? 'Repeat Off' : repeatMode === 'one' ? 'Repeat One' : 'Repeat All'}
            >
              {repeatMode === 'off' ? (
                <div className="relative inline-flex items-center justify-center">
                  <Repeat className="w-4 h-4" />
                  <svg
                    className="absolute inset-0 w-4 h-4 pointer-events-none"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="3" y1="3" x2="21" y2="21" />
                  </svg>
                </div>
              ) : (
                <Repeat className="w-4 h-4 text-[#A855F7]" />
              )}
              {repeatMode === 'one' && (
                <span className="absolute -top-1 -right-1 text-[8px] font-bold text-[#A855F7]">1</span>
              )}
            </button>
          </div>

          {/* Progress Slider */}
          <div className="flex items-center gap-3 w-full">
            <span className="text-[11px] text-zinc-400 font-mono w-9 text-right">
              {formatDuration(currentTime)}
            </span>
            <input
              id="desktop-player-seek-slider"
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="custom-progress-slider flex-1"
              style={{
                background: `linear-gradient(to right, #ffffff ${
                  duration > 0 ? (currentTime / duration) * 100 : 0
                }%, #333333 ${
                  duration > 0 ? (currentTime / duration) * 100 : 0
                }%)`,
              }}
            />
            <span className="text-[11px] text-zinc-400 font-mono w-9">
              {formatDuration(duration)}
            </span>
          </div>
        </div>

        {/* Right: Volume, Expand & Minimize */}
        <div className="flex items-center justify-end gap-3 w-1/4 min-w-[180px]">
          <button
            id="desktop-player-mute-btn"
            onClick={toggleMute}
            className="text-zinc-400 hover:text-white"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-zinc-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-zinc-300" />
            )}
          </button>
          <input
            id="desktop-player-volume-slider"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolume}
            className="custom-progress-slider w-24"
            style={{
              background: `linear-gradient(to right, #ffffff ${
                (isMuted ? 0 : volume) * 100
              }%, #333333 ${(isMuted ? 0 : volume) * 100}%)`,
            }}
          />
          <button
            id="desktop-player-expand-btn"
            onClick={onExpand}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            title="Expand Fullscreen Player"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            id="desktop-player-minimize-btn"
            onClick={() => setIsMinimized(true)}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            title="Minimize Player"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
};

