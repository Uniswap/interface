import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { NotifSettingType } from 'src/features/notifications/constants'

export interface PushNotificationsState {
  generalUpdatesEnabled: boolean
  priceAlertsEnabled: boolean
}

export const initialPushNotificationsState: PushNotificationsState = {
  generalUpdatesEnabled: true,
  priceAlertsEnabled: true,
}

type SettingsUpdatePayload = {
  [k in NotifSettingType]?: boolean
}

const slice = createSlice({
  name: 'pushNotifications',
  initialState: initialPushNotificationsState,
  reducers: {
    updateNotifSettings: (state, action: PayloadAction<SettingsUpdatePayload>) => {
      if (action.payload[NotifSettingType.GeneralUpdates] !== undefined) {
        state.generalUpdatesEnabled = action.payload[NotifSettingType.GeneralUpdates]
      }
      if (action.payload[NotifSettingType.PriceAlerts] !== undefined) {
        state.priceAlertsEnabled = action.payload[NotifSettingType.PriceAlerts]
      }
    },
    initNotifsForNewUser: (state) => {
      // Primary used to trigger side effects in saga
      state.generalUpdatesEnabled = true
    },
    resetPushNotifications: () => initialPushNotificationsState,
  },
})

export const { initNotifsForNewUser, updateNotifSettings, resetPushNotifications } = slice.actions

export const pushNotificationsReducer = slice.reducer
