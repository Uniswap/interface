import { Currency } from '@uniswap/sdk-core'
import React, { useMemo } from 'react'
import { Suspense } from 'src/components/data/Suspense'
import { useSpotPrice } from 'src/features/dataApi/spotPricesQuery'
import { createBalanceUpdate } from 'src/features/notifications/utils'
import { AssetUpdateLayout } from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { NFTTradeType, TransactionStatus, TransactionType } from 'src/features/transactions/types'

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
}: BalanceUpdateProps) {
  return (
    <Suspense fallback={null}>
      <BalanceUpdateInner
        amountRaw={amountRaw}
        currency={currency}
        nftTradeType={nftTradeType}
        transactedUSDValue={transactedUSDValue}
        transactionStatus={transactionStatus}
        transactionType={transactionType}
      />
    </Suspense>
  )
}

function BalanceUpdateInner({
  currency,
  amountRaw,
  transactionType,
  transactionStatus,
  nftTradeType,
  transactedUSDValue,
}: BalanceUpdateProps) {
  // Skip fetching spot price if known USD transacted value
  const skipQuery = !!transactedUSDValue
  const spotPrice = useSpotPrice(currency, skipQuery)

  const balanceUpdate = useMemo(() => {
    if (!amountRaw) {
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
  ])

  return (
    <AssetUpdateLayout
      caption={balanceUpdate?.usdValueChange}
      title={balanceUpdate?.assetValueChange}
    />
  )
}
