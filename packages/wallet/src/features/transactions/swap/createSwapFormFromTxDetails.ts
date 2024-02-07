import { Currency, TradeType } from '@uniswap/sdk-core'
import { logger } from 'utilities/src/logger/logger'
import { AssetType, CurrencyAsset } from 'wallet/src/entities/assets'
import { getAmountsFromTrade } from 'wallet/src/features/transactions/getAmountsFromTrade'
import {
  CurrencyField,
  TransactionState,
} from 'wallet/src/features/transactions/transactionState/types'
import { TransactionDetails, TransactionType } from 'wallet/src/features/transactions/types'
import { currencyAddress, currencyIdToAddress } from 'wallet/src/utils/currencyId'
import { ValueType, getCurrencyAmount } from 'wallet/src/utils/getCurrencyAmount'

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
  const txHash = transactionDetails?.hash
  const chainId = transactionDetails?.chainId

  if (!chainId || !txHash) {
    return undefined
  }

  try {
    const { typeInfo } = transactionDetails

    if (typeInfo.type !== TransactionType.Swap) {
      throw new Error(
        `Tx hash ${txHash} does not correspond to a swap tx. It is of type ${typeInfo.type}`
      )
    }

    const { inputCurrencyAmountRaw, outputCurrencyAmountRaw } = getAmountsFromTrade(typeInfo)
    const inputAddress = currencyIdToAddress(typeInfo.inputCurrencyId)
    const outputAddress = currencyIdToAddress(typeInfo.outputCurrencyId)

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

    const exactCurrencyField =
      typeInfo.tradeType === TradeType.EXACT_OUTPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT

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
      throw new Error(
        `Tx hash ${txHash} does not correspond to a wrap tx. It is of type ${typeInfo.type}`
      )
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
  }
}
