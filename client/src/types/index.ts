export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  volume: number;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface DevicePosition {
  x: number;
  y: number;
  audioRole?: 'center' | 'front-left' | 'front-right' | 'rear-left' | 'rear-right';
}

export type AudioMode = 'monopoly' | 'stereo';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';
