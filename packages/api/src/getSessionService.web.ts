import { getDeviceIdService } from '@universe/api/src/getDeviceIdService'
import { getIsSessionServiceEnabled } from '@universe/api/src/getIsSessionServiceEnabled'
import { getSessionStorage } from '@universe/api/src/getSessionStorage'
import { getTransport } from '@universe/api/src/transport'
import {
  createNoopSessionService,
  createSessionClient,
  createSessionRepository,
  createSessionService,
  type SessionService,
} from '@universe/sessions'
import { isWebApp } from 'utilities/src/platform'
import { REQUEST_SOURCE } from 'utilities/src/platform/requestSource'

function getSessionService(ctx: { getBaseUrl: () => string }): SessionService {
  if (!getIsSessionServiceEnabled()) {
    return createNoopSessionService()
  }
  if (isWebApp) {
    // Web doesn't have a session service (cookies are automatically handled by the browser)
    return getWebAppSessionService(ctx)
  }
  return getExtensionSessionService(ctx)
}

/**
 * In production, web won't need an explicit session service since cookies are automatically handled by the backend+browser.
 *
 * For testing, we need this since SessionService is the only backend service that has CORS configured to handle the credentials header.
 *
 * When more services are added to the Entry Gateway, we can remove this and rely on those typical requests to instantiate the cookie.
 */
function getWebAppSessionService(ctx: { getBaseUrl: () => string }): SessionService {
  const sessionClient = createSessionClient({
    transport: getTransport({
      getBaseUrl: ctx.getBaseUrl,
      getHeaders: () => ({ 'x-request-source': REQUEST_SOURCE }),
      options: {
        credentials: 'include',
      },
    }),
  })

  const sessionRepository = createSessionRepository({ client: sessionClient })

  return createSessionService({
    sessionStorage: getSessionStorage(),
    deviceIdService: getDeviceIdService(),
    sessionRepository,
  })
}

function getExtensionSessionService(ctx: { getBaseUrl: () => string }): SessionService {
  const sessionClient = createSessionClient({
    transport: getTransport({
      getBaseUrl: ctx.getBaseUrl,
      getHeaders: () => ({ 'x-request-source': REQUEST_SOURCE }),
    }),
  })

  const sessionRepository = createSessionRepository({ client: sessionClient })

  return createSessionService({
    sessionStorage: getSessionStorage(),
    deviceIdService: getDeviceIdService(),
    sessionRepository,
  })
}

export { getSessionService }
