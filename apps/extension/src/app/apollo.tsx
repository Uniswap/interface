import { ApolloProvider } from '@apollo/client/react/context'
import { PropsWithChildren } from 'react'
import { localStorage } from 'redux-persist-webextension-storage'
import { getReduxStore } from 'src/store/store'
// biome-ignore lint/style/noRestrictedImports: Direct wallet import needed for Apollo client setup in extension context
import { usePersistedApolloClient } from 'wallet/src/data/apollo/usePersistedApolloClient'

// Extension local storage has 10 MB limit, so we want to be very careful to leave enough space for the redux store + any other data that we might want to store in local storage
const MAX_CACHE_SIZE_IN_BYTES = 1024 * 1024 * 5 // 5 MB

export function GraphqlProvider({ children }: PropsWithChildren<unknown>): JSX.Element {
  const apolloClient = usePersistedApolloClient({
    storageWrapper: localStorage,
    maxCacheSizeInBytes: MAX_CACHE_SIZE_IN_BYTES,
    reduxStore: getReduxStore(),
  })

  if (!apolloClient) {
    return <></>
  }
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
}
