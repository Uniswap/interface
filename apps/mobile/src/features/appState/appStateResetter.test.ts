import { ApolloClient, InMemoryCache } from '@apollo/client'
import { configureStore } from '@reduxjs/toolkit'
import { QueryClient } from '@tanstack/react-query'
import FastImage from 'react-native-fast-image'
import { type MobileState, mobileReducer } from 'src/app/mobileReducer'
import { openModal } from 'src/features/modals/modalSlice'
import { NotifSettingType } from 'src/features/notifications/constants'
import { updateNotifSettings } from 'src/features/notifications/slice'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

// Mock FastImage
jest.mock('react-native-fast-image', () => ({
  clearMemoryCache: jest.fn().mockResolvedValue(undefined),
  clearDiskCache: jest.fn().mockResolvedValue(undefined),
}))

// Import after mock
import { createMobileAppStateResetter } from 'src/features/appState/appStateResetter'
import { ScannerModalState } from 'uniswap/src/components/ReceiveQRCode/constants'

const createMockApolloClient = (): ApolloClient<unknown> => {
  const client = new ApolloClient({
    cache: new InMemoryCache(),
  })
  jest.spyOn(client, 'resetStore').mockResolvedValue([])
  return client
}

const createMockQueryClient = (): QueryClient => {
  const client = new QueryClient()
  jest.spyOn(client, 'resetQueries').mockResolvedValue()
  return client
}

describe('createMobileAppStateResetter', () => {
  let store: ReturnType<typeof configureStore<MobileState>>
  let apolloClient: ApolloClient<unknown>
  let queryClient: QueryClient
  let resetter: ReturnType<typeof createMobileAppStateResetter>

  beforeEach(() => {
    store = configureStore({
      reducer: mobileReducer,
    })
    apolloClient = createMockApolloClient()
    queryClient = createMockQueryClient()
    resetter = createMobileAppStateResetter({
      dispatch: store.dispatch,
      apolloClient,
      queryClient,
    })
    jest.clearAllMocks()
  })

  describe('resetAccountHistory', () => {
    it('dispatches mobile-specific account history reset actions', async () => {
      store.dispatch(openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.ScanQr }))

      // Verify state was modified
      expect(store.getState().modals[ModalName.WalletConnectScan].isOpen).toBe(true)

      await resetter.resetAccountHistory()

      // Verify mobile-specific state was reset
      const state = store.getState()
      expect(state.modals[ModalName.WalletConnectScan].isOpen).toBe(false) // resetModals effect
    })
  })

  describe('resetUserSettings', () => {
    it('dispatches mobile-specific user settings reset actions', async () => {
      store.dispatch(updateNotifSettings({ [NotifSettingType.GeneralUpdates]: false }))

      // Verify state was modified
      expect(store.getState().pushNotifications.generalUpdatesEnabled).toBe(false)

      await resetter.resetUserSettings()

      // Verify mobile-specific state was reset
      const state = store.getState()
      expect(state.pushNotifications.generalUpdatesEnabled).toBe(true)
    })
  })

  describe('resetQueryCaches', () => {
    it('clears Apollo and React Query caches', async () => {
      await resetter.resetQueryCaches()

      // Verify cache clearing methods were called
      expect(apolloClient.resetStore).toHaveBeenCalledTimes(1)
      expect(queryClient.resetQueries).toHaveBeenCalledTimes(1)
      expect(FastImage.clearMemoryCache).toHaveBeenCalledTimes(1)
      expect(FastImage.clearDiskCache).toHaveBeenCalledTimes(1)
    })
  })

  describe('resetAll', () => {
    it('resets all state and clears all caches', async () => {
      // Modify state first
      store.dispatch(
        pushNotification({
          type: AppNotificationType.Success,
          title: 'Test notification',
        }),
      )

      // Verify state was modified
      expect(store.getState().notifications.notificationQueue.length).toBe(1)

      await resetter.resetAll()

      // Verify all resets worked
      const state = store.getState()
      expect(state.notifications.notificationQueue).toEqual([])
      expect(apolloClient.resetStore).toHaveBeenCalledTimes(1)
      expect(queryClient.resetQueries).toHaveBeenCalledTimes(1)
    })
  })
})
