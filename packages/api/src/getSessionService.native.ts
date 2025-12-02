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
import { REQUEST_SOURCE } from 'utilities/src/platform/requestSource'

function getSessionService(ctx: { getBaseUrl: () => string }): SessionService {
  if (!getIsSessionServiceEnabled()) {
    return createNoopSessionService()
  }
  return getMobileSessionService(ctx)
}

function getMobileSessionService(ctx: { getBaseUrl: () => string }): SessionService {
  const sessionClient = createSessionClient({
    transport: getTransport({
      getBaseUrl: ctx.getBaseUrl,
      getHeaders: () => ({ 'x-request-source': REQUEST_SOURCE }),
    }),
  })

  const sessionStorage = getSessionStorage()
  const deviceIdService = getDeviceIdService()
  const sessionRepository = createSessionRepository({ client: sessionClient })
  return createSessionService({ sessionStorage, deviceIdService, sessionRepository })
}

export { getSessionService }
