import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { Flex, Loader, Separator } from 'ui/src'
import { InsufficientGas } from 'ui/src/components/icons'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { SmartWalletModal } from 'wallet/src/components/smartWallet/modals/SmartWalletModal'
import { useSmartWalletChains } from 'wallet/src/features/smartWallet/hooks/useSmartWalletChains'
import { InsufficientFundsNetworkRow, NetworkInfo } from 'wallet/src/features/smartWallet/InsufficientFundsNetworkRow'
import { useWalletDelegationContext } from 'wallet/src/features/smartWallet/WalletDelegationProvider'

const maxHeightList = 300

export type SmartWalletActionRequiredModalProps = {
  isOpen: boolean
  isDisabled?: boolean
  onClose: () => void
  onConfirm?: () => void
  onReactivate?: () => void
  networkBalances: NetworkInfo[]
  walletAddress: Address
}

const renderItem = ({ item, index }: { item: NetworkInfo; index: number }): JSX.Element => (
  <InsufficientFundsNetworkRow key={`${index}`} networkInfo={item} />
)

const renderItemSeparator = (): JSX.Element => <Separator my="$spacing8" />

export function SmartWalletActionRequiredModal({
  isOpen,
  onClose,
  onConfirm,
  onReactivate,
  networkBalances,
  walletAddress,
}: SmartWalletActionRequiredModalProps): JSX.Element | null {
  const { t } = useTranslation()

  const enabledChains = useSmartWalletChains()
  const { getDelegationDetails } = useWalletDelegationContext()

  const delegatedChainsCount = enabledChains.filter(
    (chainId) => getDelegationDetails(walletAddress, chainId)?.isWalletDelegatedToUniswap,
  ).length

  const onConfirmCallback = useEvent(() => {
    onConfirm?.()
  })

  const onReactivateCallback = useEvent(() => {
    onReactivate?.()
  })

  const sortedData = [...networkBalances].sort((a, b) => Number(a.hasSufficientFunds) - Number(b.hasSufficientFunds))
  const sufficientFundsCount = sortedData.filter((chain) => chain.hasSufficientFunds).length
  const canContinue = sufficientFundsCount > 0

  const isLoading = sortedData.length === 0

  const ctaButtonText = isLoading
    ? undefined
    : sufficientFundsCount === 0
      ? t('smartWallet.actionRequired.insufficientFunds')
      : sufficientFundsCount > 1
        ? t('smartWallet.actionRequired.cta.plural', { amount: sufficientFundsCount })
        : t('smartWallet.actionRequired.cta')

  const title = isLoading
    ? t('smartWallet.actionRequired.title')
    : sortedData.length > 1
      ? t('smartWallet.actionRequired.title.plural', { amount: sortedData.length })
      : t('smartWallet.actionRequired.title')

  return (
    <SmartWalletModal
      isOpen={isOpen}
      icon={<InsufficientGas size="$icon.24" />}
      iconBackgroundColor="$statusCritical2"
      title={title}
      titleIsLoading={isLoading}
      titleLoadingPlaceholderText={t('smartWallet.actionRequired.title')}
      subtext={t('smartWallet.actionRequired.description')}
      modalName={ModalName.SmartWalletActionRequiredModal}
      primaryButton={{
        text: ctaButtonText || '',
        onClick: onConfirmCallback,
        variant: 'default',
        disabled: !canContinue || isLoading,
        loading: isLoading,
      }}
      secondaryButton={{
        text: t('smartWallet.actionRequired.reactivate'),
        onClick: onReactivateCallback,
        emphasis: 'text-only',
      }}
      alignment="top"
      onClose={onClose}
    >
      <Flex maxHeight={maxHeightList} flex={1}>
        {isLoading && <Loader.InsufficientFundsNetworkRow repeat={delegatedChainsCount} />}
        <FlatList
          data={sortedData}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${index}-${item.chainId}`}
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={renderItemSeparator}
        />
      </Flex>
    </SmartWalletModal>
  )
}
