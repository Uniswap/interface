import type { StorageDriver } from '@universe/api/src/storage/types'
import { getChromeWithThrow } from 'utilities/src/chrome/chrome'

export function createExtensionStorageDriver(): StorageDriver {
  return {
    async get(key: string): Promise<string | null> {
      const chrome = getChromeWithThrow()
      const result = await chrome.storage.local.get(key)
      const value = result[key]
      if (value === undefined || value === null) {
        return null
      }
      if (typeof value !== 'string') {
        throw new Error(`[StorageDriver.web.ts] Storage driver currently expects string values, got ${typeof value}`)
      }
      return value
    },

    async set(key: string, value: string): Promise<void> {
      const chrome = getChromeWithThrow()
      await chrome.storage.local.set({ [key]: value })
    },

    async remove(key: string): Promise<void> {
      const chrome = getChromeWithThrow()
      await chrome.storage.local.remove(key)
    },
  }
}
