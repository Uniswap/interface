import { createElement, useMemo } from 'react'
import { Icons, useSporeColors } from 'ui/src'
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
    icon: (
      <Icons.ContractInteraction color="$neutral2" fill={colors.surface1.get()} size="$icon.40" />
    ),
    transaction,
  })
}
