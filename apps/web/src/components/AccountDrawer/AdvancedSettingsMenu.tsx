import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { SettingsButton } from '~/components/AccountDrawer/SettingsButton'
import { SlideOutMenu } from '~/components/AccountDrawer/SlideOutMenu'
import { TestnetsToggle } from '~/components/AccountDrawer/TestnetsToggle'

export function AdvancedSettingsMenu({
  onClose,
  openStorageSettings,
}: {
  onClose: () => void
  openStorageSettings: () => void
}) {
  const { t } = useTranslation()

  return (
    <SlideOutMenu title={t('settings.setting.advanced.title')} onClose={onClose}>
      <Flex gap="$gap12" pt="$padding8">
        <SettingsButton title={t('settings.setting.storage.title')} onClick={openStorageSettings} />
        <TestnetsToggle />
      </Flex>
    </SlideOutMenu>
  )
}
