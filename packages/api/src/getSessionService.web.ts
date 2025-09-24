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
import { getChromeWithThrow } from 'utilities/src/chrome/chrome'
import { isInterface } from 'utilities/src/platform'

function getSessionService(): SessionService {
  if (!getIsSessionServiceEnabled()) {
    return createNoopSessionService()
  }
  if (isInterface) {
    // Web doesn't have a session service (cookies are automatically handled by the browser)
    return createNoopSessionService()
  }
  return getExtensionSessionService()
}

const SESSION_ID_KEY = 'UNISWAP_SESSION_ID'

const chromeSessionStorage = createSessionStorage({
  getSessionId: async () => {
    const chrome = getChromeWithThrow()
    const sessionId = await chrome.storage.local.get(SESSION_ID_KEY)
    return (sessionId as { [SESSION_ID_KEY]: string } | null)?.[SESSION_ID_KEY] ?? null
  },
  setSessionId: async (sessionId) => {
    const chrome = getChromeWithThrow()
    await chrome.storage.local.set({ [SESSION_ID_KEY]: sessionId })
  },
  clearSessionId: async () => {
    const chrome = getChromeWithThrow()
    await chrome.storage.local.remove(SESSION_ID_KEY)
  },
})

const deviceIdService = createDeviceIdService({
  queryClient: SharedQueryClient,
})

const sessionRepository = createSessionRepository()

function getExtensionSessionService(): SessionService {
  return createSessionService({
    deviceIdService,
    sessionStorage: chromeSessionStorage,
    sessionRepository,
  })
}

export { getSessionService }
