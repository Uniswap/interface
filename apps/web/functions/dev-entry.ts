// `vite dev` entry point, loaded through Vite's SSR module graph by vite/honoDevServerPlugin.ts
import { createApp, ENTRY_GATEWAY_URLS, WEBSOCKET_URLS } from 'functions/app'
import { createDiskAssets } from 'functions/diskAssets'
import { DEV_EMBED_FRAME_ANCESTORS } from 'functions/frameProtection'

// oxlint-disable-next-line import/no-unused-modules -- loaded by vite/honoDevServerPlugin.ts via ssrLoadModule
export function createDevApp({
  publicDir,
  renderSpaHtml,
}: {
  publicDir: string
  renderSpaHtml: (url: string) => Promise<string>
}): (request: Request) => Promise<Response> {
  const assets = createDiskAssets(publicDir)
  const app = createApp({
    fetchSpaHtml: async (c) => {
      const url = new URL(c.req.url)
      return new Response(await renderSpaHtml(url.pathname + url.search), {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      })
    },
    getEntryGatewayUrl: (_c, env) =>
      env ? ENTRY_GATEWAY_URLS[env] : process.env.ENTRY_GATEWAY_API_URL || ENTRY_GATEWAY_URLS.staging,
    getWebSocketUrl: () => WEBSOCKET_URLS.staging,
    getTrustedClientIp: () => undefined,
    getEmbedFrameAncestors: () => process.env.EMBED_FRAME_ANCESTORS || DEV_EMBED_FRAME_ANCESTORS,
  })
  return async (request) => app.fetch(request, { ASSETS: assets })
}
