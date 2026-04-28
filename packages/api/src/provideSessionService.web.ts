import { provideDeviceIdService } from '@universe/api/src/provideDeviceIdService'
import { provideSessionStorage } from '@universe/api/src/provideSessionStorage'
import { provideUniswapIdentifierService } from '@universe/api/src/provideUniswapIdentifierService'
import { getTransport, type Interceptors } from '@universe/api/src/transport'
import {
  createNoopSessionService,
  createSessionClient,
  createSessionRepository,
  createSessionService,
  type SessionService,
  type UniswapIdentifierService,
} from '@universe/sessions'
import type { Logger } from 'utilities/src/logger/logger'
import { isWebApp } from 'utilities/src/platform'
import { REQUEST_SOURCE } from 'utilities/src/platform/requestSource'

function provideSessionService(ctx: {
  getBaseUrl: () => string
  getIsSessionServiceEnabled: () => boolean
  getLogger?: () => Logger
  /** Optional custom UniswapIdentifierService. If not provided, uses default localStorage-based service. */
  uniswapIdentifierService?: UniswapIdentifierService
  /** Optional ConnectRPC interceptors for the session transport */
  interceptors?: Interceptors
}): SessionService {
  if (!ctx.getIsSessionServiceEnabled()) {
    return createNoopSessionService()
  }
  if (isWebApp) {
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
function getWebAppSessionService(ctx: {
  getBaseUrl: () => string
  getLogger?: () => Logger
  uniswapIdentifierService?: UniswapIdentifierService
  interceptors?: Interceptors
}): SessionService {
  const sessionClient = createSessionClient({
    transport: getTransport({
      getBaseUrl: ctx.getBaseUrl,
      getHeaders: () => ({ 'x-request-source': REQUEST_SOURCE }),
      interceptors: ctx.interceptors,
      options: {
        // RigoBlock: The CF gateway returns Access-Control-Allow-Origin: * which is incompatible
        // with credentials: 'include'. Since RigoBlock does not use Uniswap session cookies,
        // omit credentials so the CORS preflight is accepted by the wildcard origin header.
        credentials: 'omit',
      },
    }),
  })

  const sessionRepository = createSessionRepository({ client: sessionClient, getLogger: ctx.getLogger })

  return createSessionService({
    sessionStorage: provideSessionStorage(),
    deviceIdService: provideDeviceIdService(),
    uniswapIdentifierService: ctx.uniswapIdentifierService ?? provideUniswapIdentifierService(),
    sessionRepository,
  })
}

function getExtensionSessionService(ctx: {
  getBaseUrl: () => string
  getLogger?: () => Logger
  uniswapIdentifierService?: UniswapIdentifierService
}): SessionService {
  const sessionClient = createSessionClient({
    transport: getTransport({
      getBaseUrl: ctx.getBaseUrl,
      getHeaders: () => ({ 'x-request-source': REQUEST_SOURCE }),
    }),
  })

  const sessionRepository = createSessionRepository({ client: sessionClient, getLogger: ctx.getLogger })

  return createSessionService({
    sessionStorage: provideSessionStorage(),
    deviceIdService: provideDeviceIdService(),
    uniswapIdentifierService: ctx.uniswapIdentifierService ?? provideUniswapIdentifierService(),
    sessionRepository,
  })
}

export { provideSessionService }
