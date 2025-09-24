import { SharedQueryClient } from '@universe/api/src/clients/base/SharedQueryClient'
import { getIsSessionServiceEnabled } from '@universe/api/src/getIsSessionServiceEnabled'
import {
  createDeviceIdService,
  createNoopSessionService,
  createSessionRepository,
  createSessionService,
  createSessionStorage,
  type SessionService,
} from '@universe/sessions'
import * as SecureStore from 'expo-secure-store'

function getSessionService(): SessionService {
  if (!getIsSessionServiceEnabled()) {
    return createNoopSessionService()
  }
  return getMobileSessionService()
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

const sessionRepository = createSessionRepository()

function getMobileSessionService(): SessionService {
  return createSessionService({
    deviceIdService,
    sessionStorage: mobileSessionStorage,
    sessionRepository,
  })
}

export { getSessionService }
