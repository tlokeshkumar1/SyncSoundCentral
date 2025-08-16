import { z } from "zod";

export const roomSchema = z.object({
  id: z.string(),
  otp: z.string().length(6),
  name: z.string(),
  hostDeviceId: z.string(),
  audioMode: z.enum(["monopoly", "stereo"]),
  audioSource: z.enum(["upload", "spotify"]),
  isActive: z.boolean(),
  createdAt: z.date(),
  expiresAt: z.date(),
});

export const deviceSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  name: z.string(),
  type: z.enum(["mobile", "tablet", "desktop"]),
  isHost: z.boolean(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  audioRole: z.enum(["center", "front-left", "front-right", "rear-left", "rear-right"]).optional(),
  volume: z.number().min(0).max(100).default(75),
  isMuted: z.boolean().default(false),
  isConnected: z.boolean().default(true),
  lastSeen: z.date(),
  connectedAt: z.date(),
});

export const createRoomSchema = roomSchema.pick({
  name: true,
  audioMode: true,
  audioSource: true,
});

export const joinRoomSchema = z.object({
  otp: z.string().length(6),
  deviceName: z.string(),
  deviceType: z.enum(["mobile", "tablet", "desktop"]),
});

export const updateDeviceSchema = deviceSchema.pick({
  volume: true,
  isMuted: true,
  positionX: true,
  positionY: true,
}).partial();

export type Room = z.infer<typeof roomSchema>;
export type Device = z.infer<typeof deviceSchema>;
export type CreateRoom = z.infer<typeof createRoomSchema>;
export type JoinRoom = z.infer<typeof joinRoomSchema>;
export type UpdateDevice = z.infer<typeof updateDeviceSchema>;
