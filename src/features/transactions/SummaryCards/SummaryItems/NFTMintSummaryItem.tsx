import { skipToken } from '@reduxjs/toolkit/dist/query'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { PollingInterval } from 'src/constants/misc'
import { AssetType } from 'src/entities/assets'
import { useSpotPricesQuery } from 'src/features/dataApi/slice'
import { createBalanceUpdate } from 'src/features/notifications/utils'
import { useCurrency } from 'src/features/tokens/useCurrency'
import TransactionSummaryLayout from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import {
  BaseTransactionSummaryProps,
  TXN_HISTORY_SIZING,
} from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { formatTitleWithStatus } from 'src/features/transactions/SummaryCards/utils'
import { NFTMintTransactionInfo, TransactionType } from 'src/features/transactions/types'
import { currencyAddress } from 'src/utils/currencyId'

export default function NFTMintSummaryItem({
  transaction,
  showInlineWarning,
  readonly,
  ...rest
}: BaseTransactionSummaryProps & { transaction: { typeInfo: NFTMintTransactionInfo } }) {
  const { t } = useTranslation()
  const title = formatTitleWithStatus({
    status: transaction.status,
    text: t('Mint'),
    showInlineWarning,
    t,
  })

  const currency = useCurrency(transaction.typeInfo.purchaseCurrencyId)

  // Transfer info for ERC20s
  const amountRaw = transaction.typeInfo.purchaseCurrencyAmountRaw
  const { currentData } = useSpotPricesQuery(
    currency
      ? {
          chainId: transaction.chainId,
          addresses: [currencyAddress(currency)],
        }
      : skipToken,
    // Covalent pricing endpoint only refreshes every 30 minutes
    { pollingInterval: PollingInterval.Slow }
  )
  const balanceUpdate = useMemo(() => {
    return amountRaw
      ? createBalanceUpdate(
          // mimic buy or sell
          transaction.typeInfo.type,
          transaction.status,
          currency,
          amountRaw,
          currentData
        )
      : undefined
  }, [amountRaw, currency, currentData, transaction.status, transaction.typeInfo.type])

  return (
    <TransactionSummaryLayout
      caption={transaction.typeInfo.nftSummaryInfo.collectionName}
      endCaption={balanceUpdate?.usdIncrease ?? ''}
      endTitle={balanceUpdate?.assetIncrease ?? ''}
      icon={
        <LogoWithTxStatus
          assetType={AssetType.ERC721}
          nftImageUrl={transaction.typeInfo.nftSummaryInfo.imageURL}
          size={TXN_HISTORY_SIZING}
          txStatus={transaction.status}
          txType={TransactionType.NFTMint}
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
