import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export enum AppearanceSettingType {
  System = 'system',
  Light = 'light',
  Dark = 'dark',
}

export interface AppearanceSettingsState {
  selectedAppearanceSettings: AppearanceSettingType
}

export const initialAppearanceSettingsState: AppearanceSettingsState = {
  selectedAppearanceSettings: AppearanceSettingType.System,
}

const slice = createSlice({
  name: 'appearanceSettings',
  initialState: initialAppearanceSettingsState,
  reducers: {
    setSelectedAppearanceSettings: (state, action: PayloadAction<AppearanceSettingType>) => {
      state.selectedAppearanceSettings = action.payload
    },
    resetSettings: () => initialAppearanceSettingsState,
  },
})

export const { setSelectedAppearanceSettings, resetSettings } = slice.actions

export const appearanceSettingsReducer = slice.reducer
