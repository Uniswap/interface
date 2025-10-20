import { SharedQueryClient } from '@universe/api/src/clients/base/SharedQueryClient'
import { getIsSessionServiceEnabled } from '@universe/api/src/getIsSessionServiceEnabled'
import {
  createDeviceIdService,
  createNoopSessionService,
  createSessionClient,
  createSessionRepository,
  createSessionService,
  createSessionStorage,
  createTransport,
  type SessionService,
} from '@universe/sessions'
import * as SecureStore from 'expo-secure-store'

function getSessionService(ctx: { getBaseUrl: () => string }): SessionService {
  if (!getIsSessionServiceEnabled()) {
    return createNoopSessionService()
  }
  return getMobileSessionService(ctx)
}

const SESSION_ID_KEY = 'UNISWAP_SESSION_ID'

const mobileSessionStorage = createSessionStorage({
  getSessionId: async () => {
    const sessionId = await SecureStore.getItemAsync(SESSION_ID_KEY)
    return sessionId ?? null
  },
  setSessionId: async (sessionId) => {
    await SecureStore.setItemAsync(SESSION_ID_KEY, sessionId)
  },
  clearSessionId: async () => {
    await SecureStore.deleteItemAsync(SESSION_ID_KEY)
  },
})

const deviceIdService = createDeviceIdService({
  queryClient: SharedQueryClient,
})

function getMobileSessionService(ctx: { getBaseUrl: () => string }): SessionService {
  const sessionClient = createSessionClient({
    transport: createTransport({
      getBaseUrl: ctx.getBaseUrl,
      getSessionId: (): Promise<string | null> => mobileSessionStorage.get().then((state) => state?.sessionId ?? null),
      getDeviceId: deviceIdService.getDeviceId,
    }),
  })

  const sessionRepository = createSessionRepository({ client: sessionClient })

  return createSessionService({
    sessionStorage: mobileSessionStorage,
    sessionRepository,
  })
}

export { getSessionService }
