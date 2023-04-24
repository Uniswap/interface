import { createSlice, PayloadAction } from '@reduxjs/toolkit'

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
})

export const { setRequiredForAppAccess, setRequiredForTransactions, resetSettings } = slice.actions

export const biometricSettingsReducer = slice.reducer
