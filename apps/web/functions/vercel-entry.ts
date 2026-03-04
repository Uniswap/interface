// Vercel serverless function entry point (bundled by build-vercel.ts)
import { handle } from '@hono/node-server/vercel'
import { createApp, ENTRY_GATEWAY_URLS, WEBSOCKET_URLS } from 'functions/app'

// Note: upgradeWebSocket is not provided because Vercel serverless functions
// do not support long-lived WebSocket connections. On Vercel staging,
// the BFF proxy handles REST API calls for cookie handling, but WebSocket
// connections use direct backend URLs.
const app = createApp({
  // On Vercel, fetch index.html from the same origin (CDN).
  // The catch-all rewrite only matches extensionless paths, so /index.html
  // is served directly from CDN without hitting this function.
  fetchSpaHtml: (c) => {
    const origin = new URL(c.req.url).origin
    return fetch(`${origin}/index.html`)
  },
  getEntryGatewayUrl: () => process.env.ENTRY_GATEWAY_API_URL || ENTRY_GATEWAY_URLS.staging,
  getWebSocketUrl: () => process.env.WEBSOCKET_URL || WEBSOCKET_URLS.staging,
  getTrustedClientIp: (c) => c.req.header('x-real-ip'),
})

export default handle(app)
