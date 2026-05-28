import { useTranslation } from 'react-i18next'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { useAppStateResetter } from 'src/store/appStateResetter'
import { Flex } from 'ui/src'
import { StorageHelpIcon, StorageSettingsContent } from 'uniswap/src/features/settings/storage/StorageSettingsContent'
import { useEvent } from 'utilities/src/react/hooks'

export function SettingsStorageScreen(): JSX.Element {
  const { t } = useTranslation()

  const appStateResetter = useAppStateResetter()
  const onPressClearAccountHistory = useEvent(() => appStateResetter.resetAccountHistory())
  const onPressClearUserSettings = useEvent(() => appStateResetter.resetUserSettings())
  const onPressClearCachedData = useEvent(() => appStateResetter.resetQueryCaches())
  const onPressClearAllData = useEvent(() => appStateResetter.resetAll())

  return (
    <Flex fill gap="$gap16">
      <ScreenHeader title={t('settings.setting.storage.title')} rightColumn={<StorageHelpIcon />} />
      <StorageSettingsContent
        onPressClearAccountHistory={onPressClearAccountHistory}
        onPressClearUserSettings={onPressClearUserSettings}
        onPressClearCachedData={onPressClearCachedData}
        onPressClearAllData={onPressClearAllData}
      />
    </Flex>
  )
}
