import { configureStore } from '@reduxjs/toolkit'
import { AppearanceSettingType, setSelectedAppearanceSettings } from 'uniswap/src/features/appearance/slice'
import { addFavoriteToken } from 'uniswap/src/features/favorites/slice'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { createWalletStateResetter } from 'wallet/src/state/createWalletStateResetter'
import { type WalletStateReducersOnly, walletRootReducer } from 'wallet/src/state/walletReducer'

describe('createWalletStateResetter', () => {
  let store: ReturnType<typeof configureStore<WalletStateReducersOnly>>
  let resetter: ReturnType<typeof createWalletStateResetter>
  let onResetAccountHistory: jest.Mock
  let onResetUserSettings: jest.Mock
  let onResetQueryCaches: jest.Mock

  beforeEach(() => {
    store = configureStore({
      reducer: walletRootReducer,
    })
    onResetAccountHistory = jest.fn()
    onResetUserSettings = jest.fn()
    onResetQueryCaches = jest.fn()
    resetter = createWalletStateResetter({
      dispatch: store.dispatch,
      onResetAccountHistory,
      onResetUserSettings,
      onResetQueryCaches,
    })
  })

  describe('resetAccountHistory', () => {
    it('dispatches account history reset actions', async () => {
      // Modify state first
      store.dispatch(
        pushNotification({
          type: AppNotificationType.Success,
          title: 'Test notification',
        }),
      )

      // Verify state was modified
      expect(store.getState().notifications.notificationQueue.length).toBe(1)

      await resetter.resetAccountHistory()

      // Verify state was reset
      const state = store.getState()
      expect(state.notifications.notificationQueue).toEqual([]) // clearNotificationQueue effect
    })

    it('calls onResetAccountHistory callback', async () => {
      await resetter.resetAccountHistory()

      expect(onResetAccountHistory).toHaveBeenCalledTimes(1)
    })
  })

  describe('resetUserSettings', () => {
    it('dispatches user settings reset actions', async () => {
      // Modify state first
      const initialTokenCount = store.getState().favorites.tokens.length
      store.dispatch(addFavoriteToken({ currencyId: 'test-currency-id' }))
      store.dispatch(setSelectedAppearanceSettings(AppearanceSettingType.Dark))

      // Verify state was modified
      expect(store.getState().favorites.tokens.length).toBe(initialTokenCount + 1)
      expect(store.getState().appearanceSettings.selectedAppearanceSettings).toBe(AppearanceSettingType.Dark)

      await resetter.resetUserSettings()

      // Verify state was reset
      const state = store.getState()
      expect(state.favorites.tokens.length).toBe(initialTokenCount) // resetFavorites restores defaults
      expect(state.appearanceSettings.selectedAppearanceSettings).toBe(AppearanceSettingType.System) // resetAppearanceSettings effect
    })

    it('calls onResetUserSettings callback', async () => {
      await resetter.resetUserSettings()

      expect(onResetUserSettings).toHaveBeenCalledTimes(1)
    })
  })

  describe('resetQueryCaches', () => {
    it('calls onResetQueryCaches callback', async () => {
      await resetter.resetQueryCaches()

      expect(onResetQueryCaches).toHaveBeenCalledTimes(1)
    })
  })

  describe('resetAll', () => {
    it('calls all three reset methods', async () => {
      await resetter.resetAll()

      expect(onResetAccountHistory).toHaveBeenCalledTimes(1)
      expect(onResetUserSettings).toHaveBeenCalledTimes(1)
      expect(onResetQueryCaches).toHaveBeenCalledTimes(1)
    })
  })
})
