import { Currency, TradeType } from '@uniswap/sdk-core'
import { AssetType, CurrencyAsset } from 'uniswap/src/entities/assets'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import {
  TransactionDetails,
  TransactionType,
  isBridgeTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyAddress, currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { getAmountsFromTrade } from 'wallet/src/features/transactions/getAmountsFromTrade'

interface Props {
  transactionDetails: TransactionDetails
  inputCurrency: Maybe<Currency>
  outputCurrency: Maybe<Currency>
}

/**
 * Used to synchronously create swap form state given a transaction and relevant currencies.
 */
export function createSwapFormFromTxDetails({
  transactionDetails,
  inputCurrency,
  outputCurrency,
}: Props): TransactionState | undefined {
  const chainId = transactionDetails?.chainId

  if (!chainId) {
    return undefined
  }

  try {
    const { typeInfo } = transactionDetails
    const isBridging = isBridgeTypeInfo(typeInfo)

    if (typeInfo.type !== TransactionType.Swap && !isBridging) {
      throw new Error(
        `Tx with id ${transactionDetails.id}, hash ${transactionDetails.hash} does not correspond to a swap tx. It is of type ${typeInfo.type}`,
      )
    }

    const { inputCurrencyAmountRaw, outputCurrencyAmountRaw } = getAmountsFromTrade(typeInfo)
    const inputAddress = currencyIdToAddress(typeInfo.inputCurrencyId)
    const outputAddress = currencyIdToAddress(typeInfo.outputCurrencyId)
    const outputChainId = currencyIdToChain(typeInfo.outputCurrencyId)

    const inputAsset: CurrencyAsset = {
      address: inputAddress,
      chainId,
      type: AssetType.Currency,
    }

    const outputAsset: CurrencyAsset | null = outputChainId
      ? {
          address: outputAddress,
          chainId: outputChainId,
          type: AssetType.Currency,
        }
      : null

    const exactCurrencyField = isBridging
      ? CurrencyField.INPUT
      : typeInfo.tradeType === TradeType.EXACT_OUTPUT
        ? CurrencyField.OUTPUT
        : CurrencyField.INPUT

    const { value, currency } =
      exactCurrencyField === CurrencyField.INPUT
        ? { value: inputCurrencyAmountRaw, currency: inputCurrency }
        : { value: outputCurrencyAmountRaw, currency: outputCurrency }

    const exactAmount = getCurrencyAmount({ value, valueType: ValueType.Raw, currency })

    const swapFormState: TransactionState = {
      [CurrencyField.INPUT]: inputAsset,
      [CurrencyField.OUTPUT]: outputAsset,
      exactCurrencyField,
      exactAmountToken: exactAmount?.toExact() ?? '',
    }

    return swapFormState
  } catch (error) {
    logger.error(error, {
      tags: { file: 'createSwapFormFromTxDetails', function: 'createSwapFormFromTxDetails' },
    })
    return undefined
  }
}

/**
 * Used to synchronously create wrap form state given a transaction and relevant currencies.
 */
export function createWrapFormFromTxDetails({
  transactionDetails,
  inputCurrency,
  outputCurrency,
}: Props): TransactionState | undefined {
  const txHash = transactionDetails?.hash
  const chainId = transactionDetails?.chainId

  if (!chainId || !txHash || !inputCurrency || !outputCurrency) {
    return undefined
  }

  try {
    const { typeInfo } = transactionDetails

    if (typeInfo.type !== TransactionType.Wrap) {
      throw new Error(`Tx hash ${txHash} does not correspond to a wrap tx. It is of type ${typeInfo.type}`)
    }

    const currencyAmountRaw = typeInfo.currencyAmountRaw

    const inputAddress = currencyAddress(inputCurrency)
    const outputAddress = currencyAddress(outputCurrency)

    const inputAsset: CurrencyAsset = {
      address: inputAddress,
      chainId,
      type: AssetType.Currency,
    }

    const outputAsset: CurrencyAsset = {
      address: outputAddress,
      chainId,
      type: AssetType.Currency,
    }

    const exactAmount = getCurrencyAmount({
      value: currencyAmountRaw,
      valueType: ValueType.Raw,
      currency: inputCurrency,
    })

    const swapFormState: TransactionState = {
      [CurrencyField.INPUT]: inputAsset,
      [CurrencyField.OUTPUT]: outputAsset,
      exactCurrencyField: CurrencyField.INPUT,
      exactAmountToken: exactAmount?.toExact() ?? '',
    }

    return swapFormState
  } catch (error) {
    logger.error(error, {
      tags: { file: 'createSwapFormFromTxDetails', function: 'createWrapFormFromTxDetails' },
    })
    return undefined
  }
}
