import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { zIndexes } from 'ui/src/theme'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SmartWalletModal } from 'wallet/src/components/smartWallet/modals/SmartWalletModal'

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
      isDismissible
      isOpen={isOpen}
      icon={<CheckCircleFilled color="$statusSuccess" size="$icon.24" />}
      iconBackgroundColor="$statusSuccess2"
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
      primaryButton={{ text: t('common.done'), onClick: onClose, variant: 'default', emphasis: 'secondary' }}
      zIndex={zIndexes.popover}
      onClose={onClose}
    />
  )
}
