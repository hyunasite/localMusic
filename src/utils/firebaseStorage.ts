import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Song, Playlist } from '../types';
import { INITIAL_SAMPLE_SONGS } from '../data/sampleSongs';
import { saveAudioFile, getAudioFile, deleteAudioFile } from './storage';

const SONGS_COLLECTION = 'songs';
const PLAYLISTS_COLLECTION = 'playlists';
const CHUNK_SIZE = 400 * 1024; // 400 KB base64 string length per chunk

// Helper: Convert File to Base64 string
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Helper: Convert Base64 string back to File/Blob
function base64ToFile(base64: string, filename: string, mimeType: string): File {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
}

/**
 * Real-time listener for song collection in Firestore.
 * Triggers onSnapshot whenever a song is added, updated, or removed on ANY device.
 */
export function subscribeToFirestoreSongs(
  onUpdate: (songs: Song[]) => void,
  onError?: (err: Error) => void
): () => void {
  const songsRef = collection(db, SONGS_COLLECTION);
  const q = query(songsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    async (snapshot) => {
      if (snapshot.empty) {
        console.log('Firestore songs collection empty. Seeding initial sample songs...');
        await seedSampleSongs();
        return;
      }

      const songList: Song[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        songList.push({
          id: docSnap.id,
          title: data.title || 'Untitled',
          artist: data.artist || 'Unknown Artist',
          album: data.album || 'Unknown Album',
          duration: data.duration || 180,
          audioUrl: data.audioUrl || 'synth:ambient-1',
          artworkUrl:
            data.artworkUrl ||
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
          createdAt: data.createdAt || Date.now(),
          isSample: data.isSample ?? false,
          hasAudioChunks: data.hasAudioChunks ?? false,
          chunkCount: data.chunkCount || 0,
          mimeType: data.mimeType || 'audio/mpeg',
        });
      });

      onUpdate(songList);
    },
    (err) => {
      console.error('Firestore real-time subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Populate Firestore with initial sample songs if collection is empty
 */
async function seedSampleSongs(): Promise<void> {
  try {
    const batch = writeBatch(db);
    INITIAL_SAMPLE_SONGS.forEach((song) => {
      const docRef = doc(db, SONGS_COLLECTION, song.id);
      batch.set(docRef, {
        title: song.title,
        artist: song.artist,
        album: song.album,
        duration: song.duration,
        audioUrl: song.audioUrl,
        artworkUrl: song.artworkUrl,
        createdAt: song.createdAt,
        isSample: true,
        hasAudioChunks: false,
      });
    });
    await batch.commit();
  } catch (err) {
    console.error('Error seeding initial sample songs:', err);
  }
}

/**
 * Safely ensure image data URLs don't exceed Firestore document limits (1MB).
 */
export function compressDataUrlIfNeeded(dataUrl: string, maxDimension = 400, quality = 0.75): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return Promise.resolve(dataUrl);
  }
  if (dataUrl.length < 200000) {
    return Promise.resolve(dataUrl);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl.slice(0, 100000));
      }
    };
    img.onerror = () => resolve('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80');
    img.src = dataUrl;
  });
}

/**
 * Save an imported song to Firestore with chunked audio data so it reflects LIVE on all devices
 */
export async function addSongToFirestore(
  songData: Omit<Song, 'id' | 'createdAt'>,
  audioFile?: File
): Promise<Song> {
  const songId = `imported-${Date.now()}`;
  const createdAt = Date.now();
  const mimeType = audioFile?.type || 'audio/mpeg';

  // Ensure artwork URL doesn't exceed Firestore document limit (1MB)
  const safeArtworkUrl = await compressDataUrlIfNeeded(songData.artworkUrl);

  // 1. Save local audio file in IndexedDB immediately if available
  if (audioFile) {
    try {
      await saveAudioFile(songId, audioFile);
    } catch (err) {
      console.warn('Failed to save audio to IndexedDB:', err);
    }
  }

  const newSong: Song = {
    id: songId,
    title: songData.title.trim() || 'Untitled Song',
    artist: songData.artist.trim() || 'Unknown Artist',
    album: songData.album?.trim() || 'Local Import',
    duration: songData.duration || 180,
    audioUrl: songData.audioUrl || `local:${songId}`,
    artworkUrl: safeArtworkUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    createdAt,
    isSample: false,
    hasAudioChunks: !!audioFile,
    chunkCount: 0,
    mimeType,
  };

  // 2. CRITICAL FIX: WRITE MAIN SONG DOCUMENT TO FIRESTORE FIRST!
  // This triggers Firestore onSnapshot real-time listener instantly across all devices.
  await setDoc(doc(db, SONGS_COLLECTION, songId), {
    title: newSong.title,
    artist: newSong.artist,
    album: newSong.album,
    duration: newSong.duration,
    audioUrl: newSong.audioUrl,
    artworkUrl: newSong.artworkUrl,
    createdAt: newSong.createdAt,
    isSample: false,
    hasAudioChunks: newSong.hasAudioChunks,
    chunkCount: 0,
    mimeType,
  });

  // 3. Upload audio chunks in background batches so main doc write is not blocked
  if (audioFile) {
    (async () => {
      try {
        const base64Str = await fileToBase64(audioFile);
        const chunkSize = 250 * 1024; // 250 KB
        const totalChunks = Math.ceil(base64Str.length / chunkSize);

        const BATCH_SIZE = 4;
        for (let i = 0; i < totalChunks; i += BATCH_SIZE) {
          const promises = [];
          for (let j = i; j < Math.min(i + BATCH_SIZE, totalChunks); j++) {
            const chunkData = base64Str.slice(j * chunkSize, (j + 1) * chunkSize);
            const chunkRef = doc(db, SONGS_COLLECTION, songId, 'chunks', `chunk_${j}`);
            promises.push(setDoc(chunkRef, { index: j, data: chunkData }));
          }
          await Promise.all(promises);
        }

        // Update chunkCount on the main document when chunking finishes
        await setDoc(
          doc(db, SONGS_COLLECTION, songId),
          { chunkCount: totalChunks },
          { merge: true }
        );
      } catch (err) {
        console.error('Failed to store audio chunks in Firestore background:', err);
      }
    })();
  }

  return newSong;
}

