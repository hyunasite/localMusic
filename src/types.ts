export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  audioUrl: string; // URL or Blob object URL
  artworkUrl: string;
  createdAt: number;
  isSample?: boolean;
  fileData?: File;
  hasAudioChunks?: boolean;
  chunkCount?: number;
  mimeType?: string;
}

export interface Playlist {
  id: string;
  name: string;
  coverUrl: string;
  songIds: string[];
  createdAt: number;
}

export type TabType = 'home' | 'search' | 'library';

export type RepeatMode = 'off' | 'all' | 'one';

export interface AdminState {
  isAuthenticated: boolean;
  isPinModalOpen: boolean;
  pinInput: string;
  pinError: string | null;
}

export interface RecentlySearched {
  id: string;
  query: string;
  timestamp: number;
}
