import { PreferencesHeader } from 'components/NavBar/PreferencesMenu/Header'
import { Views } from 'components/NavBar/PreferencesMenu/shared'
import { Trans, t } from 'i18n'
import { ChevronRight } from 'react-feather'
import styled, { useTheme } from 'styled-components'
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
  setSettingsView: (view: Views) => void
  showHeader?: boolean
}) {
  const items: SettingItem[] = [
    {
      label: t('themeToggle.theme'),
      component: <ThemeSelector compact />,
    },
    {
      label: t('common.language'),
      component: <SelectButton label="English" onClick={() => setSettingsView(Views.LANGUAGE)} />,
    },
    {
      label: t('common.currency'),
      component: <SelectButton label="USD" onClick={() => setSettingsView(Views.CURRENCY)} />,
    },
  ]

  return (
    <>
      {showHeader && (
        <PreferencesHeader>
          <Trans i18nKey="common.preferences" />
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
