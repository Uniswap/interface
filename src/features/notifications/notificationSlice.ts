import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ChainId, ChainIdTo } from 'src/constants/chains'
import { AppNotification } from 'src/features/notifications/types'

interface NotificationState {
  notificationQueue: AppNotification[]
  notificationCount: {
    [userAddress: Address]: number
  }
  lastTxNotificationUpdate: { [address: Address]: ChainIdTo<number> }
}

const initialState: NotificationState = {
  notificationQueue: [],
  notificationCount: {},
  lastTxNotificationUpdate: {},
}

const slice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    pushNotification: (state, action: PayloadAction<AppNotification>) => {
      state.notificationQueue.push(action.payload)
    },
    popNotification: (state, action: PayloadAction<{ address: Nullable<Address> }>) => {
      const { address } = action.payload
      if (!address) {
        state.notificationQueue.shift()
      } else {
        const indexToRemove = state.notificationQueue.findIndex(
          (notif) => notif.address === address
        )
        if (indexToRemove !== -1) state.notificationQueue.splice(indexToRemove, 1)
      }
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
    setLastTxNotificationUpdate: (
      state,
      { payload }: PayloadAction<{ address: Address; timestamp: number; chainId: ChainId }>
    ) => {
      const { address, timestamp, chainId } = payload
      state.lastTxNotificationUpdate[address] ??= {}
      state.lastTxNotificationUpdate[address][chainId] = timestamp
    },
  },
})

export const {
  pushNotification,
  popNotification,
  resetNotifications,
  addToNotificationCount,
  clearNotificationCount,
  setLastTxNotificationUpdate,
} = slice.actions

export const notificationReducer = slice.reducer
