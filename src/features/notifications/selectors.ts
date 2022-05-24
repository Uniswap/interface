import { createSelector } from '@reduxjs/toolkit'
import { RootState } from 'src/app/rootReducer'
import { activeAccountAddressSelector } from 'src/features/wallet/walletSlice'

const selectNotificationQueue = (state: RootState) => state.notifications.notificationQueue

export const selectActiveAccountNotifications = createSelector(
  selectNotificationQueue,
  activeAccountAddressSelector,
  (notificationQueue, address) => {
    if (!address) return []
    return notificationQueue.filter((notif) => notif.address === address)
  }
)
