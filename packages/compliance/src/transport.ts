import { type Transport } from '@connectrpc/connect'
import { getEntryGatewayUrl, getTransport, tryProvideSession } from '@universe/api'
import { isWebApp, REQUEST_SOURCE } from '@universe/environment'

/**
 * Transport for the compliance v2 service, shared across web, extension, and native.
 * Authentication goes through the shared session interceptor (session headers); the web
 * app additionally sends cookies (`credentials: 'include'`), gated on `isWebApp` so the
 * extension and native — where `isWebApp` is false — don't.
 */
export function createComplianceV2Transport(): Transport {
  return getTransport({
    getBaseUrl: getEntryGatewayUrl,
    // Send the first-party `x-request-source` header that every other entry-gateway client
    // sends. The gateway factors it into the request's auth score; without it the wallet's
    // session-authenticated calls score too low and the gateway rejects them with 401, even
    // though the session header is attached.
    getHeaders: () => ({ 'x-request-source': REQUEST_SOURCE }),
    // Gate each call on a ready session (retry once on 401), like the other entry-gateway
    // clients, so the request carries a live credential. The gateway resolves it to a
    // non-empty wrappedId, which is what enables per-session acknowledgement reasons.
    getSession: tryProvideSession,
    source: 'connect-rpc-compliance',
    options: {
      jsonOptions: { enumAsInteger: true },
      ...(isWebApp ? { credentials: 'include' } : undefined),
    },
  })
}
