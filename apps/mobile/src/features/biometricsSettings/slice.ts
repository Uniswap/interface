import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { setFinishedOnboarding } from 'wallet/src/features/wallet/slice'

export enum BiometricSettingType {
  RequiredForAppAccess = 0,
  RequiredForTransactions = 1,
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

export const { setRequiredForAppAccess, setRequiredForTransactions } = slice.actions

export const biometricSettingsReducer = slice.reducer

export const selectBiometricSettings = (state: { biometricSettings: BiometricSettingsState }): BiometricSettingsState =>
  state.biometricSettings
export const selectRequiredForAppAccess = (state: { biometricSettings: BiometricSettingsState }): boolean =>
  selectBiometricSettings(state).requiredForAppAccess
