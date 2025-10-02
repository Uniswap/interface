import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useSporeColors } from 'ui/src'
import { SmartWallet } from 'ui/src/components/icons'
import { ExcludedNetworkBanner } from 'uniswap/src/components/banners/ExcludedNetworkBanner'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isExtensionApp } from 'utilities/src/platform'
import { SmartWalletModal } from 'wallet/src/components/smartWallet/modals/SmartWalletModal'
import { NetworkInfo } from 'wallet/src/features/smartWallet/InsufficientFundsNetworkRow'
import { RemoveDelegationTotalFee } from 'wallet/src/features/smartWallet/RemoveDelegationTotalFee'
import { AddressFooter } from 'wallet/src/features/transactions/TransactionRequest/AddressFooter'

/**
 * Props for the SmartWalletConfirmModal component.
 * Includes `networkFeeFooter` for mobile platforms (WalletConnect SignRequest/TransactionRequest),
 * omitted in extension for platform-specific rendering.
 */
type SmartWalletConfirmModalProps = {
  isOpen: boolean
  onCancel?: () => void
  onConfirm: () => void
  onClose: () => void
  networkBalances: NetworkInfo[]
  inProgress?: boolean
  walletAddress: string
  isDismissible?: boolean
  hasError?: boolean
}

export function SmartWalletConfirmModal({
  isOpen,
  onCancel,
  onConfirm,
  onClose,
  networkBalances,
  inProgress,
  walletAddress,
  isDismissible,
  hasError,
}: SmartWalletConfirmModalProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const chainIds = networkBalances.filter((network) => !network.hasSufficientFunds).map((network) => network.chainId)

  const [isGasFeesLoading, setIsGasFeesLoading] = useState(false)

  const gasFees = useMemo(
    () =>
      networkBalances.map((network) => ({
        chainId: network.chainId,
        gasFeeDisplayValue: network.gasFee.displayValue,
      })),
    [networkBalances],
  )

  return (
    <SmartWalletModal
      horizontalButtons
      horizontalAlignment={isExtensionApp ? 'left' : 'center'}
      isOpen={isOpen}
      icon={<SmartWallet color={colors.neutral1.val} size="$icon.24" />}
      iconBackgroundColor="$surface3"
      title={t('smartWallets.disable.modal.title')}
      subtext={t('smartWallets.disable.modal.description')}
      modalName={ModalName.SmartWalletConfirmModal}
      primaryButtonText={!inProgress ? t('common.button.confirm') : t('common.button.disabling')}
      primaryButtonOnClick={onConfirm}
      primaryButtonVariant="default"
      primaryButtonDisabled={isGasFeesLoading}
      primaryButtonLoading={inProgress}
      secondaryButtonText={!inProgress ? t('common.button.cancel') : undefined}
      secondaryButtonOnClick={onCancel}
      alignment="top"
      isDismissible={isDismissible}
      onClose={onClose}
    >
      <Flex flexDirection="column" gap="$spacing12" flex={1}>
        {chainIds.length > 0 && (
          <Flex pb="$spacing12">
            <ExcludedNetworkBanner chainIds={chainIds} />
          </Flex>
        )}
        <RemoveDelegationTotalFee gasFees={gasFees} setIsLoading={setIsGasFeesLoading} />
        <AddressFooter activeAccountAddress={walletAddress} />
        {hasError && (
          <Text
            variant={isExtensionApp ? 'body4' : 'body3'}
            color="$statusCritical"
            textAlign={isExtensionApp ? 'left' : 'center'}
          >
            {t('smartWallets.disable.failed')}
          </Text>
        )}
      </Flex>
    </SmartWalletModal>
  )
}
