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
    popNotification: (state) => {
      state.notificationQueue.shift()
    },
    resetNotifications: () => initialState,
  },
})

export const { pushNotification, popNotification, resetNotifications } = slice.actions

export const notificationReducer = slice.reducer
