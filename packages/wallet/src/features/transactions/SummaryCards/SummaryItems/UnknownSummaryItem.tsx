import { createElement, useMemo } from 'react'
import { useSporeColors } from 'ui/src'
import { ContractInteraction } from 'ui/src/components/icons'
import {
  SummaryItemProps,
  TransactionSummaryLayoutProps,
} from 'wallet/src/features/transactions/SummaryCards/types'
import { TransactionDetails, UnknownTransactionInfo } from 'wallet/src/features/transactions/types'
import { getValidAddress, shortenAddress } from 'wallet/src/utils/addresses'

export function UnknownSummaryItem({
  transaction,
  layoutElement,
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
    icon: <ContractInteraction color="$neutral2" fill={colors.surface1.get()} size="$icon.40" />,
    transaction,
  })
}
