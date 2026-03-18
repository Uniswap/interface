import { useTranslation } from 'react-i18next'
import { StorageHelpIcon, StorageSettingsContent } from 'uniswap/src/features/settings/storage/StorageSettingsContent'
import { useEvent } from 'utilities/src/react/hooks'
import { SlideOutMenu } from '~/components/AccountDrawer/SlideOutMenu'
import { useAppStateResetter } from '~/state/reset/appResetter'

export default function StorageMenu({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()

  const appStateResetter = useAppStateResetter()
  const onPressClearAccountHistory = useEvent(() => appStateResetter.resetAccountHistory())
  const onPressClearUserSettings = useEvent(() => appStateResetter.resetUserSettings())
  const onPressClearCachedData = useEvent(() => appStateResetter.resetQueryCaches())
  const onPressClearAllData = useEvent(() => appStateResetter.resetAll())

  return (
    <SlideOutMenu grow title={t('settings.setting.storage.title')} onClose={onClose} rightIcon={<StorageHelpIcon />}>
      <StorageSettingsContent
        onPressClearAccountHistory={onPressClearAccountHistory}
        onPressClearUserSettings={onPressClearUserSettings}
        onPressClearCachedData={onPressClearCachedData}
        onPressClearAllData={onPressClearAllData}
      />
    </SlideOutMenu>
  )
}
