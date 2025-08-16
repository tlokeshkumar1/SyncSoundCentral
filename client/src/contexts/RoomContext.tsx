import React, { createContext, useContext, useState } from 'react';
import type { Room, Device } from '@shared/schema';

interface RoomContextType {
  room: Room | null;
  device: Device | null;
  connectedDevices: Device[];
  setRoom: (room: Room) => void;
  setDevice: (device: Device) => void;
  setConnectedDevices: (devices: Device[]) => void;
  updateDevice: (deviceId: string, updates: Partial<Device>) => void;
  addDevice: (device: Device) => void;
  removeDevice: (deviceId: string) => void;
  leaveRoom: () => void;
}

const RoomContext = createContext<RoomContextType | null>(null);

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within RoomProvider');
  }
  return context;
}

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);

  const updateDevice = (deviceId: string, updates: Partial<Device>) => {
    setConnectedDevices(devices => 
      devices.map(d => d.id === deviceId ? { ...d, ...updates } : d)
    );
    
    if (device?.id === deviceId) {
      setDevice(current => current ? { ...current, ...updates } : null);
    }
  };

  const addDevice = (newDevice: Device) => {
    setConnectedDevices(devices => {
      const exists = devices.some(d => d.id === newDevice.id);
      if (exists) {
        return devices.map(d => d.id === newDevice.id ? newDevice : d);
      }
      return [...devices, newDevice];
    });
  };

  const removeDevice = (deviceId: string) => {
    setConnectedDevices(devices => devices.filter(d => d.id !== deviceId));
  };

  const leaveRoom = () => {
    setRoom(null);
    setDevice(null);
    setConnectedDevices([]);
  };

  return (
    <RoomContext.Provider value={{
      room,
      device,
      connectedDevices,
      setRoom,
      setDevice,
      setConnectedDevices,
      updateDevice,
      addDevice,
      removeDevice,
      leaveRoom,
    }}>
      {children}
    </RoomContext.Provider>
  );
}
