import { BigNumber } from 'ethers'
import { openModal } from 'src/features/modals/modalSlice'
import { put } from 'typed-redux-saga'
import { logger } from 'utilities/src/logger/logger'
import { ALL_SUPPORTED_CHAIN_IDS } from 'wallet/src/constants/chains'
import { AssetType, CurrencyAsset } from 'wallet/src/entities/assets'
import {
  CurrencyField,
  TransactionState,
} from 'wallet/src/features/transactions/transactionState/types'
import { ModalName } from 'wallet/src/telemetry/constants'
import { getValidAddress } from 'wallet/src/utils/addresses'
import { currencyIdToAddress, currencyIdToChain } from 'wallet/src/utils/currencyId'

export function* handleSwapLink(url: URL) {
  try {
    const {
      inputChain,
      inputAddress,
      outputChain,
      outputAddress,
      exactCurrencyField,
      exactAmountToken,
    } = parseAndValidateSwapParams(url)

    const inputAsset: CurrencyAsset = {
      address: inputAddress,
      chainId: inputChain,
      type: AssetType.Currency,
    }

    const outputAsset: CurrencyAsset = {
      address: outputAddress,
      chainId: outputChain,
      type: AssetType.Currency,
    }

    const swapFormState: TransactionState = {
      [CurrencyField.INPUT]: inputAsset,
      [CurrencyField.OUTPUT]: outputAsset,
      exactCurrencyField,
      exactAmountToken,
    }

    yield* put(openModal({ name: ModalName.Swap, initialState: swapFormState }))
  } catch (error) {
    logger.error(error, { tags: { file: 'handleSwapLinkSaga', function: 'handleSwapLink' } })
    yield* put(openModal({ name: ModalName.Swap }))
  }
}

const parseAndValidateSwapParams = (url: URL) => {
  const inputCurrencyId = url.searchParams.get('inputCurrencyId')
  const outputCurrencyId = url.searchParams.get('outputCurrencyId')
  const currencyField = url.searchParams.get('currencyField')
  const exactAmountToken = url.searchParams.get('amount') ?? '0'

  if (!inputCurrencyId) {
    throw new Error('No inputCurrencyId')
  }

  if (!outputCurrencyId) {
    throw new Error('No outputCurrencyId')
  }

  const inputChain = currencyIdToChain(inputCurrencyId)
  const inputAddress = currencyIdToAddress(inputCurrencyId)

  const outputChain = currencyIdToChain(outputCurrencyId)
  const outputAddress = currencyIdToAddress(outputCurrencyId)

  if (!inputChain || !inputAddress) {
    throw new Error('Invalid inputCurrencyId. Must be of format `<chainId>-<tokenAddress>`')
  }

  if (!outputChain || !outputAddress) {
    throw new Error('Invalid outputCurrencyId. Must be of format `<chainId>-<tokenAddress>`')
  }

  if (!getValidAddress(inputAddress, true)) {
    throw new Error('Invalid tokenAddress provided within inputCurrencyId')
  }

  if (!getValidAddress(outputAddress, true)) {
    throw new Error('Invalid tokenAddress provided within outputCurrencyId')
  }

  if (!ALL_SUPPORTED_CHAIN_IDS.includes(inputChain)) {
    throw new Error('Invalid inputCurrencyId. Chain ID is not supported')
  }

  if (!ALL_SUPPORTED_CHAIN_IDS.includes(outputChain)) {
    throw new Error('Invalid outputCurrencyId. Chain ID is not supported')
  }

  try {
    BigNumber.from(exactAmountToken).toNumber() // throws if exactAmount string is not a valid number
  } catch (error) {
    throw new Error('Invalid swap amount')
  }

  if (
    !currencyField ||
    (currencyField.toLowerCase() !== 'input' && currencyField.toLowerCase() !== 'output')
  ) {
    throw new Error('Invalid currencyField. Must be either `input` or `output`')
  }

  const exactCurrencyField =
    currencyField.toLowerCase() === 'output' ? CurrencyField.OUTPUT : CurrencyField.INPUT

  return {
    inputChain,
    inputAddress,
    outputChain,
    outputAddress,
    exactCurrencyField,
    exactAmountToken,
  }
}
