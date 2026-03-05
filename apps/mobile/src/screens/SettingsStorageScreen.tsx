import { useTranslation } from 'react-i18next'
import { ScreenWithHeader } from 'src/components/layout/screens/ScreenWithHeader'
import { useAppStateResetter } from 'src/features/appState/appStateResetter'
import { Flex, Text } from 'ui/src'
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
    <ScreenWithHeader
      centerElement={<Text variant="subheading1">{t('settings.setting.storage.title')}</Text>}
      rightElement={<StorageHelpIcon />}
    >
      <Flex fill px="$spacing24" py="$spacing8">
        <StorageSettingsContent
          onPressClearAccountHistory={onPressClearAccountHistory}
          onPressClearUserSettings={onPressClearUserSettings}
          onPressClearCachedData={onPressClearCachedData}
          onPressClearAllData={onPressClearAllData}
        />
      </Flex>
    </ScreenWithHeader>
  )
}
