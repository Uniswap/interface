import { processSections } from 'src/components/Settings/lists/SettingsList'
import { SettingsSection } from 'src/components/Settings/SettingsRow'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

const icon = <></>

function buildSections(label: (text: string) => string, { hideCurrency = false } = {}): SettingsSection[] {
  return [
    {
      subTitle: label('Preferences'),
      data: [
        {
          navigationModal: ModalName.SettingsAppearance,
          text: label('Theme'),
          currentSetting: label('Device'),
          icon,
        },
        {
          navigationModal: ModalName.FiatCurrencySelector,
          text: label('Local currency'),
          currentSetting: 'USD',
          icon,
          isHidden: hideCurrency,
        },
        {
          navigationModal: ModalName.LanguageSelector,
          text: label('Language'),
          currentSetting: label('English'),
          icon,
        },
        { screen: MobileScreens.SettingsNotifications, text: label('Notifications'), icon },
        { text: label('Haptic touch'), icon, isToggleEnabled: true, onToggle: (): void => {} },
        { text: label('Testnet mode'), icon, isToggleEnabled: false, onToggle: (): void => {} },
      ],
    },
    {
      subTitle: label('Security'),
      data: [
        { screen: MobileScreens.SettingsViewSeedPhrase, text: label('Recovery phrase'), icon, testID: 'recovery' },
      ],
    },
  ]
}

const english = (key: string): string => key
const french = (key: string): string => `fr:${key}`

function itemKeys(sections: SettingsSection[]): string[] {
  return processSections(sections, { hasSectionHeader: true, hasSectionFooter: false })
    .filter((row) => row.type === 'item')
    .map((row) => row.key)
}

describe(processSections, () => {
  it('keeps every row key stable when the language changes', () => {
    expect(itemKeys(buildSections(french))).toEqual(itemKeys(buildSections(english)))
  })

  it('keys rows by non-translated identifiers', () => {
    // Literal expected keys, deliberately not derived from rowKey.
    expect(itemKeys(buildSections(english))).toEqual([
      'section-0-appearance-settings-modal-0',
      'section-0-fiat-currency-selector-1',
      'section-0-language-selector-modal-2',
      'section-0-SettingsNotifications-3',
      'section-0-row-4',
      'section-0-row-5',
      'section-1-recovery-0',
    ])
  })

  it('does not re-key the remaining rows when a sibling is hidden', () => {
    const keys = itemKeys(buildSections(english, { hideCurrency: true }))
    expect(keys).not.toContain('section-0-fiat-currency-selector-1')
    expect(keys).toContain('section-0-language-selector-modal-2')
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('emits no rows for a hidden section', () => {
    const sections = buildSections(english)
    sections[1] = { ...sections[1], data: sections[1]?.data ?? [], isHidden: true }
    expect(itemKeys(sections)).not.toContain('section-1-recovery-0')
  })
})
