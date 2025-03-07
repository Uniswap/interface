import { PayloadAction, createSlice } from '@reduxjs/toolkit'

//------------------------------------------------------------------------------------------------
// LockScreen
//------------------------------------------------------------------------------------------------

export enum LockScreenVisibility {
  Init = 'init',
  Visible = 'visible',
  Hidden = 'hidden',
}

export interface LockScreenState {
  visibility: LockScreenVisibility
  onBlur: boolean
}

const initialState: LockScreenState = {
  visibility: LockScreenVisibility.Init,
  onBlur: false,
}

export const lockScreenSlice = createSlice({
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
  },
})

export const { setLockScreenVisibility, setLockScreenOnBlur } = lockScreenSlice.actions
export const lockScreenReducer = lockScreenSlice.reducer

//------------------------------
// LockScreen selectors
//------------------------------

export const selectLockScreenVisibility = (state: { lockScreen: LockScreenState }): LockScreenVisibility =>
  state.lockScreen.visibility

export const selectIsLockScreenHidden = (state: { lockScreen: LockScreenState }): boolean =>
  state.lockScreen.visibility === LockScreenVisibility.Hidden

export const selectIsLockScreenVisible = (state: { lockScreen: LockScreenState }): boolean =>
  state.lockScreen.visibility === LockScreenVisibility.Visible

export const selectLockScreenOnBlur = (state: { lockScreen: LockScreenState }): boolean => state.lockScreen.onBlur
