import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import UnknownStatus from 'src/assets/icons/contract-interaction.svg'
import TransactionSummaryLayout, {
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { BaseTransactionSummaryProps } from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { getTransactionTitle } from 'src/features/transactions/SummaryCards/utils'
import { UnknownTransactionInfo } from 'src/features/transactions/types'
import { getValidAddress, shortenAddress } from 'src/utils/addresses'

export default function UnknownSummaryItem({
  transaction,
  readonly,
  ...rest
}: BaseTransactionSummaryProps & {
  transaction: { typeInfo: UnknownTransactionInfo }
}): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const title = getTransactionTitle(transaction.status, t('Contract Interaction'), t)

  const caption = useMemo(() => {
    return transaction.typeInfo.tokenAddress && getValidAddress(transaction.typeInfo.tokenAddress)
      ? shortenAddress(transaction.typeInfo.tokenAddress)
      : undefined
  }, [transaction.typeInfo.tokenAddress])

  return (
    <TransactionSummaryLayout
      caption={caption}
      icon={
        <UnknownStatus
          color={theme.colors.textSecondary}
          fill={theme.colors.background0}
          height={TXN_HISTORY_ICON_SIZE}
          width={TXN_HISTORY_ICON_SIZE}
        />
      }
      readonly={readonly}
      title={title}
      transaction={transaction}
      {...rest}
    />
  )
}
