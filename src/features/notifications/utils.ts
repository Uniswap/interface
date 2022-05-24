import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { i18n } from 'src/app/i18n'
import { SpotPrices } from 'src/features/dataApi/types'
import { NFTAsset } from 'src/features/nfts/types'
import { WalletConnectNotification } from 'src/features/notifications/types'
import { TransactionStatus, TransactionType } from 'src/features/transactions/types'
import { WalletConnectEvent } from 'src/features/walletConnect/saga'
import { isValidAddress, shortenAddress } from 'src/utils/addresses'
import { buildCurrencyId, currencyIdToAddress } from 'src/utils/currencyId'
import { formatCurrencyAmount, formatUSDPrice } from 'src/utils/format'

export const formWCNotificationTitle = (appNotification: WalletConnectNotification) => {
  const { event, dappName } = appNotification

  switch (event) {
    case WalletConnectEvent.Connected:
      return i18n.t('Connected to {{dappName}}', { dappName })
    case WalletConnectEvent.Disconnected:
      return i18n.t('Disconnected from {{dappName}}', { dappName })
  }
}

export const formApproveNotificationTitle = (
  txStatus: TransactionStatus,
  currency: Nullable<Currency>,
  tokenAddress: Address,
  spender: Address
) => {
  const currencySymbol = getCurrencySymbol(currency, tokenAddress)
  const address = shortenAddress(spender)
  return txStatus === TransactionStatus.Success
    ? i18n.t('Approved {{currencySymbol}} for use with {{address}}.', {
        currencySymbol,
        address,
      })
    : i18n.t('Failed to approve {{currencySymbol}} for use with {{address}}.', {
        currencySymbol,
        address,
      })
}

export const formSwapNotificationTitle = (
  txStatus: TransactionStatus,
  tradeType: TradeType,
  inputCurrency: Nullable<Currency>,
  outputCurrency: Nullable<Currency>,
  inputCurrencyId: string,
  outputCurrencyId: string,
  inputCurrencyAmountRaw: string,
  outputCurrencyAmountRaw: string
) => {
  const inputCurrencySymbol = getCurrencySymbol(inputCurrency, currencyIdToAddress(inputCurrencyId))
  const outputCurrencySymbol = getCurrencySymbol(
    outputCurrency,
    currencyIdToAddress(outputCurrencyId)
  )

  const inputAmount = getFormattedCurrencyAmount(
    inputCurrency,
    inputCurrencyAmountRaw,
    tradeType === TradeType.EXACT_OUTPUT
  )
  const outputAmount = getFormattedCurrencyAmount(
    outputCurrency,
    outputCurrencyAmountRaw,
    tradeType === TradeType.EXACT_INPUT
  )

  const inputAssetInfo = `${inputAmount}${inputCurrencySymbol}`
  const outputAssetInfo = `${outputAmount}${outputCurrencySymbol}`

  return txStatus === TransactionStatus.Success
    ? i18n.t('Swapped {{inputAssetInfo}} for {{outputAssetInfo}}.', {
        inputAssetInfo,
        outputAssetInfo,
      })
    : i18n.t('Failed to swap {{inputAssetInfo}} for {{outputAssetInfo}}.', {
        inputAssetInfo,
        outputAssetInfo,
      })
}

export const formTransferCurrencyNotificationTitle = (
  txType: TransactionType,
  txStatus: TransactionStatus,
  currency: Nullable<Currency>,
  tokenAddress: string,
  currencyAmountRaw: string,
  senderOrRecipient: string
) => {
  const currencySymbol = getCurrencySymbol(currency, tokenAddress)
  const amount = getFormattedCurrencyAmount(currency, currencyAmountRaw)
  const shortenedAddressOrENS = getShortenedAddressOrEns(senderOrRecipient)
  return formTransferTxTitle(txType, txStatus, `${amount}${currencySymbol}`, shortenedAddressOrENS)
}

export const formTransferNFTNotificationTitle = (
  txType: TransactionType,
  txStatus: TransactionStatus,
  nft: NFTAsset.Asset | undefined,
  tokenAddress: Address,
  tokenId: string,
  senderOrRecipient: string
) => {
  const nftName = nft ? nft.name : `NFT ${shortenAddress(tokenAddress)} #${tokenId}`
  const shortenedAddressOrENS = getShortenedAddressOrEns(senderOrRecipient)
  return formTransferTxTitle(txType, txStatus, nftName, shortenedAddressOrENS)
}

export const formUnknownTxTitle = (
  txStatus: TransactionStatus,
  tokenAddress: Address | undefined,
  ensName: string | null
) => {
  let addressText
  if (ensName) {
    addressText = ` ${ensName}`
  } else if (tokenAddress) {
    const address = shortenAddress(tokenAddress)
    addressText = i18n.t(' with {{address}}', { address })
  } else {
    addressText = ''
  }

  return txStatus === TransactionStatus.Success
    ? i18n.t('Completed unknown transaction{{addressText}}.', { addressText })
    : i18n.t('Failed to complete unknown transaction{{addressText}}.', { addressText })
}

const formTransferTxTitle = (
  txType: TransactionType,
  txStatus: TransactionStatus,
  assetInfo: string,
  senderOrRecipient: string
) => {
  if (txType === TransactionType.Send) {
    return txStatus === TransactionStatus.Success
      ? i18n.t('Sent {{assetInfo}} to {{senderOrRecipient}}.', { assetInfo, senderOrRecipient })
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

export const createBalanceUpdate = (
  txStatus: TransactionStatus.Success | TransactionStatus.Failed,
  currency: Nullable<Currency>,
  currencyAmountRaw: string,
  spotPrices?: SpotPrices // despite what typescript says about `useSpotPrices`, `spotPrices` can be undefined while loading
) => {
  if (!currency || txStatus === TransactionStatus.Failed) return undefined

  const currencyAmount = getFormattedCurrencyAmount(currency, currencyAmountRaw)
  return {
    assetIncrease: `+${currencyAmount}${currency.symbol}`,
    usdIncrease: getUSDValue(spotPrices, currencyAmountRaw, currency),
  }
}

const getFormattedCurrencyAmount = (
  currency: Nullable<Currency>,
  currencyAmountRaw: string,
  isApproximateAmount = false
) => {
  if (!currency) return ''
  const currencyAmount = CurrencyAmount.fromRawAmount<Currency>(currency, currencyAmountRaw)
  const formattedAmount = formatCurrencyAmount(currencyAmount)
  return isApproximateAmount ? `~${formattedAmount} ` : `${formattedAmount} `
}

const getUSDValue = (
  spotPrices: SpotPrices | undefined,
  currencyAmountRaw: string,
  currency: Nullable<Currency>
) => {
  if (!currency || !spotPrices) return undefined

  const currencyId = buildCurrencyId(currency.chainId, currency.wrapped.address)
  if (!spotPrices[currencyId]) return undefined

  const usdValue =
    (Number(currencyAmountRaw) / 10 ** currency.decimals) * spotPrices[currencyId].price
  return formatUSDPrice(usdValue)
}

const getCurrencySymbol = (currency: Nullable<Currency>, tokenAddress: Address) =>
  currency?.symbol ? currency.symbol : shortenAddress(tokenAddress)

const getShortenedAddressOrEns = (addressOrENS: string) =>
  isValidAddress(addressOrENS) ? shortenAddress(addressOrENS) : addressOrENS
