import { useTranslation } from 'react-i18next'
import { LocalCurrencyMenuItems } from '~/components/AccountDrawer/LocalCurrencyMenu'
import { PreferencesHeader } from '~/components/NavBar/PreferencesMenu/Header'
import { SettingsColumn } from '~/components/NavBar/PreferencesMenu/shared'

export function CurrencySettings({ onExitMenu }: { onExitMenu: () => void }) {
  const { t } = useTranslation()
  return (
    <>
      <PreferencesHeader onExitMenu={onExitMenu}>{t('common.currency')}</PreferencesHeader>
      <SettingsColumn>
        <LocalCurrencyMenuItems />
      </SettingsColumn>
    </>
  )
}
