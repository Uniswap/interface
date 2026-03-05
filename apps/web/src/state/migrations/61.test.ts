import { AppearanceSettingType } from 'uniswap/src/features/appearance/slice'
import { migration61, PersistAppStateV60, themeSettingAtomName } from '~/state/migrations/61'

const previousState: PersistAppStateV60 = {
  _persist: {
    version: 60,
    rehydrated: true,
  },
}

describe('migration to v61', () => {
  it('should set as system when value is not set', async () => {
    const result: any = migration61(previousState)
    expect(result.appearanceSettings.selectedAppearanceSettings).toEqual(AppearanceSettingType.System)
  })
  it('should set as system when value is auto', async () => {
    localStorage.setItem(themeSettingAtomName, 'auto')
    const result: any = migration61(previousState)
    expect(result.appearanceSettings.selectedAppearanceSettings).toEqual(AppearanceSettingType.System)
  })
  it('should set as system when value is invalid', async () => {
    localStorage.setItem(themeSettingAtomName, 'invalid')
    const result: any = migration61(previousState)
    expect(result.appearanceSettings.selectedAppearanceSettings).toEqual(AppearanceSettingType.System)
  })
  it('should set as light when value is light', async () => {
    localStorage.setItem(themeSettingAtomName, 'light')
    const result: any = migration61(previousState)
    expect(result.appearanceSettings.selectedAppearanceSettings).toEqual(AppearanceSettingType.Light)
  })
  it('should set as dark when value is dark', async () => {
    localStorage.setItem(themeSettingAtomName, 'dark')
    const result: any = migration61(previousState)
    expect(result.appearanceSettings.selectedAppearanceSettings).toEqual(AppearanceSettingType.Dark)
  })
})
