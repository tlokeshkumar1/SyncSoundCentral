import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { useAudio } from '../contexts/AudioContext';
import { useRoom } from '../contexts/RoomContext';
import { useWebSocket } from '../hooks/useWebSocket';

interface AudioPlayerProps {
  isHost?: boolean;
}

export function AudioPlayer({ isHost = false }: AudioPlayerProps) {
  const { 
    currentTrack, 
    isPlaying, 
    volume, 
    isMuted, 
    currentTime, 
    duration,
    play,
    pause,
    seek,
    setVolume,
    toggleMute
  } = useAudio();
  
  const { device } = useRoom();
  const { broadcastAudioSync, broadcastVolumeChange } = useWebSocket();

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
      if (isHost) broadcastAudioSync('pause');
    } else {
      play();
      if (isHost) broadcastAudioSync('play', currentTime);
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    seek(newTime);
    if (isHost) broadcastAudioSync('seek', newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    broadcastVolumeChange(newVolume, isMuted);
  };

  const handleMute = () => {
    toggleMute();
    broadcastVolumeChange(volume, !isMuted);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) {
    return (
      <Card className="p-6 bg-white/5 border-white/10">
        <div className="text-center text-gray-400">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-music text-2xl text-white/50"></i>
          </div>
          <p>No track loaded</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white/5 border-white/10" data-testid="audio-player">
      {/* Track Info */}
      <div className="mb-6">
        <div className="w-full aspect-square bg-gradient-to-br from-primary to-secondary rounded-2xl mb-4 flex items-center justify-center">
          <i className="fas fa-music text-4xl text-white/50"></i>
        </div>
        <h4 className="font-semibold truncate" data-testid="track-title">{currentTrack.title}</h4>
        <p className="text-sm text-gray-400 truncate" data-testid="track-artist">{currentTrack.artist}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span data-testid="current-time">{formatTime(currentTime)}</span>
          <span data-testid="total-duration">{formatTime(duration)}</span>
        </div>
        <Slider
          value={[currentTime]}
          max={duration}
          step={1}
          onValueChange={handleSeek}
          disabled={!isHost}
          className="w-full"
          data-testid="progress-slider"
        />
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        {isHost && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20"
              data-testid="button-skip-backward"
            >
              <SkipBack className="h-4 w-4 text-gray-400" />
            </Button>
            
            <Button
              onClick={handlePlayPause}
              size="icon"
              className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/25"
              data-testid="button-play-pause"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6 text-white" />
              ) : (
                <Play className="h-6 w-6 text-white ml-1" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20"
              data-testid="button-skip-forward"
            >
              <SkipForward className="h-4 w-4 text-gray-400" />
            </Button>
          </>
        )}
        
        {!isHost && (
          <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
            {isPlaying ? (
              <Pause className="h-6 w-6 text-white" />
            ) : (
              <Play className="h-6 w-6 text-white ml-1" />
            )}
          </div>
        )}
      </div>
      
      {!isHost && (
        <p className="text-xs text-gray-400 text-center mb-6">
          Playback controlled by room host
        </p>
      )}

      {/* Volume Control */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-3" data-testid="label-volume">
          {isHost ? 'Master Volume' : 'Your Volume'}
        </label>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMute}
            className="w-8 h-8"
            data-testid="button-mute"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-gray-400" />
            ) : (
              <Volume2 className="h-4 w-4 text-gray-400" />
            )}
          </Button>
          <Slider
            value={[volume]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="flex-1"
            data-testid="volume-slider"
          />
        </div>
      </div>
    </Card>
  );
}
