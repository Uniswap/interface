import React from 'react'
import { useTranslation } from 'react-i18next'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'src/entities/assets'
import { useCurrencyInfo } from 'src/features/tokens/useCurrencyInfo'
import BalanceUpdate from 'src/features/transactions/SummaryCards/BalanceUpdate'
import TransactionSummaryLayout, {
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { BaseTransactionSummaryProps } from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { getTransactionTitle } from 'src/features/transactions/SummaryCards/utils'
import { NFTTradeTransactionInfo, NFTTradeType } from 'src/features/transactions/types'

export default function NFTTradeSummaryItem({
  transaction,
  readonly,
  ...rest
}: BaseTransactionSummaryProps & {
  transaction: { typeInfo: NFTTradeTransactionInfo }
}): JSX.Element {
  const { t } = useTranslation()

  const purchaseCurrencyInfo = useCurrencyInfo(transaction.typeInfo.purchaseCurrencyId)
  const purchaseAmountRaw = transaction.typeInfo.purchaseCurrencyAmountRaw

  const titleText = transaction.typeInfo.tradeType === NFTTradeType.BUY ? t('Buy') : t('Sell')
  const title = getTransactionTitle(transaction.status, titleText, t)

  return (
    <TransactionSummaryLayout
      caption={transaction.typeInfo.nftSummaryInfo.collectionName}
      endAdornment={
        purchaseAmountRaw && purchaseCurrencyInfo ? (
          <BalanceUpdate
            amountRaw={purchaseAmountRaw}
            currency={purchaseCurrencyInfo.currency}
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
