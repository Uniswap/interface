import { PreferencesHeader } from 'components/NavBar/PreferencesMenu/Header'
import { PreferencesView } from 'components/NavBar/PreferencesMenu/shared'
import { deprecatedStyled } from 'lib/styled-components'
import { ChevronRight } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { ThemeSelector } from 'theme/components/ThemeToggle'
import { Flex, Text, useSporeColors } from 'ui/src'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLanguage, useLanguageInfo } from 'uniswap/src/features/language/hooks'

const Pref = deprecatedStyled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`
const StyledChevron = deprecatedStyled(ChevronRight)`
  opacity: 0.8;
`
const SelectButtonContainer = deprecatedStyled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  width: 100%;
  justify-content: end;
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.6;
  }
`

function SelectButton({ label, onClick }: { label: string; onClick?: () => void }) {
  const colors = useSporeColors()
  return (
    <SelectButtonContainer onClick={onClick}>
      <Text variant="buttonLabel2" color="$neutral1">
        {label}
      </Text>
      <StyledChevron size={24} color={colors.neutral1.val} />
    </SelectButtonContainer>
  )
}

type SettingItem = {
  label?: string
  component: JSX.Element
}

export function PreferenceSettings({
  setSettingsView,
  showHeader = true,
  showThemeLabel = true,
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
      label: showThemeLabel ? t('themeToggle.theme') : undefined,
      component: <ThemeSelector compact fullWidth={!showThemeLabel} />,
    },
    {
      label: t('common.language'),
      component: (
        <SelectButton label={languageInfo.displayName} onClick={() => setSettingsView(PreferencesView.LANGUAGE)} />
      ),
    },
    {
      label: t('common.currency'),
      component: <SelectButton label={activeLocalCurrency} onClick={() => setSettingsView(PreferencesView.CURRENCY)} />,
    },
  ]

  return (
    <>
      {showHeader && (
        <PreferencesHeader>
          <Trans i18nKey="globalPreferences.title" />
        </PreferencesHeader>
      )}

      <Flex gap="$gap12">
        {items.map(({ label, component }, index) => (
          <Pref key={`${label}_${index}`}>
            {label && (
              <Text variant="body2" color="$neutral2" textAlign="left">
                {label}
              </Text>
            )}
            {component}
          </Pref>
        ))}
      </Flex>
    </>
  )
}
