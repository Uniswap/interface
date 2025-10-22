import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppNotification } from 'uniswap/src/features/notifications/slice/types'

export interface NotificationState {
  notificationQueue: AppNotification[]
  notificationStatus: {
    [userAddress: Address]: boolean | undefined
  }
  lastTxNotificationUpdate: { [address: Address]: number | undefined }
}

export const initialNotificationsState: NotificationState = {
  notificationQueue: [],
  notificationStatus: {},
  lastTxNotificationUpdate: {},
}

const slice = createSlice({
  name: 'notifications',
  initialState: initialNotificationsState,
  reducers: {
    pushNotification: (state, action: PayloadAction<AppNotification>) => {
      state.notificationQueue.push(action.payload)
    },
    popNotification: (state, action: PayloadAction<{ address: Maybe<Address> }>) => {
      const { address } = action.payload
      if (!address) {
        state.notificationQueue.shift()
      } else {
        const indexToRemove = state.notificationQueue.findIndex((notif) => notif.address === address)
        if (indexToRemove !== -1) {
          state.notificationQueue.splice(indexToRemove, 1)
        }
      }
    },
    setNotificationViewed: (state, action: PayloadAction<{ address: Maybe<Address> }>) => {
      const { address } = action.payload
      if (!address) {
        if (state.notificationQueue[0]) {
          state.notificationQueue[0].shown = true
        }
      } else {
        const indexToChange = state.notificationQueue.findIndex((notif) => notif.address === address)
        if (indexToChange !== -1) {
          const itemToChange = state.notificationQueue[indexToChange]
          if (itemToChange) {
            itemToChange.shown = true
          }
        }
      }
    },
    clearNotificationQueue: (state) => {
      state.notificationQueue = []
    },
    resetNotifications: () => initialNotificationsState,
    setNotificationStatus: (state, action: PayloadAction<{ address: Address; hasNotifications: boolean }>) => {
      const { address, hasNotifications } = action.payload
      state.notificationStatus = { ...state.notificationStatus, [address]: hasNotifications }
    },
    setLastTxNotificationUpdate: (state, { payload }: PayloadAction<{ address: Address; timestamp: number }>) => {
      const { address, timestamp } = payload
      state.lastTxNotificationUpdate[address] = timestamp
    },
  },
})

export const {
  pushNotification,
  popNotification,
  setNotificationViewed,
  clearNotificationQueue,
  resetNotifications,
  setNotificationStatus,
  setLastTxNotificationUpdate,
} = slice.actions

export const notificationReducer = slice.reducer
