import { PersistState } from 'redux-persist'
import { AppearanceSettingType } from 'uniswap/src/features/appearance/slice'

export type PersistAppStateV60 = {
  _persist: PersistState
}

export const themeSettingAtomName = 'interface_color_theme'

const themeAtomToEnumMapping: Record<string, AppearanceSettingType | undefined> = {
  auto: AppearanceSettingType.System,
  light: AppearanceSettingType.Light,
  dark: AppearanceSettingType.Dark,
}

/**
 * Migrate existing setting atom for theme to shared redux
 */
export const migration61 = (state: PersistAppStateV60 | undefined) => {
  if (!state) {
    return undefined
  }

  // Translate existing atom value
  const atomLocalThemeSettingValue = localStorage.getItem(themeSettingAtomName) as string
  const migratedThemeSetting: AppearanceSettingType =
    themeAtomToEnumMapping[atomLocalThemeSettingValue] || AppearanceSettingType.System

  // Add migrated value to the existing state
  const newState: any = {
    ...state,
    appearanceSettings: {
      selectedAppearanceSettings: migratedThemeSetting,
    },
  }

  // Remove the atom locally
  localStorage.removeItem(themeSettingAtomName)

  return { ...newState, _persist: { ...state._persist, version: 61 } }
}
