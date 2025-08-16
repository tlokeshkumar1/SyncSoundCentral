import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import type { AudioTrack } from '../types';

interface AudioContextType {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  loadTrack: (file: File) => Promise<void>;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  syncPlayback: (timestamp: number, action: string, position?: number) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize Web Audio API
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Create audio element
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      });
      audioRef.current.addEventListener('durationchange', () => {
        setDuration(audioRef.current?.duration || 0);
      });
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const loadTrack = async (file: File) => {
    if (!audioRef.current) return;

    const url = URL.createObjectURL(file);
    audioRef.current.src = url;
    
    const track: AudioTrack = {
      id: crypto.randomUUID(),
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: "Unknown Artist",
      duration: 0,
      currentTime: 0,
      isPlaying: false,
      volume: volume,
    };
    
    setCurrentTrack(track);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const play = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const syncPlayback = (timestamp: number, action: string, position?: number) => {
    const now = Date.now();
    const delay = Math.max(0, timestamp - now);
    
    setTimeout(() => {
      switch (action) {
        case 'play':
          if (position !== undefined) {
            seek(position);
          }
          play();
          break;
        case 'pause':
          pause();
          break;
        case 'seek':
          if (position !== undefined) {
            seek(position);
          }
          break;
      }
    }, delay);
  };

  return (
    <AudioContext.Provider value={{
      currentTrack,
      isPlaying,
      volume,
      isMuted,
      currentTime,
      duration,
      loadTrack,
      play,
      pause,
      seek,
      setVolume,
      toggleMute,
      syncPlayback,
    }}>
      {children}
    </AudioContext.Provider>
  );
}
