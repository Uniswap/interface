import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { Wrench } from 'ui/src/components/icons'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { InfoLinkModal } from 'wallet/src/components/modals/InfoLinkModal'

type TestnetModeModalProps = {
  isOpen: boolean
  onClose: () => void
  unsupported?: boolean
  descriptionCopy?: string
}

export function TestnetModeModal({
  isOpen,
  onClose,
  descriptionCopy,
  unsupported = false,
}: TestnetModeModalProps): JSX.Element {
  const { t } = useTranslation()
  return (
    <InfoLinkModal
      title={unsupported ? t('common.notSupported') : t('settings.setting.wallet.testnetMode.title')}
      description={
        descriptionCopy ?? unsupported ? t('testnet.unsupported') : t('settings.setting.wallet.testnetMode.description')
      }
      isOpen={isOpen}
      buttonText={t('common.button.close')}
      buttonTheme="secondary"
      name={ModalName.TestnetMode}
      icon={
        <Flex centered backgroundColor="$surface3" borderRadius="$rounded12" p="$spacing12">
          <Wrench color="$neutral1" size="$icon.24" />
        </Flex>
      }
      onDismiss={onClose}
      onButtonPress={onClose}
    />
  )
}
