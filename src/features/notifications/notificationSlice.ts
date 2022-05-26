import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppNotification } from 'src/features/notifications/types'

interface NotificationState {
  notificationQueue: AppNotification[]
  notificationCount: {
    [userAddress: Address]: number
  }
}

const initialState: NotificationState = {
  notificationQueue: [],
  notificationCount: {},
}

const slice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    pushNotification: (state, action: PayloadAction<AppNotification>) => {
      state.notificationQueue.push(action.payload)
    },
    popNotification: (state, action: PayloadAction<{ address: Address | null }>) => {
      const { address } = action.payload
      if (!address) return
      const indexToRemove = state.notificationQueue.findIndex((notif) => notif.address === address)
      if (indexToRemove !== -1) state.notificationQueue.splice(indexToRemove, 1)
    },
    resetNotifications: () => initialState,
    addToNotificationCount: (state, action: PayloadAction<{ address: Address; count: number }>) => {
      const { address, count } = action.payload
      state.notificationCount[address] = (state.notificationCount[address] ?? 0) + count
    },
    clearNotificationCount: (state, action: PayloadAction<{ address: Address | null }>) => {
      const { address } = action.payload
      if (!address || !state.notificationCount[address]) return
      state.notificationCount[address] = 0
    },
  },
})

export const {
  pushNotification,
  popNotification,
  resetNotifications,
  addToNotificationCount,
  clearNotificationCount,
} = slice.actions

export const notificationReducer = slice.reducer
