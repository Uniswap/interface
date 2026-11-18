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

import { stripCloudFrontViewerPort } from 'utilities/src/security/cloudFrontViewerAddress'

/**
 * Headers that identify the real client behind SSR requests.
 * Uses cf-connecting-ip for backend compatibility (matches apps/web pattern).
 */
export interface ClientIdentityHeaders {
  'cf-connecting-ip'?: string
  'User-Agent'?: string
}

// Shape check only, not IP parsing: the result keys rate limiters, so anything that is not a short
// run of IPv4/IPv6 characters (e.g. a forged `victim@example.com:1`) must not become a key.
const VIEWER_IP_SHAPE = /^[0-9a-fA-F:.]{2,45}$/

/**
 * The viewer IP from CloudFront's `cloudfront-viewer-address`, or undefined when the
 * request did not come through a distribution that forwards it, or the value is not IP-shaped.
 */
export function getCloudFrontViewerIp(request: Request): string | undefined {
  const viewerAddress = request.headers.get('cloudfront-viewer-address')
  if (!viewerAddress) {
    return undefined
  }
  const ip = stripCloudFrontViewerPort(viewerAddress)
  return VIEWER_IP_SHAPE.test(ip) ? ip : undefined
}

/**
 * Extract the client's IP address from the request.
 *
 * A header is trustworthy only because the proxy in front of THIS deployment
 * sets it AND is the sole path to the origin — a header the front proxy does
 * NOT set is client-spoofable. So we check the front-proxy headers first:
 * 1. cloudfront-viewer-address — set + overwritten by CloudFront, the prod front
 *    door. Behind CloudFront cf-connecting-ip is caller input, so this must win.
 * 2. cf-connecting-ip — set + overwritten by Cloudflare, the previous front door.
 *    Only reached while a hostname is still Cloudflare-proxied.
 * 3. x-real-ip — set by Vercel at the TCP level (Vercel/preview deployments).
 * 4. x-forwarded-for — first entry, client-controllable; last resort only.
 *
 * While a hostname is still Cloudflare-proxied, a client can send its own
 * cloudfront-viewer-address through Cloudflare and have it trusted, so deploy
 * this together with the DNS switch. This ordering is not a full substitute for
 * per-runtime header selection.
 *
 * Use for rate limiting, logging, and any context where you need just the IP string.
 */
export function getClientIp(request: Request): string {
  return (
    getCloudFrontViewerIp(request) ??
    // TODO: drop once developers.uniswap.org is DNS-only to CloudFront and the ALB stops admitting Cloudflare (backend#16707).
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-real-ip') ??
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
