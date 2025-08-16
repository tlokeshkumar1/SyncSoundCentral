import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react';
import { useAudioStream } from '../contexts/AudioStreamContext';
import { useRoom } from '../contexts/RoomContext';

export function ReceiverAudioPlayer() {
  const { isReceiving, latency, receivedAudioBuffer, streamQuality } = useAudioStream();
  const { device } = useRoom();
  const { subscribe } = useSocket();
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [bufferHealth, setBufferHealth] = useState(100);
  const [currentSong, setCurrentSong] = useState<{ title: string; artist: string; thumbnail?: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const bufferQueueRef = useRef<AudioBuffer[]>([]);
  const nextPlayTimeRef = useRef(0);

  useEffect(() => {
    // Initialize Web Audio API for playback
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.connect(audioContextRef.current.destination);
    
    // Subscribe to song updates from host
    const unsubscribers = [
      subscribe('current-song-update', (data) => {
        setCurrentSong({
          title: data.title,
          artist: data.artist || data.channel,
          thumbnail: data.thumbnail
        });
      }),
      subscribe('audio-sync', (data) => {
        if (data.action === 'play') {
          setIsPlaying(true);
        } else if (data.action === 'pause') {
          setIsPlaying(false);
        }
      })
    ];
    
    return () => {
      audioContextRef.current?.close();
      unsubscribers.forEach(unsub => unsub());
    };
  }, [subscribe]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (receivedAudioBuffer && audioContextRef.current) {
      playAudioBuffer(receivedAudioBuffer);
    }
  }, [receivedAudioBuffer]);

  const playAudioBuffer = async (buffer: ArrayBuffer) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;

    try {
      // Convert ArrayBuffer to AudioBuffer
      const audioData = new Float32Array(buffer);
      const audioBuffer = audioContextRef.current.createBuffer(1, audioData.length, 44100);
      audioBuffer.copyToChannel(audioData, 0);

      // Add to buffer queue for smooth playback
      bufferQueueRef.current.push(audioBuffer);
      
      // Update buffer health
      setBufferHealth(Math.min(bufferQueueRef.current.length * 10, 100));

      // Play next buffer if ready
      if (bufferQueueRef.current.length > 0) {
        scheduleNextBuffer();
      }
    } catch (error) {
      console.error('Error playing audio buffer:', error);
    }
  };

  const scheduleNextBuffer = () => {
    if (!audioContextRef.current || !gainNodeRef.current || bufferQueueRef.current.length === 0) return;

    const buffer = bufferQueueRef.current.shift()!;
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(gainNodeRef.current);

    const currentTime = audioContextRef.current.currentTime;
    const playTime = Math.max(currentTime, nextPlayTimeRef.current);
    
    source.start(playTime);
    nextPlayTimeRef.current = playTime + buffer.duration;

    // Schedule next buffer
    setTimeout(() => {
      if (bufferQueueRef.current.length > 0) {
        scheduleNextBuffer();
      }
    }, (buffer.duration * 1000) - 50); // Slight overlap to prevent gaps
  };

  const getConnectionQuality = () => {
    if (!isReceiving) return 'disconnected';
    if (latency < 50) return 'excellent';
    if (latency < 100) return 'good';
    if (latency < 200) return 'fair';
    return 'poor';
  };

  const getQualityColor = () => {
    const quality = getConnectionQuality();
    switch (quality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'fair': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    return isReceiving ? (
      <Wifi className={`w-4 h-4 ${getQualityColor()}`} />
    ) : (
      <WifiOff className="w-4 h-4 text-gray-400" />
    );
  };

  return (
    <Card className="p-6 bg-white border border-gray-200 shadow-lg" data-testid="receiver-audio-player">
      {/* Current Song Display */}
      {currentSong && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
          <div className="flex items-center space-x-4">
            {currentSong.thumbnail ? (
              <img 
                src={currentSong.thumbnail} 
                alt="Song thumbnail" 
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-music text-white text-xl"></i>
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-800 line-clamp-1" data-testid="current-song-title">
                {currentSong.title}
              </h3>
              <p className="text-sm text-gray-600" data-testid="current-song-artist">
                {currentSong.artist}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                {isPlaying ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium">NOW PLAYING</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-gray-500">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-xs font-medium">PAUSED</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h4 className="font-semibold text-gray-800" data-testid="receiver-status">
              {isReceiving ? 'Receiving Audio' : 'Waiting for Stream'}
            </h4>
            <p className="text-sm text-gray-600">
              {device?.audioRole?.replace('-', ' ').toUpperCase() || 'Center'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-800" data-testid="latency-display">
            {latency}ms
          </div>
          <Badge 
            variant="outline" 
            className={`text-xs ${getQualityColor()} border-current`}
            data-testid="connection-quality"
          >
            {getConnectionQuality().toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Audio Visualization */}
      {isReceiving && (
        <div className="mb-6">
          <div className="relative h-20 bg-gradient-to-r from-dark-secondary to-dark-tertiary rounded-xl overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center space-x-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 bg-gradient-to-t from-primary to-secondary rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 60 + 20}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`,
                  }}
                />
              ))}
            </div>
            <div className="absolute top-2 left-3 text-xs text-gray-400">
              Stream Quality: {streamQuality.toUpperCase()}
            </div>
            <div className="absolute top-2 right-3 text-xs text-gray-400">
              Buffer: {bufferHealth}%
            </div>
          </div>
        </div>
      )}

      {/* Volume Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Device Volume</span>
          <span className="text-sm text-gray-400">{volume}%</span>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="w-8 h-8"
            data-testid="receiver-mute-button"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-red-400" />
            ) : (
              <Volume2 className="h-4 w-4 text-gray-400" />
            )}
          </Button>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
            data-testid="receiver-volume-slider"
          />
        </div>
      </div>

      {/* Advanced Controls */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Audio Role</span>
            <p className="font-medium" data-testid="audio-role">
              {device?.audioRole?.replace('-', ' ').toUpperCase() || 'CENTER'}
            </p>
          </div>
          <div>
            <span className="text-gray-400">Buffer Health</span>
            <div className="flex items-center space-x-2">
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                  style={{ width: `${bufferHealth}%` }}
                />
              </div>
              <span className="text-xs">{bufferHealth}%</span>
            </div>
          </div>
        </div>
      </div>

      {!isReceiving && !currentSong && (
        <div className="mt-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Wifi className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-600">
            Waiting for host to start audio streaming...
          </p>
        </div>
      )}
    </Card>
  );
}