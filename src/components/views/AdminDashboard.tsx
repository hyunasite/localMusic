import React, { useState } from 'react';
import { Song } from '../../types';
import {
  Upload,
  Edit3,
  Trash2,
  Lock,
  Plus,
  Music,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Key,
  ShieldCheck,
  X,
} from 'lucide-react';
import { formatDuration } from '../../utils/formatters';
import { setAdminPin } from '../../utils/storage';
import { compressDataUrlIfNeeded } from '../../utils/firebaseStorage';

interface AdminDashboardProps {
  songs: Song[];
  onImportSong: (songData: Omit<Song, 'id' | 'createdAt'>, audioFile?: File) => void;
  onUpdateSong: (songId: string, updated: Partial<Song>) => void;
  onDeleteSong: (songId: string) => void;
  onLockAdmin: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  songs,
  onImportSong,
  onUpdateSong,
  onDeleteSong,
  onLockAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'manage' | 'pin'>('import');

  // Import form state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [artworkPreview, setArtworkPreview] = useState<string>('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [duration, setDuration] = useState<number>(210);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Edit song modal state
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editArtworkUrl, setEditArtworkUrl] = useState('');

  // Delete confirmation modal
  const [deletingSong, setDeletingSong] = useState<Song | null>(null);

  // Change PIN state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  // Preset Artwork covers for quick creation
  const presetArtworks = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
  ];

  // Auto-read audio metadata when audio file is uploaded
  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);

    // Extract title from filename (remove extension and replace underscores/dashes)
    const rawName = file.name.replace(/\.[^/.]+$/, '');
    const parts = rawName.split(/[-_]/);
    if (parts.length >= 2) {
      setArtist(parts[0].trim());
      setTitle(parts.slice(1).join(' ').trim());
    } else {
      setTitle(rawName);
      if (!artist) setArtist('Unknown Artist');
    }
    if (!album) setAlbum('Offline Import');

    // Determine audio duration using temporary Audio object
    const audioObj = new Audio();
    audioObj.src = URL.createObjectURL(file);
    audioObj.onloadedmetadata = () => {
      if (audioObj.duration && !isNaN(audioObj.duration)) {
        setDuration(Math.round(audioObj.duration));
      }
    };
  };

  // Handle Artwork file upload
  const handleArtworkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArtworkFile(file);
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const compressed = await compressDataUrlIfNeeded(reader.result);
        setArtworkPreview(compressed);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) {
      setImportStatus('Error: Title and Artist are required.');
      return;
    }

    setImportStatus('Importing music file...');

    try {
      let finalArtwork = artworkPreview;
      if (!finalArtwork) {
        finalArtwork = presetArtworks[Math.floor(Math.random() * presetArtworks.length)];
      }

      let audioUrl = 'synth:ambient-1';
      if (audioFile) {
        audioUrl = URL.createObjectURL(audioFile);
      }

      await onImportSong(
        {
          title: title.trim(),
          artist: artist.trim(),
          album: album.trim() || 'Local Import',
          duration: duration || 180,
          audioUrl,
          artworkUrl: finalArtwork,
        },
        audioFile || undefined
      );

      setImportStatus(`Successfully imported "${title}"!`);

      // Reset form
      setAudioFile(null);
      setArtworkFile(null);
      setArtworkPreview('');
      setTitle('');
      setArtist('');
      setAlbum('');
      setDuration(210);

      setTimeout(() => {
        setImportStatus(null);
        setActiveTab('manage');
      }, 1000);
    } catch (err) {
      console.error('Import song failed:', err);
      setImportStatus('Error: Failed to import song. Please try again.');
    }
  };

  // Open Edit modal
  const startEditing = (song: Song) => {
    setEditingSong(song);
    setEditTitle(song.title);
    setEditArtist(song.artist);
    setEditArtworkUrl(song.artworkUrl);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSong) return;
    onUpdateSong(editingSong.id, {
      title: editTitle,
      artist: editArtist,
      artworkUrl: editArtworkUrl,
    });
    setEditingSong(null);
  };

  // Change PIN handler
  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinMessage('PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinMessage('PIN confirmation does not match.');
      return;
    }
    setAdminPin(newPin);
    setPinMessage('4-digit PIN updated successfully!');
    setNewPin('');
    setConfirmPin('');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-28">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#222222] pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7] animate-pulse" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Protected area for importing and managing local music files
          </p>
        </div>

        <button
          id="admin-lock-exit-btn"
          onClick={onLockAdmin}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#181818] hover:bg-[#222222] border border-[#282828] text-xs font-semibold text-zinc-300 hover:text-white transition-all"
        >
          <Lock className="w-4 h-4 text-[#A855F7]" />
          <span>Exit</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-[#222222] pb-3 overflow-x-auto">
        <button
          id="admin-tab-import"
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'import'
              ? 'bg-[#7C3AED] text-white shadow-md'
              : 'bg-[#181818] text-zinc-400 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Import Music</span>
        </button>

        <button
          id="admin-tab-manage"
          onClick={() => setActiveTab('manage')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'manage'
              ? 'bg-[#7C3AED] text-white shadow-md'
              : 'bg-[#181818] text-zinc-400 hover:text-white'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>Manage Library ({songs.length})</span>
        </button>

        <button
          id="admin-tab-pin"
          onClick={() => setActiveTab('pin')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'pin'
              ? 'bg-[#7C3AED] text-white shadow-md'
              : 'bg-[#181818] text-zinc-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Change PIN</span>
        </button>
      </div>

      {/* TAB 1: IMPORT MUSIC */}
      {activeTab === 'import' && (
        <div className="max-w-2xl bg-[#181818] border border-[#262626] rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#A855F7]" />
            <span>Import New Music</span>
          </h2>
          <p className="text-xs text-zinc-400 mb-6">
            Upload MP3/WAV files and customize song title, artist, and album artwork.
          </p>

          {importStatus && (
            <div
              className={`p-3 rounded-xl mb-6 text-xs font-semibold flex items-center gap-2 ${
                importStatus.startsWith('Error')
                  ? 'bg-red-950/60 border border-red-800 text-red-300'
                  : 'bg-purple-950/60 border border-purple-800 text-purple-200'
              }`}
            >
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          <form onSubmit={handleImportSubmit} className="space-y-5">
            {/* Audio File Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                1. Select Music File (MP3, WAV, AAC)
              </label>
              <div className="relative border-2 border-dashed border-[#2D2D2D] hover:border-[#7C3AED] rounded-2xl p-6 text-center bg-[#121212] transition-colors cursor-pointer group">
                <input
                  id="admin-audio-file-input"
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Music className="w-8 h-8 text-[#A855F7] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-medium text-white mb-1">
                  {audioFile ? audioFile.name : 'Click or Drag audio file here'}
                </p>
                <p className="text-[11px] text-zinc-500">
                  {audioFile
                    ? `${(audioFile.size / (1024 * 1024)).toFixed(2)} MB • Auto-extracted metadata`
                    : 'Supports MP3, WAV, FLAC, M4A'}
                </p>
              </div>
            </div>

            {/* Artwork File or Preset */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                2. Album Artwork (Upload or choose preset)
              </label>

              <div className="flex items-center gap-4 mb-3">
                <div className="relative w-20 h-20 rounded-[10px] overflow-hidden bg-[#222222] border border-white/10 flex-shrink-0">
                  {artworkPreview ? (
                    <img
                      src={artworkPreview}
                      alt="Artwork Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                      <ImageIcon className="w-6 h-6" />
                      <span className="text-[9px] mt-1">10px radius</span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <label
                    htmlFor="admin-artwork-file-input"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-xs font-semibold text-white border border-zinc-700 cursor-pointer transition-all"
                  >
                    <ImageIcon className="w-4 h-4 text-[#A855F7]" />
                    <span>Upload Image File</span>
                  </label>
                  <input
                    id="admin-artwork-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleArtworkChange}
                    className="hidden"
                  />
                  <p className="text-[11px] text-zinc-500 mt-2">
                    JPG, PNG, or WebP square image
                  </p>
                </div>
              </div>

              {/* Preset cover choices */}
              <div className="text-[11px] text-zinc-400 mb-2">Or select a preset artwork:</div>
              <div className="flex items-center gap-2">
                {presetArtworks.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Preset ${i}`}
                    onClick={() => {
                      setArtworkPreview(url);
                      setArtworkFile(null);
                    }}
                    className={`w-12 h-12 rounded-[10px] object-cover cursor-pointer border-2 transition-all ${
                      artworkPreview === url
                        ? 'border-[#7C3AED] scale-105 shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Song Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Song Title *
                </label>
                <input
                  id="admin-import-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Synthwave Dreams"
                  className="w-full px-3.5 py-2.5 bg-[#121212] border border-[#2A2A2A] rounded-xl text-white text-xs outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Artist Name *
                </label>
                <input
                  id="admin-import-artist"
                  type="text"
                  required
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="e.g. Neon Pulse"
                  className="w-full px-3.5 py-2.5 bg-[#121212] border border-[#2A2A2A] rounded-xl text-white text-xs outline-none focus:border-[#7C3AED]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="admin-import-submit-btn"
              type="submit"
              className="w-full py-3 rounded-xl bg-[#7C3AED] hover:bg-[#A855F7] text-white text-xs font-bold shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-4"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Complete Music Import</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: MANAGE LIBRARY */}
      {activeTab === 'manage' && (
        <div className="bg-[#181818] border border-[#262626] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Imported Songs ({songs.length})</h2>
          </div>

          <div className="flex flex-col gap-3">
            {songs.map((song) => (
              <div
                key={song.id}
                className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-[#121212] border border-[#222222] hover:border-zinc-700 transition-colors"
              >
                <img
                  src={song.artworkUrl}
                  alt={song.title}
                  className="w-12 h-12 rounded-[10px] object-cover flex-shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate">{song.title}</h4>
                  <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                </div>

                <span className="text-xs text-zinc-500 font-mono flex-shrink-0">
                  {formatDuration(song.duration)}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEditing(song)}
                    className="p-2 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#A855F7]" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>

                  <button
                    onClick={() => setDeletingSong(song)}
                    className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold flex items-center gap-1.5 border border-red-900/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CHANGE PIN */}
      {activeTab === 'pin' && (
        <div className="max-w-md bg-[#181818] border border-[#262626] rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#A855F7]" />
            <span>Admin Security PIN</span>
          </h2>
          <p className="text-xs text-zinc-400 mb-6">
            Update your 4-digit passcode below:
          </p>

          {pinMessage && (
            <div
              className={`p-3 rounded-xl mb-4 text-xs font-semibold ${
                pinMessage.includes('successfully')
                  ? 'bg-purple-950/60 border border-purple-800 text-purple-200'
                  : 'bg-red-950/60 border border-red-800 text-red-300'
              }`}
            >
              {pinMessage}
            </div>
          )}

          <form onSubmit={handleChangePinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                New 4-Digit PIN
              </label>
              <input
                type="password"
                maxLength={4}
                required
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="4 digits"
                className="w-full px-3.5 py-2.5 bg-[#121212] border border-[#2A2A2A] rounded-xl text-white text-sm outline-none focus:border-[#7C3AED] font-mono tracking-widest text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Confirm New PIN
              </label>
              <input
                type="password"
                maxLength={4}
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Confirm 4 digits"
                className="w-full px-3.5 py-2.5 bg-[#121212] border border-[#2A2A2A] rounded-xl text-white text-sm outline-none focus:border-[#7C3AED] font-mono tracking-widest text-center"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#7C3AED] hover:bg-[#A855F7] text-white text-xs font-bold transition-all shadow-lg"
            >
              Update Security PIN
            </button>
          </form>
        </div>
      )}

      {/* EDIT SONG MODAL */}
      {editingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#181818] border border-[#262626] rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingSong(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">Edit Song Details</h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Song Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#121212] border border-[#2A2A2A] rounded-xl text-white text-xs outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Artist Name
                </label>
                <input
                  type="text"
                  required
                  value={editArtist}
                  onChange={(e) => setEditArtist(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#121212] border border-[#2A2A2A] rounded-xl text-white text-xs outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Artwork Image URL
                </label>
                <input
                  type="text"
                  required
                  value={editArtworkUrl}
                  onChange={(e) => setEditArtworkUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#121212] border border-[#2A2A2A] rounded-xl text-white text-xs outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSong(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#222222] text-zinc-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#A855F7] text-white text-xs font-bold shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#181818] border border-[#262626] rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-950/60 text-red-400 border border-red-800 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Delete Song?</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Are you sure you want to remove "<strong className="text-white">{deletingSong.title}</strong>"?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeletingSong(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#222222] text-zinc-300 text-xs font-semibold hover:bg-[#2A2A2A]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteSong(deletingSong.id);
                  setDeletingSong(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
