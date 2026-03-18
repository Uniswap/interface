import { createSlice, PayloadAction } from '@reduxjs/toolkit'

//------------------------------------------------------------------------------------------------
// LockScreen
//------------------------------------------------------------------------------------------------

export enum LockScreenVisibility {
  Init = 'init',
  Visible = 'visible',
  Hidden = 'hidden',
}

// eslint-disable-next-line import/no-unused-modules
export interface LockScreenState {
  visibility: LockScreenVisibility
  onBlur: boolean
  preventLock: boolean
  manualRetryRequired: boolean
}

const initialState: LockScreenState = {
  visibility: LockScreenVisibility.Init,
  onBlur: false,
  preventLock: false,
  manualRetryRequired: false,
}

const lockScreenSlice = createSlice({
  name: 'lockScreen',
  initialState,
  reducers: {
    setLockScreenVisibility: (
      state,
      action: PayloadAction<LockScreenVisibility.Visible | LockScreenVisibility.Hidden>,
    ) => {
      state.visibility = action.payload
    },
    setLockScreenOnBlur: (state, action: PayloadAction<boolean>) => {
      state.onBlur = action.payload
    },
    setPreventLock: (state, action: PayloadAction<boolean>) => {
      state.preventLock = action.payload
    },
    setManualRetryRequired: (state, action: PayloadAction<boolean>) => {
      state.manualRetryRequired = action.payload
    },
  },
})

export const { setLockScreenVisibility, setLockScreenOnBlur, setPreventLock, setManualRetryRequired } =
  lockScreenSlice.actions
export const lockScreenReducer = lockScreenSlice.reducer

//------------------------------
// LockScreen selectors
//------------------------------

export const selectIsLockScreenVisible = (state: { lockScreen: LockScreenState }): boolean =>
  state.lockScreen.visibility === LockScreenVisibility.Visible

export const selectLockScreenOnBlur = (state: { lockScreen: LockScreenState }): boolean => state.lockScreen.onBlur

export const selectPreventLock = (state: { lockScreen: LockScreenState }): boolean => state.lockScreen.preventLock

export const selectManualRetryRequired = (state: { lockScreen: LockScreenState }): boolean =>
  state.lockScreen.manualRetryRequired
