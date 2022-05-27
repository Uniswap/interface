import { BigNumber } from 'ethers'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AssetType, CurrencyAsset } from 'src/entities/assets'
import { selectActiveChainIds } from 'src/features/chains/utils'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { Screens } from 'src/screens/Screens'
import { isValidAddress } from 'src/utils/addresses'
import { currencyIdToAddress, currencyIdToChain } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'
import { call } from 'typed-redux-saga'

export function* handleSwapLink(url: URL) {
  try {
    const {
      inputChain,
      inputAddress,
      outputChain,
      outputAddress,
      exactCurrencyField,
      exactAmount,
    } = yield* call(parseAndValidateSwapParams, url)

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
      exactAmount,
    }

    yield* call(navigate, Screens.Swap, { swapFormState })
  } catch (error: any) {
    logger.info('handleSwapLink', 'handleSwapLink', error?.message)
    yield* call(navigate, Screens.Swap)
  }
}

export function* parseAndValidateSwapParams(url: URL) {
  const inputCurrencyId = url.searchParams.get('inputCurrencyId')
  const outputCurrencyId = url.searchParams.get('outputCurrencyId')
  const currencyField = url.searchParams.get('currencyField')
  const exactAmount = url.searchParams.get('amount') ?? '0'

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

  if (!isValidAddress(inputAddress)) {
    throw new Error('Invalid tokenAddress provided within inputCurrencyId')
  }

  if (!isValidAddress(outputAddress)) {
    throw new Error('Invalid tokenAddress provided within outputCurrencyId')
  }

  const activeChainIds = yield* selectActiveChainIds()

  if (!activeChainIds.includes(inputChain)) {
    throw new Error('Invalid inputCurrencyId. Chain ID is not currently active')
  }

  if (!activeChainIds.includes(outputChain)) {
    throw new Error('Invalid outputCurrencyId. Chain ID is not currently active')
  }

  try {
    BigNumber.from(exactAmount).toNumber() // throws if exactAmount string is not a valid number
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
    exactAmount,
  }
}
