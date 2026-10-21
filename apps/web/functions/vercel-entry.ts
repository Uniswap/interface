// Vercel serverless function entry point (bundled by vite.server.config.mts)
import { handle } from '@hono/node-server/vercel'
import { createApp, ENTRY_GATEWAY_URLS } from 'functions/app'

// Vercel functions can't hold WebSockets; clients connect to the WS backend directly.
const app = createApp({
  // On Vercel, fetch index.html from the same origin (CDN).
  // The catch-all rewrite only matches extensionless paths, so /index.html
  // is served directly from CDN without hitting this function.
  fetchSpaHtml: (c) => {
    const origin = new URL(c.req.url).origin
    return fetch(`${origin}/index.html`)
  },
  getEntryGatewayUrl: (_c, env) => {
    if (env) {
      return ENTRY_GATEWAY_URLS[env]
    }
    return process.env.ENTRY_GATEWAY_API_URL || ENTRY_GATEWAY_URLS.staging
  },
  getTrustedClientIp: (c) => c.req.header('x-real-ip'),
  getEmbedFrameAncestors: () => process.env.EMBED_FRAME_ANCESTORS,
})

export default handle(app)
