import { type ApolloClient, useApolloClient } from '@apollo/client'
import { type Dispatch } from '@reduxjs/toolkit'
import { type QueryClient, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { type AppStateResetter, createAppStateResetter } from 'uniswap/src/state/createAppStateResetter'
import { createLogger } from 'utilities/src/logger/logger'
import { resetApplication } from '~/state/application/reducer'
import { resetFiatOnRamp } from '~/state/fiatOnRampTransactions/reducer'
import { resetLists } from '~/state/lists/actions'
import { resetLogs } from '~/state/logs/slice'
import { resetRoutingApi } from '~/state/routing/slice'
import { resetUser } from '~/state/user/reducer'

/**
 * Creates the web app's state resetter instance.
 * This wraps the base createAppStateResetter and adds web-specific reset actions.
 */
export function createWebAppStateResetter({
  dispatch,
  apolloClient,
  queryClient,
}: {
  dispatch: Dispatch
  apolloClient: ApolloClient<unknown>
  queryClient: QueryClient
}): AppStateResetter {
  const logger = createLogger('appResetter.tsx', 'createWebAppStateResetter')

  return createAppStateResetter({
    dispatch,

    onResetAccountHistory: () => {
      dispatch(resetFiatOnRamp())
      dispatch(resetApplication())
      dispatch(resetLogs())
    },

    onResetUserSettings: () => {
      dispatch(resetUser())
      dispatch(resetLists())
    },

    onResetQueryCaches: async () => {
      dispatch(resetRoutingApi())
      await Promise.all([
        apolloClient.resetStore().then(() => logger.info('Apollo cache cleared successfully')),
        queryClient.resetQueries().then(() => logger.info('React Query cache cleared successfully')),
      ])
    },
  })
}

export function useAppStateResetter(): AppStateResetter {
  const dispatch = useDispatch()
  const apolloClient = useApolloClient()
  const queryClient = useQueryClient()

  return useMemo(
    () => createWebAppStateResetter({ dispatch, apolloClient, queryClient }),
    [dispatch, apolloClient, queryClient],
  )
}
