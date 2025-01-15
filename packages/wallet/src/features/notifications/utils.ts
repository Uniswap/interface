import { Currency, TradeType } from '@uniswap/sdk-core'
import { getChainLabel, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { GQLNftAsset } from 'uniswap/src/features/nfts/types'
import { WalletConnectNotification } from 'uniswap/src/features/notifications/types'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { WalletConnectEvent } from 'uniswap/src/types/walletConnect'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { getCurrencyDisplayText, getFormattedCurrencyAmount, getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'

// eslint-disable-next-line consistent-return
export const formWCNotificationTitle = (appNotification: WalletConnectNotification): string => {
  const { event, dappName, chainId } = appNotification

  switch (event) {
    case WalletConnectEvent.Connected:
      return i18n.t('notification.walletConnect.connected')
    case WalletConnectEvent.Disconnected:
      return i18n.t('notification.walletConnect.disconnected')
    case WalletConnectEvent.NetworkChanged:
      {
        const supportedChainId = toSupportedChainId(chainId)
        if (supportedChainId) {
          return i18n.t('notification.walletConnect.networkChanged.full', {
            networkName: getChainLabel(supportedChainId),
          })
        }
      }
      return i18n.t('notification.walletConnect.networkChanged.short')
    case WalletConnectEvent.TransactionConfirmed:
      return i18n.t('notification.walletConnect.confirmed', { dappName })
    case WalletConnectEvent.TransactionFailed:
      return i18n.t('notification.walletConnect.failed', { dappName })
  }
}

export const formApproveNotificationTitle = (
  txStatus: TransactionStatus,
  currency: Maybe<Currency>,
  tokenAddress: Address,
  spender: Address,
): string => {
  const currencyDisplayText = getCurrencyDisplayText(currency, tokenAddress)
  const address = shortenAddress(spender)
  return txStatus === TransactionStatus.Success
    ? i18n.t('notification.transaction.approve.success', {
        currencySymbol: currencyDisplayText,
        address,
      })
    : txStatus === TransactionStatus.Canceled
      ? i18n.t('notification.transaction.approve.canceled', {
          currencySymbol: currencyDisplayText,
        })
      : i18n.t('notification.transaction.approve.fail', {
          currencySymbol: currencyDisplayText,
          address,
        })
}

export const formBridgeNotificationTitle = (txStatus: TransactionStatus): string => {
  switch (txStatus) {
    case TransactionStatus.Success:
      return i18n.t('transaction.status.swap.success')
    case TransactionStatus.Canceled:
      return i18n.t('transaction.status.swap.canceled')
    default:
      return i18n.t('transaction.status.swap.failed')
  }
}

export const formSwapNotificationTitle = (
  formatter: LocalizationContextState,
  txStatus: TransactionStatus,
  inputCurrency: Maybe<Currency>,
  outputCurrency: Maybe<Currency>,
  inputCurrencyId: string,
  outputCurrencyId: string,
  inputCurrencyAmountRaw: string,
  outputCurrencyAmountRaw: string,
  tradeType?: TradeType,
): string => {
  const inputCurrencySymbol = getCurrencyDisplayText(inputCurrency, currencyIdToAddress(inputCurrencyId))
  const outputCurrencySymbol = getCurrencyDisplayText(outputCurrency, currencyIdToAddress(outputCurrencyId))

  const inputAmount = getFormattedCurrencyAmount(
    inputCurrency,
    inputCurrencyAmountRaw,
    formatter,
    tradeType === TradeType.EXACT_OUTPUT,
  )
  const outputAmount = getFormattedCurrencyAmount(
    outputCurrency,
    outputCurrencyAmountRaw,
    formatter,
    tradeType === TradeType.EXACT_INPUT,
  )

  const inputCurrencyAmountWithSymbol = `${inputAmount}${inputCurrencySymbol}`
  const outputCurrencyAmountWithSymbol = `${outputAmount}${outputCurrencySymbol}`

  switch (txStatus) {
    case TransactionStatus.Success:
      return i18n.t('notification.transaction.swap.success', {
        inputCurrencyAmountWithSymbol,
        outputCurrencyAmountWithSymbol,
      })
    case TransactionStatus.Canceled:
      return i18n.t('notification.transaction.swap.canceled', {
        inputCurrencySymbol,
        outputCurrencySymbol,
      })
    case TransactionStatus.Expired:
      return i18n.t('notification.transaction.swap.expired', {
        inputCurrencySymbol,
        outputCurrencySymbol,
      })
    default:
      return i18n.t('notification.transaction.swap.fail', {
        inputCurrencyAmountWithSymbol,
        outputCurrencyAmountWithSymbol,
      })
  }
}

export const formWrapNotificationTitle = (
  formatter: LocalizationContextState,
  txStatus: TransactionStatus,
  inputCurrency: Maybe<Currency>,
  outputCurrency: Maybe<Currency>,
  currencyAmountRaw: string,
  unwrapped: boolean,
): string => {
  const inputCurrencySymbol = getSymbolDisplayText(inputCurrency?.symbol)
  const outputCurrencySymbol = getSymbolDisplayText(outputCurrency?.symbol)

  const inputAmount = getFormattedCurrencyAmount(inputCurrency, currencyAmountRaw, formatter)
  const outputAmount = getFormattedCurrencyAmount(outputCurrency, currencyAmountRaw, formatter)

  const inputCurrencyAmountWithSymbol = `${inputAmount}${inputCurrencySymbol}`
  const outputCurrencyAmountWithSymbol = `${outputAmount}${outputCurrencySymbol}`

  if (unwrapped) {
    return txStatus === TransactionStatus.Success
      ? i18n.t('notification.transaction.unwrap.success', {
          inputCurrencyAmountWithSymbol,
          outputCurrencyAmountWithSymbol,
        })
      : txStatus === TransactionStatus.Canceled
        ? i18n.t('notification.transaction.unwrap.canceled', {
            inputCurrencySymbol,
          })
        : i18n.t('notification.transaction.unwrap.fail', {
            inputCurrencyAmountWithSymbol,
          })
  }
  return txStatus === TransactionStatus.Success
    ? i18n.t('notification.transaction.wrap.success', {
        inputCurrencyAmountWithSymbol,
        outputCurrencyAmountWithSymbol,
      })
    : txStatus === TransactionStatus.Canceled
      ? i18n.t('notification.transaction.wrap.canceled', {
          inputCurrencySymbol,
        })
      : i18n.t('notification.transaction.wrap.fail', {
          inputCurrencyAmountWithSymbol,
        })
}

export const formTransferCurrencyNotificationTitle = (
  formatter: LocalizationContextState,
  txType: TransactionType,
  txStatus: TransactionStatus,
  currency: Maybe<Currency>,
  tokenAddress: string,
  currencyAmountRaw: string,
  senderOrRecipient: string,
): string => {
  const currencySymbol = getCurrencyDisplayText(currency, tokenAddress)
  const amount = getFormattedCurrencyAmount(currency, currencyAmountRaw, formatter)
  const shortenedAddressOrENS = getShortenedAddressOrEns(senderOrRecipient)
  return formTransferTxTitle(txType, txStatus, `${amount}${currencySymbol}`, shortenedAddressOrENS)
}

export const formTransferNFTNotificationTitle = (
  txType: TransactionType,
  txStatus: TransactionStatus,
  nft: GQLNftAsset | undefined,
  tokenAddress: Address,
  tokenId: string,
  senderOrRecipient: string,
): string => {
  const nftName = nft?.name ?? `NFT ${shortenAddress(tokenAddress)} #${tokenId}`
  const shortenedAddressOrENS = getShortenedAddressOrEns(senderOrRecipient)
  return formTransferTxTitle(txType, txStatus, nftName, shortenedAddressOrENS)
}

export const formUnknownTxTitle = (
  txStatus: TransactionStatus,
  tokenAddress: Address | undefined,
  ensName: string | null,
): string => {
  const address = tokenAddress && shortenAddress(tokenAddress)
  const target = ensName ?? address

  if (txStatus === TransactionStatus.Success) {
    if (target) {
      return i18n.t('notification.transaction.unknown.success.full', { addressOrEnsName: target })
    }
    return i18n.t('notification.transaction.unknown.success.short')
  }

  if (target) {
    return i18n.t('notification.transaction.unknown.fail.full', { addressOrEnsName: target })
  }
  return i18n.t('notification.transaction.unknown.fail.short')
}

const formTransferTxTitle = (
  txType: TransactionType,
  txStatus: TransactionStatus,
  tokenNameOrAddress: string,
  walletNameOrAddress: string,
): string => {
  if (txType === TransactionType.Send) {
    return txStatus === TransactionStatus.Success
      ? i18n.t('notification.transaction.transfer.success', {
          tokenNameOrAddress,
          walletNameOrAddress,
        })
      : txStatus === TransactionStatus.Canceled
        ? i18n.t('notification.transaction.transfer.canceled', {
            tokenNameOrAddress,
          })
        : i18n.t('notification.transaction.transfer.fail', {
            tokenNameOrAddress,
            walletNameOrAddress,
          })
  }

  return i18n.t('notification.transaction.transfer.received', {
    tokenNameOrAddress,
    walletNameOrAddress,
  })
}

const getShortenedAddressOrEns = (addressOrENS: string): string => {
  return getValidAddress(addressOrENS) ? shortenAddress(addressOrENS) : addressOrENS
}
