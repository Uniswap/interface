// Shared between the client router and the Cloudflare/Vercel worker
// (functions/app.ts). Do not add any imports to this file.

export const EMBED_BASE_PATH = '/embed'

/** True when documents at `pathname` are served with the embed frame policy (see functions/app.ts). */
export function isEmbedPath(pathname: string): boolean {
  return pathname === EMBED_BASE_PATH || pathname.startsWith(`${EMBED_BASE_PATH}/`)
}
