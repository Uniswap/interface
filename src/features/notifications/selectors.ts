import { createSelector } from '@reduxjs/toolkit'
import { RootState } from 'src/app/rootReducer'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'

const selectNotificationQueue = (state: RootState) => state.notifications.notificationQueue

export const selectActiveAccountNotifications = createSelector(
  selectNotificationQueue,
  selectActiveAccountAddress,
  (notificationQueue, address) => {
    if (!address) return []
    return notificationQueue.filter((notif) => notif.address === address)
  }
)
