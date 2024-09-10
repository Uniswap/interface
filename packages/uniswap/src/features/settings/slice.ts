import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface UserSettingsState {
  hideSmallBalances: boolean
  hideSpamTokens: boolean
}

export const initialUserSettingsState: UserSettingsState = {
  hideSmallBalances: true,
  hideSpamTokens: true,
}

const slice = createSlice({
  name: 'userSettings',
  initialState: initialUserSettingsState,
  reducers: {
    setHideSmallBalances: (state, { payload }: PayloadAction<boolean>) => {
      state.hideSmallBalances = payload
    },
    setHideSpamTokens: (state, { payload }: PayloadAction<boolean>) => {
      state.hideSpamTokens = payload
    },
  },
})

export const { setHideSmallBalances, setHideSpamTokens } = slice.actions

export const userSettingsReducer = slice.reducer
