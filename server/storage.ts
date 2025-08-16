import { randomUUID } from "crypto";
import type { Room, Device, CreateRoom, JoinRoom } from "@shared/schema";

export interface IStorage {
  // Room operations
  createRoom(room: CreateRoom, hostDeviceId: string): Promise<Room>;
  getRoomByOtp(otp: string): Promise<Room | undefined>;
  getRoomById(id: string): Promise<Room | undefined>;
  updateRoom(id: string, updates: Partial<Room>): Promise<Room | undefined>;
  deleteRoom(id: string): Promise<boolean>;
  
  // Device operations
  createDevice(device: Omit<Device, "id" | "connectedAt" | "lastSeen">): Promise<Device>;
  getDevice(id: string): Promise<Device | undefined>;
  getDevicesByRoomId(roomId: string): Promise<Device[]>;
  updateDevice(id: string, updates: Partial<Device>): Promise<Device | undefined>;
  removeDevice(id: string): Promise<boolean>;
  
  // Utility operations
  cleanupExpiredRooms(): Promise<void>;
}

export class MemStorage implements IStorage {
  private rooms: Map<string, Room> = new Map();
  private devices: Map<string, Device> = new Map();

  constructor() {
    // Clean up expired rooms every 5 minutes
    setInterval(() => {
      this.cleanupExpiredRooms();
    }, 5 * 60 * 1000);
  }

  async createRoom(roomData: CreateRoom, hostDeviceId: string): Promise<Room> {
    const id = randomUUID();
    const otp = this.generateOTP();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const room: Room = {
      id,
      otp,
      hostDeviceId,
      isActive: true,
      createdAt: now,
      expiresAt,
      ...roomData,
    };

    this.rooms.set(id, room);
    return room;
  }

  async getRoomByOtp(otp: string): Promise<Room | undefined> {
    return Array.from(this.rooms.values()).find(
      (room) => room.otp === otp && room.isActive && room.expiresAt > new Date()
    );
  }

  async getRoomById(id: string): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (!room || !room.isActive || room.expiresAt <= new Date()) {
      return undefined;
    }
    return room;
  }

  async updateRoom(id: string, updates: Partial<Room>): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;

    const updatedRoom = { ...room, ...updates };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  async deleteRoom(id: string): Promise<boolean> {
    const deleted = this.rooms.delete(id);
    // Also remove all devices in this room
    const devices = Array.from(this.devices.values()).filter(d => d.roomId === id);
    devices.forEach(device => this.devices.delete(device.id));
    return deleted;
  }

  async createDevice(deviceData: Omit<Device, "id" | "connectedAt" | "lastSeen">): Promise<Device> {
    const id = randomUUID();
    const now = new Date();

    const device: Device = {
      id,
      connectedAt: now,
      lastSeen: now,
      ...deviceData,
    };

    this.devices.set(id, device);
    return device;
  }

  async getDevice(id: string): Promise<Device | undefined> {
    return this.devices.get(id);
  }

  async getDevicesByRoomId(roomId: string): Promise<Device[]> {
    return Array.from(this.devices.values()).filter((device) => device.roomId === roomId);
  }

  async updateDevice(id: string, updates: Partial<Device>): Promise<Device | undefined> {
    const device = this.devices.get(id);
    if (!device) return undefined;

    const updatedDevice = { ...device, ...updates, lastSeen: new Date() };
    this.devices.set(id, updatedDevice);
    return updatedDevice;
  }

  async removeDevice(id: string): Promise<boolean> {
    return this.devices.delete(id);
  }

  async cleanupExpiredRooms(): Promise<void> {
    const now = new Date();
    const expiredRooms = Array.from(this.rooms.values()).filter(
      (room) => room.expiresAt <= now
    );

    for (const room of expiredRooms) {
      await this.deleteRoom(room.id);
    }
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

export const storage = new MemStorage();
