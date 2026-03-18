import { type ApolloClient, useApolloClient } from '@apollo/client'
import { type Dispatch } from '@reduxjs/toolkit'
import { type QueryClient, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import FastImage from 'react-native-fast-image'
import { useDispatch } from 'react-redux'
import { resetBiometricSettings } from 'src/features/biometricsSettings/slice'
import { resetModals } from 'src/features/modals/modalSlice'
import { resetPushNotifications } from 'src/features/notifications/slice'
import { resetTweaks } from 'src/features/tweaks/slice'
import { resetWalletConnect } from 'src/features/walletConnect/walletConnectSlice'
import { type AppStateResetter } from 'uniswap/src/state/createAppStateResetter'
import { createLogger } from 'utilities/src/logger/logger'
import { createWalletStateResetter } from 'wallet/src/state/createWalletStateResetter'

/**
 * Creates the mobile app's state resetter instance.
 * This wraps the base createAppStateResetter and adds mobile-specific reset actions.
 */
export function createMobileAppStateResetter({
  dispatch,
  apolloClient,
  queryClient,
}: {
  dispatch: Dispatch
  apolloClient: ApolloClient<unknown>
  queryClient: QueryClient
}): AppStateResetter {
  const logger = createLogger('appStateResetter.tsx', 'createMobileAppStateResetter')

  return createWalletStateResetter({
    dispatch,

    onResetAccountHistory: () => {
      dispatch(resetModals())
      dispatch(resetWalletConnect())
    },

    onResetUserSettings: () => {
      dispatch(resetBiometricSettings())
      dispatch(resetPushNotifications())
      dispatch(resetTweaks())
    },

    onResetQueryCaches: async () => {
      await Promise.all([
        apolloClient.resetStore().then(() => logger.info('Apollo cache cleared successfully')),
        queryClient.resetQueries().then(() => logger.info('React Query cache cleared successfully')),
        FastImage.clearMemoryCache()
          .then(() => FastImage.clearDiskCache())
          .then(() => logger.info('FastImage cache cleared successfully')),
      ])
    },
  })
}

export function useAppStateResetter(): AppStateResetter {
  const dispatch = useDispatch()
  const apolloClient = useApolloClient()
  const queryClient = useQueryClient()
  return useMemo(
    () => createMobileAppStateResetter({ dispatch, apolloClient, queryClient }),
    [dispatch, apolloClient, queryClient],
  )
}
