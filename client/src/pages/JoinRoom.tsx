import { useState } from 'react';
import { ArrowLeft, LogIn, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useRoom } from '../contexts/RoomContext';
import { useToast } from '@/hooks/use-toast';
import { OTPInput } from '../components/OTPInput';
import type { JoinRoom } from '@shared/schema';

export default function JoinRoom() {
  const [, setLocation] = useLocation();
  const { setRoom, setDevice } = useRoom();
  const { toast } = useToast();
  
  const [otp, setOtp] = useState('');
  const [deviceName, setDeviceName] = useState('My Device');

  const joinRoomMutation = useMutation({
    mutationFn: async (data: JoinRoom) => {
      const response = await apiRequest('POST', '/api/rooms/join', data);
      return response.json();
    },
    onSuccess: (data) => {
      setRoom(data.room);
      setDevice(data.device);
      setLocation('/participant-dashboard');
      toast({
        title: "Joined Room",
        description: `Successfully joined "${data.room.name}"!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join room",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter the complete 6-digit room code",
        variant: "destructive",
      });
      return;
    }

    if (!deviceName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a device name",
        variant: "destructive",
      });
      return;
    }

    // Detect device type (simplified)
    const deviceType = window.innerWidth < 768 ? 'mobile' : 
                      window.innerWidth < 1024 ? 'tablet' : 'desktop';

    joinRoomMutation.mutate({
      otp,
      deviceName: deviceName.trim(),
      deviceType,
    });
  };

  // Mock recent rooms (in real app, this would come from localStorage or API)
  const recentRooms = [
    { name: 'Movie Night', otp: '849273', timeAgo: '2 hours ago' },
    { name: 'Study Session', otp: '156789', timeAgo: 'Yesterday' },
  ];

  return (
    <div className="min-h-screen bg-dark-primary text-white relative overflow-hidden" data-testid="join-room-page">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-transparent to-secondary"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
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
            <h2 className="text-4xl font-bold mb-4">Join a Room</h2>
            <p className="text-gray-400">Enter the 6-digit room code to connect</p>
          </div>

          {/* OTP Input Form */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-lg mb-8">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Room Code Input */}
                <div className="text-center">
                  <Label className="text-gray-300 mb-4 block">Room Code</Label>
                  <OTPInput
                    length={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={joinRoomMutation.isPending}
                  />
                  <p className="text-sm text-gray-400 mt-4">Ask the room host for the 6-digit code</p>
                </div>

                {/* Device Name */}
                <div>
                  <Label className="text-gray-300 mb-3 block">Your Device Name</Label>
                  <Input
                    type="text"
                    placeholder="My Device"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-2xl px-6 py-4 placeholder-gray-500 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    data-testid="input-device-name"
                    required
                  />
                </div>

                {/* Device Info Display */}
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3">Your Device</h4>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-secondary to-emerald-600 rounded-xl flex items-center justify-center">
                        <i className="fas fa-mobile-alt text-white"></i>
                      </div>
                      <div>
                        <p className="font-medium">{deviceName || 'My Device'}</p>
                        <p className="text-sm text-gray-400">Ready to connect</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Join Button */}
                <Button 
                  type="submit"
                  disabled={joinRoomMutation.isPending || otp.length !== 6}
                  className="w-full bg-gradient-to-r from-secondary to-emerald-600 hover:shadow-lg hover:shadow-secondary/25 transition-all duration-300 py-6 rounded-2xl font-bold text-lg"
                  data-testid="button-join-room"
                >
                  {joinRoomMutation.isPending ? (
                    <>Joining Room...</>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Join Room
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Rooms */}
          {recentRooms.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-4 text-gray-400">Recent Rooms</h4>
              <div className="space-y-3">
                {recentRooms.map((room, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    onClick={() => setOtp(room.otp)}
                    className="w-full text-left bg-white/5 rounded-2xl p-4 hover:bg-white/10 transition-colors"
                    data-testid={`button-recent-room-${index}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{room.name}</p>
                        <p className="text-sm text-gray-400">
                          Code: {room.otp} • {room.timeAgo}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
