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
  showInlineWarning,
}: {
  transactionSummaryInfo: TransactionSummaryInfo
  currency: Nullable<Currency>
  otherCurrency: Nullable<Currency>
  showInlineWarning?: boolean
}) {
  const { type, tokenAddress, assetType, status, nftMetaData } = transactionSummaryInfo

  const tokenAddressOrName =
    assetType === AssetType.Currency ? tokenAddress : nftMetaData?.name ?? 'NFT'
  const assetName = getCurrencySymbol(currency, tokenAddressOrName)

  let title = ''
  switch (type) {
    case TransactionType.Swap:
      title = generateSwapTitle(assetName, otherCurrency?.symbol, status, showInlineWarning)
      break
    case TransactionType.Approve:
      title = generateApproveTitle(assetName, status)
      break
    case TransactionType.Send:
      title = generateSendTitle(assetName, status)
      break
    case TransactionType.Receive:
      title = generateReceiveTitle(assetName)
      break
    default:
      title = i18n.t('Unknown transaction')
  }

  return title
}

function generateSwapTitle(
  assetName: string | undefined,
  otherAssetName: string | undefined,
  status: TransactionStatus,
  showInlineWarning: boolean | undefined
) {
  let swapTokensString = otherAssetName ? otherAssetName + i18n.t(' for ') + assetName : ''
  if (status === TransactionStatus.FailedCancel && showInlineWarning) {
    return i18n.t('Swap')
  } else if (
    status === TransactionStatus.Cancelling ||
    status === TransactionStatus.Pending ||
    status === TransactionStatus.Replacing
  ) {
    return i18n.t('Swap ' + '{{swapTokensString}}', {
      swapTokensString,
    })
  } else if (status === TransactionStatus.Failed) {
    return i18n.t('Failed swap')
  } else if (status === TransactionStatus.Cancelled && showInlineWarning) {
    return i18n.t('Canceled swap')
  } else {
    return i18n.t('Swapped ' + '{{swapTokensString}}', {
      swapTokensString,
    })
  }
}

function generateApproveTitle(assetName: string | undefined, status: TransactionStatus) {
  if (
    status === TransactionStatus.Cancelling ||
    status === TransactionStatus.Pending ||
    status === TransactionStatus.Replacing
  ) {
    return i18n.t('Approve ' + '{{assetName}}', {
      assetName,
    })
  } else if (status === TransactionStatus.Failed) {
    return i18n.t('Failed approve')
  } else if (status === TransactionStatus.Cancelled) {
    return i18n.t('Canceled Approve')
  } else {
    return i18n.t('Approved ' + '{{assetName}}', {
      assetName,
    })
  }
}

function generateSendTitle(assetName: string | undefined, status: TransactionStatus) {
  if (
    status === TransactionStatus.Cancelling ||
    status === TransactionStatus.Pending ||
    status === TransactionStatus.Replacing
  ) {
    return i18n.t('Send ' + '{{assetName}}', {
      assetName,
    })
  } else if (status === TransactionStatus.Failed) {
    return i18n.t('Failed send')
  } else if (status === TransactionStatus.Cancelled) {
    return i18n.t('Canceled send')
  } else {
    return i18n.t('Sent ' + '{{assetName}}', {
      assetName,
    })
  }
}

function generateReceiveTitle(assetName: string | undefined) {
  // Impossible to locate failed txns with user as recipient.
  return i18n.t('Receive ' + '{{assetName}}', {
    assetName,
  })
}
