import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export enum PopupName {
  Connect = 'connect',
}

export interface PopupsState {
  [PopupName.Connect]: {
    isOpen: boolean
  }
}

const initialState: PopupsState = {
  [PopupName.Connect]: {
    isOpen: false,
  },
}

const slice = createSlice({
  name: 'popups',
  initialState,
  reducers: {
    openPopup: (state, action: PayloadAction<PopupName>) => {
      state[action.payload].isOpen = true
    },
    closePopup: (state, action: PayloadAction<PopupName>) => {
      state[action.payload].isOpen = false
    },
    resetPopups: () => initialState,
  },
})

export const { openPopup, closePopup, resetPopups } = slice.actions
export const { reducer: popupsReducer } = slice
