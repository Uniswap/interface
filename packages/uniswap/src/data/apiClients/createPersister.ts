import { PersistedClient, Persister } from '@tanstack/react-query-persist-client'
import { del, get, set } from 'idb-keyval'
import { REACT_QUERY_PERSISTER_KEY } from 'uniswap/src/data/apiClients/constants'

// Based on example from https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient#building-a-persister
export function createPersister(key: string = REACT_QUERY_PERSISTER_KEY): Persister {
  const persister: Persister = {
    persistClient: async (client: PersistedClient) => {
      await set(key, client)
    },
    restoreClient: async () => {
      return await get<PersistedClient>(key)
    },
    removeClient: async () => {
      await del(key)
    },
  }

  return persister
}
