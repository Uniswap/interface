import { BigintIsh, Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { i18n } from 'src/app/i18n'
import { CHAIN_INFO } from 'src/constants/chains'
import { SpotPrices } from 'src/features/dataApi/types'
import { NFTAsset } from 'src/features/nfts/types'
import { WalletConnectNotification } from 'src/features/notifications/types'
import { TransactionStatus, TransactionType } from 'src/features/transactions/types'
import { WalletConnectEvent } from 'src/features/walletConnect/saga'
import { isValidAddress, shortenAddress } from 'src/utils/addresses'
import { buildCurrencyId, currencyIdToAddress } from 'src/utils/currencyId'
import { formatCurrencyAmount, formatUSDPrice } from 'src/utils/format'
import { logger } from 'src/utils/logger'

export const formWCNotificationTitle = (appNotification: WalletConnectNotification) => {
  const { event, dappName, chainId } = appNotification

  switch (event) {
    case WalletConnectEvent.Connected:
      return i18n.t('Connected')
    case WalletConnectEvent.Disconnected:
      return i18n.t('Disconnected')
    case WalletConnectEvent.NetworkChanged:
      const networkName = CHAIN_INFO[chainId]?.label
      return i18n.t('Switched to {{networkName}}', { networkName })
    case WalletConnectEvent.TransactionConfirmed:
      return i18n.t('Transaction confirmed with {{dappName}}', { dappName })
    case WalletConnectEvent.TransactionFailed:
      return i18n.t('Transaction failed with {{dappName}}', { dappName })
  }
}

export const formApproveNotificationTitle = (
  txStatus: TransactionStatus,
  currency: NullUndefined<Currency>,
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
  inputCurrency: NullUndefined<Currency>,
  outputCurrency: NullUndefined<Currency>,
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
  currency: NullUndefined<Currency>,
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

export interface BalanceUpdate {
  assetIncrease: string
  usdIncrease: string | undefined
}

export const createBalanceUpdate = (
  txType: TransactionType.Send | TransactionType.Receive | TransactionType.Swap,
  txStatus: TransactionStatus,
  currency: NullUndefined<Currency>,
  currencyAmountRaw: string,
  spotPrices?: SpotPrices // despite what typescript says about `useSpotPrices`, `spotPrices` can be undefined while loading
): BalanceUpdate | undefined => {
  if (
    !currency ||
    !(
      txStatus === TransactionStatus.Success ||
      txStatus === TransactionStatus.Pending ||
      txStatus === TransactionStatus.FailedCancel
    )
  ) {
    return undefined
  }

  const currencyAmount = getFormattedCurrencyAmount(currency, currencyAmountRaw)

  return {
    assetIncrease: `${txType === TransactionType.Send ? '-' : '+'}${currencyAmount}${
      currency.symbol
    }`,
    usdIncrease: getUSDValue(spotPrices, currencyAmountRaw, currency),
  }
}

export function convertScientificNotationToNumber(value: string) {
  let convertedValue: string | BigintIsh = value

  // Convert scientific notation into number format so it can be parsed by BigInt properly
  if (value.includes('e')) {
    const [xStr, eStr] = value.split('e')
    let x = Number(xStr)
    let e = Number(eStr)
    if (xStr.includes('.')) {
      const splitX = xStr.split('.')
      const decimalPlaces = splitX[1].split('').length
      e -= decimalPlaces
      x *= Math.pow(10, decimalPlaces)
    }
    try {
      convertedValue = JSBI.multiply(
        JSBI.BigInt(x),
        JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(e))
      )
    } catch (error) {
      // If the numbers can't be converted to BigInts then just do regular arithmetic (i.e. when the exponent is negative)
      logger.info(
        'notifications/utils',
        'convertScientificNotationToNumber',
        'BigInt arithmetic unsuccessful',
        e
      )
      convertedValue = (x * Math.pow(10, e)).toString()
    }
  }

  return convertedValue
}

export const getFormattedCurrencyAmount = (
  currency: NullUndefined<Currency>,
  currencyAmountRaw: string,
  isApproximateAmount = false
) => {
  if (!currency) return ''

  try {
    // Convert scientific notation into number format so it can be parsed by BigInt properly
    const parsedCurrencyAmountRaw: string | BigintIsh =
      convertScientificNotationToNumber(currencyAmountRaw)

    const currencyAmount = CurrencyAmount.fromRawAmount<Currency>(currency, parsedCurrencyAmountRaw)
    const formattedAmount = formatCurrencyAmount(currencyAmount)
    return isApproximateAmount ? `~${formattedAmount} ` : `${formattedAmount} `
  } catch (e) {
    logger.info('notifications/utils', 'getFormattedCurrencyAmount', 'could not format amount', e)
    return ''
  }
}

const getUSDValue = (
  spotPrices: SpotPrices | undefined,
  currencyAmountRaw: string,
  currency: NullUndefined<Currency>
) => {
  if (!currency || !spotPrices) return undefined

  const currencyId = buildCurrencyId(currency.chainId, currency.wrapped.address)
  if (!spotPrices[currencyId]) return undefined

  const usdValue =
    (Number(currencyAmountRaw) / 10 ** currency.decimals) * spotPrices[currencyId].price
  return formatUSDPrice(usdValue)
}

export const getCurrencySymbol = (
  currency: NullUndefined<Currency>,
  tokenAddressString: Address | undefined
) =>
  currency?.symbol
    ? currency.symbol
    : tokenAddressString && isValidAddress(tokenAddressString)
    ? shortenAddress(tokenAddressString)
    : tokenAddressString

const getShortenedAddressOrEns = (addressOrENS: string) =>
  isValidAddress(addressOrENS) ? shortenAddress(addressOrENS) : addressOrENS
