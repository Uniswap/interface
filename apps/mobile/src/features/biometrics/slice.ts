import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { setFinishedOnboarding } from 'wallet/src/features/wallet/slice'

export enum BiometricSettingType {
  RequiredForAppAccess,
  RequiredForTransactions,
}

export interface BiometricSettingsState {
  requiredForAppAccess: boolean
  requiredForTransactions: boolean
}

export const initialBiometricsSettingsState: BiometricSettingsState = {
  requiredForAppAccess: false,
  requiredForTransactions: false,
}

const slice = createSlice({
  name: 'biometricSettings',
  initialState: initialBiometricsSettingsState,
  reducers: {
    setRequiredForAppAccess: (state, action: PayloadAction<boolean>) => {
      state.requiredForAppAccess = action.payload
    },
    setRequiredForTransactions: (state, action: PayloadAction<boolean>) => {
      state.requiredForTransactions = action.payload
    },
    resetSettings: () => initialBiometricsSettingsState,
  },
  extraReducers: (builder) => {
    builder.addCase(setFinishedOnboarding, (state, action) => {
      // disable biometrics if user has no wallets
      if (!action.payload.finishedOnboarding) {
        state.requiredForAppAccess = false
        state.requiredForTransactions = false
      }
    })
  },
})

export const { setRequiredForAppAccess, setRequiredForTransactions, resetSettings } = slice.actions

export const biometricSettingsReducer = slice.reducer
