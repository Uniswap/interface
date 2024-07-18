import { v4 as uuidv4 } from 'uuid'
import { PersistedStorage } from 'wallet/src/utils/persistedStorage'

const STORAGE_AREA_KEY = 'local'
export const USER_ID_KEY = 'USER_ID'
export const LOCAL_STORAGE = new PersistedStorage(STORAGE_AREA_KEY)

export async function getLocalUserId(): Promise<string> {
  let userId: string | undefined = await LOCAL_STORAGE.getItem(USER_ID_KEY)

  if (userId) {
    return userId
  }

  userId = uuidv4()
  await LOCAL_STORAGE.setItem(USER_ID_KEY, userId)
  return userId
}
