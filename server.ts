import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Security hardening: hide Express fingerprint
  app.disable('x-powered-by');

  // Request logging middleware for API calls
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      if (req.originalUrl.startsWith('/api')) {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
      }
    });
    next();
  });

  app.use(express.json({ limit: '10mb' }));

  // Helper for SHA256 hashing required by Meta CAPI
  function hashData(val?: string): string | undefined {
    if (!val || typeof val !== 'string') return undefined;
    const cleaned = val.trim().toLowerCase();
    if (!cleaned) return undefined;
    return crypto.createHash('sha256').update(cleaned).digest('hex');
  }

  // Health check API for container orchestration (Docker/K8s/Cloud Run)
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // Meta Conversions API (CAPI) Endpoint
  app.post('/api/pixel/event', async (req, res) => {
    try {
      const {
        pixelId: reqPixelId,
        accessToken: reqAccessToken,
        testEventCode: reqTestCode,
        eventName,
        eventId,
        eventSourceUrl,
        userData = {},
        customData = {},
      } = req.body;

      const pixelId = (reqPixelId || process.env.FB_PIXEL_ID || '').trim();
      const accessToken = (reqAccessToken || process.env.FB_CAPI_ACCESS_TOKEN || '').trim();
      const testCode = (reqTestCode || process.env.FB_TEST_EVENT_CODE || '').trim();

      if (!pixelId || !accessToken) {
        return res.status(200).json({
          success: false,
          warning: 'Pixel ID and CAPI Access Token are required for Meta Conversions API.',
        });
      }

      // Extract client details from request headers
      const clientIp =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        '';
      const userAgent = req.headers['user-agent'] || '';

      const nowSeconds = Math.floor(Date.now() / 1000);

      // Prepare user_data payload according to Meta CAPI standard
      const metaUserData: Record<string, any> = {
        client_ip_address: clientIp,
        client_user_agent: userAgent,
      };

      if (userData.fbp) metaUserData.fbp = userData.fbp;
      if (userData.fbc) metaUserData.fbc = userData.fbc;
      if (userData.email) metaUserData.em = [hashData(userData.email)];
      if (userData.phone) {
        // Convert any Eastern Arabic / Persian numerals to Western digits first
        const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        const persianNumerals = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        let rawPhone = String(userData.phone);
        for (let i = 0; i < 10; i++) {
          rawPhone = rawPhone.split(arabicNumerals[i]).join(String(i));
          rawPhone = rawPhone.split(persianNumerals[i]).join(String(i));
        }
        let cleanPhone = rawPhone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0020')) cleanPhone = cleanPhone.slice(2);
        else if (cleanPhone.startsWith('0')) cleanPhone = '20' + cleanPhone.slice(1);
        else if (cleanPhone.startsWith('1') && cleanPhone.length === 10) cleanPhone = '20' + cleanPhone;

        if (cleanPhone) {
          metaUserData.ph = [hashData(cleanPhone)];
        }
      }
      if (userData.name) {
        metaUserData.fn = [hashData(userData.name)];
      }

      const eventPayload: Record<string, any> = {
        event_name: eventName,
        event_time: nowSeconds,
        event_id: eventId || `ev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        event_source_url: eventSourceUrl || req.headers.referer || '',
        action_source: 'website',
        user_data: metaUserData,
        custom_data: customData,
      };

      const requestBody: Record<string, any> = {
        data: [eventPayload],
      };

      if (testCode) {
        requestBody.test_event_code = testCode;
      }

      const metaUrl = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`;
      const response = await fetch(metaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('[Meta CAPI Server Error]', responseData);
        return res.status(response.status).json({ success: false, error: responseData });
      }

      console.log(`[Meta CAPI Server Success] Event: ${eventName} | EventID: ${eventPayload.event_id}`);
      return res.json({ success: true, result: responseData, eventId: eventPayload.event_id });
    } catch (err: any) {
      console.error('[Meta CAPI Internal Error]', err);
      return res.status(500).json({ success: false, error: err?.message || 'Server error' });
    }
  });

  // Vite middleware in dev vs static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Frank Server] Running on http://0.0.0.0:${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });

  const gracefulShutdown = (signal: string) => {
    console.log(`[Frank Server] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('[Frank Server] HTTP server closed cleanly.');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('[Frank Server] Forcefully terminating after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer();
