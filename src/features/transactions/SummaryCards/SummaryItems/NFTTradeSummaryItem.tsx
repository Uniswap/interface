import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'src/entities/assets'
import { useSpotPrice } from 'src/features/dataApi/spotPricesQuery'
import { createBalanceUpdate } from 'src/features/notifications/utils'
import { useCurrency } from 'src/features/tokens/useCurrency'
import TransactionSummaryLayout, {
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { BaseTransactionSummaryProps } from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { formatTitleWithStatus } from 'src/features/transactions/SummaryCards/utils'
import {
  NFTTradeTransactionInfo,
  NFTTradeType,
  TransactionType,
} from 'src/features/transactions/types'

export default function NFTTradeSummaryItem({
  transaction,
  showInlineWarning,
  readonly,
  ...rest
}: BaseTransactionSummaryProps & { transaction: { typeInfo: NFTTradeTransactionInfo } }) {
  const { t } = useTranslation()

  const purchaseCurrency = useCurrency(transaction.typeInfo.purchaseCurrencyId)
  const purchaseAmountRaw = transaction.typeInfo.purchaseCurrencyAmountRaw
  const spotPrice = useSpotPrice(purchaseCurrency)

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
          spotPrice
        )
      : undefined
  }, [
    spotPrice,
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
          size={TXN_HISTORY_ICON_SIZE}
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
