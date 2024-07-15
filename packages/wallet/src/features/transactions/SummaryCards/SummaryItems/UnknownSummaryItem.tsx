import { createElement, useMemo } from 'react'
import { useSporeColors } from 'ui/src'
import { ContractInteraction } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { getValidAddress, shortenAddress } from 'uniswap/src/utils/addresses'
import { DappLogoWithWCBadge } from 'wallet/src/components/CurrencyLogo/LogoWithTxStatus'
import { SummaryItemProps, TransactionSummaryLayoutProps } from 'wallet/src/features/transactions/SummaryCards/types'
import { TransactionDetails, UnknownTransactionInfo } from 'wallet/src/features/transactions/types'

export function UnknownSummaryItem({
  transaction,
  layoutElement,
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

  return createElement(layoutElement as React.FunctionComponent<TransactionSummaryLayoutProps>, {
    caption,
    icon: transaction.typeInfo.dappInfo?.icon ? (
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
    transaction,
    index,
  })
}
