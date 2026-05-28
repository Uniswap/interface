import { type StorageDriver } from '@universe/api/src/storage/types'

export function createWebStorageDriver(): StorageDriver {
  return {
    async get(key: string): Promise<string | null> {
      return localStorage.getItem(key)
    },

    async set(key: string, value: string): Promise<void> {
      localStorage.setItem(key, value)
    },

    async remove(key: string): Promise<void> {
      localStorage.removeItem(key)
    },
  }
}
