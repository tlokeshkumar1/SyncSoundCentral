import { Crown, Smartphone, Tablet, Monitor } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Device } from '@shared/schema';

interface DeviceCardProps {
  device: Device;
  showPosition?: boolean;
}

export function DeviceCard({ device, showPosition = false }: DeviceCardProps) {
  const getDeviceIcon = () => {
    switch (device.type) {
      case 'tablet':
        return <Tablet className="w-5 h-5 text-white" />;
      case 'desktop':
        return <Monitor className="w-5 h-5 text-white" />;
      default:
        return <Smartphone className="w-5 h-5 text-white" />;
    }
  };

  const getDeviceColor = () => {
    if (device.isHost) return 'from-accent to-orange-600';
    switch (device.type) {
      case 'tablet':
        return 'from-primary to-purple-600';
      case 'desktop':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-secondary to-emerald-600';
    }
  };

  const getStatusColor = () => {
    return device.isConnected ? 'bg-secondary' : 'bg-gray-500';
  };

  const getStatusText = () => {
    if (!device.isConnected) return 'Disconnected';
    return device.isHost ? 'Host' : 'Synced';
  };

  return (
    <Card 
      className={`p-4 transition-all duration-300 ${
        device.isHost 
          ? 'bg-accent/10 border-accent/30' 
          : 'bg-white/5 border-white/10'
      }`}
      data-testid={`device-card-${device.id}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`relative w-12 h-12 bg-gradient-to-br ${getDeviceColor()} rounded-xl flex items-center justify-center overflow-hidden`}>
            {device.isHost && (
              <Crown className="absolute top-1 right-1 w-3 h-3 text-white" />
            )}
            {getDeviceIcon()}
            {/* Ping animation for connected devices */}
            {device.isConnected && !device.isHost && (
              <div className="absolute -inset-2 border-2 border-primary rounded-full animate-ping opacity-75"></div>
            )}
          </div>
          <div>
            <h4 className="font-semibold" data-testid={`device-name-${device.id}`}>
              {device.name}
            </h4>
            <p className="text-sm text-gray-400" data-testid={`device-info-${device.id}`}>
              {device.isHost ? 'Host' : 'Participant'} • {device.type}
            </p>
            {showPosition && device.audioRole && (
              <Badge variant="outline" className="mt-1 text-xs" data-testid={`audio-role-${device.id}`}>
                {device.audioRole.replace('-', ' ').toUpperCase()}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 ${getStatusColor()} rounded-full ${device.isConnected ? 'animate-pulse' : ''}`}></div>
          <span className={`text-sm font-medium ${device.isConnected ? 'text-secondary' : 'text-gray-500'}`} data-testid={`status-${device.id}`}>
            {getStatusText()}
          </span>
        </div>
      </div>
      
      {/* Volume indicator for non-host devices */}
      {!device.isHost && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Volume: {device.volume}%</span>
            {device.isMuted && (
              <Badge variant="outline" className="text-red-400 border-red-400">
                Muted
              </Badge>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
