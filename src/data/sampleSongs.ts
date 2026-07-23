import { Song } from '../types';
import neonPurpleArt from '../assets/images/neon_purple_album_1784790454268.jpg';
import ambientVioletArt from '../assets/images/ambient_violet_album_1784790470338.jpg';

export const INITIAL_SAMPLE_SONGS: Song[] = [
  {
    id: 'sample-1',
    title: 'Midnight Resonance',
    artist: 'Aether Harmonic',
    album: 'Obsidian Echoes',
    duration: 198,
    audioUrl: 'synth:ambient-1',
    artworkUrl: neonPurpleArt,
    createdAt: Date.now() - 3600000 * 24 * 5,
    isSample: true,
  },
  {
    id: 'sample-2',
    title: 'Violet Drift',
    artist: 'Lumina Wave',
    album: 'Neon Horizon',
    duration: 215,
    audioUrl: 'synth:chords-1',
    artworkUrl: ambientVioletArt,
    createdAt: Date.now() - 3600000 * 24 * 4,
    isSample: true,
  },
  {
    id: 'sample-3',
    title: 'Purple Pulse',
    artist: 'Velvet Echo',
    album: 'Deep Frequencies',
    duration: 184,
    audioUrl: 'synth:synthwave-1',
    artworkUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    createdAt: Date.now() - 3600000 * 24 * 3,
    isSample: true,
  },
  {
    id: 'sample-4',
    title: 'Cyber Solitude',
    artist: 'Kroma Sound',
    album: 'Sub-Zero',
    duration: 242,
    audioUrl: 'synth:lofi-1',
    artworkUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80',
    createdAt: Date.now() - 3600000 * 24 * 2,
    isSample: true,
  },
  {
    id: 'sample-5',
    title: 'Astral Echoes',
    artist: 'Starlight Dreamer',
    album: 'Cosmic Drift',
    duration: 210,
    audioUrl: 'synth:ambient-2',
    artworkUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    createdAt: Date.now() - 3600000 * 24 * 1,
    isSample: true,
  }
];
