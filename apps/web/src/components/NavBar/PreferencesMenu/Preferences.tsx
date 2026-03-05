import { useTranslation } from 'react-i18next'
import { ColorTokens, Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { ThemeToggle } from 'uniswap/src/components/appearance/ThemeToggle'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLanguage, useLanguageInfo } from 'uniswap/src/features/language/hooks'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { PreferencesHeader } from '~/components/NavBar/PreferencesMenu/Header'
import { PreferencesView } from '~/components/NavBar/PreferencesMenu/shared'

function SelectButton({ label, onClick }: { label: string; onClick?: () => void }) {
  const color = useSporeColors()
  return (
    <TouchableArea row alignItems="center" gap="$gap4" onPress={onClick}>
      <Text variant="buttonLabel2" color="$neutral1">
        {label}
      </Text>
      <RotatableChevron direction="right" size="$icon.24" color={color.neutral1.get() as ColorTokens} opacity={0.8} />
    </TouchableArea>
  )
}

type SettingItem = {
  label?: string
  component: JSX.Element
}

export function PreferenceSettings({
  setSettingsView,
  showHeader = true,
}: {
  setSettingsView: (view: PreferencesView) => void
  showHeader?: boolean
  showThemeLabel?: boolean
}) {
  const { t } = useTranslation()
  const activeLocalCurrency = useAppFiatCurrency()
  const activeLanguage = useCurrentLanguage()
  const languageInfo = useLanguageInfo(activeLanguage)

  const items: SettingItem[] = [
    {
      label: t('settings.setting.appearance.title'),
      component: (
        <Trace logPress element={ElementName.NavbarPreferencesTheme}>
          <ThemeToggle />
        </Trace>
      ),
    },
    {
      label: t('common.language'),
      component: (
        <Trace logPress element={ElementName.NavbarPreferencesLanguage}>
          <SelectButton label={languageInfo.displayName} onClick={() => setSettingsView(PreferencesView.LANGUAGE)} />
        </Trace>
      ),
    },
    {
      label: t('common.currency'),
      component: (
        <Trace logPress element={ElementName.NavbarPreferencesCurrency}>
          <SelectButton label={activeLocalCurrency} onClick={() => setSettingsView(PreferencesView.CURRENCY)} />
        </Trace>
      ),
    },
  ]

  return (
    <>
      {showHeader && <PreferencesHeader>{t('globalPreferences.title')}</PreferencesHeader>}

      <Flex gap="$gap12">
        {items.map(({ label, component }, index) => (
          <Flex
            row
            width="100%"
            justifyContent="space-between"
            alignItems="center"
            gap="$gap12"
            key={`${label}_${index}`}
          >
            {label && (
              <Text variant="body2" color="$neutral2" textAlign="left">
                {label}
              </Text>
            )}
            {component}
          </Flex>
        ))}
      </Flex>
    </>
  )
}
