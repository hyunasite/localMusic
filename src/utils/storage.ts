import { Song } from '../types';
import { INITIAL_SAMPLE_SONGS } from '../data/sampleSongs';

const DB_NAME = 'LocalMusicPlayerDB';
const DB_VERSION = 1;
const STORE_SONGS = 'songs';
const STORE_AUDIO = 'audio_files';
const PIN_KEY = 'admin_pin_code';
const RECENTLY_LISTENED_KEY = 'recently_listened_ids';
const RECENTLY_SEARCHED_KEY = 'recently_searched_queries';

export function getAdminPin(): string {
  return localStorage.getItem(PIN_KEY) || '1234';
}

export function setAdminPin(newPin: string): void {
  localStorage.setItem(PIN_KEY, newPin);
}

// Open IndexedDB database
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_SONGS)) {
        db.createObjectStore(STORE_SONGS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_AUDIO)) {
        db.createObjectStore(STORE_AUDIO, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllSongsFromDB(): Promise<Song[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SONGS, 'readonly');
      const store = tx.objectStore(STORE_SONGS);
      const request = store.getAll();

      request.onsuccess = async () => {
        let songs: Song[] = request.result || [];
        if (songs.length === 0) {
          // Initialize with sample songs
          await saveSongsToDB(INITIAL_SAMPLE_SONGS);
          songs = INITIAL_SAMPLE_SONGS;
        }
        resolve(songs);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error fetching songs from DB:', err);
    return INITIAL_SAMPLE_SONGS;
  }
}

export async function saveSongsToDB(songs: Song[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SONGS, 'readwrite');
    const store = tx.objectStore(STORE_SONGS);
    store.clear();
    songs.forEach((song) => store.put(song));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveAudioFile(id: string, file: File): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_AUDIO, 'readwrite');
    const store = tx.objectStore(STORE_AUDIO);
    store.put({ id, file, name: file.name, type: file.type });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAudioFile(id: string): Promise<File | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_AUDIO, 'readonly');
      const store = tx.objectStore(STORE_AUDIO);
      const request = store.get(id);
      request.onsuccess = () => {
        resolve(request.result ? request.result.file : null);
      };
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

export async function deleteAudioFile(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_AUDIO, 'readwrite');
    const store = tx.objectStore(STORE_AUDIO);
    store.delete(id);
  } catch (e) {
    // Ignore error
  }
}

// Recently listened history
export function getRecentlyListenedIds(): string[] {
  try {
    const data = localStorage.getItem(RECENTLY_LISTENED_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function addRecentlyListenedId(songId: string): void {
  try {
    let ids = getRecentlyListenedIds();
    ids = [songId, ...ids.filter((id) => id !== songId)].slice(0, 20);
    localStorage.setItem(RECENTLY_LISTENED_KEY, JSON.stringify(ids));
  } catch (e) {
    // Ignore error
  }
}

// Recently searched queries
export function getRecentlySearched(): string[] {
  try {
    const data = localStorage.getItem(RECENTLY_SEARCHED_KEY);
    return data ? JSON.parse(data) : ['synth', 'violet', 'midnight', 'cyber'];
  } catch (e) {
    return ['synth', 'violet', 'midnight', 'cyber'];
  }
}

export function addRecentlySearched(query: string): void {
  if (!query.trim()) return;
  try {
    let list = getRecentlySearched();
    list = [query.trim(), ...list.filter((q) => q.toLowerCase() !== query.trim().toLowerCase())].slice(0, 10);
    localStorage.setItem(RECENTLY_SEARCHED_KEY, JSON.stringify(list));
  } catch (e) {
    // Ignore
  }
}
