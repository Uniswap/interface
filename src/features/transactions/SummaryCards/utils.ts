import { Currency } from '@uniswap/sdk-core'
import { i18n } from 'src/app/i18n'
import { AssetType } from 'src/entities/assets'
import { getCurrencySymbol } from 'src/features/notifications/utils'
import { TransactionSummaryInfo } from 'src/features/transactions/SummaryCards/TransactionSummaryItem'
import { TransactionStatus, TransactionType } from 'src/features/transactions/types'

export function getTransactionSummaryTitle({
  transactionSummaryInfo,
  currency,
  otherCurrency,
  inlineWarning,
}: {
  transactionSummaryInfo: TransactionSummaryInfo
  currency: Nullable<Currency>
  otherCurrency: Nullable<Currency>
  inlineWarning?: Boolean
}) {
  const { type, tokenAddress, assetType, status, nftMetaData } = transactionSummaryInfo

  const tokenAddressOrName =
    assetType === AssetType.Currency ? tokenAddress : nftMetaData?.name ?? 'NFT'
  const assetName = getCurrencySymbol(currency, tokenAddressOrName)

  const failed = status === TransactionStatus.Failed
  const canceled = status === TransactionStatus.Cancelled
  const inProgress = status === TransactionStatus.Cancelling || status === TransactionStatus.Pending

  let title = ''
  switch (type) {
    case TransactionType.Swap:
      let tokensText = ''
      if (currency && otherCurrency) {
        tokensText = otherCurrency.symbol + i18n.t(' for ') + assetName
      }
      title = inProgress
        ? (title = i18n.t('Swap ' + '{{tokensText}}', {
            tokensText,
          }))
        : failed
        ? i18n.t('Failed swap')
        : canceled && inlineWarning
        ? i18n.t('Canceled swap')
        : i18n.t('Swapped ' + '{{tokensText}}', {
            tokensText,
          })
      break
    case TransactionType.Approve:
      title = inProgress
        ? i18n.t('Approve {{assetName}}', { assetName })
        : failed
        ? i18n.t('Failed approve')
        : i18n.t('Approved {{assetName}}', { assetName })
      break
    case TransactionType.Send:
      title = inProgress
        ? i18n.t('Send {{assetName}}', { assetName })
        : failed
        ? i18n.t('Failed send')
        : i18n.t('Sent {{assetName}}', { assetName })
      break
    case TransactionType.Receive:
      title = i18n.t('Received {{assetName}}', { assetName })
      break
    default:
      title = i18n.t('Unknown transaction')
  }

  return title
}
