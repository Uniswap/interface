import { createSelector, Selector } from '@reduxjs/toolkit'
import { AppNotification } from 'wallet/src/features/notifications/types'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'
import { WalletState } from 'wallet/src/state/walletReducer'

const selectNotificationQueue = (state: WalletState): AppNotification[] => state.notifications.notificationQueue

export const selectActiveAccountNotifications = createSelector(
  selectNotificationQueue,
  selectActiveAccountAddress,
  (notificationQueue, address) => {
    if (!address) {
      return undefined
    }
    // If a notification doesn't have an address param assume it belongs to the active account
    return notificationQueue.filter((notif) => !notif.address || notif.address === address)
  },
)

const selectNotificationStatus = (
  state: WalletState,
): {
  [userAddress: string]: boolean | undefined
} => state.notifications.notificationStatus

export const makeSelectHasNotifications = (): Selector<WalletState, boolean | undefined, [Address | null]> =>
  createSelector(
    selectNotificationStatus,
    (_: WalletState, address: Address | null) => address,
    (notificationStatuses, address) => {
      if (!address) {
        return undefined
      }
      return notificationStatuses?.[address]
    },
  )

export const selectLastTxNotificationUpdate = (
  state: WalletState,
): {
  [address: string]: number | undefined
} => state.notifications.lastTxNotificationUpdate
