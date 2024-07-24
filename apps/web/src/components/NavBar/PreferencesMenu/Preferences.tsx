import { PreferencesHeader } from 'components/NavBar/PreferencesMenu/Header'
import { PreferencesView } from 'components/NavBar/PreferencesMenu/shared'
import { LOCALE_LABEL } from 'constants/locales'
import { useActiveLocalCurrency } from 'hooks/useActiveLocalCurrency'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { Trans, t } from 'i18n'
import styled, { useTheme } from 'lib/styled-components'
import { ChevronRight } from 'react-feather'
import { ThemeSelector } from 'theme/components/ThemeToggle'
import { Text } from 'ui/src'

const Pref = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0px;
  gap: 12px;
`
const StyledChevron = styled(ChevronRight)`
  opacity: 0.8;
`
const SelectButtonContainer = styled.div`
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
  const theme = useTheme()
  return (
    <SelectButtonContainer onClick={onClick}>
      <Text variant="buttonLabel3" color="$neutral1">
        {label}
      </Text>
      <StyledChevron size={24} color={theme.neutral1} />
    </SelectButtonContainer>
  )
}

type SettingItem = {
  label: string
  component: JSX.Element
}

export function PreferenceSettings({
  setSettingsView,
  showHeader = true,
}: {
  setSettingsView: (view: PreferencesView) => void
  showHeader?: boolean
}) {
  const activeLocalCurrency = useActiveLocalCurrency()
  const activeLocale = useActiveLocale()

  const items: SettingItem[] = [
    {
      label: t('themeToggle.theme'),
      component: <ThemeSelector compact />,
    },
    {
      label: t('common.language'),
      component: (
        <SelectButton label={LOCALE_LABEL[activeLocale]} onClick={() => setSettingsView(PreferencesView.LANGUAGE)} />
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

      {items.map(({ label, component }, index) => (
        <Pref key={`${label}_${index}`}>
          <Text variant="body2" color="$neutral2" textAlign="left">
            {label}
          </Text>
          {component}
        </Pref>
      ))}
    </>
  )
}
