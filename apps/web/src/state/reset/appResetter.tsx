import { type Dispatch } from '@reduxjs/toolkit'
import { type QueryClient, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { type AppStateResetter, createAppStateResetter } from 'uniswap/src/state/createAppStateResetter'
import { createLogger } from 'utilities/src/logger/logger'
import { resetApplication } from '~/state/application/reducer'
import { resetFiatOnRamp } from '~/state/fiatOnRampTransactions/reducer'
import { resetLists } from '~/state/lists/actions'
import { resetUser } from '~/state/user/reducer'

/**
 * Creates the web app's state resetter instance.
 * This wraps the base createAppStateResetter and adds web-specific reset actions.
 */
export function createWebAppStateResetter({
  dispatch,
  queryClient,
}: {
  dispatch: Dispatch
  queryClient: QueryClient
}): AppStateResetter {
  const logger = createLogger('appResetter.tsx', 'createWebAppStateResetter')

  return createAppStateResetter({
    dispatch,

    onResetAccountHistory: () => {
      dispatch(resetFiatOnRamp())
      dispatch(resetApplication())
    },

    onResetUserSettings: () => {
      dispatch(resetUser())
      dispatch(resetLists())
    },

    onResetQueryCaches: async () => {
      await queryClient.resetQueries().then(() => logger.info('React Query cache cleared successfully'))
    },
  })
}

export function useAppStateResetter(): AppStateResetter {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  return useMemo(() => createWebAppStateResetter({ dispatch, queryClient }), [dispatch, queryClient])
}
