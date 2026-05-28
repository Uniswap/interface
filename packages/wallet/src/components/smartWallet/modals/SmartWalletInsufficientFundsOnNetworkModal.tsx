import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { Flex, Separator } from 'ui/src'
import { InsufficientGas } from 'ui/src/components/icons'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SmartWalletModal } from 'wallet/src/components/smartWallet/modals/SmartWalletModal'
import { InsufficientFundsNetworkRow, NetworkInfo } from 'wallet/src/features/smartWallet/InsufficientFundsNetworkRow'

export type SmartWalletInsufficientFundsOnNetworkModalProps = {
  isOpen: boolean
  onClose: () => void
  onContinue?: (sortedData: NetworkInfo[]) => void
  networkBalances?: NetworkInfo[]
  showActiveDelegatedNetworks?: boolean
}

const maxHeightList = 300

const renderItem = ({ item, index }: { item: NetworkInfo; index: number }): JSX.Element => (
  <InsufficientFundsNetworkRow key={`${index}`} networkInfo={item} />
)

const renderItemSeparator = (): JSX.Element => <Separator my="$spacing8" />

export function SmartWalletInsufficientFundsOnNetworkModal({
  isOpen,
  onClose,
  onContinue,
  networkBalances,
  showActiveDelegatedNetworks = false,
}: SmartWalletInsufficientFundsOnNetworkModalProps): JSX.Element {
  const { t } = useTranslation()

  const sortedData = [...(networkBalances ?? [])].sort(
    (a, b) => Number(a.hasSufficientFunds) - Number(b.hasSufficientFunds),
  )
  const sufficientFundsCount = sortedData.filter((chain) => chain.hasSufficientFunds === false).length
  const canContinue = sortedData.some((chain) => chain.hasSufficientFunds)

  const onConfirm = useCallback(() => {
    onContinue?.(sortedData)
  }, [onContinue, sortedData])

  // Title logic
  const title = showActiveDelegatedNetworks
    ? sortedData.length > 1
      ? t('smartWallet.activeNetworks.title.plural', { amount: sortedData.length })
      : t('smartWallet.activeNetworks.title')
    : sufficientFundsCount > 1
      ? t('smartWallet.insufficient.title.plural', { amount: sufficientFundsCount })
      : t('smartWallet.insufficient.title')

  const primaryButtonText = t('smartWallet.InsufficientFunds.button.continue.text')
  const secondaryButtonText = t('common.close')

  const primaryButtonOnClick = onConfirm
  const secondaryButtonOnClick = onClose

  return (
    <SmartWalletModal
      isOpen={isOpen}
      icon={<InsufficientGas size="$icon.24" />}
      iconBackgroundColor="$accent2"
      title={title}
      subtext={t('smartWallet.insufficient.description')}
      modalName={ModalName.SmartWalletInsufficientFundsOnNetworkModal}
      primaryButton={{
        text: canContinue ? primaryButtonText : secondaryButtonText,
        onClick: canContinue ? primaryButtonOnClick : secondaryButtonOnClick,
        variant: 'default',
        emphasis: canContinue ? 'tertiary' : 'secondary',
      }}
      secondaryButton={
        canContinue
          ? {
              text: secondaryButtonText,
              onClick: secondaryButtonOnClick,
              emphasis: 'secondary',
            }
          : undefined
      }
      alignment="top"
      onClose={onClose}
    >
      <Flex maxHeight={maxHeightList} flex={1}>
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
