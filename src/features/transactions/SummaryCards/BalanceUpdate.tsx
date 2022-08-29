import { Currency } from '@uniswap/sdk-core'
import React, { Suspense, useMemo } from 'react'
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
}

export default function BalanceUpdate({
  currency,
  amountRaw,
  transactionType,
  transactionStatus,
  nftTradeType,
}: BalanceUpdateProps) {
  return (
    <Suspense fallback={null}>
      <BalanceUpdateInner
        amountRaw={amountRaw}
        currency={currency}
        nftTradeType={nftTradeType}
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
}: BalanceUpdateProps) {
  const spotPrice = useSpotPrice(currency)

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
    })
  }, [amountRaw, currency, nftTradeType, spotPrice, transactionStatus, transactionType])

  return (
    <AssetUpdateLayout
      caption={balanceUpdate?.usdValueChange}
      title={balanceUpdate?.assetValueChange}
    />
  )
}
