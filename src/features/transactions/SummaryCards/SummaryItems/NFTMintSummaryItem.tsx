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
import { NFTMintTransactionInfo, TransactionType } from 'src/features/transactions/types'

export default function NFTMintSummaryItem({
  transaction,
  readonly,
  ...rest
}: BaseTransactionSummaryProps & {
  transaction: { typeInfo: NFTMintTransactionInfo }
}): JSX.Element {
  const { t } = useTranslation()
  const title = getTransactionTitle(transaction.status, t('Mint'), t('Minted'), t)
  const currencyInfo = useCurrencyInfo(transaction.typeInfo.purchaseCurrencyId)
  const amountRaw = transaction.typeInfo.purchaseCurrencyAmountRaw

  return (
    <TransactionSummaryLayout
      caption={transaction.typeInfo.nftSummaryInfo.collectionName}
      endAdornment={
        currencyInfo && amountRaw ? (
          <BalanceUpdate
            amountRaw={amountRaw}
            currency={currencyInfo?.currency}
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
          size={TXN_HISTORY_ICON_SIZE}
          txStatus={transaction.status}
          txType={TransactionType.NFTMint}
        />
      }
      readonly={readonly}
      title={title}
      transaction={transaction}
      {...rest}
    />
  )
}
