import { type Dispatch } from '@reduxjs/toolkit'
import { type QueryClient, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { resetBiometricSettings } from 'src/features/biometricsSettings/slice'
import { resetModals } from 'src/features/modals/modalSlice'
import { resetPushNotifications } from 'src/features/notifications/slice'
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
  queryClient,
}: {
  dispatch: Dispatch
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
    },

    onResetQueryCaches: async () => {
      await Promise.all([
        queryClient.resetQueries().then(() => logger.info('React Query cache cleared successfully')),
        Image.clearDiskCache().then(() => logger.info('Image disk cache cleared successfully')),
        Image.clearMemoryCache().then(() => logger.info('Image memory cache cleared successfully')),
      ])
    },
  })
}

export function useAppStateResetter(): AppStateResetter {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  return useMemo(() => createMobileAppStateResetter({ dispatch, queryClient }), [dispatch, queryClient])
}
