import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// eslint-disable-next-line import/no-unused-modules
export interface PasswordLockoutState {
  passwordAttempts: number
  endTime?: number
}

export const initialPasswordLockoutState: Readonly<PasswordLockoutState> = {
  passwordAttempts: 0,
}

const slice = createSlice({
  name: 'passwordLockout',
  initialState: initialPasswordLockoutState,
  reducers: {
    incrementPasswordAttempts: (state) => {
      state.passwordAttempts++
    },
    resetPasswordAttempts: (state) => {
      state.passwordAttempts = 0
    },
    setLockoutEndTime: (state, action: PayloadAction<{ lockoutEndTime: number }>) => {
      state.endTime = action.payload.lockoutEndTime
    },
    resetLockoutEndTime: (state) => {
      state.endTime = undefined
    },
  },
})

export const { incrementPasswordAttempts, resetPasswordAttempts, setLockoutEndTime, resetLockoutEndTime } =
  slice.actions
export const { reducer: passwordLockoutReducer } = slice
