import { Currency } from '@uniswap/sdk-core'
import { TFunction } from 'i18next'
import { AssetType } from 'src/entities/assets'
import { getCurrencySymbol, getFormattedCurrencyAmount } from 'src/features/notifications/utils'
import { TransactionSummaryInfo } from 'src/features/transactions/SummaryCards/TransactionSummaryItem'
import { TransactionStatus, TransactionType } from 'src/features/transactions/types'
import { isValidAddress, shortenAddress } from 'src/utils/addresses'

export function getTransactionSummaryTitle({
  transactionSummaryInfo,
  t,
  showInlineWarning,
}: {
  transactionSummaryInfo: TransactionSummaryInfo
  t: TFunction
  showInlineWarning?: boolean
}) {
  const { type, status } = transactionSummaryInfo
  let title = ''
  const prefix =
    status === TransactionStatus.Failed
      ? 'Failed '
      : status === TransactionStatus.Cancelled && showInlineWarning
      ? 'Canceled '
      : ''
  switch (type) {
    case TransactionType.Swap:
      title = t('Swap')
      break
    case TransactionType.Approve:
      title = t('Approve')
      break
    case TransactionType.Send:
      title = t('Send')
      break
    case TransactionType.Receive:
      title = t('Receive')
      break
    default:
      title = t('Unknown transaction')
  }
  // Lowercase title if prefix
  return prefix + (prefix ? title.toLocaleLowerCase() : title)
}

export function getTransactionSummaryCaption({
  transactionSummaryInfo,
  currency,
  otherCurrency,
}: {
  transactionSummaryInfo: TransactionSummaryInfo
  currency: Nullable<Currency>
  otherCurrency: Nullable<Currency>
}) {
  const {
    type,
    otherTokenAddress,
    amountRaw,
    otherAmountRaw,
    status,
    assetType,
    tokenAddress,
    nftMetaData,
    from,
    to,
  } = transactionSummaryInfo
  let caption: string | undefined

  const assetAddressOrName =
    assetType === AssetType.Currency ? tokenAddress : nftMetaData?.name ?? 'NFT'
  const assetSymbol = getCurrencySymbol(currency, assetAddressOrName)

  const otherAssetAddressOrName =
    assetType === AssetType.Currency ? otherTokenAddress : nftMetaData?.name ?? 'NFT'
  const otherAssetSymbol = getCurrencySymbol(otherCurrency, otherAssetAddressOrName)

  switch (type) {
    case TransactionType.Swap:
      if (!assetSymbol || !otherAssetSymbol) {
        break
      }
      if (
        (status === TransactionStatus.Failed ||
          status === TransactionStatus.Pending ||
          status === TransactionStatus.Cancelling ||
          status === TransactionStatus.Cancelled) &&
        currency &&
        otherCurrency &&
        amountRaw &&
        otherAmountRaw
      ) {
        const currencyAmount = getFormattedCurrencyAmount(currency, amountRaw)
        const otherCurrencyAmount = getFormattedCurrencyAmount(otherCurrency, otherAmountRaw)
        if (currencyAmount && otherCurrencyAmount) {
          caption = `${otherCurrencyAmount} ${otherAssetSymbol} → ${currencyAmount} ${assetSymbol}`
        }
      } else {
        caption = otherAssetSymbol + '→' + assetSymbol
      }
      break
    case TransactionType.Approve:
      break
    case TransactionType.Send:
      if (to && isValidAddress(to)) {
        caption = shortenAddress(to)
      }
      break
    case TransactionType.Receive:
      if (from && isValidAddress(from)) {
        caption = shortenAddress(from)
      }
      break
  }
  return caption
}
