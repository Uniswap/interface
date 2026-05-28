import { createSelector, Selector } from '@reduxjs/toolkit'
import { AppNotification } from 'uniswap/src/features/notifications/slice/types'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'

const selectNotificationQueue = (state: UniswapState): AppNotification[] => state.notifications.notificationQueue

export const makeSelectAddressNotifications = (): Selector<
  UniswapState,
  AppNotification[] | undefined,
  [Address | null]
> =>
  createSelector(
    selectNotificationQueue,
    (_: UniswapState, address: Address | null) => address,
    (notificationQueue, address) => {
      if (!address) {
        return undefined
      }
      // If a notification doesn't have an address param assume it belongs to the active account
      return notificationQueue.filter((notif) => !notif.address || notif.address === address)
    },
  )

const selectNotificationStatus = (
  state: UniswapState,
): {
  [userAddress: string]: boolean | undefined
} => state.notifications.notificationStatus

export const makeSelectHasNotifications = (): Selector<UniswapState, boolean | undefined, [Address | null]> =>
  createSelector(
    selectNotificationStatus,
    (_: UniswapState, address: Address | null) => address,
    (notificationStatuses, address) => {
      if (!address) {
        return undefined
      }
      return notificationStatuses[address]
    },
  )

export const selectLastTxNotificationUpdate = (
  state: UniswapState,
): {
  [address: string]: number | undefined
} => state.notifications.lastTxNotificationUpdate
