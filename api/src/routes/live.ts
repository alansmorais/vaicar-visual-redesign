import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { addLiveClient, removeLiveClient, broadcastLiveEvent, getLiveClientCount } from '../services/liveStream.js';
import { authenticate } from '../middleware/auth.js';

export const liveRouter = Router();

/**
 * GET /api/v1/live/stream
 * Server-Sent Events (SSE) live event stream.
 */
liveRouter.get('/stream', authenticate, (req: Request, res: Response) => {
  // authenticate verifies Firebase ID tokens or server JWTs; never accept anonymous streams.
  const userId = req.user!.authUid;

  // Set SSE HTTP response headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const clientId = `client-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  addLiveClient(clientId, res, userId);

  // Send initial handshake event
  res.write(`event: CONNECTED\ndata: ${JSON.stringify({ type: 'CONNECTED', clientId, activeClients: getLiveClientCount(), timestamp: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    removeLiveClient(clientId);
  });
});

/**
 * GET /api/v1/live/status
 * Health inspection for SSE stream
 */
liveRouter.get('/status', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    activeClients: getLiveClientCount(),
    timestamp: new Date().toISOString(),
  });
});
