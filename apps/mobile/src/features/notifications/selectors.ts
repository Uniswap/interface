import { createSelector, Selector } from '@reduxjs/toolkit'
import { MobileState } from 'src/app/reducer'
import { AppNotification } from 'wallet/src/features/notifications/types'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'

const selectNotificationQueue = (state: MobileState): AppNotification[] =>
  state.notifications.notificationQueue

export const selectActiveAccountNotifications = createSelector(
  selectNotificationQueue,
  selectActiveAccountAddress,
  (notificationQueue, address) => {
    if (!address) return
    // If a notification doesn't have an address param assume it belongs to the active account
    return notificationQueue.filter((notif) => !notif.address || notif.address === address)
  }
)

const selectNotificationStatus = (
  state: MobileState
): {
  [userAddress: string]: boolean | undefined
} => state.notifications.notificationStatus

export const makeSelectHasNotifications = (): Selector<
  MobileState,
  boolean | undefined,
  [Address | null]
> =>
  createSelector(
    selectNotificationStatus,
    (_: MobileState, address: Address | null) => address,
    (notificationStatuses, address) => {
      if (!address) return undefined
      return notificationStatuses?.[address]
    }
  )

export const selectLastTxNotificationUpdate = (
  state: MobileState
): {
  [address: string]: number | undefined
} => state.notifications.lastTxNotificationUpdate
