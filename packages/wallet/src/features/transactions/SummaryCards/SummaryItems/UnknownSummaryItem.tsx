import { createElement, useMemo } from 'react'
import { Icons, useTheme } from 'ui/src'
import {
  SummaryItemProps,
  TransactionSummaryLayoutProps,
} from 'wallet/src/features/transactions/SummaryCards/types'
import { TXN_HISTORY_ICON_SIZE } from 'wallet/src/features/transactions/SummaryCards/utils'
import { TransactionDetails, UnknownTransactionInfo } from 'wallet/src/features/transactions/types'
import { getValidAddress, shortenAddress } from 'wallet/src/utils/addresses'

export function UnknownSummaryItem({
  transaction,
  layoutElement,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: UnknownTransactionInfo }
}): JSX.Element {
  const theme = useTheme()

  const caption = useMemo(() => {
    return transaction.typeInfo.tokenAddress && getValidAddress(transaction.typeInfo.tokenAddress)
      ? shortenAddress(transaction.typeInfo.tokenAddress)
      : ''
  }, [transaction.typeInfo.tokenAddress])

  return createElement(layoutElement as React.FunctionComponent<TransactionSummaryLayoutProps>, {
    caption,
    icon: (
      <Icons.ContractInteraction
        color="$neutral2"
        fill={theme.surface1.get()}
        height={TXN_HISTORY_ICON_SIZE}
        width={TXN_HISTORY_ICON_SIZE}
      />
    ),
    transaction,
  })
}
