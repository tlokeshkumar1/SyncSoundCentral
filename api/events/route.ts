// Alternative for Vercel - API route for Server-Sent Events
import { NextRequest } from 'next/server';
import { storage } from '../../../server/storage';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');
  const deviceId = searchParams.get('deviceId');

  if (!roomId || !deviceId) {
    return new Response('Missing roomId or deviceId', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: 'connected' })}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));

      // In a real implementation, you'd need a way to push updates
      // This is a simplified example
      const interval = setInterval(() => {
        const data = `data: ${JSON.stringify({ 
          type: 'heartbeat', 
          timestamp: Date.now() 
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
