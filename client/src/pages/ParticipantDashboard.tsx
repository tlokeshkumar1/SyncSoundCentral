import { useEffect } from 'react';
import { LogOut, Mic, MicOff, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useRoom } from '../contexts/RoomContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useToast } from '@/hooks/use-toast';
import { AudioPlayer } from '../components/AudioPlayer';
import { ReceiverAudioPlayer } from '../components/ReceiverAudioPlayer';
import { DeviceCard } from '../components/DeviceCard';

export default function ParticipantDashboard() {
  const [, setLocation] = useLocation();
  const { room, device, connectedDevices, setConnectedDevices, leaveRoom } = useRoom();
  const { toast } = useToast();

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

  const handleLeaveRoom = () => {
    if (confirm('Are you sure you want to leave this room?')) {
      leaveRoom();
      setLocation('/');
      toast({
        title: "Left Room",
        description: "You have successfully left the room.",
      });
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

  const hostDevice = connectedDevices.find(d => d.isHost);
  const otherDevices = connectedDevices.filter(d => !d.isHost && d.id !== device.id);
  
  // Mock latency calculation
  const latency = Math.floor(Math.random() * 20 + 15); // 15-35ms

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 relative overflow-hidden" data-testid="participant-dashboard">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-transparent to-secondary"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Room Info Header */}
          <Card className="bg-white border border-gray-200 shadow-lg mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-secondary to-emerald-600 rounded-2xl flex items-center justify-center">
                    <i className="fas fa-users text-white text-xl"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold" data-testid="room-name">{room.name}</h2>
                    <p className="text-gray-400">
                      Participant • Connected to {hostDevice?.name || "Host"}'s Room
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-secondary rounded-full animate-pulse"></div>
                  <span className="text-sm text-secondary font-medium" data-testid="connection-status">Synced</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Receiver Audio Player */}
            <div>
              <ReceiverAudioPlayer />
            </div>

            {/* Room Status and Controls */}
            <div className="space-y-6">
              {/* Connection Status */}
              <Card className="bg-white border border-gray-200 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Connection Status</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Room Connection</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-secondary rounded-full"></div>
                        <span className="text-sm text-secondary font-medium">Connected</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Audio Sync</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                        <span className="text-sm text-secondary font-medium">Synced</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Latency</span>
                      <span className="text-sm text-gray-400" data-testid="latency-display">{latency}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Audio Mode</span>
                      <Badge variant="outline" className="text-gray-400 border-gray-600">
                        {room.audioMode}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Connected Devices */}
              <Card className="bg-white border border-gray-200 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Other Devices</h3>
                  
                  <div className="space-y-3">
                    {/* Host Device */}
                    {hostDevice && (
                      <div className="flex items-center space-x-3 p-3 bg-accent/10 rounded-lg border border-accent/30">
                        <div className="w-8 h-8 bg-gradient-to-br from-accent to-orange-600 rounded-lg flex items-center justify-center">
                          <i className="fas fa-crown text-white text-xs"></i>
                        </div>
                        <div>
                          <p className="text-sm font-medium" data-testid={`host-device-name`}>{hostDevice.name}</p>
                          <p className="text-xs text-gray-400">Host</p>
                        </div>
                      </div>
                    )}

                    {/* Other Participants */}
                    {otherDevices.map((connectedDevice) => (
                      <div key={connectedDevice.id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                          <i className={`fas fa-${connectedDevice.type === 'tablet' ? 'tablet-alt' : connectedDevice.type === 'desktop' ? 'laptop' : 'mobile-alt'} text-white text-xs`}></i>
                        </div>
                        <div>
                          <p className="text-sm font-medium" data-testid={`device-name-${connectedDevice.id}`}>{connectedDevice.name}</p>
                          <p className="text-xs text-gray-400">Participant</p>
                        </div>
                      </div>
                    ))}
                    
                    {otherDevices.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">
                        No other participants yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white border border-gray-200 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Button
                      variant="outline"
                      className="bg-white/5 border-white/10 rounded-xl py-3 text-sm font-medium hover:bg-white/10"
                      data-testid="button-mute"
                    >
                      <MicOff className="w-4 h-4 mb-1" />
                      Mute
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-white/5 border-white/10 rounded-xl py-3 text-sm font-medium hover:bg-white/10"
                      data-testid="button-settings"
                    >
                      <Settings className="w-4 h-4 mb-1" />
                      Settings
                    </Button>
                  </div>
                  
                  <Button
                    onClick={handleLeaveRoom}
                    className="w-full bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl py-3 text-sm font-medium hover:bg-red-500/30"
                    data-testid="button-leave-room"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Leave Room
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
