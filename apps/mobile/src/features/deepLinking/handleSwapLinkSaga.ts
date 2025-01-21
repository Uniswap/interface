import { BigNumber } from 'ethers'
import { openModal } from 'src/features/modals/modalSlice'
import { put } from 'typed-redux-saga'
import { AssetType, CurrencyAsset } from 'uniswap/src/entities/assets'
import { ALL_CHAIN_IDS, SUPPORTED_TESTNET_CHAIN_IDS, UniverseChainId } from 'uniswap/src/features/chains/types'
import { getEnabledChainIdsSaga } from 'uniswap/src/features/settings/saga'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'

/**
 * Opens swap modal with the provided swap link parameters; prompts testnet switch modal if necessary.
 *
 * Testing deep links:
 *  Testnet mode – https://uniswap.org/mobile-redirect?screen=swap&userAddress=<YOUR_WALET_ADDRESS>&inputCurrencyId=10143-0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701&outputCurrencyId=10143-0xF5A8061bB2C5D9Dc9bC9c5C633D870DAC7bD351e&currencyField=output&amount=100000
 *  Prod mode – https://uniswap.org/mobile-redirect?screen=swap&userAddress=<YOUR_WALET_ADDRESS>&inputCurrencyId=1-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&outputCurrencyId=10-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&currencyField=output&amount=100000
 *  Mixed – https://uniswap.org/mobile-redirect?screen=swap&userAddress=<YOUR_WALET_ADDRESS>&inputCurrencyId=1-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&outputCurrencyId=10143-0xF5A8061bB2C5D9Dc9bC9c5C633D870DAC7bD351e&currencyField=output&amount=100000
 *
 * @param url - URL object containing the swap link
 */
export function* handleSwapLink(url: URL) {
  try {
    const { inputChain, inputAddress, outputChain, outputAddress, exactCurrencyField, exactAmountToken } =
      parseAndValidateSwapParams(url)

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

    // both should match as of writing because of the check in parseAndValidateSwapParams,
    // but we're including an OR gate in case we update to allow only one chain to be passed
    const isTestnetChains =
      SUPPORTED_TESTNET_CHAIN_IDS.includes(inputChain) || SUPPORTED_TESTNET_CHAIN_IDS.includes(outputChain)
    const { isTestnetModeEnabled } = yield* getEnabledChainIdsSaga()

    // prefill modal irrespective of testnet mode alignment
    yield* put(openModal({ name: ModalName.Swap, initialState: swapFormState }))

    // if testnet mode isn't aligned with assets, prompt testnet switch modal (closes prefilled swap modal if rejected)
    if (isTestnetModeEnabled !== isTestnetChains) {
      yield* put(
        openModal({
          name: ModalName.TestnetSwitchModal,
          initialState: {
            switchToMode: isTestnetChains ? 'testnet' : 'production',
          },
        }),
      )
      return
    }
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

  const inputChain = currencyIdToChain(inputCurrencyId) as UniverseChainId
  const inputAddress = currencyIdToAddress(inputCurrencyId)

  const outputChain = currencyIdToChain(outputCurrencyId) as UniverseChainId
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

  if (!ALL_CHAIN_IDS.includes(inputChain)) {
    throw new Error('Invalid inputCurrencyId. Chain ID is not supported')
  }

  if (!ALL_CHAIN_IDS.includes(outputChain)) {
    throw new Error('Invalid outputCurrencyId. Chain ID is not supported')
  }

  try {
    BigNumber.from(exactAmountToken).toNumber() // throws if exactAmount string is not a valid number
  } catch (error) {
    throw new Error('Invalid swap amount')
  }

  if (!currencyField || (currencyField.toLowerCase() !== 'input' && currencyField.toLowerCase() !== 'output')) {
    throw new Error('Invalid currencyField. Must be either `input` or `output`')
  }

  const isInputTestnet = SUPPORTED_TESTNET_CHAIN_IDS.includes(inputChain)
  const isOutputTestnet = SUPPORTED_TESTNET_CHAIN_IDS.includes(outputChain)

  if (inputChain && outputChain && isInputTestnet !== isOutputTestnet) {
    throw new Error('Cannot swap between testnet and mainnet')
  }

  const exactCurrencyField = currencyField.toLowerCase() === 'output' ? CurrencyField.OUTPUT : CurrencyField.INPUT

  return {
    inputChain,
    inputAddress,
    outputChain,
    outputAddress,
    exactCurrencyField,
    exactAmountToken,
  }
}
