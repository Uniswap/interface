import { getClientCountry } from './client-identity'
import type { ServerEventContext } from './service'
import { extractDomain, stripQueryParams } from './url-utils'

interface ServerContextExtractorDeps {
  getAuthSession: (request?: Request) => Promise<{ session?: { userId?: string; provider?: string } | null }>
  getDeviceId: (request: Request) => Promise<string | null>
}

/**
 * Create a server context extractor with auth deps injected.
 *
 * The boundary (middleware, loader, tRPC context) owns the wiring;
 * the returned function only needs the raw request.
 */
export function createServerContextExtractor({ getAuthSession, getDeviceId }: ServerContextExtractorDeps) {
  return async (request: Request): Promise<ServerEventContext> => {
    const [authResult, deviceId] = await Promise.all([getAuthSession(request), getDeviceId(request)])
    const session = authResult.session
    const rawReferrer = request.headers.get('Referer') ?? undefined
    const referrer = rawReferrer ? stripQueryParams(rawReferrer) : undefined

    return {
      userId: session?.userId,
      deviceId: deviceId ?? undefined,
      provider: session?.provider,
      language: request.headers.get('Accept-Language')?.split(',')[0]?.trim() ?? undefined,
      country: getClientCountry(request),
      referrer,
      referringDomain: rawReferrer ? extractDomain(rawReferrer) : undefined,
    }
  }
}
