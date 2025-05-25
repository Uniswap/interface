import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { ExcludedNetworkBanner } from 'uniswap/src/components/banners/ExcludedNetworkBanner'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isMobileApp } from 'utilities/src/platform'
import { NetworkInfo } from 'wallet/src/features/smartWallet/InsufficientFundsNetworkRow'
import { AddressFooter } from 'wallet/src/features/transactions/TransactionRequest/AddressFooter'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

/**
 * Props for the SmartWalletConfirmModal component.
 * Includes `networkFeeFooter` for mobile platforms (WalletConnect SignRequest/TransactionRequest),
 * omitted in extension for platform-specific rendering.
 */
type SmartWalletConfirmModalProps = {
  confirmationEnabled?: boolean
  icon?: React.ReactNode
  isOpen: boolean
  title?: string
  description?: string
  onCancel?: () => void
  onConfirm?: () => void
  onClose: () => void
  networkFeeFooter?: React.ReactNode
  networkInfo?: NetworkInfo[]
}

export type SmartWalletConfirmModalState = Omit<SmartWalletConfirmModalProps, 'onClose' | 'isOpen'>

export function SmartWalletConfirmModal({
  confirmationEnabled,
  icon,
  isOpen,
  title,
  description,
  onCancel,
  onConfirm,
  onClose,
  networkFeeFooter,
  networkInfo,
}: SmartWalletConfirmModalProps): JSX.Element {
  const { t } = useTranslation()
  const insets = useAppInsets()
  const activeAccount = useActiveAccountWithThrow()
  const chainIds = networkInfo?.map((network) => network.chainId) || []

  return (
    <Modal name={ModalName.SmartWalletConfirmModal} isModalOpen={isOpen} onClose={onClose}>
      <Flex p="$spacing12" gap="$spacing8">
        <Flex alignItems="center" pb="$gap24">
          <Flex
            backgroundColor="$accent2"
            borderRadius="$rounded12"
            height="$spacing48"
            width="$spacing48"
            alignItems="center"
            justifyContent="center"
            mb="$spacing16"
          >
            {icon}
          </Flex>
          <Text variant="subheading2" color="$neutral1" mb="$spacing8">
            {title}
          </Text>
          <Text variant="body3" color="$neutral2">
            {description}
          </Text>
        </Flex>

        {networkInfo && (
          <Flex px="$spacing24" pb="$spacing16">
            <ExcludedNetworkBanner chainIds={chainIds} />
          </Flex>
        )}

        <Flex gap="$spacing12" pb="$spacing16" px={isMobileApp ? '$spacing24' : undefined}>
          {networkFeeFooter}
          <AddressFooter activeAccountAddress={activeAccount.address} px="$spacing8" />
        </Flex>
        <Flex
          row
          backgroundColor="$surface1"
          gap={isMobileApp ? '$spacing8' : '$spacing12'}
          pb={insets.bottom + spacing.spacing12}
          px={isMobileApp ? '$spacing24' : undefined}
        >
          <Button size="large" testID={TestID.Cancel} emphasis="tertiary" onPress={onCancel}>
            {t('common.button.cancel')}
          </Button>

          <Button
            variant="default"
            isDisabled={!confirmationEnabled}
            size="large"
            testID={TestID.Confirm}
            onPress={onConfirm}
          >
            {t('common.button.confirm')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
