import { createSelector } from '@reduxjs/toolkit'
import { RootState } from 'src/app/rootReducer'
import { selectPendingTransactions } from 'src/features/transactions/selectors'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'

export const selectNotificationQueue = (state: RootState) => state.notifications.notificationQueue
const selectNotificationCount = (state: RootState) => state.notifications.notificationCount

export const selectActiveAccountNotifications = createSelector(
  selectNotificationQueue,
  selectActiveAccountAddress,
  (notificationQueue, address) => {
    if (!address) return []
    return notificationQueue.filter((notif) => notif.address === address)
  }
)

export const makeSelectAddressNotificationCount = (address: Address | null) =>
  createSelector(selectNotificationCount, (notificationCount) => {
    if (!address) return undefined
    return notificationCount[address]
  })

export const selectHasUnreadNotifications = createSelector(
  selectNotificationCount,
  selectPendingTransactions,
  (notificationCount, pendingTxs) => {
    const sumOfUnreadNotifications = Object.values(notificationCount).reduce(
      (accum, count) => (accum += count),
      0
    )
    return sumOfUnreadNotifications + pendingTxs.length > 0
  }
)
