import { LanguageMenuItems } from 'components/AccountDrawer/LanguageMenu'
import { PreferencesHeader } from 'components/NavBar/PreferencesMenu/Header'
import { SettingsColumn } from 'components/NavBar/PreferencesMenu/shared'
import { Trans } from 'react-i18next'

export function LanguageSettings({ onExitMenu }: { onExitMenu: () => void }) {
  return (
    <>
      <PreferencesHeader onExitMenu={onExitMenu}>
        <Trans i18nKey="common.language" />
      </PreferencesHeader>
      <SettingsColumn>
        <LanguageMenuItems />
      </SettingsColumn>
    </>
  )
}
