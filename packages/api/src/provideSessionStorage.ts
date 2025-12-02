import { getStorageDriver } from '@universe/api/src/storage/getStorageDriver'
import { createSessionStorage, type SessionStorage } from '@universe/sessions'

const SESSION_ID_KEY = 'UNISWAP_SESSION_ID'

function provideSessionStorage(): SessionStorage {
  const driver = getStorageDriver()
  return createSessionStorage({
    getSessionId: async () => {
      return driver.get(SESSION_ID_KEY)
    },
    setSessionId: async (sessionId) => {
      await driver.set(SESSION_ID_KEY, sessionId)
    },
    clearSessionId: async () => {
      await driver.remove(SESSION_ID_KEY)
    },
  })
}

export { provideSessionStorage }
