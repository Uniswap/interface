import { createStorageDriver } from '@universe/api/src/storage/createStorageDriver'
import { createSessionStorage, SessionStorage } from '@universe/sessions'

const SESSION_ID_KEY = 'UNISWAP_SESSION_ID'

function getSessionStorage(): SessionStorage {
  const driver = createStorageDriver()

  const storage = createSessionStorage({
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

  return storage
}

export { getSessionStorage }
