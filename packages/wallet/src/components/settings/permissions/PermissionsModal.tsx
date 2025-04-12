import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isExtension } from 'utilities/src/platform'
import { AnalyticsToggleLineSwitch } from 'wallet/src/components/settings/AnalyticsToggleLineSwitch'
import { DefaultWalletLineSwitch } from 'wallet/src/components/settings/permissions/DefaultWalletLineSwitch'

type PermissionsModalProps = {
  onClose: () => void
  handleDefaultBrowserToggle?: (isChecked: boolean) => void
  isDefaultBrowserProvider?: boolean
}

export function PermissionsModal({
  onClose,
  handleDefaultBrowserToggle,
  isDefaultBrowserProvider,
}: PermissionsModalProps): JSX.Element {
  const { t } = useTranslation()

  const handleBrowserToggle = async (isChecked: boolean): Promise<void> => {
    setIsDefaultProvider(!!isChecked)
    if (handleDefaultBrowserToggle) {
      handleDefaultBrowserToggle(isChecked)
    }
  }

  const [isDefaultProvider, setIsDefaultProvider] = useState(isDefaultBrowserProvider || false)

  return (
    <Modal name={ModalName.PermissionsModal} onClose={onClose}>
      <Flex
        animation="fast"
        gap="$spacing16"
        pb={isExtension ? undefined : '$spacing60'}
        py={isExtension ? '$spacing16' : undefined}
        px={isExtension ? '$spacing12' : '$spacing24'}
        width="100%"
      >
        <Flex centered>
          <Text color="$neutral1" variant="subheading1">
            {t('settings.setting.permissions.title')}
          </Text>
        </Flex>

        <AnalyticsToggleLineSwitch />

        {isExtension && (
          <DefaultWalletLineSwitch
            title={t('extension.settings.defaultWallet.title')}
            description={t('extension.settings.defaultWallet.message')}
            isChecked={isDefaultProvider}
            onCheckedChange={handleBrowserToggle}
          />
        )}
      </Flex>
    </Modal>
  )
}
