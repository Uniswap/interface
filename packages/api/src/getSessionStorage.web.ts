import { createSessionStorage, SessionStorage } from '@universe/sessions'
import { getChromeWithThrow } from 'utilities/src/chrome/chrome'
import { isExtensionApp } from 'utilities/src/platform'

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

function getSessionStorage(): SessionStorage {
  if (!isExtensionApp) {
    throw new Error('[getSessionStorage.web.ts] getSessionStorage is not supported on web, only extension')
  }
  return chromeSessionStorage
}

export { getSessionStorage }
