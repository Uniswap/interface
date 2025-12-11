import { useMemo } from 'react'
import { useSporeColors } from 'ui/src'
import { ContractInteraction } from 'ui/src/components/icons/ContractInteraction'
import { iconSizes } from 'ui/src/theme'
import { TransactionSummaryLayout } from 'uniswap/src/components/activity/summaries/TransactionSummaryLayout'
import { SummaryItemProps } from 'uniswap/src/components/activity/types'
import { DappLogoWithWCBadge } from 'uniswap/src/components/CurrencyLogo/LogoWithTxStatus'
import { TransactionDetails, UnknownTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { shortenAddress } from 'utilities/src/addresses'

export function UnknownSummaryItem({
  transaction,
  index,
  isExternalProfile,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: UnknownTransactionInfo }
}): JSX.Element {
  const colors = useSporeColors()

  const caption = useMemo(() => {
    if (transaction.typeInfo.dappInfo?.name) {
      return transaction.typeInfo.dappInfo.name
    }

    if (getValidAddress({ address: transaction.typeInfo.tokenAddress, chainId: transaction.chainId })) {
      return shortenAddress({ address: transaction.typeInfo.tokenAddress })
    }

    return ''
  }, [transaction.typeInfo.tokenAddress, transaction.typeInfo.dappInfo?.name, transaction.chainId])

  const icon = useMemo(
    () =>
      transaction.typeInfo.dappInfo?.icon ? (
        <DappLogoWithWCBadge
          hideWCBadge
          chainId={transaction.chainId}
          dappImageUrl={transaction.typeInfo.dappInfo.icon}
          dappName={transaction.typeInfo.dappInfo.name ?? ''}
          size={iconSizes.icon40}
        />
      ) : (
        <ContractInteraction color="$neutral2" fill={colors.surface1.get()} size="$icon.40" />
      ),
    [colors.surface1, transaction.chainId, transaction.typeInfo.dappInfo?.icon, transaction.typeInfo.dappInfo?.name],
  )

  return (
    <TransactionSummaryLayout
      caption={caption}
      icon={icon}
      index={index}
      transaction={transaction}
      isExternalProfile={isExternalProfile}
    />
  )
}