/**
 * Update song metadata in Firestore
 */
export async function updateSongInFirestore(
  songId: string,
  updatedFields: Partial<Song>
): Promise<void> {
  const songRef = doc(db, SONGS_COLLECTION, songId);
  const cleanFields: Record<string, any> = {};
  if (updatedFields.title !== undefined) cleanFields.title = updatedFields.title;
  if (updatedFields.artist !== undefined) cleanFields.artist = updatedFields.artist;
  if (updatedFields.album !== undefined) cleanFields.album = updatedFields.album;
  if (updatedFields.artworkUrl !== undefined) cleanFields.artworkUrl = updatedFields.artworkUrl;

  await setDoc(songRef, cleanFields, { merge: true });
}

/**
 * Delete song from Firestore (including all audio chunks)
 */
export async function deleteSongFromFirestore(songId: string): Promise<void> {
  try {
    const chunksRef = collection(db, SONGS_COLLECTION, songId, 'chunks');
    const chunksSnap = await getDocs(chunksRef);
    const batch = writeBatch(db);
    chunksSnap.forEach((cSnap) => {
      batch.delete(cSnap.ref);
    });
    await batch.commit();
  } catch (e) {
    console.warn('Error clearing audio chunks subcollection:', e);
  }

  await deleteDoc(doc(db, SONGS_COLLECTION, songId));
  await deleteAudioFile(songId);
}

/**
 * Resolve audio playback source on any device.
 * Automatically fetches and reconstructs chunks from Firestore if not cached locally.
 */
export async function resolveAudioForPlayback(song: Song): Promise<string> {
  if (song.audioUrl.startsWith('synth:')) {
    return song.audioUrl;
  }

  // Check local IndexedDB first
  const localFile = await getAudioFile(song.id);
  if (localFile) {
    return URL.createObjectURL(localFile);
  }

  // Standard web URL
  if (
    (song.audioUrl.startsWith('http://') || song.audioUrl.startsWith('https://')) &&
    !song.audioUrl.includes('localhost')
  ) {
    return song.audioUrl;
  }

  // Fetch audio chunks from Firestore for imported songs
  if (song.hasAudioChunks && song.chunkCount && song.chunkCount > 0) {
    try {
      console.log(`Fetching ${song.chunkCount} audio chunks from Firestore for "${song.title}"...`);
      const chunksRef = collection(db, SONGS_COLLECTION, song.id, 'chunks');
      const q = query(chunksRef, orderBy('index', 'asc'));
      const querySnap = await getDocs(q);

      let fullBase64 = '';
      querySnap.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.data) {
          fullBase64 += d.data;
        }
      });

      if (fullBase64) {
        const file = base64ToFile(fullBase64, `${song.id}.mp3`, song.mimeType || 'audio/mpeg');
        await saveAudioFile(song.id, file);
        return URL.createObjectURL(file);
      }
    } catch (err) {
      console.error('Error reconstructing audio from Firestore:', err);
    }
  }

  return song.audioUrl;
}

/**
 * Real-time listener for Playlists collection in Firestore.
 */
export function subscribeToFirestorePlaylists(
  onUpdate: (playlists: Playlist[]) => void,
  onError?: (err: Error) => void
): () => void {
  const ref = collection(db, PLAYLISTS_COLLECTION);
  const q = query(ref, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const playlistList: Playlist[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        playlistList.push({
          id: docSnap.id,
          name: data.name || 'Untitled Playlist',
          coverUrl:
            data.coverUrl ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
          songIds: Array.isArray(data.songIds) ? data.songIds : [],
          createdAt: data.createdAt || Date.now(),
        });
      });
      onUpdate(playlistList);
    },
    (err) => {
      console.error('Firestore playlist subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Add new playlist to Firestore
 */
export async function addPlaylistToFirestore(
  playlistData: Omit<Playlist, 'id' | 'createdAt'>
): Promise<Playlist> {
  const id = `playlist-${Date.now()}`;
  const createdAt = Date.now();

  const newPlaylist: Playlist = {
    id,
    name: playlistData.name,
    coverUrl:
      playlistData.coverUrl ||
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    songIds: playlistData.songIds || [],
    createdAt,
  };

  await setDoc(doc(db, PLAYLISTS_COLLECTION, id), newPlaylist);
  return newPlaylist;
}

/**
 * Update playlist in Firestore
 */
export async function updatePlaylistInFirestore(
  playlistId: string,
  updatedFields: Partial<Playlist>
): Promise<void> {
  const pRef = doc(db, PLAYLISTS_COLLECTION, playlistId);
  const cleanFields: Record<string, any> = {};
  if (updatedFields.name !== undefined) cleanFields.name = updatedFields.name;
  if (updatedFields.coverUrl !== undefined) cleanFields.coverUrl = updatedFields.coverUrl;
  if (updatedFields.songIds !== undefined) cleanFields.songIds = updatedFields.songIds;

  await setDoc(pRef, cleanFields, { merge: true });
}

/**
 * Delete playlist from Firestore
 */
export async function deletePlaylistFromFirestore(playlistId: string): Promise<void> {
  await deleteDoc(doc(db, PLAYLISTS_COLLECTION, playlistId));
}
