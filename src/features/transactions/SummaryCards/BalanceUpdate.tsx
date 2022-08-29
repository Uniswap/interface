import { Currency } from '@uniswap/sdk-core'
import React, { Suspense, useMemo } from 'react'
import { useSpotPrice } from 'src/features/dataApi/spotPricesQuery'
import { createBalanceUpdate } from 'src/features/notifications/utils'
import { AssetUpdateLayout } from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { TransactionStatus, TransactionType } from 'src/features/transactions/types'

interface BalanceUpdateProps {
  currency: Currency
  amountRaw: string
  transactionType: TransactionType
  transactionStatus: TransactionStatus
}

export default function BalanceUpdate({
  currency,
  amountRaw,
  transactionType,
  transactionStatus,
}: BalanceUpdateProps) {
  return (
    <Suspense fallback={null}>
      <BalanceUpdateInner
        amountRaw={amountRaw}
        currency={currency}
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
}: BalanceUpdateProps) {
  const spotPrice = useSpotPrice(currency)

  const balanceUpdate = useMemo(() => {
    const hasBalanceUpdate =
      transactionType === TransactionType.Receive ||
      transactionType === TransactionType.Send ||
      transactionType === TransactionType.Swap ||
      transactionType === TransactionType.NFTTrade ||
      transactionType === TransactionType.NFTMint

    if (!hasBalanceUpdate || !amountRaw) {
      return undefined
    }
    return createBalanceUpdate(transactionType, transactionStatus, currency, amountRaw, spotPrice)
  }, [amountRaw, currency, spotPrice, transactionStatus, transactionType])

  return (
    <AssetUpdateLayout caption={balanceUpdate?.usdIncrease} title={balanceUpdate?.assetIncrease} />
  )
}
