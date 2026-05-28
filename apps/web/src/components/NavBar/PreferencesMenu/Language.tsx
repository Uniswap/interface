import { useTranslation } from 'react-i18next'
import { LanguageMenuItems } from '~/components/AccountDrawer/LanguageMenu'
import { PreferencesHeader } from '~/components/NavBar/PreferencesMenu/Header'
import { SettingsColumn } from '~/components/NavBar/PreferencesMenu/shared'

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
