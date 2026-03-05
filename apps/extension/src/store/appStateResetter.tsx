import { type ApolloClient, useApolloClient } from '@apollo/client'
import { type Dispatch } from '@reduxjs/toolkit'
import { type QueryClient, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { dappRequestActions } from 'src/app/features/dappRequests/slice'
import { resetAlerts } from 'src/app/features/onboarding/alerts/slice'
import { resetPopups } from 'src/app/features/popups/slice'
import { type AppStateResetter } from 'uniswap/src/state/createAppStateResetter'
import { createLogger } from 'utilities/src/logger/logger'
import { createWalletStateResetter } from 'wallet/src/state/createWalletStateResetter'

/**
 * Creates the extension app's state resetter instance.
 * This wraps the base createAppStateResetter and adds extension-specific reset actions.
 *
 * @param apolloClient - Optional Apollo client for cache clearing. If not provided, cache clearing is skipped.
 * @param queryClient - Optional React Query client for cache clearing. If not provided, cache clearing is skipped.
 */
export function createExtensionAppStateResetter({
  dispatch,
  apolloClient,
  queryClient,
}: {
  dispatch: Dispatch
  apolloClient?: ApolloClient<unknown>
  queryClient?: QueryClient
}): AppStateResetter {
  const logger = createLogger('appResetter.tsx', 'createExtensionAppStateResetter')

  return createWalletStateResetter({
    dispatch,

    onResetAccountHistory: () => {
      dispatch(dappRequestActions.reset())
      dispatch(resetPopups())
      dispatch(resetAlerts())
    },

    onResetUserSettings: () => {
      // No extension-specific settings resets are currently required
    },

    onResetQueryCaches: async () => {
      const cachePromises: Promise<void>[] = []
      if (apolloClient) {
        cachePromises.push(apolloClient.resetStore().then(() => logger.info('Apollo cache cleared successfully')))
      }
      if (queryClient) {
        cachePromises.push(queryClient.resetQueries().then(() => logger.info('React Query cache cleared successfully')))
      }
      if (cachePromises.length > 0) {
        await Promise.all(cachePromises)
      }
    },
  })
}

export function useAppStateResetter(): AppStateResetter {
  const dispatch = useDispatch()
  const apolloClient = useApolloClient()
  const queryClient = useQueryClient()
  return useMemo(
    () => createExtensionAppStateResetter({ dispatch, apolloClient, queryClient }),
    [dispatch, apolloClient, queryClient],
  )
}

/**
 * Creates a resetter for use in crash recovery scenarios (e.g., error boundaries).
 * This version does not require the Apollo context, which is not
 * available when rendering the error fallback UI.
 */
export function useOnCrashAppStateResetter(): AppStateResetter {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  return useMemo(() => createExtensionAppStateResetter({ dispatch, queryClient }), [dispatch, queryClient])
}
