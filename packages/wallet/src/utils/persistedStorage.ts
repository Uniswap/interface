import { getChromeWithThrow } from 'utilities/src/chrome/chrome'

const chrome = getChromeWithThrow()

type AreaName = keyof Pick<typeof chrome.storage, 'sync' | 'local' | 'managed' | 'session'>

export const prefix = 'com.uniswap.web'
export const ENCRYPTION_KEY_STORAGE_KEY = `${prefix}.encryptionKey`

/**
 * Chrome storage wrapper
 * @implements {redux-persist#Storage}
 *
 * NOTE: class avoids dependency on redux-persist by not explicity defining implements
 * */
export class PersistedStorage {
  constructor(private area: AreaName = 'local') {}

  async getItem(key: string): Promise<string | undefined> {
    const result = await chrome.storage[this.area].get(key)
    const item = result[key]
    return typeof item === 'string' ? item : undefined
  }

  async getAll(): Promise<Record<string, string>> {
    const result = await chrome.storage[this.area].get(null)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return result ?? {}
  }

  setItem(key: string, value: string): Promise<void> {
    return chrome.storage[this.area].set({ [key]: value })
  }

  removeItem(key: string | string[]): Promise<void> {
    return chrome.storage[this.area].remove(key)
  }

  clear(): Promise<void> {
    return chrome.storage[this.area].clear()
  }
}
