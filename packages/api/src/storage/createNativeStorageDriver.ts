import { StorageDriver } from '@universe/api/src/storage/types'
import * as SecureStore from 'expo-secure-store'

export function createNativeStorageDriver(): StorageDriver {
  return {
    async get(key: string): Promise<string | null> {
      const value = await SecureStore.getItemAsync(key)
      return value ?? null
    },

    async set(key: string, value: string): Promise<void> {
      await SecureStore.setItemAsync(key, value)
    },

    async remove(key: string): Promise<void> {
      await SecureStore.deleteItemAsync(key)
    },
  }
}
