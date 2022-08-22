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
      ? t('Failed ')
      : status === TransactionStatus.Cancelled && showInlineWarning
      ? t('Canceled ')
      : status === TransactionStatus.Cancelling && showInlineWarning
      ? t('Canceling ')
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
      title = t('Contract interaction')
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
  currency: NullUndefined<Currency>
  otherCurrency: NullUndefined<Currency>
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

  // For NFT transaction, show sender or recipient, or name if swap.
  if (nftMetaData) {
    if (type === TransactionType.Receive) {
      return from && isValidAddress(from) ? shortenAddress(from) : undefined
    }
    if (type === TransactionType.Send) {
      return to && isValidAddress(to) ? shortenAddress(to) : undefined
    }
  }

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

export function getNftUpdateInfo(
  nftMetaData:
    | {
        name: string
        collectionName: string
      }
    | undefined
) {
  if (!nftMetaData) {
    return undefined
  }
  return {
    title: nftMetaData.name,
    caption: nftMetaData.collectionName,
  }
}
