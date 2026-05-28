import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { type AsyncStorage, type Persister } from '@tanstack/react-query-persist-client'
import { del, get, set } from 'idb-keyval'
import { REACT_QUERY_PERSISTER_KEY } from 'uniswap/src/data/apiClients/constants'
import { jsonParse, jsonStringify } from 'utilities/src/serialization/json'

/**
 * IndexedDB storage adapter for TanStack Query persistence.
 * Uses idb-keyval for simple key-value storage in IndexedDB.
 * Inspired by https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient#building-a-persister
 */
const indexedDBStorage: AsyncStorage<string> = {
  async getItem(key: string): Promise<string | undefined> {
    return await get<string>(key)
  },
  async setItem(key: string, value: string): Promise<void> {
    await set(key, value)
  },
  async removeItem(key: string): Promise<void> {
    await del(key)
  },
}

/**
 * Creates a persister for TanStack Query cache using IndexedDB.
 * Handles BigInt serialization using custom JSON utilities.
 */
export function createPersister(key: string = REACT_QUERY_PERSISTER_KEY): Persister {
  return createAsyncStoragePersister({
    key,
    storage: indexedDBStorage,
    serialize: jsonStringify,
    deserialize: jsonParse,
  })
}
