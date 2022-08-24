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
import { ReceiveTokenTransactionInfo } from 'src/features/transactions/types'
import { shortenAddress } from 'src/utils/addresses'
import { buildCurrencyId, currencyAddress } from 'src/utils/currencyId'

export default function ReceiveSummaryItem({
  transaction,
  showInlineWarning,
  readonly,
  ...rest
}: BaseTransactionSummaryProps & { transaction: { typeInfo: ReceiveTokenTransactionInfo } }) {
  const { t } = useTranslation()
  const currency = useCurrency(
    buildCurrencyId(transaction.chainId, transaction.typeInfo.tokenAddress)
  )

  // Transfer info for ERC20s
  const amountRaw = transaction.typeInfo.currencyAmountRaw
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

  const endTitle =
    transaction.typeInfo.assetType === AssetType.Currency
      ? balanceUpdate?.assetIncrease
      : transaction.typeInfo.nftSummaryInfo?.name

  const endCaption =
    transaction.typeInfo.assetType === AssetType.Currency
      ? balanceUpdate?.usdIncrease
      : transaction.typeInfo.nftSummaryInfo?.collectionName

  const icon = useMemo(() => {
    if (transaction.typeInfo.assetType === AssetType.Currency) {
      return (
        <LogoWithTxStatus
          assetType={AssetType.Currency}
          currency={currency}
          size={TXN_HISTORY_SIZING}
          txStatus={transaction.status}
          txType={transaction.typeInfo.type}
        />
      )
    }
    return (
      <LogoWithTxStatus
        assetType={AssetType.ERC721}
        nftImageUrl={transaction.typeInfo.nftSummaryInfo?.imageURL}
        size={TXN_HISTORY_SIZING}
        txStatus={transaction.status}
        txType={transaction.typeInfo.type}
      />
    )
  }, [
    currency,
    transaction.status,
    transaction.typeInfo.assetType,
    transaction.typeInfo.nftSummaryInfo?.imageURL,
    transaction.typeInfo.type,
  ])

  const title = formatTitleWithStatus({
    status: transaction.status,
    text: t('Receive'),
    showInlineWarning,
    t,
  })

  return (
    <TransactionSummaryLayout
      caption={shortenAddress(transaction.typeInfo.sender)}
      endCaption={endCaption ?? ''}
      endTitle={endTitle ?? ''}
      icon={icon}
      readonly={readonly}
      showInlineWarning={showInlineWarning}
      title={title}
      transaction={transaction}
      {...rest}
    />
  )
}
