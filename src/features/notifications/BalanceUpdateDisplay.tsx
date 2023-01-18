import { Currency } from '@uniswap/sdk-core'
import React, { useMemo } from 'react'
import { Text } from 'src/components/Text'
import { useSpotPrice } from 'src/features/dataApi/spotPricesQuery'
import { createBalanceUpdate } from 'src/features/notifications/utils'
import { TransactionStatus, TransactionType } from 'src/features/transactions/types'
import { currencyId } from 'src/utils/currencyId'

interface BalanceUpdateProps {
  currency: NullUndefined<Currency>
  amountRaw: string | undefined
  transactionType: TransactionType
  transactionStatus: TransactionStatus
}

export default function BalanceUpdate({
  currency,
  amountRaw,
  transactionType,
  transactionStatus,
}: BalanceUpdateProps): JSX.Element | null {
  const _currencyId = currency ? currencyId(currency) : null
  const { data: spotPrice, loading } = useSpotPrice(_currencyId)
  return useMemo(() => {
    if (!amountRaw || !currency || loading) {
      return null
    }
    const balanceUpdate = createBalanceUpdate({
      transactionType,
      transactionStatus,
      currency,
      currencyAmountRaw: amountRaw,
      spotPrice,
    })
    if (!balanceUpdate) {
      return null
    }
    return (
      <>
        <Text
          adjustsFontSizeToFit
          color="accentSuccess"
          numberOfLines={1}
          variant="buttonLabelSmall">
          {balanceUpdate.assetValueChange}
        </Text>
        <Text
          adjustsFontSizeToFit
          color="textSecondary"
          numberOfLines={1}
          variant="buttonLabelMicro">
          {balanceUpdate.usdValueChange}
        </Text>
      </>
    )
  }, [amountRaw, currency, spotPrice, transactionStatus, transactionType, loading])
}
