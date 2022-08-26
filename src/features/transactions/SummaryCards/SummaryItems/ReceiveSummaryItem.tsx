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
import { ReceiveTokenTransactionInfo } from 'src/features/transactions/types'
import { shortenAddress } from 'src/utils/addresses'
import { buildCurrencyId } from 'src/utils/currencyId'

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
  const spotPrice = useSpotPrice(currency)

  const balanceUpdate = useMemo(() => {
    return amountRaw
      ? createBalanceUpdate(
          // mimic buy or sell
          transaction.typeInfo.type,
          transaction.status,
          currency,
          amountRaw,
          spotPrice
        )
      : undefined
  }, [amountRaw, currency, spotPrice, transaction.status, transaction.typeInfo.type])

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
          size={TXN_HISTORY_ICON_SIZE}
          txStatus={transaction.status}
          txType={transaction.typeInfo.type}
        />
      )
    }
    return (
      <LogoWithTxStatus
        assetType={AssetType.ERC721}
        nftImageUrl={transaction.typeInfo.nftSummaryInfo?.imageURL}
        size={TXN_HISTORY_ICON_SIZE}
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
