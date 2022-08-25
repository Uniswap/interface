import { skipToken } from '@reduxjs/toolkit/dist/query'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { PollingInterval } from 'src/constants/misc'
import { AssetType } from 'src/entities/assets'
import { useSpotPricesQuery } from 'src/features/dataApi/slice'
import { createBalanceUpdate } from 'src/features/notifications/utils'
import { useCurrency } from 'src/features/tokens/useCurrency'
import TransactionSummaryLayout, {
  TXN_HISTORY_SIZING,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { BaseTransactionSummaryProps } from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { formatTitleWithStatus } from 'src/features/transactions/SummaryCards/utils'
import {
  NFTTradeTransactionInfo,
  NFTTradeType,
  TransactionType,
} from 'src/features/transactions/types'
import { currencyAddress } from 'src/utils/currencyId'

export default function NFTTradeSummaryItem({
  transaction,
  showInlineWarning,
  readonly,
  ...rest
}: BaseTransactionSummaryProps & { transaction: { typeInfo: NFTTradeTransactionInfo } }) {
  const { t } = useTranslation()

  const purchaseCurrency = useCurrency(transaction.typeInfo.purchaseCurrencyId)
  const purchaseAmountRaw = transaction.typeInfo.purchaseCurrencyAmountRaw
  const { currentData } = useSpotPricesQuery(
    purchaseCurrency
      ? {
          chainId: transaction.chainId,
          addresses: [currencyAddress(purchaseCurrency)],
        }
      : skipToken,
    // Covalent pricing endpoint only refreshes every 30 minutes
    { pollingInterval: PollingInterval.Slow }
  )

  const balanceUpdate = useMemo(() => {
    return purchaseAmountRaw
      ? createBalanceUpdate(
          // mimic buy or sell
          transaction.typeInfo.tradeType === NFTTradeType.BUY
            ? TransactionType.Send
            : TransactionType.Swap,
          transaction.status,
          purchaseCurrency,
          purchaseAmountRaw,
          currentData
        )
      : undefined
  }, [
    currentData,
    purchaseAmountRaw,
    purchaseCurrency,
    transaction.status,
    transaction.typeInfo.tradeType,
  ])

  const titleText = transaction.typeInfo.tradeType === NFTTradeType.BUY ? t('Buy') : t('Sell')
  const title = formatTitleWithStatus({
    status: transaction.status,
    text: titleText,
    showInlineWarning,
    t,
  })

  return (
    <TransactionSummaryLayout
      caption={transaction.typeInfo.nftSummaryInfo.collectionName}
      endCaption={balanceUpdate?.usdIncrease ?? ''}
      endTitle={balanceUpdate?.assetIncrease ?? ''}
      icon={
        <LogoWithTxStatus
          assetType={AssetType.ERC721}
          nftImageUrl={transaction.typeInfo.nftSummaryInfo.imageURL}
          nftTradeType={transaction.typeInfo.tradeType}
          size={TXN_HISTORY_SIZING}
          txStatus={transaction.status}
          txType={transaction.typeInfo.type}
        />
      }
      readonly={readonly}
      showInlineWarning={showInlineWarning}
      title={title}
      transaction={transaction}
      {...rest}
    />
  )
}
