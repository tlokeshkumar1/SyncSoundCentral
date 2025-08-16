import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { createRoomSchema, joinRoomSchema, updateDeviceSchema } from "@shared/schema";
import { z } from "zod";

interface WebSocketWithInfo extends WebSocket {
  deviceId?: string;
  roomId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Room management routes
  app.post("/api/rooms", async (req, res) => {
    try {
      const roomData = createRoomSchema.parse(req.body);
      const hostDeviceData = z.object({
        name: z.string(),
        type: z.enum(["mobile", "tablet", "desktop"]),
      }).parse(req.body);

      // Create host device first
      const hostDevice = await storage.createDevice({
        roomId: "temp", // Will be updated after room creation
        name: hostDeviceData.name,
        type: hostDeviceData.type,
        isHost: true,
        volume: 75,
        isMuted: false,
        isConnected: true,
      });

      // Create room with host device ID
      const room = await storage.createRoom(roomData, hostDevice.id);
      
      // Update host device with correct room ID
      await storage.updateDevice(hostDevice.id, { roomId: room.id });

      res.json({ room, hostDevice });
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(400).json({ error: "Failed to create room" });
    }
  });

  app.post("/api/rooms/join", async (req, res) => {
    try {
      const joinData = joinRoomSchema.parse(req.body);
      
      const room = await storage.getRoomByOtp(joinData.otp);
      if (!room) {
        return res.status(404).json({ error: "Room not found or expired" });
      }

      const device = await storage.createDevice({
        roomId: room.id,
        name: joinData.deviceName,
        type: joinData.deviceType,
        isHost: false,
        volume: 75,
        isMuted: false,
        isConnected: true,
      });

      res.json({ room, device });
    } catch (error) {
      console.error("Error joining room:", error);
      res.status(400).json({ error: "Failed to join room" });
    }
  });

  app.get("/api/rooms/:id", async (req, res) => {
    try {
      const room = await storage.getRoomById(req.params.id);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      const devices = await storage.getDevicesByRoomId(room.id);
      res.json({ room, devices });
    } catch (error) {
      console.error("Error fetching room:", error);
      res.status(500).json({ error: "Failed to fetch room" });
    }
  });

  app.put("/api/rooms/:id", async (req, res) => {
    try {
      const updates = z.object({
        audioMode: z.enum(["monopoly", "stereo"]).optional(),
        isActive: z.boolean().optional(),
      }).parse(req.body);

      const room = await storage.updateRoom(req.params.id, updates);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      res.json(room);
    } catch (error) {
      console.error("Error updating room:", error);
      res.status(400).json({ error: "Failed to update room" });
    }
  });

  app.delete("/api/rooms/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteRoom(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Room not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting room:", error);
      res.status(500).json({ error: "Failed to delete room" });
    }
  });

  // Device management routes
  app.put("/api/devices/:id", async (req, res) => {
    try {
      const updates = updateDeviceSchema.parse(req.body);
      const device = await storage.updateDevice(req.params.id, updates);
      
      if (!device) {
        return res.status(404).json({ error: "Device not found" });
      }

      res.json(device);
    } catch (error) {
      console.error("Error updating device:", error);
      res.status(400).json({ error: "Failed to update device" });
    }
  });

  app.delete("/api/devices/:id", async (req, res) => {
    try {
      const deleted = await storage.removeDevice(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Device not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing device:", error);
      res.status(500).json({ error: "Failed to remove device" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocketWithInfo, req) => {
    console.log('New WebSocket connection');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join-room':
            ws.deviceId = message.deviceId;
            ws.roomId = message.roomId;
            
            // Update device connection status
            await storage.updateDevice(message.deviceId, { isConnected: true });
            
            // Broadcast device connection to room
            broadcastToRoom(message.roomId, {
              type: 'device-connected',
              deviceId: message.deviceId,
            }, ws);
            break;

          case 'audio-sync':
            if (ws.roomId) {
              broadcastToRoom(ws.roomId, {
                type: 'audio-sync',
                timestamp: message.timestamp,
                action: message.action, // play, pause, seek
                position: message.position,
              }, ws);
            }
            break;

          case 'device-position':
            if (ws.deviceId) {
              await storage.updateDevice(ws.deviceId, {
                positionX: message.x,
                positionY: message.y,
                audioRole: message.audioRole,
              });
              
              if (ws.roomId) {
                broadcastToRoom(ws.roomId, {
                  type: 'position-update',
                  deviceId: ws.deviceId,
                  x: message.x,
                  y: message.y,
                  audioRole: message.audioRole,
                });
              }
            }
            break;

          case 'volume-change':
            if (ws.deviceId) {
              await storage.updateDevice(ws.deviceId, {
                volume: message.volume,
                isMuted: message.isMuted,
              });
              
              if (ws.roomId) {
                broadcastToRoom(ws.roomId, {
                  type: 'device-update',
                  deviceId: ws.deviceId,
                  volume: message.volume,
                  isMuted: message.isMuted,
                });
              }
            }
            break;

          case 'mode-change':
            if (ws.roomId) {
              await storage.updateRoom(ws.roomId, {
                audioMode: message.mode,
              });
              
              broadcastToRoom(ws.roomId, {
                type: 'mode-change',
                mode: message.mode,
              });
            }
            break;

          case 'current-song-update':
            if (ws.roomId) {
              broadcastToRoom(ws.roomId, {
                type: 'current-song-update',
                title: message.title,
                artist: message.artist,
                thumbnail: message.thumbnail,
              }, ws);
            }
            break;

          case 'audio-sync':
            if (ws.roomId) {
              broadcastToRoom(ws.roomId, {
                type: 'audio-sync',
                action: message.action,
                timestamp: message.timestamp,
                position: message.position,
              }, ws);
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {
      if (ws.deviceId) {
        await storage.updateDevice(ws.deviceId, { isConnected: false });
        
        if (ws.roomId) {
          broadcastToRoom(ws.roomId, {
            type: 'device-disconnected',
            deviceId: ws.deviceId,
          });
        }
      }
    });
  });

  function broadcastToRoom(roomId: string, message: any, sender?: WebSocketWithInfo) {
    wss.clients.forEach((client: WebSocketWithInfo) => {
      if (client.roomId === roomId && client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  return httpServer;
}
