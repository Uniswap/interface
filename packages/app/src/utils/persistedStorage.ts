type AreaName = keyof Pick<
  typeof chrome.storage,
  'sync' | 'local' | 'managed' | 'session'
>

/** Chrome storage wrapper */
export class PersistedStorage {
  constructor(private area: AreaName = 'local') {}

  async get(key: string | null): Promise<string> {
    const result = await chrome.storage[this.area].get(key)

    return key ? result[key] : result
  }

  getAll(): Promise<string> {
    return this.get(null)
  }

  set(key: string, value: string): Promise<void> {
    return chrome.storage[this.area].set({ [key]: value })
  }

  clear(): Promise<void> {
    return chrome.storage[this.area].clear()
  }
}
