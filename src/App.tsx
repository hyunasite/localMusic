import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import { Song, Playlist, TabType } from './types';
import {
  getAdminPin,
  addRecentlyListenedId,
} from './utils/storage';
import {
  subscribeToFirestoreSongs,
  addSongToFirestore,
  updateSongInFirestore,
  deleteSongFromFirestore,
  subscribeToFirestorePlaylists,
  addPlaylistToFirestore,
  updatePlaylistInFirestore,
  deletePlaylistFromFirestore,
} from './utils/firebaseStorage';
import { audioEngine } from './utils/audioEngine';

import { Navigation } from './components/Navigation';
import { HomeView } from './components/views/HomeView';
import { SearchView } from './components/views/SearchView';
import { LibraryView } from './components/views/LibraryView';
import { AdminDashboard } from './components/views/AdminDashboard';
import { PinModal } from './components/PinModal';
import { PlayingNowModal } from './components/PlayingNowModal';
import { PersistentPlayer } from './components/PersistentPlayer';
import { LoadingScreen } from './components/LoadingScreen';
import { ConnectionStatusToast } from './components/ConnectionStatusToast';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showStatusToast, setShowStatusToast] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  // Track browser network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // App initialization timer (1.5 seconds loading screen)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Status notification popup: appears 1s after loading screen finishes, lasts 1.5s
  useEffect(() => {
    if (!isLoading) {
      const showTimer = setTimeout(() => {
        setShowStatusToast(true);
        const hideTimer = setTimeout(() => {
          setShowStatusToast(false);
        }, 1500);
        return () => clearTimeout(hideTimer);
      }, 1000);
      return () => clearTimeout(showTimer);
    }
  }, [isLoading]);

  // Admin lock state
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Audio state
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingNowOpen, setIsPlayingNowOpen] = useState(false);

  // Subscribe to live Firestore song updates across all devices
  useEffect(() => {
    const unsubscribe = subscribeToFirestoreSongs((updatedSongs) => {
      setSongs(updatedSongs);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to live Firestore playlist updates across all devices
  useEffect(() => {
    const unsubscribe = subscribeToFirestorePlaylists((updatedPlaylists) => {
      setPlaylists(updatedPlaylists);
    });
    return () => unsubscribe();
  }, []);

  // Sync audio engine state updates
  useEffect(() => {
    const update = () => {
      setCurrentSong(audioEngine.getCurrentSong());
      setIsPlaying(audioEngine.getIsPlaying());
    };
    update();
    const unsubscribe = audioEngine.subscribe(update);
    return () => unsubscribe();
  }, []);

  // Next / Prev track handlers
  const handlePlayNext = useCallback(() => {
    if (!currentSong || songs.length === 0) return;
    const currentIndex = songs.findIndex((s) => s.id === currentSong.id);
    let nextIndex = 0;

    if (audioEngine.getIsShuffle()) {
      nextIndex = Math.floor(Math.random() * songs.length);
    } else {
      nextIndex = (currentIndex + 1) % songs.length;
    }

    const nextSong = songs[nextIndex];
    if (nextSong) {
      audioEngine.playSong(nextSong);
      addRecentlyListenedId(nextSong.id);
    }
  }, [currentSong, songs]);

  const handlePlayPrev = useCallback(() => {
    if (!currentSong || songs.length === 0) return;
    const currentIndex = songs.findIndex((s) => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    const prevSong = songs[prevIndex];
    if (prevSong) {
      audioEngine.playSong(prevSong);
      addRecentlyListenedId(prevSong.id);
    }
  }, [currentSong, songs]);

  // Track ended event listener
  useEffect(() => {
    const handleTrackEnded = () => {
      handlePlayNext();
    };
    window.addEventListener('player:track-ended', handleTrackEnded);
    return () => window.removeEventListener('player:track-ended', handleTrackEnded);
  }, [handlePlayNext]);

  // Admin verification handler
  const handleAdminLockClick = () => {
    if (isAdminUnlocked) {
      setShowAdminDashboard((prev) => !prev);
    } else {
      setIsPinModalOpen(true);
    }
  };

  const handlePinSuccess = () => {
    setIsAdminUnlocked(true);
    setShowAdminDashboard(true);
  };

  // Song playback
  const handlePlaySong = (song: Song) => {
    audioEngine.playSong(song);
    addRecentlyListenedId(song.id);
  };

  const handleTogglePlay = () => {
    if (!currentSong && songs.length > 0) {
      handlePlaySong(songs[0]);
    } else if (currentSong) {
      if (isPlaying) audioEngine.pause();
      else audioEngine.resume();
    }
  };

  // Admin CRUD operations (Synced live across all devices)
  const handleImportSong = async (
    songData: Omit<Song, 'id' | 'createdAt'>,
    audioFile?: File
  ) => {
    const newSong = await addSongToFirestore(songData, audioFile);
    setSongs((prev) => {
      if (prev.some((s) => s.id === newSong.id)) return prev;
      return [newSong, ...prev];
    });
  };

  const handleUpdateSong = async (songId: string, updatedFields: Partial<Song>) => {
    await updateSongInFirestore(songId, updatedFields);
  };

  const handleDeleteSong = async (songId: string) => {
    if (currentSong?.id === songId) {
      audioEngine.pause();
    }
    await deleteSongFromFirestore(songId);
  };

  // Playlist CRUD operations
  const handleCreatePlaylist = async (playlistData: {
    name: string;
    coverUrl: string;
    songIds: string[];
  }) => {
    await addPlaylistToFirestore(playlistData);
  };

  const handleUpdatePlaylist = async (playlistId: string, updatedFields: Partial<Playlist>) => {
    await updatePlaylistInFirestore(playlistId, updatedFields);
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    await deletePlaylistFromFirestore(playlistId);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col font-sans selection:bg-[#7C3AED] selection:text-white antialiased">
      {/* Navigation (Mobile Bottom Bar & Desktop Sidebar) */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setShowAdminDashboard(false);
        }}
        isAdminUnlocked={isAdminUnlocked}
        onAdminClick={handleAdminLockClick}
      />

      {/* Main Screen Layout Container */}
      <main className="flex-1 w-full md:pl-64 flex flex-col">
        {showAdminDashboard && isAdminUnlocked ? (
          <AdminDashboard
            songs={songs}
            onImportSong={handleImportSong}
            onUpdateSong={handleUpdateSong}
            onDeleteSong={handleDeleteSong}
            onLockAdmin={() => {
              setIsAdminUnlocked(false);
              setShowAdminDashboard(false);
            }}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView
                songs={songs}
                currentSong={currentSong}
                isPlaying={isPlaying}
                onPlaySong={handlePlaySong}
                isAdminUnlocked={isAdminUnlocked}
                onAdminClick={handleAdminLockClick}
                onEditSong={(song) => {
                  setShowAdminDashboard(true);
                }}
                onDeleteSong={handleDeleteSong}
                onOpenAdminUpload={() => {
                  setShowAdminDashboard(true);
                }}
              />
            )}

            {activeTab === 'search' && (
              <SearchView
                songs={songs}
                currentSong={currentSong}
                isPlaying={isPlaying}
                onPlaySong={handlePlaySong}
                isAdminUnlocked={isAdminUnlocked}
                onEditSong={(song) => setShowAdminDashboard(true)}
                onDeleteSong={handleDeleteSong}
              />
            )}

            {activeTab === 'library' && (
              <LibraryView
                songs={songs}
                playlists={playlists}
                currentSong={currentSong}
                isPlaying={isPlaying}
                onPlaySong={handlePlaySong}
                onOpenPlayingNow={() => setIsPlayingNowOpen(true)}
                isAdminUnlocked={isAdminUnlocked}
                onEditSong={(song) => setShowAdminDashboard(true)}
                onDeleteSong={handleDeleteSong}
                onCreatePlaylist={handleCreatePlaylist}
                onUpdatePlaylist={handleUpdatePlaylist}
                onDeletePlaylist={handleDeletePlaylist}
              />
            )}
          </>
        )}
      </main>

      {/* Persistent Bottom Player */}
      <PersistentPlayer
        currentSong={currentSong}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onNext={handlePlayNext}
        onPrev={handlePlayPrev}
        onExpand={() => setIsPlayingNowOpen(true)}
      />

      {/* Full-screen Playing Now Modal */}
      <PlayingNowModal
        isOpen={isPlayingNowOpen}
        onClose={() => setIsPlayingNowOpen(false)}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onNext={handlePlayNext}
        onPrev={handlePlayPrev}
      />

      {/* PIN Keypad Verification Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
        correctPin={getAdminPin()}
      />

      {/* 1.5 Second Initial App Splash Loading Screen */}
      <AnimatePresence>
        {isLoading && <LoadingScreen key="app-loading-screen" />}
      </AnimatePresence>

      {/* Online/Offline Connection Status Toast (Appears 1s after loading screen, lasts 1.5s) */}
      <AnimatePresence>
        {showStatusToast && (
          <ConnectionStatusToast key="status-toast" isOnline={isOnline} />
        )}
      </AnimatePresence>
    </div>
  );
}
