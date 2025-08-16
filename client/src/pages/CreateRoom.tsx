import { useState } from 'react';
import { ArrowLeft, Upload, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useRoom } from '../contexts/RoomContext';
import { useToast } from '@/hooks/use-toast';
import type { CreateRoom } from '@shared/schema';

export default function CreateRoom() {
  const [, setLocation] = useLocation();
  const { setRoom, setDevice } = useRoom();
  const { toast } = useToast();
  
  const [roomName, setRoomName] = useState('');
  const [audioMode, setAudioMode] = useState<'monopoly' | 'stereo'>('monopoly');
  const [audioSource, setAudioSource] = useState<'upload' | 'spotify'>('upload');
  const [deviceName, setDeviceName] = useState('My Device');

  const createRoomMutation = useMutation({
    mutationFn: async (data: CreateRoom & { name: string; type: 'mobile' | 'tablet' | 'desktop' }) => {
      const response = await apiRequest('POST', '/api/rooms', data);
      return response.json();
    },
    onSuccess: (data) => {
      setRoom(data.room);
      setDevice(data.hostDevice);
      setLocation('/host-dashboard');
      toast({
        title: "Room Created",
        description: `Room "${roomName}" created successfully!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create room",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a room name",
        variant: "destructive",
      });
      return;
    }

    // Detect device type (simplified)
    const deviceType = window.innerWidth < 768 ? 'mobile' : 
                      window.innerWidth < 1024 ? 'tablet' : 'desktop';

    createRoomMutation.mutate({
      name: roomName.trim(),
      audioMode,
      audioSource,
      type: deviceType,
    });
  };

  return (
    <div className="min-h-screen bg-dark-primary text-white relative overflow-hidden" data-testid="create-room-page">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-transparent to-secondary"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Button
              variant="ghost"
              onClick={() => setLocation('/')}
              className="text-gray-400 hover:text-white mb-4 p-0"
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <h2 className="text-4xl font-bold mb-4">Create Your Room</h2>
            <p className="text-gray-400">Set up your audio room and invite others to join</p>
          </div>

          {/* Room Setup Form */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-lg mb-8">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Room Name */}
                <div>
                  <Label className="text-gray-300 mb-3 block">Room Name</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Movie Night, Study Session..."
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-2xl px-6 py-4 placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    data-testid="input-room-name"
                    required
                  />
                </div>

                {/* Device Name */}
                <div>
                  <Label className="text-gray-300 mb-3 block">Your Device Name</Label>
                  <Input
                    type="text"
                    placeholder="My Device"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-2xl px-6 py-4 placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    data-testid="input-device-name"
                    required
                  />
                </div>

                {/* Audio Source */}
                <div>
                  <Label className="text-gray-300 mb-3 block">Audio Source</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAudioSource('upload')}
                      className={`p-4 rounded-2xl transition-colors ${
                        audioSource === 'upload' 
                          ? 'border-primary bg-primary/20' 
                          : 'bg-white/5 border-white/10 hover:border-primary'
                      }`}
                      data-testid="button-audio-upload"
                    >
                      <Upload className="w-6 h-6 mb-2 text-primary" />
                      <p className="text-sm font-medium">Upload Files</p>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAudioSource('spotify')}
                      className={`p-4 rounded-2xl transition-colors ${
                        audioSource === 'spotify' 
                          ? 'border-secondary bg-secondary/20' 
                          : 'bg-white/5 border-white/10 hover:border-secondary'
                      }`}
                      data-testid="button-audio-spotify"
                    >
                      <i className="fab fa-spotify text-2xl mb-2 text-secondary"></i>
                      <p className="text-sm font-medium">Spotify</p>
                    </Button>
                  </div>
                </div>

                {/* Audio Mode */}
                <div>
                  <Label className="text-gray-300 mb-3 block">Audio Mode</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAudioMode('monopoly')}
                      className={`p-4 rounded-2xl text-left transition-colors ${
                        audioMode === 'monopoly' 
                          ? 'border-primary bg-primary/20' 
                          : 'bg-white/5 border-white/10 hover:border-white/30'
                      }`}
                      data-testid="button-mode-monopoly"
                    >
                      <h4 className="font-semibold mb-1">Monopoly Mode</h4>
                      <p className="text-xs text-gray-400">All devices play identical audio</p>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAudioMode('stereo')}
                      className={`p-4 rounded-2xl text-left transition-colors ${
                        audioMode === 'stereo' 
                          ? 'border-primary bg-primary/20' 
                          : 'bg-white/5 border-white/10 hover:border-white/30'
                      }`}
                      data-testid="button-mode-stereo"
                    >
                      <h4 className="font-semibold mb-1">Stereo Mode</h4>
                      <p className="text-xs text-gray-400">Surround sound positioning</p>
                    </Button>
                  </div>
                </div>

                {/* Create Room Button */}
                <Button 
                  type="submit"
                  disabled={createRoomMutation.isPending}
                  className="w-full bg-gradient-to-r from-accent to-orange-600 hover:shadow-lg hover:shadow-accent/25 transition-all duration-300 py-6 rounded-2xl font-bold text-lg"
                  data-testid="button-create-room"
                >
                  {createRoomMutation.isPending ? (
                    <>Creating Room...</>
                  ) : (
                    <>
                      <Crown className="mr-2 h-5 w-5" />
                      Create Room
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
