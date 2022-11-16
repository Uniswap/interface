import React from 'react'
import { useTranslation } from 'react-i18next'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'src/entities/assets'
import { useCurrency } from 'src/features/tokens/useCurrency'
import BalanceUpdate from 'src/features/transactions/SummaryCards/BalanceUpdate'
import TransactionSummaryLayout, {
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { BaseTransactionSummaryProps } from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { formatTitleWithStatus } from 'src/features/transactions/SummaryCards/utils'
import { NFTTradeTransactionInfo, NFTTradeType } from 'src/features/transactions/types'

export default function NFTTradeSummaryItem({
  transaction,
  showInlineWarning,
  readonly,
  ...rest
}: BaseTransactionSummaryProps & { transaction: { typeInfo: NFTTradeTransactionInfo } }) {
  const { t } = useTranslation()

  const purchaseCurrency = useCurrency(transaction.typeInfo.purchaseCurrencyId)
  const purchaseAmountRaw = transaction.typeInfo.purchaseCurrencyAmountRaw

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
      endAdornment={
        purchaseAmountRaw && purchaseCurrency ? (
          <BalanceUpdate
            amountRaw={purchaseAmountRaw}
            currency={purchaseCurrency}
            nftTradeType={transaction.typeInfo.tradeType}
            transactedUSDValue={transaction.typeInfo.transactedUSDValue}
            transactionStatus={transaction.status}
            transactionType={transaction.typeInfo.type}
          />
        ) : undefined
      }
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
      title={title}
      transaction={transaction}
      {...rest}
    />
  )
}
