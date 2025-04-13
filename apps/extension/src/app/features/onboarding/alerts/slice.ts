import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export enum AlertName {
  PinToToolbar = 'PinToToolbar',
}

export interface AlertsState {
  [AlertName.PinToToolbar]: {
    isOpen: boolean
  }
}

const initialState: AlertsState = {
  [AlertName.PinToToolbar]: {
    isOpen: true,
  },
}

const slice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    closeAlert: (state, action: PayloadAction<AlertName>) => {
      state[action.payload].isOpen = false
    },
  },
})

export const { closeAlert } = slice.actions
export const { reducer: alertsReducer } = slice
