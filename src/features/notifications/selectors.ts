import { createSelector } from '@reduxjs/toolkit'
import { RootState } from 'src/app/rootReducer'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'

const selectNotificationQueue = (state: RootState) => state.notifications.notificationQueue

export const selectActiveAccountNotifications = createSelector(
  selectNotificationQueue,
  selectActiveAccountAddress,
  (notificationQueue, address) => {
    if (!address) return []
    // If a notification doesn't have an address param assume it belongs to the active account
    return notificationQueue.filter((notif) => !notif.address || notif.address === address)
  }
)

export const makeSelectAddressNotificationCount =
  (address: Address | null) => (state: RootState) => {
    if (!address) return undefined
    return state.notifications.notificationCount?.[address]
  }

export const selectHasUnreadNotifications = (state: RootState) => {
  for (const count of Object.values(state.notifications.notificationCount)) {
    if (count) return true
  }
  return false
}

export const selectLastTxNotificationUpdate = (state: RootState) =>
  state.notifications.lastTxNotificationUpdate
