/**
 * Client Identity Forwarding
 *
 * During SSR, backend API calls originate from the server, not the browser.
 * Without explicit forwarding, backends see the server's IP and User-Agent,
 * causing issues like OTP emails showing server location instead of the user's.
 *
 * This module extracts client identity from the incoming request once at the
 * boundary and provides it for explicit forwarding to all outbound API calls.
 */

/**
 * Headers that identify the real client behind SSR requests.
 * Uses cf-connecting-ip for backend compatibility (matches apps/web pattern).
 */
export interface ClientIdentityHeaders {
  'cf-connecting-ip'?: string
  'User-Agent'?: string
}

/**
 * Extract the client's IP address from the request.
 *
 * IP resolution priority (most trusted first):
 * 1. x-real-ip — set by Vercel/infra at the TCP level, cannot be spoofed by clients
 * 2. cf-connecting-ip — set by Cloudflare edge
 * 3. x-forwarded-for — first entry, least trusted (can be spoofed)
 *
 * Use for rate limiting, logging, and any context where you need just the IP string.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}

/**
 * Extract the client's country from edge-injected headers.
 *
 * Resolution priority:
 * 1. x-vercel-ip-country — set by Vercel at the edge
 * 2. cf-ipcountry — set by Cloudflare at the edge
 */
export function getClientCountry(request: Request): string | undefined {
  return request.headers.get('x-vercel-ip-country') ?? request.headers.get('cf-ipcountry') ?? undefined
}

/**
 * Extract full client identity headers for forwarding to backend APIs.
 *
 * Forwarded as cf-connecting-ip to match the header the backend already reads.
 * This is the same pattern apps/web uses (see apps/web/functions/app.ts).
 */
export function extractClientIdentity(request: Request): ClientIdentityHeaders {
  const headers: ClientIdentityHeaders = {}

  const ip = getClientIp(request)
  if (ip !== 'unknown') {
    headers['cf-connecting-ip'] = ip
  }

  const userAgent = request.headers.get('User-Agent')
  if (userAgent) {
    headers['User-Agent'] = userAgent
  }

  return headers
}
