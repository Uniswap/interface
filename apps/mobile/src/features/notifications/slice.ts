import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { NotifSettingType } from 'src/features/notifications/constants'

// eslint-disable-next-line import/no-unused-modules
export interface PushNotificationsState {
  generalUpdatesEnabled: boolean
}

export const initialPushNotificationsState: PushNotificationsState = {
  generalUpdatesEnabled: true,
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
    },
    initNotifsForNewUser: (state) => {
      // Primary used to trigger side effects in saga
      state.generalUpdatesEnabled = true
    },
  },
})

export const { initNotifsForNewUser, updateNotifSettings } = slice.actions

export const pushNotificationsReducer = slice.reducer
