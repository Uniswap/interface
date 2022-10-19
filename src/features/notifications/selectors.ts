import { createSelector } from '@reduxjs/toolkit'
import { RootState } from 'src/app/rootReducer'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'

const selectNotificationQueue = (state: RootState) => state.notifications.notificationQueue
export const selectActiveAccountNotifications = createSelector(
  selectNotificationQueue,
  selectActiveAccountAddress,
  (notificationQueue, address) => {
    if (!address) return EMPTY_ARRAY
    // If a notification doesn't have an address param assume it belongs to the active account
    return notificationQueue.filter((notif) => !notif.address || notif.address === address)
  }
)

const selectNotificationStatus = (state: RootState) => state.notifications.notificationStatus

export const makeSelectHasNotifications = (address: Address | null) =>
  createSelector(selectNotificationStatus, (notificationsCount) => {
    if (!address) return undefined
    return notificationsCount?.[address]
  })

export const selectLastTxNotificationUpdate = (state: RootState) =>
  state.notifications.lastTxNotificationUpdate
