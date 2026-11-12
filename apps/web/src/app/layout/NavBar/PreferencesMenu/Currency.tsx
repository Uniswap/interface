import { useTranslation } from 'react-i18next'
import { PreferencesHeader } from '~/app/layout/NavBar/PreferencesMenu/Header'
import { SettingsColumn } from '~/app/layout/NavBar/PreferencesMenu/shared'
import { LocalCurrencyMenuItems } from '~/features/wallet/components/AccountDrawer/LocalCurrencyMenu'

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
