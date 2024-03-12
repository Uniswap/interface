import { Currency, TradeType } from '@uniswap/sdk-core'
import { CHAIN_INFO } from 'wallet/src/constants/chains'
import { toSupportedChainId } from 'wallet/src/features/chains/utils'
import { LocalizationContextState } from 'wallet/src/features/language/LocalizationContext'
import { GQLNftAsset } from 'wallet/src/features/nfts/hooks'
import { WalletConnectNotification } from 'wallet/src/features/notifications/types'
import { TransactionStatus, TransactionType } from 'wallet/src/features/transactions/types'
import { WalletConnectEvent } from 'wallet/src/features/walletConnect/types'
import i18n from 'wallet/src/i18n/i18n'
import { getValidAddress, shortenAddress } from 'wallet/src/utils/addresses'
import {
  getCurrencyDisplayText,
  getFormattedCurrencyAmount,
  getSymbolDisplayText,
} from 'wallet/src/utils/currency'
import { currencyIdToAddress } from 'wallet/src/utils/currencyId'

export const formWCNotificationTitle = (appNotification: WalletConnectNotification): string => {
  const { event, dappName, chainId } = appNotification

  switch (event) {
    case WalletConnectEvent.Connected:
      return i18n.t('Connected')
    case WalletConnectEvent.Disconnected:
      return i18n.t('Disconnected')
    case WalletConnectEvent.NetworkChanged:
      {
        const supportedChainId = toSupportedChainId(chainId)
        if (supportedChainId) {
          return i18n.t('Switched to {{name}}', {
            name: CHAIN_INFO[supportedChainId].label,
          })
        }
      }
      return i18n.t('Switched networks')
    case WalletConnectEvent.TransactionConfirmed:
      return i18n.t('Transaction confirmed with {{dappName}}', { dappName })
    case WalletConnectEvent.TransactionFailed:
      return i18n.t('Transaction failed with {{dappName}}', { dappName })
  }
}

export const formApproveNotificationTitle = (
  txStatus: TransactionStatus,
  currency: Maybe<Currency>,
  tokenAddress: Address,
  spender: Address
): string => {
  const currencyDisplayText = getCurrencyDisplayText(currency, tokenAddress)
  const address = shortenAddress(spender)
  return txStatus === TransactionStatus.Success
    ? i18n.t('Approved {{currencySymbol}} for use with {{address}}.', {
        currencySymbol: currencyDisplayText,
        address,
      })
    : txStatus === TransactionStatus.Cancelled
    ? i18n.t('Canceled {{currencySymbol}} approve.', {
        currencySymbol: currencyDisplayText,
        address,
      })
    : i18n.t('Failed to approve {{currencySymbol}} for use with {{address}}.', {
        currencySymbol: currencyDisplayText,
        address,
      })
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
  tradeType?: TradeType
): string => {
  const inputCurrencySymbol = getCurrencyDisplayText(
    inputCurrency,
    currencyIdToAddress(inputCurrencyId)
  )
  const outputCurrencySymbol = getCurrencyDisplayText(
    outputCurrency,
    currencyIdToAddress(outputCurrencyId)
  )

  const inputAmount = getFormattedCurrencyAmount(
    inputCurrency,
    inputCurrencyAmountRaw,
    formatter,
    tradeType === TradeType.EXACT_OUTPUT
  )
  const outputAmount = getFormattedCurrencyAmount(
    outputCurrency,
    outputCurrencyAmountRaw,
    formatter,
    tradeType === TradeType.EXACT_INPUT
  )

  const inputAssetInfo = `${inputAmount}${inputCurrencySymbol}`
  const outputAssetInfo = `${outputAmount}${outputCurrencySymbol}`

  return txStatus === TransactionStatus.Success
    ? i18n.t('Swapped {{inputAssetInfo}} for {{outputAssetInfo}}.', {
        inputAssetInfo,
        outputAssetInfo,
      })
    : txStatus === TransactionStatus.Cancelled
    ? i18n.t('Canceled {{inputCurrencySymbol}}-{{outputCurrencySymbol}} swap.', {
        inputCurrencySymbol,
        outputCurrencySymbol,
      })
    : i18n.t('Failed to swap {{inputAssetInfo}} for {{outputAssetInfo}}.', {
        inputAssetInfo,
        outputAssetInfo,
      })
}

