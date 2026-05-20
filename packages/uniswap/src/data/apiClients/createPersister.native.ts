import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { type AsyncStorage, type Persister } from '@tanstack/react-query-persist-client'
import { createMMKV } from 'react-native-mmkv'
import { REACT_QUERY_PERSISTER_KEY } from 'uniswap/src/data/apiClients/constants'
import { jsonParse, jsonStringify } from 'utilities/src/serialization/json'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const mmkv = createMMKV()

const mmkvStorageWrapper: AsyncStorage<string> = {
  async getItem(key: string): Promise<string | undefined> {
    return mmkv.getString(key)
  },
  async setItem(key: string, value: string): Promise<void> {
    mmkv.set(key, value)
  },
  async removeItem(key: string): Promise<void> {
    mmkv.remove(key)
  },
}

export function createPersister(key: string = REACT_QUERY_PERSISTER_KEY): Persister {
  return createAsyncStoragePersister({
    key,
    storage: mmkvStorageWrapper,
    serialize: jsonStringify,
    deserialize: jsonParse,
    throttleTime: 5 * ONE_SECOND_MS,
  })
}
