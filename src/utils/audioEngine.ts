import { Song, RepeatMode } from '../types';
import { getAudioFile } from './storage';
import { resolveAudioForPlayback } from './firebaseStorage';

class AudioEngine {
  private audioElement: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private synthGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private synthTimer: number | null = null;

  private currentSong: Song | null = null;
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private duration: number = 0;
  private volume: number = 0.8;
  private isMuted: boolean = false;
  private repeatMode: RepeatMode = 'off';
  private isShuffle: boolean = false;

  private listeners: Set<() => void> = new Set();
  private objectUrlToRevoke: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioElement = new Audio();
      this.audioElement.volume = this.volume;

      this.audioElement.addEventListener('timeupdate', () => {
        if (this.audioElement && !this.currentSong?.audioUrl.startsWith('synth:')) {
          this.currentTime = this.audioElement.currentTime;
          this.duration = this.audioElement.duration || this.currentSong?.duration || 0;
          this.notify();
        }
      });

      this.audioElement.addEventListener('ended', () => {
        this.handleTrackEnded();
      });

      this.audioElement.addEventListener('error', (e) => {
        console.warn('Audio element error:', e);
      });
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  // State getters
  public getCurrentSong(): Song | null {
    return this.currentSong;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getDuration(): number {
    return this.duration || this.currentSong?.duration || 0;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getRepeatMode(): RepeatMode {
    return this.repeatMode;
  }

  public getIsShuffle(): boolean {
    return this.isShuffle;
  }

  // Controls
  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
    if (this.synthGain) {
      this.synthGain.gain.setValueAtTime(this.volume, this.audioCtx?.currentTime || 0);
    }
    this.notify();
  }

  public toggleRepeat(): RepeatMode {
    if (this.repeatMode === 'off') this.repeatMode = 'all';
    else if (this.repeatMode === 'all') this.repeatMode = 'one';
    else this.repeatMode = 'off';
    this.notify();
    return this.repeatMode;
  }

  public toggleShuffle(): boolean {
    this.isShuffle = !this.isShuffle;
    this.notify();
    return this.isShuffle;
  }

  public async playSong(song: Song) {
    // If same song, just toggle play/pause
    if (this.currentSong?.id === song.id) {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.resume();
      }
      return;
    }

    this.stopSynth();
    if (this.objectUrlToRevoke) {
      URL.revokeObjectURL(this.objectUrlToRevoke);
      this.objectUrlToRevoke = null;
    }

    this.currentSong = song;
    this.currentTime = 0;
    this.duration = song.duration || 180;
    this.isPlaying = true;
    this.notify();

    if (song.audioUrl.startsWith('synth:')) {
      // Play Web Audio synth
      this.startSynth(song.audioUrl);
    } else {
      // Resolve audio target URL from local cache or Firestore
      let targetUrl = await resolveAudioForPlayback(song);
      if (targetUrl.startsWith('blob:')) {
        this.objectUrlToRevoke = targetUrl;
      }

      if (this.audioElement) {
        this.audioElement.src = targetUrl;
        this.audioElement.currentTime = 0;
        try {
          await this.audioElement.play();
        } catch (e) {
          console.warn('Playback error fallback to synth:', e);
          this.startSynth('synth:ambient-1');
        }
      }
    }
  }

  public resume() {
    if (!this.currentSong) return;
    this.isPlaying = true;

    if (this.currentSong.audioUrl.startsWith('synth:')) {
      this.startSynth(this.currentSong.audioUrl, this.currentTime);
    } else if (this.audioElement) {
      this.audioElement.play().catch(console.error);
    }
    this.notify();
  }

  public pause() {
    this.isPlaying = false;
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.stopSynth();
    this.notify();
  }

  public seek(seconds: number) {
    this.currentTime = Math.max(0, Math.min(seconds, this.getDuration()));
    if (this.audioElement && !this.currentSong?.audioUrl.startsWith('synth:')) {
      this.audioElement.currentTime = this.currentTime;
    }
    this.notify();
  }

  private handleTrackEnded() {
    if (this.repeatMode === 'one' && this.currentSong) {
      this.currentTime = 0;
      this.playSong(this.currentSong);
    } else {
      // Trigger next track event through custom dispatch
      window.dispatchEvent(new CustomEvent('player:track-ended'));
    }
  }

  // --- Web Audio Synth Generator for Sample Tracks ---
  private initAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      this.synthGain = this.audioCtx.createGain();
      this.synthGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
      this.synthGain.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  private startSynth(type: string, startFromSec: number = 0) {
    this.initAudioContext();
    if (!this.audioCtx || !this.synthGain) return;

    this.stopSynth();
    this.currentTime = startFromSec;

    // Frequencies for a lush C Minor / Eb Major chord progression (C3, Eb3, G3, Bb3, C4, D4, F4, G4)
    const scale = [130.81, 155.56, 196.00, 233.08, 261.63, 293.66, 349.23, 392.00];

    let noteIndex = 0;
    const intervalTime = 800; // ms per note

    const playNote = () => {
      if (!this.isPlaying || !this.audioCtx || !this.synthGain) return;

      this.currentTime += intervalTime / 1000;
      if (this.currentTime >= this.getDuration()) {
        this.handleTrackEnded();
        return;
      }

      try {
        const osc = this.audioCtx.createOscillator();
        const noteGain = this.audioCtx.createGain();

        // Synth sound type
        if (type.includes('lofi')) {
          osc.type = 'triangle';
        } else if (type.includes('synthwave')) {
          osc.type = 'sawtooth';
        } else {
          osc.type = 'sine';
        }

        const freq = scale[noteIndex % scale.length];
        noteIndex = (noteIndex + (type.includes('chords') ? 2 : 1)) % scale.length;

        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

        noteGain.gain.setValueAtTime(0.01, this.audioCtx.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(0.2, this.audioCtx.currentTime + 0.1);
        noteGain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.75);

        osc.connect(noteGain);
        noteGain.connect(this.synthGain);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.8);
      } catch (e) {
        // Ignore audio node errors
      }

      this.notify();
    };

    playNote();
    this.synthTimer = window.setInterval(playNote, intervalTime);
  }

  private stopSynth() {
    if (this.synthTimer) {
      clearInterval(this.synthTimer);
      this.synthTimer = null;
    }
  }

  public getVisualizerData(): Uint8Array {
    if (this.analyser) {
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(dataArray);
      return dataArray;
    }
    return new Uint8Array(16);
  }
}

export const audioEngine = new AudioEngine();
