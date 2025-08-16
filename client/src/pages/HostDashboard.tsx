import { useEffect, useState, useRef } from 'react';
import { Copy, Settings, LogOut, Upload, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useRoom } from '../contexts/RoomContext';
import { useAudio } from '../contexts/AudioContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useToast } from '@/hooks/use-toast';
import { DeviceCard } from '../components/DeviceCard';
import { AudioPlayer } from '../components/AudioPlayer';
import { AppIntegrationHub } from '../components/AppIntegrationHub';
import { useAudioStream } from '../contexts/AudioStreamContext';

export default function HostDashboard() {
  const [, setLocation] = useLocation();
  const { room, device, connectedDevices, setConnectedDevices, leaveRoom } = useRoom();
  const { loadTrack } = useAudio();
  const { changeAudioMode } = useWebSocket();
  const { startStreaming, stopStreaming, isStreaming } = useAudioStream();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [autoSync, setAutoSync] = useState(true);
  const [notifications, setNotifications] = useState(false);

  // Fetch room data and connected devices
  const { data: roomData } = useQuery({
    queryKey: ['/api/rooms', room?.id],
    enabled: !!room?.id,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  useEffect(() => {
    if (roomData && typeof roomData === 'object' && 'devices' in roomData) {
      setConnectedDevices((roomData as any).devices);
    }
  }, [roomData, setConnectedDevices]);

  // End room mutation
  const endRoomMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/rooms/${room?.id}`);
      return response.json();
    },
    onSuccess: () => {
      leaveRoom();
      setLocation('/');
      toast({
        title: "Room Ended",
        description: "The room has been closed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to end room",
        variant: "destructive",
      });
    },
  });

  // Update room mutation
  const updateRoomMutation = useMutation({
    mutationFn: async (updates: { audioMode?: 'monopoly' | 'stereo' }) => {
      const response = await apiRequest('PUT', `/api/rooms/${room?.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms', room?.id] });
    },
  });

  const handleCopyCode = async () => {
    if (room?.otp) {
      try {
        await navigator.clipboard.writeText(room.otp);
        toast({
          title: "Copied!",
          description: "Room code copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy room code",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      loadTrack(file);
      toast({
        title: "Track Loaded",
        description: `"${file.name}" is ready to play`,
      });
    } else {
      toast({
        title: "Error",
        description: "Please select a valid audio file",
        variant: "destructive",
      });
    }
  };

  const handleAudioModeChange = (mode: 'monopoly' | 'stereo') => {
    updateRoomMutation.mutate({ audioMode: mode });
    changeAudioMode(mode);
  };

  const handleEndRoom = () => {
    if (confirm('Are you sure you want to end this room? All participants will be disconnected.')) {
      endRoomMutation.mutate();
    }
  };

  if (!room || !device) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-white text-center">
          <p>No room found. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 relative overflow-hidden" data-testid="host-dashboard">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-transparent to-secondary"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Room Header */}
          <Card className="bg-white border border-gray-200 shadow-lg mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent to-orange-600 rounded-2xl flex items-center justify-center">
                    <i className="fas fa-crown text-white text-xl"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold" data-testid="room-name">{room.name}</h2>
                    <p className="text-gray-400">Host • Created {new Date(room.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Enhanced Room Code Display */}
                <div className="text-center">
                  <p className="text-sm font-bold mb-3 text-primary">🏠 ROOM CODE</p>
                  <div className="bg-gradient-to-br from-yellow-100 to-orange-100 border-4 border-primary rounded-3xl p-6 shadow-xl">
                    <div className="text-6xl font-black font-mono tracking-widest text-gray-800 mb-2" data-testid="room-otp">
                      {room.otp}
                    </div>
                    <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Share this code to connect devices
                    </div>
                  </div>
                  <Button
                    onClick={handleCopyCode}
                    className="mt-4 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all"
                    data-testid="button-copy-code"
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copy Code
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Connected Devices Panel */}
            <div className="lg:col-span-2 space-y-8">
              {/* App Integration Hub */}
              <AppIntegrationHub />
              
              {/* Connected Devices */}
              <Card className="bg-white border border-gray-200 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Connected Devices</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-400">
                        <span data-testid="device-count">{connectedDevices.length}</span> device{connectedDevices.length !== 1 ? 's' : ''} connected
                      </span>
                    </div>
                  </div>

                  {/* Device List */}
                  <div className="space-y-4 mb-8">
                    {connectedDevices.map((connectedDevice) => (
                      <DeviceCard 
                        key={connectedDevice.id} 
                        device={connectedDevice}
                        showPosition={room.audioMode === 'stereo'}
                      />
                    ))}
                  </div>

                  {/* Device Positioning Visualization (Stereo Mode) */}
                  {room.audioMode === 'stereo' && (
                    <div className="p-6 bg-white/5 rounded-2xl">
                      <h4 className="font-semibold mb-4 text-center">Device Positioning (Stereo Mode)</h4>
                      <div className="relative w-full h-64 bg-gradient-to-br from-dark-secondary to-dark-tertiary rounded-2xl overflow-hidden">
                        <svg className="absolute inset-0 w-full h-full">
                          {/* Connection lines from center */}
                          {connectedDevices.filter(d => !d.isHost).map((device, index) => {
                            const angle = (index * 2 * Math.PI) / Math.max(connectedDevices.length - 1, 1);
                            const x = 50 + 30 * Math.cos(angle);
                            const y = 50 + 30 * Math.sin(angle);
                            return (
                              <line 
                                key={device.id}
                                x1="50%" 
                                y1="50%" 
                                x2={`${x}%`} 
                                y2={`${y}%`} 
                                stroke="#7C3AED" 
                                strokeWidth="2" 
                                className="opacity-60"
                                strokeDasharray="5,5"
                              />
                            );
                          })}
                        </svg>
                        
                        {/* Host Device (Center) */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <div className="w-8 h-8 bg-gradient-to-br from-accent to-orange-600 rounded-full flex items-center justify-center relative">
                            <i className="fas fa-crown text-white text-xs"></i>
                            <div className="absolute -inset-2 border-2 border-accent rounded-full animate-ping opacity-75"></div>
                          </div>
                          <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">Host</span>
                        </div>

                        {/* Participant Devices */}
                        {connectedDevices.filter(d => !d.isHost).map((device, index) => {
                          const angle = (index * 2 * Math.PI) / Math.max(connectedDevices.length - 1, 1);
                          const x = 50 + 30 * Math.cos(angle);
                          const y = 50 + 30 * Math.sin(angle);
                          
                          return (
                            <div 
                              key={device.id}
                              className="absolute transform -translate-x-1/2 -translate-y-1/2"
                              style={{ left: `${x}%`, top: `${y}%` }}
                            >
                              <div className="w-6 h-6 bg-gradient-to-br from-secondary to-emerald-600 rounded-full"></div>
                              <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
                                {device.audioRole?.replace('-', ' ').toUpperCase() || 'POS'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-400 text-center mt-2">
                        Devices automatically position themselves for optimal surround sound
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Audio Controls Panel */}
            <div className="space-y-6">
              {/* Audio Player */}
              <AudioPlayer isHost={true} />

              {/* Audio Mode Toggle */}
              <Card className="bg-white border border-gray-200 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Audio Mode</h3>
                  <div className="bg-white/5 rounded-2xl p-1 flex">
                    <Button
                      onClick={() => handleAudioModeChange('monopoly')}
                      variant={room.audioMode === 'monopoly' ? 'default' : 'ghost'}
                      className={`flex-1 py-3 text-sm font-medium transition-all ${
                        room.audioMode === 'monopoly' 
                          ? 'bg-primary text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                      data-testid="button-monopoly-mode"
                    >
                      Monopoly
                    </Button>
                    <Button
                      onClick={() => handleAudioModeChange('stereo')}
                      variant={room.audioMode === 'stereo' ? 'default' : 'ghost'}
                      className={`flex-1 py-3 text-sm font-medium transition-all ${
                        room.audioMode === 'stereo' 
                          ? 'bg-primary text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                      data-testid="button-stereo-mode"
                    >
                      Stereo
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white border border-gray-200 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3 mb-4">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="w-full bg-white/5 border-white/10 rounded-xl py-3 text-sm font-medium hover:bg-white/10"
                      data-testid="button-upload-audio"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Local File
                    </Button>
                    <Button
                      onClick={isStreaming ? stopStreaming : startStreaming}
                      className={`w-full rounded-xl py-3 text-sm font-medium transition-all ${
                        isStreaming 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                          : 'bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/25'
                      }`}
                      data-testid="button-toggle-streaming"
                    >
                      {isStreaming ? (
                        <>
                          <i className="fas fa-stop mr-2"></i>
                          Stop Broadcasting
                        </>
                      ) : (
                        <>
                          <i className="fas fa-broadcast-tower mr-2"></i>
                          Start Broadcasting
                        </>
                      )}
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </CardContent>
              </Card>

              {/* Room Settings */}
              <Card className="bg-white border border-gray-200 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Room Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-sync devices</span>
                      <Switch 
                        checked={autoSync}
                        onCheckedChange={setAutoSync}
                        data-testid="switch-auto-sync"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Room notifications</span>
                      <Switch 
                        checked={notifications}
                        onCheckedChange={setNotifications}
                        data-testid="switch-notifications"
                      />
                    </div>
                    <Button
                      onClick={handleEndRoom}
                      disabled={endRoomMutation.isPending}
                      className="w-full bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl py-3 text-sm font-medium hover:bg-red-500/30"
                      data-testid="button-end-room"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {endRoomMutation.isPending ? 'Ending Room...' : 'End Room'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
