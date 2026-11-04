import { REQUEST_SOURCE } from '@universe/environment'
import {
  createNoopSessionService,
  createSessionClient,
  createSessionRepository,
  createSessionService,
  type SessionService,
} from '@universe/sessions'
import type { Logger } from 'utilities/src/logger/logger'
import { isSessionServiceEnabled } from './isSessionServiceEnabled'
import { provideDeviceIdService } from './provideDeviceIdService'
import { provideSessionStorage } from './provideSessionStorage'
import { provideUniswapIdentifierService } from './provideUniswapIdentifierService'
import { getTransport } from './transport'

function provideSessionService(ctx: {
  getBaseUrl: () => string
  getIsSessionServiceEnabled?: () => boolean
  getLogger?: () => Logger
  interceptors?: import('./transport').Interceptors
}): SessionService {
  const isEnabled = isSessionServiceEnabled({
    getIsSessionServiceEnabled: ctx.getIsSessionServiceEnabled,
    getDefault: () => true,
  })
  if (!isEnabled) {
    return createNoopSessionService()
  }
  return getMobileSessionService(ctx)
}

function getMobileSessionService(ctx: { getBaseUrl: () => string; getLogger?: () => Logger }): SessionService {
  const sessionClient = createSessionClient({
    transport: getTransport({
      getBaseUrl: ctx.getBaseUrl,
      getHeaders: () => ({ 'x-request-source': REQUEST_SOURCE }),
    }),
  })

  const sessionStorage = provideSessionStorage()
  const deviceIdService = provideDeviceIdService()
  const uniswapIdentifierService = provideUniswapIdentifierService()
  const sessionRepository = createSessionRepository({ client: sessionClient, getLogger: ctx.getLogger })
  return createSessionService({
    sessionStorage,
    deviceIdService,
    uniswapIdentifierService,
    sessionRepository,
  })
}

export { provideSessionService }
