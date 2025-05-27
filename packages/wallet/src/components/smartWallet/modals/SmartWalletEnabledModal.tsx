import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { SmartWalletModal } from 'uniswap/src/features/smartWallet/modals/SmartWalletModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

interface SmartWalletEnabledModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SmartWalletEnabledModal({ isOpen, onClose }: SmartWalletEnabledModalProps): JSX.Element {
  const { t } = useTranslation()
  return (
    <SmartWalletModal
      isOpen={isOpen}
      icon={
        <Flex
          backgroundColor="$statusSuccess2"
          borderRadius="$rounded12"
          height="$spacing48"
          width="$spacing48"
          alignItems="center"
          justifyContent="center"
          mb="$spacing4"
        >
          <CheckCircleFilled color="$statusSuccess" size="$icon.24" />
        </Flex>
      }
      title={t('smartWallets.enabledModal.title')}
      subtext={t('smartWallets.enabledModal.description')}
      modalName={ModalName.SmartWalletEnabledModal}
      primaryButtonText={t('common.done')}
      primaryButtonVariant="default"
      primaryButtonEmphasis="secondary"
      primaryButtonOnClick={onClose}
      onClose={onClose}
    />
  )
}
