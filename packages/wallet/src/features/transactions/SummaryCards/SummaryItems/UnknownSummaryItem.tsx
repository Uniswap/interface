import { useMemo } from 'react'
import { useSporeColors } from 'ui/src'
import { ContractInteraction } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { TransactionDetails, UnknownTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getValidAddress, shortenAddress } from 'uniswap/src/utils/addresses'
import { DappLogoWithWCBadge } from 'wallet/src/components/CurrencyLogo/LogoWithTxStatus'
import { TransactionSummaryLayout } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionSummaryLayout'
import { SummaryItemProps } from 'wallet/src/features/transactions/SummaryCards/types'

export function UnknownSummaryItem({
  transaction,
  index,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: UnknownTransactionInfo }
}): JSX.Element {
  const colors = useSporeColors()

  const caption = useMemo(() => {
    return transaction.typeInfo.tokenAddress && getValidAddress(transaction.typeInfo.tokenAddress)
      ? shortenAddress(transaction.typeInfo.tokenAddress)
      : ''
  }, [transaction.typeInfo.tokenAddress])

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

  return <TransactionSummaryLayout caption={caption} icon={icon} index={index} transaction={transaction} />
}
