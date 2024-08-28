import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { PropsWithChildren } from 'react'
import { SharedQueryClient } from 'uniswap/src/data/apiClients/SharedQueryClient'
import { createPersister } from 'uniswap/src/data/apiClients/createPersister'
import { MAX_REACT_QUERY_CACHE_TIME_MS } from 'utilities/src/time/time'

const persister = createPersister()

const persistOptions: React.ComponentProps<typeof PersistQueryClientProvider>['persistOptions'] = {
  // Change this unique string whenever we want to bust the entire cache.
  buster: 'v0',
  maxAge: MAX_REACT_QUERY_CACHE_TIME_MS,
  persister,
}

export function SharedPersistQueryClientProvider({ children }: PropsWithChildren): JSX.Element {
  return (
    <PersistQueryClientProvider client={SharedQueryClient} persistOptions={persistOptions}>
      {children}
    </PersistQueryClientProvider>
  )
}
