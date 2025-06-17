import { getChromeWithThrow } from 'utilities/src/chrome/chrome'
import { v4 as uuidv4 } from 'uuid'

export const USER_ID_KEY = 'USER_ID'

export async function getUniqueId(): Promise<string> {
  const storedUserId: string | undefined | null = await getUserId()

  if (storedUserId) {
    return storedUserId
  }

  const newUserId = uuidv4()
  await setUserId(newUserId)
  return newUserId
}

async function getUserId(): Promise<string | undefined | null> {
  try {
    const chrome = getChromeWithThrow()
    const stored = await chrome.storage.local.get(USER_ID_KEY)
    const userId = stored[USER_ID_KEY]
    return typeof userId === 'string' ? userId : null
  } catch {
    return window.localStorage.getItem(USER_ID_KEY)
  }
}

async function setUserId(userId: string): Promise<void> {
  try {
    const chrome = getChromeWithThrow()
    await chrome.storage.local.set({ [USER_ID_KEY]: userId })
  } catch {
    window.localStorage.setItem(USER_ID_KEY, userId)
  }
}
