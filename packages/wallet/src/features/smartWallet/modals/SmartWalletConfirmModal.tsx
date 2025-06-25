import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { ExcludedNetworkBanner } from 'uniswap/src/components/banners/ExcludedNetworkBanner'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isExtension, isMobileApp } from 'utilities/src/platform'
import { NetworkInfo } from 'wallet/src/features/smartWallet/InsufficientFundsNetworkRow'
import { AddressFooter } from 'wallet/src/features/transactions/TransactionRequest/AddressFooter'
import { NetworkFeeFooter } from 'wallet/src/features/transactions/TransactionRequest/NetworkFeeFooter'

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
  networkBalances: NetworkInfo[]
  inProgress?: boolean
  walletAddress: string
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
  networkBalances,
  inProgress,
  walletAddress,
}: SmartWalletConfirmModalProps): JSX.Element {
  const { t } = useTranslation()
  const chainIds = networkBalances.filter((network) => !network.hasSufficientFunds).map((network) => network.chainId)

  const totalGasFee = networkBalances
    .reduce((acc, network) => acc + BigInt(network.gasFee.displayValue ?? '0'), BigInt(0))
    .toString()

  const multipleNetworks = networkBalances.length > 1
  const logoOverrideChainId = !multipleNetworks ? networkBalances[0]?.chainId : undefined

  return (
    <Modal name={ModalName.SmartWalletConfirmModal} isModalOpen={isOpen} alignment="top" onClose={onClose}>
      <Flex px={isExtension ? '$none' : '$spacing12'} pt="$spacing12" gap="$spacing8">
        <Flex alignItems={isExtension ? 'flex-start' : 'center'} pb="$gap24">
          <Flex
            backgroundColor="$surface3"
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

        {chainIds.length > 0 && (
          <Flex px={isMobileApp ? '$spacing24' : undefined} pb="$spacing16">
            <ExcludedNetworkBanner chainIds={chainIds} />
          </Flex>
        )}

        <Flex gap="$spacing12" pb="$spacing16" px={isMobileApp ? '$spacing24' : undefined}>
          <NetworkFeeFooter
            showNetworkLogo
            chainId={UniverseChainId.Mainnet}
            gasFee={{ displayValue: totalGasFee, isLoading: false, error: null }}
            showAllNetworks={multipleNetworks}
            logoOverrideChainId={logoOverrideChainId}
          />
          <AddressFooter activeAccountAddress={walletAddress} px="$spacing8" />
        </Flex>
        <Flex
          row
          backgroundColor="$surface1"
          gap={isMobileApp ? '$spacing8' : '$spacing12'}
          pb={isMobileApp ? spacing.spacing12 : undefined}
          px={isMobileApp ? '$spacing12' : undefined}
        >
          {!inProgress && (
            <Button size="medium" testID={TestID.Cancel} emphasis="secondary" onPress={onCancel}>
              {t('common.button.cancel')}
            </Button>
          )}
          <Button
            variant="default"
            isDisabled={!confirmationEnabled}
            size="medium"
            testID={TestID.Confirm}
            loading={inProgress}
            onPress={onConfirm}
          >
            {t('common.button.confirm')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
