import { useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useRoom } from '../contexts/RoomContext';
import { useAudio } from '../contexts/AudioContext';

export function useWebSocket() {
  const { sendMessage, subscribe } = useSocket();
  const { room, device, updateDevice, addDevice, removeDevice } = useRoom();
  const { syncPlayback } = useAudio();

  useEffect(() => {
    if (!room || !device) return;

    // Join room on connection
    sendMessage({
      type: 'join-room',
      roomId: room.id,
      deviceId: device.id,
    });

    const unsubscribers = [
      subscribe('device-connected', (data) => {
        console.log('Device connected:', data.deviceId);
      }),

      subscribe('device-disconnected', (data) => {
        removeDevice(data.deviceId);
      }),

      subscribe('audio-sync', (data) => {
        syncPlayback(data.timestamp, data.action, data.position);
      }),

      subscribe('position-update', (data) => {
        updateDevice(data.deviceId, {
          positionX: data.x,
          positionY: data.y,
          audioRole: data.audioRole,
        });
      }),

      subscribe('device-update', (data) => {
        updateDevice(data.deviceId, {
          volume: data.volume,
          isMuted: data.isMuted,
        });
      }),

      subscribe('mode-change', (data) => {
        // Handle audio mode change
        console.log('Audio mode changed:', data.mode);
      }),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [room, device, sendMessage, subscribe, updateDevice, addDevice, removeDevice, syncPlayback]);

  const broadcastAudioSync = (action: string, position?: number) => {
    if (!room || !device?.isHost) return;
    
    sendMessage({
      type: 'audio-sync',
      timestamp: Date.now() + 100, // Small delay for sync
      action,
      position,
    });
  };

  const updateDevicePosition = (x: number, y: number, audioRole?: string) => {
    sendMessage({
      type: 'device-position',
      x,
      y,
      audioRole,
    });
  };

  const broadcastVolumeChange = (volume: number, isMuted: boolean) => {
    sendMessage({
      type: 'volume-change',
      volume,
      isMuted,
    });
  };

  const changeAudioMode = (mode: 'monopoly' | 'stereo') => {
    sendMessage({
      type: 'mode-change',
      mode,
    });
  };

  return {
    broadcastAudioSync,
    updateDevicePosition,
    broadcastVolumeChange,
    changeAudioMode,
  };
}
