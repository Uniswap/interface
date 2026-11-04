import { isE2eTestEnv, isWebApp, REQUEST_SOURCE } from '@universe/environment'
import {
  createNoopSessionService,
  createSessionClient,
  createSessionRepository,
  createSessionService,
  type SessionService,
  type UniswapIdentifierService,
} from '@universe/sessions'
import type { Logger } from 'utilities/src/logger/logger'
import { isSessionServiceEnabled } from './isSessionServiceEnabled'
import { provideDeviceIdService } from './provideDeviceIdService'
import { provideSessionStorage } from './provideSessionStorage'
import { provideUniswapIdentifierService } from './provideUniswapIdentifierService'
import { getTransport, type Interceptors } from './transport'

function provideSessionService(ctx: {
  getBaseUrl: () => string
  getIsSessionServiceEnabled?: () => boolean
  getLogger?: () => Logger
  /** Optional custom UniswapIdentifierService. If not provided, uses default localStorage-based service. */
  uniswapIdentifierService?: UniswapIdentifierService
  /** Optional ConnectRPC interceptors for the session transport */
  interceptors?: Interceptors
}): SessionService {
  // Default (no explicit flag): sessions are disabled under web e2e so every data-path
  // client (uniswap/trading/FOR/livePrices/bundler) skips session-gated hosts that are
  // blackholed in CI (net::ERR_NAME_NOT_RESOLVED), and enabled everywhere else. An
  // explicit getIsSessionServiceEnabled still wins, preserving the DisableSessionsForPlan
  // kill switch (() => false ⇒ noop) in prod.
  const isEnabled = isSessionServiceEnabled({
    getIsSessionServiceEnabled: ctx.getIsSessionServiceEnabled,
    getDefault: () => !isE2eTestEnv(),
  })
  if (!isEnabled) {
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
        credentials: 'include',
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
