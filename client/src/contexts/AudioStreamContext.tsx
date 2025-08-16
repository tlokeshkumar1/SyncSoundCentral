import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useSocket } from './SocketContext';

interface AudioStreamContextType {
  isStreaming: boolean;
  isReceiving: boolean;
  streamQuality: 'low' | 'medium' | 'high';
  latency: number;
  startStreaming: () => Promise<void>;
  stopStreaming: () => void;
  setStreamQuality: (quality: 'low' | 'medium' | 'high') => void;
  receivedAudioBuffer: ArrayBuffer | null;
}

const AudioStreamContext = createContext<AudioStreamContextType | null>(null);

export function useAudioStream() {
  const context = useContext(AudioStreamContext);
  if (!context) {
    throw new Error('useAudioStream must be used within AudioStreamProvider');
  }
  return context;
}

export function AudioStreamProvider({ children }: { children: React.ReactNode }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [streamQuality, setStreamQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [latency, setLatency] = useState(0);
  const [receivedAudioBuffer, setReceivedAudioBuffer] = useState<ArrayBuffer | null>(null);
  
  const { sendMessage, subscribe } = useSocket();
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    // Initialize audio context
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Subscribe to audio stream events
    const unsubscribers = [
      subscribe('audio-stream-data', handleReceivedAudioData),
      subscribe('stream-quality-change', (data) => setStreamQuality(data.quality)),
      subscribe('stream-started', () => setIsReceiving(true)),
      subscribe('stream-stopped', () => setIsReceiving(false)),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
      stopStreaming();
    };
  }, [subscribe]);

  const getQualitySettings = () => {
    switch (streamQuality) {
      case 'low':
        return { sampleRate: 22050, bufferSize: 1024, bitRate: 64000 };
      case 'medium':
        return { sampleRate: 44100, bufferSize: 2048, bitRate: 128000 };
      case 'high':
        return { sampleRate: 48000, bufferSize: 4096, bitRate: 256000 };
    }
  };

  const startStreaming = async () => {
    try {
      // Get user media (microphone) or display media for system audio
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      mediaStreamRef.current = stream;
      
      if (!audioContextRef.current) return;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const settings = getQualitySettings();
      
      processorRef.current = audioContextRef.current.createScriptProcessor(
        settings.bufferSize, 1, 1
      );

      processorRef.current.onaudioprocess = (event) => {
        const audioData = event.inputBuffer.getChannelData(0);
        const buffer = new ArrayBuffer(audioData.length * 4);
        const view = new Float32Array(buffer);
        view.set(audioData);

        // Send audio data via WebSocket
        sendMessage({
          type: 'audio-stream-data',
          buffer: Array.from(new Uint8Array(buffer)),
          timestamp: Date.now(),
          quality: streamQuality,
        });
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      setIsStreaming(true);
      
      sendMessage({
        type: 'stream-started',
        quality: streamQuality,
      });

    } catch (error) {
      console.error('Failed to start audio streaming:', error);
    }
  };

  const stopStreaming = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setIsStreaming(false);
    
    sendMessage({
      type: 'stream-stopped',
    });
  };

  const handleReceivedAudioData = (data: any) => {
    const audioBuffer = new ArrayBuffer(data.buffer.length * 4);
    const view = new Float32Array(audioBuffer);
    data.buffer.forEach((byte: number, index: number) => {
      view[index] = byte;
    });
    
    setReceivedAudioBuffer(audioBuffer);
    
    // Calculate latency
    const currentTime = Date.now();
    const streamLatency = currentTime - data.timestamp;
    setLatency(streamLatency);
  };

  return (
    <AudioStreamContext.Provider value={{
      isStreaming,
      isReceiving,
      streamQuality,
      latency,
      startStreaming,
      stopStreaming,
      setStreamQuality,
      receivedAudioBuffer,
    }}>
      {children}
    </AudioStreamContext.Provider>
  );
}