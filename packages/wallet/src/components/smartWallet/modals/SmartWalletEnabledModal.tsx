import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { zIndexes } from 'ui/src/theme'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SmartWalletModal } from 'wallet/src/features/smartWallet/modals/SmartWalletModal'

interface SmartWalletEnabledModalProps {
  isOpen: boolean
  onClose: () => void
  showReconnectDappPrompt?: boolean
}

export type SmartWalletEnabledModalState = Omit<SmartWalletEnabledModalProps, 'onClose' | 'isOpen'>

export function SmartWalletEnabledModal({
  isOpen,
  onClose,
  showReconnectDappPrompt,
}: SmartWalletEnabledModalProps): JSX.Element {
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
      subtext={
        <Flex gap="$gap8">
          <Text variant="body3" color="$neutral2" textAlign="center">
            {showReconnectDappPrompt
              ? t('smartWallets.enabledModal.description.dapp')
              : t('smartWallets.enabledModal.description')}
          </Text>
          {showReconnectDappPrompt && (
            <Text variant="body3" color="$neutral2" textAlign="center">
              {t('smartWallets.enabledModal.description.dapp.line2')}
            </Text>
          )}
        </Flex>
      }
      modalName={ModalName.SmartWalletEnabledModal}
      primaryButtonText={t('common.done')}
      primaryButtonVariant="default"
      primaryButtonEmphasis="secondary"
      primaryButtonOnClick={onClose}
      zIndex={zIndexes.popover}
      onClose={onClose}
    />
  )
}
