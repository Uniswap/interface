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
import { getChromeWithThrow } from 'utilities/src/chrome/chrome'
import { isExtensionApp, isWebApp } from 'utilities/src/platform'

function getSessionService(ctx: { getBaseUrl: () => string }): SessionService {
  if (!getIsSessionServiceEnabled()) {
    return createNoopSessionService()
  }
  if (isWebApp) {
    // Web doesn't have a session service (cookies are automatically handled by the browser)
    return createNoopSessionService()
  }
  return getExtensionSessionService(ctx)
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

function getExtensionSessionService(ctx: { getBaseUrl: () => string }): SessionService {
  const sessionClient = createSessionClient({
    transport: createTransport({
      getBaseUrl: ctx.getBaseUrl,
      getSessionId: isExtensionApp
        ? (): Promise<string | null> => chromeSessionStorage.get().then((state) => state?.sessionId ?? null)
        : undefined,
      getDeviceId: isExtensionApp ? deviceIdService.getDeviceId : undefined,
    }),
  })

  const sessionRepository = createSessionRepository({ client: sessionClient })

  return createSessionService({
    sessionStorage: chromeSessionStorage,
    sessionRepository,
  })
}

export { getSessionService }
