import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppNotification } from 'src/features/notifications/types'

interface NotificationState {
  notificationQueue: AppNotification[]
}

const initialState: NotificationState = {
  notificationQueue: [],
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
  },
})

export const { pushNotification, popNotification, resetNotifications } = slice.actions

export const notificationReducer = slice.reducer
