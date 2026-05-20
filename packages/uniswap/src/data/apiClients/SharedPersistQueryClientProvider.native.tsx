import { IsRestoringProvider, QueryClientProvider } from '@tanstack/react-query'
import { persistQueryClientRestore, persistQueryClientSave } from '@tanstack/react-query-persist-client'
import { SharedQueryClient } from '@universe/api'
import { PropsWithChildren, useEffect, useState } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { createPersister } from 'uniswap/src/data/apiClients/createPersister'
import { sharedDehydrateOptions } from 'uniswap/src/data/apiClients/sharedDehydrateOptions'
import { logger } from 'utilities/src/logger/logger'
import { MAX_REACT_QUERY_CACHE_TIME_MS } from 'utilities/src/time/time'

const CACHE_BUSTER = 'v1'

const persister = createPersister()

// Hydrate once at module load — fire-and-forget so children mount immediately.
// `IsRestoringProvider` below makes `useQuery` wait until restore settles, so
// we don't fire network fetches that the cache could have served.
const restorePromise = persistQueryClientRestore({
  queryClient: SharedQueryClient,
  persister,
  maxAge: MAX_REACT_QUERY_CACHE_TIME_MS,
  buster: CACHE_BUSTER,
}).catch((error: unknown) => {
  logger.warn('SharedPersistQueryClientProvider.native', 'restore', 'Failed to restore react-query cache from MMKV', {
    error: String(error),
  })
})

export function SharedPersistQueryClientProvider({ children }: PropsWithChildren): JSX.Element {
  const [isRestoring, setIsRestoring] = useState(true)

  useEffect(() => {
    let mounted = true
    void restorePromise.finally(() => {
      if (mounted) {
        setIsRestoring(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus): void => {
      // Background-only persistence: dehydrate + JSON.stringify + MMKV write
      // happens off the active interaction path. iOS routes some transitions
      // through 'inactive' (notification center pull-down, app switcher) and
      // Android only hits 'background', so we save on both.
      if (nextState !== 'background' && nextState !== 'inactive') {
        return
      }

      // Await restore so we don't dehydrate over an in-flight hydrate (rare —
      // user would have to background the app mid-boot — but cheap to guard).
      restorePromise
        .then(() =>
          persistQueryClientSave({
            queryClient: SharedQueryClient,
            persister,
            buster: CACHE_BUSTER,
            dehydrateOptions: sharedDehydrateOptions,
          }),
        )
        .catch((error: unknown) => {
          logger.warn(
            'SharedPersistQueryClientProvider.native',
            'save',
            'Failed to persist react-query cache to MMKV',
            { error: String(error) },
          )
        })
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => subscription.remove()
  }, [])

  return (
    <QueryClientProvider client={SharedQueryClient}>
      <IsRestoringProvider value={isRestoring}>{children}</IsRestoringProvider>
    </QueryClientProvider>
  )
}
