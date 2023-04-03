type AreaName = keyof Pick<
  typeof chrome.storage,
  'sync' | 'local' | 'managed' | 'session'
>

/** Chrome storage wrapper */
export class PersistedStorage {
  constructor(private area: AreaName = 'local') {}

  async get(key: string): Promise<string | undefined> {
    const result = await chrome.storage[this.area].get(key)
    return result[key]
  }

  async getAll(): Promise<Record<string, string>> {
    const result = await chrome.storage[this.area].get(null)
    return result ?? {}
  }

  set(key: string, value: string): Promise<void> {
    return chrome.storage[this.area].set({ [key]: value })
  }

  clear(): Promise<void> {
    return chrome.storage[this.area].clear()
  }
}