export const formWrapNotificationTitle = (
  formatter: LocalizationContextState,
  txStatus: TransactionStatus,
  inputCurrency: Maybe<Currency>,
  outputCurrency: Maybe<Currency>,
  currencyAmountRaw: string,
  unwrapped: boolean
): string => {
  const inputCurrencySymbol = getSymbolDisplayText(inputCurrency?.symbol)
  const outputCurrencySymbol = getSymbolDisplayText(outputCurrency?.symbol)

  const inputAmount = getFormattedCurrencyAmount(inputCurrency, currencyAmountRaw, formatter)
  const outputAmount = getFormattedCurrencyAmount(outputCurrency, currencyAmountRaw, formatter)

  const inputAssetInfo = `${inputAmount}${inputCurrencySymbol}`
  const outputAssetInfo = `${outputAmount}${outputCurrencySymbol}`

  if (unwrapped) {
    return txStatus === TransactionStatus.Success
      ? i18n.t('Unwrapped {{inputAssetInfo}} and received {{outputAssetInfo}}.', {
          inputAssetInfo,
          outputAssetInfo,
        })
      : txStatus === TransactionStatus.Cancelled
      ? i18n.t('Canceled {{inputCurrencySymbol}} unwrap.', {
          inputCurrencySymbol,
        })
      : i18n.t('Failed to unwrap {{inputAssetInfo}}.', {
          inputAssetInfo,
        })
  }
  return txStatus === TransactionStatus.Success
    ? i18n.t('Wrapped {{inputAssetInfo}} and received {{outputAssetInfo}}.', {
        inputAssetInfo,
        outputAssetInfo,
      })
    : txStatus === TransactionStatus.Cancelled
    ? i18n.t('Canceled {{inputCurrencySymbol}} wrap.', {
        inputCurrencySymbol,
      })
    : i18n.t('Failed to wrap {{inputAssetInfo}}.', {
        inputAssetInfo,
      })
}

export const formTransferCurrencyNotificationTitle = (
  formatter: LocalizationContextState,
  txType: TransactionType,
  txStatus: TransactionStatus,
  currency: Maybe<Currency>,
  tokenAddress: string,
  currencyAmountRaw: string,
  senderOrRecipient: string
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
  senderOrRecipient: string
): string => {
  const nftName = nft?.name ?? `NFT ${shortenAddress(tokenAddress)} #${tokenId}`
  const shortenedAddressOrENS = getShortenedAddressOrEns(senderOrRecipient)
  return formTransferTxTitle(txType, txStatus, nftName, shortenedAddressOrENS)
}

export const formUnknownTxTitle = (
  txStatus: TransactionStatus,
  tokenAddress: Address | undefined,
  ensName: string | null
): string => {
  let addressText
  if (ensName) {
    addressText = i18n.t(' with {{ensName}}', { ensName })
  } else if (tokenAddress) {
    const address = shortenAddress(tokenAddress)
    addressText = i18n.t(' with {{address}}', { address })
  } else {
    addressText = ''
  }

  return txStatus === TransactionStatus.Success
    ? i18n.t('Transacted{{addressText}}.', { addressText })
    : i18n.t('Failed to transact{{addressText}}.', { addressText })
}

const formTransferTxTitle = (
  txType: TransactionType,
  txStatus: TransactionStatus,
  assetInfo: string,
  senderOrRecipient: string
): string => {
  if (txType === TransactionType.Send) {
    return txStatus === TransactionStatus.Success
      ? i18n.t('Sent {{assetInfo}} to {{senderOrRecipient}}.', { assetInfo, senderOrRecipient })
      : txStatus === TransactionStatus.Cancelled
      ? i18n.t('Canceled {{assetInfo}} send.', { assetInfo, senderOrRecipient })
      : i18n.t('Failed to send {{assetInfo}} to {{senderOrRecipient}}.', {
          assetInfo,
          senderOrRecipient,
        })
  }

  return i18n.t('Received {{assetInfo}} from {{senderOrRecipient}}.', {
    assetInfo,
    senderOrRecipient,
  })
}

const getShortenedAddressOrEns = (addressOrENS: string): string => {
  return getValidAddress(addressOrENS) ? shortenAddress(addressOrENS) : addressOrENS
}
