type AreaName = keyof Pick<
  typeof chrome.storage,
  'sync' | 'local' | 'managed' | 'session'
>

/**
 * Chrome storage wrapper
 * @implements {redux-persist#Storage}
 *
 * NOTE: class avoids dependency on redux-persist by not explicity definiing implements
 * */
export class PersistedStorage {
  constructor(private area: AreaName = 'local') {}

  async getItem(key: string): Promise<string | undefined> {
    const result = await chrome.storage[this.area].get(key)
    return result[key]
  }

  async getAll(): Promise<Record<string, string>> {
    const result = await chrome.storage[this.area].get(null)
    return result ?? {}
  }

  setItem(key: string, value: string): Promise<void> {
    return chrome.storage[this.area].set({ [key]: value })
  }

  removeItem(key: string): Promise<void> {
    return chrome.storage[this.area].remove(key)
  }

  clear(): Promise<void> {
    return chrome.storage[this.area].clear()
  }
}
