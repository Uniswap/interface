import { LocalCurrencyMenuItems } from 'components/AccountDrawer/LocalCurrencyMenu'
import { PreferencesHeader } from 'components/NavBar/PreferencesMenu/Header'
import { SettingsColumn } from 'components/NavBar/PreferencesMenu/shared'
import { Trans } from 'react-i18next'

export function CurrencySettings({ onExitMenu }: { onExitMenu: () => void }) {
  return (
    <>
      <PreferencesHeader onExitMenu={onExitMenu}>
        <Trans i18nKey="common.currency" />
      </PreferencesHeader>
      <SettingsColumn>
        <LocalCurrencyMenuItems />
      </SettingsColumn>
    </>
  )
}
