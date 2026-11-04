import { type StorageDriver } from './types'

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
