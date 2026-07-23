import React, { useState, useEffect } from 'react';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, VolumeX, Disc } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Song, RepeatMode } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { formatDuration } from '../utils/formatters';

interface PlayingNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSong: Song | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const PlayingNowModal: React.FC<PlayingNowModalProps> = ({
  isOpen,
  onClose,
  currentSong,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const updateState = () => {
      setCurrentTime(audioEngine.getCurrentTime());
      setDuration(audioEngine.getDuration());
      setVolume(audioEngine.getVolume());
      setRepeatMode(audioEngine.getRepeatMode());
      setIsShuffle(audioEngine.getIsShuffle());
    };

    updateState();
    const unsubscribe = audioEngine.subscribe(updateState);
    return () => unsubscribe();
  }, []);

  if (!isOpen || !currentSong) return null;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    audioEngine.seek(val);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleToggleRepeat = () => {
    const nextMode = audioEngine.toggleRepeat();
    setRepeatMode(nextMode);
  };

  const handleToggleShuffle = () => {
    const next = audioEngine.toggleShuffle();
    setIsShuffle(next);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[70] bg-[#0D0D0D] text-white flex flex-col justify-between p-6 overflow-y-auto"
      >
        {/* Background glow gradient */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#7C3AED]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Bar */}
        <div className="relative z-10 flex items-center justify-between w-full max-w-md mx-auto pt-2 pb-4">
          <button
            id="playing-now-back-btn"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
            aria-label="Minimize player"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
          <span className="text-xs font-normal tracking-widest text-zinc-400 uppercase">
            PLAYING NOW
          </span>
          <div className="w-10" />
        </div>

        {/* Center Artwork */}
        <div className="relative z-10 my-auto flex flex-col items-center w-full max-w-md mx-auto">
          <div className="relative group w-full aspect-square max-w-[320px] mb-8 shadow-2xl rounded-[10px] overflow-hidden bg-[#181818] border border-white/5">
            <img
              src={currentSong.artworkUrl}
              alt={currentSong.title}
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-105' : 'scale-100 opacity-90'
              }`}
            />
            {/* Ambient vinyl/glowing effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
          </div>

          {/* Song Metadata & Repeat button aligned right on same row as artist */}
          <div className="w-full mb-6">
            <h2 className="font-poppins text-2xl font-normal text-white truncate mb-1">
              {currentSong.title}
            </h2>
            <div className="flex items-center justify-between w-full">
              <p className="font-poppins text-sm text-zinc-400 truncate font-normal">
                {currentSong.artist}
              </p>

              {/* Repeat/Loop button aligned right on artist row as requested */}
              <button
                id="playing-now-repeat-btn"
                onClick={handleToggleRepeat}
                className={`p-2 rounded-full transition-all relative ${
                  repeatMode !== 'off'
                    ? 'text-[#A855F7] bg-[#7C3AED]/20 shadow-[0_0_12px_rgba(168,85,247,0.4)] ring-1 ring-[#A855F7]/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                aria-label="Repeat mode"
                title={repeatMode === 'off' ? 'Repeat Off' : repeatMode === 'one' ? 'Repeat One' : 'Repeat All'}
              >
                {repeatMode === 'off' ? (
                  <div className="relative inline-flex items-center justify-center">
                    <Repeat className="w-5 h-5" />
                    <svg
                      className="absolute inset-0 w-5 h-5 pointer-events-none"
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
                  <Repeat className="w-5 h-5 text-[#A855F7]" />
                )}
                {repeatMode === 'one' && (
                  <span className="absolute text-[9px] font-bold top-1 right-1 text-[#A855F7]">1</span>
                )}
              </button>
            </div>
          </div>

          {/* Progress Slider */}
          <div className="w-full mb-6">
            <input
              id="playing-now-seek-slider"
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={handleSeekChange}
              className="custom-progress-slider"
              style={{
                background: `linear-gradient(to right, #ffffff ${
                  duration > 0 ? (currentTime / duration) * 100 : 0
                }%, #333333 ${
                  duration > 0 ? (currentTime / duration) * 100 : 0
                }%)`,
              }}
            />
            <div className="flex justify-between text-xs text-zinc-400 font-mono mt-2">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Bottom Controls (Centered): Previous, Play/Pause (largest), Next */}
          <div className="flex items-center justify-center gap-8 w-full mb-6">
            <button
              id="playing-now-prev-btn"
              onClick={onPrev}
              className="text-zinc-300 hover:text-white transition-transform active:scale-95 p-2"
              aria-label="Previous song"
            >
              <SkipBack className="w-7 h-7 fill-current" />
            </button>

            <button
              id="playing-now-play-btn"
              onClick={onTogglePlay}
              className="w-16 h-16 rounded-full bg-[#7C3AED] hover:bg-[#A855F7] text-white flex items-center justify-center shadow-[0_0_25px_rgba(124,58,237,0.5)] transition-all transform active:scale-95"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current ml-0.5" />
              )}
            </button>

            <button
              id="playing-now-next-btn"
              onClick={onNext}
              className="text-zinc-300 hover:text-white transition-transform active:scale-95 p-2"
              aria-label="Next song"
            >
              <SkipForward className="w-7 h-7 fill-current" />
            </button>
          </div>

          {/* Additional Controls: Shuffle & Volume Slider */}
          <div className="flex items-center justify-between w-full pt-4 border-t border-zinc-800/60">
            <button
              id="playing-now-shuffle-btn"
              onClick={handleToggleShuffle}
              className={`p-2 rounded-full transition-colors ${
                isShuffle
                  ? 'text-[#A855F7] bg-[#7C3AED]/20 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              aria-label="Shuffle"
            >
              <Shuffle className="w-5 h-5" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 w-36">
              <button
                id="playing-now-mute-btn"
                onClick={toggleMute}
                className="text-zinc-400 hover:text-white"
                aria-label="Toggle mute"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-zinc-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-zinc-300" />
                )}
              </button>
              <input
                id="playing-now-volume-slider"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full h-1 bg-[#262626] rounded-lg appearance-none cursor-pointer accent-[#A855F7]"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
