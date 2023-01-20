import { Currency } from '@uniswap/sdk-core'
import React, { useMemo } from 'react'
import { useSpotPrice } from 'src/features/dataApi/spotPricesQuery'
import { createBalanceUpdate } from 'src/features/notifications/utils'
import { AssetUpdateLayout } from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { NFTTradeType, TransactionStatus, TransactionType } from 'src/features/transactions/types'
import { currencyId } from 'src/utils/currencyId'

interface BalanceUpdateProps {
  currency: Currency
  amountRaw: string
  transactionType: TransactionType
  transactionStatus: TransactionStatus
  nftTradeType?: NFTTradeType
  transactedUSDValue?: number // Overrides API request for spot price if USD value already known
}

export default function BalanceUpdate({
  currency,
  amountRaw,
  transactionType,
  transactionStatus,
  nftTradeType,
  transactedUSDValue,
}: BalanceUpdateProps): JSX.Element | null {
  // Skip fetching spot price if known USD transacted value
  const skipQuery = !!transactedUSDValue
  const _currencyId = currencyId(currency)
  const { data: spotPrice, loading } = useSpotPrice(_currencyId, skipQuery)

  const balanceUpdate = useMemo(() => {
    if (!amountRaw || loading) {
      return undefined
    }
    return createBalanceUpdate({
      transactionType,
      transactionStatus,
      currency,
      currencyAmountRaw: amountRaw,
      spotPrice,
      nftTradeType,
      transactedUSDValue,
    })
  }, [
    amountRaw,
    currency,
    nftTradeType,
    spotPrice,
    transactedUSDValue,
    transactionStatus,
    transactionType,
    loading,
  ])

  if (loading) return null

  return (
    <AssetUpdateLayout
      caption={balanceUpdate?.usdValueChange}
      title={balanceUpdate?.assetValueChange}
    />
  )
}
