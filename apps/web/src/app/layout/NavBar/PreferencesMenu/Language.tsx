import { useTranslation } from 'react-i18next'
import { PreferencesHeader } from '~/app/layout/NavBar/PreferencesMenu/Header'
import { SettingsColumn } from '~/app/layout/NavBar/PreferencesMenu/shared'
import { LanguageMenuItems } from '~/features/wallet/components/AccountDrawer/LanguageMenu'

export function LanguageSettings({ onExitMenu }: { onExitMenu: () => void }) {
  const { t } = useTranslation()
  return (
    <>
      <PreferencesHeader onExitMenu={onExitMenu}>{t('common.language')}</PreferencesHeader>
      <SettingsColumn>
        <LanguageMenuItems />
      </SettingsColumn>
    </>
  )
}
