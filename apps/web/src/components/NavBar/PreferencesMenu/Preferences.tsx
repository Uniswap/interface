import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { useTranslation } from 'react-i18next'
import { Switch } from 'ui/src'
import { ThemeToggle } from 'uniswap/src/components/appearance/ThemeToggle'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLanguage, useLanguageInfo } from 'uniswap/src/features/language/hooks'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { PreferencesHeader } from '~/components/NavBar/PreferencesMenu/Header'
import { PreferencesView } from '~/components/NavBar/PreferencesMenu/shared'
import {
  AnalyticsInfoTooltip,
  ShareDeviceIdentifiersInfoTooltip,
  useAllowAnalyticsSetting,
  useShareDeviceIdentifiersSetting,
} from '~/components/PrivacyChoices/PrivacySettings'

function SelectButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <TouchableArea row alignItems="center" gap="$gap4" py="$spacing8" onPress={onClick}>
      <Text variant="body3" color="$neutral2">
        {label}
      </Text>
      <RotatableChevron direction="right" size="$icon.24" color="$neutral3" />
    </TouchableArea>
  )
}

type SettingItem = {
  label?: string
  info?: JSX.Element
  component: JSX.Element
  minHeight?: number
}

export function PreferenceSettings({
  setSettingsView,
  closeMenu,
  showHeader = true,
}: {
  setSettingsView: (view: PreferencesView) => void
  closeMenu: () => void
  showHeader?: boolean
  showThemeLabel?: boolean
}) {
  const { t } = useTranslation()
  const activeLocalCurrency = useAppFiatCurrency()
  const activeLanguage = useCurrentLanguage()
  const languageInfo = useLanguageInfo(activeLanguage)
  const { allowAnalytics, toggleAllowAnalytics } = useAllowAnalyticsSetting()
  const { shareDeviceIdentifiers, toggleShareDeviceIdentifiers } = useShareDeviceIdentifiersSetting()

  const items: SettingItem[] = [
    {
      label: t('settings.setting.appearance.title'),
      // The shared ThemeToggle is 32px; the spec reserves a 36px row for it.
      minHeight: 36,
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
    {
      label: t('analytics.allow'),
      info: <AnalyticsInfoTooltip />,
      minHeight: 40,
      component: <Switch variant="branded" checked={allowAnalytics} onCheckedChange={toggleAllowAnalytics} />,
    },
    {
      label: t('settings.setting.shareDeviceIdentifiers.title'),
      info: <ShareDeviceIdentifiersInfoTooltip onLearnMore={closeMenu} />,
      minHeight: 40,
      component: (
        <Switch variant="branded" checked={shareDeviceIdentifiers} onCheckedChange={toggleShareDeviceIdentifiers} />
      ),
    },
  ]

  return (
    <>
      {showHeader && <PreferencesHeader>{t('globalPreferences.title')}</PreferencesHeader>}

      <Flex gap="$gap12" mt="$spacing16" pr="$spacing12">
        {items.map(({ label, info, component, minHeight }, index) => (
          <Flex
            row
            width="100%"
            justifyContent="space-between"
            alignItems="center"
            gap="$gap12"
            minHeight={minHeight}
            key={`${label}_${index}`}
          >
            {label && (
              <Flex row gap="$gap4" alignItems="center">
                <Text variant="body3" color="$neutral1" textAlign="left">
                  {label}
                </Text>
                {info}
              </Flex>
            )}
            {component}
          </Flex>
        ))}
      </Flex>
    </>
  )
}
