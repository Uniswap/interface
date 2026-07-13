import type { ParsedQs } from 'qs'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { chainIdToPlatform } from 'uniswap/src/features/platforms/utils/chains'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import type { CurrencyState } from '~/features/Swap/state/types'
import type { SerializedCurrencyState, SwapState } from '~/pages/Swap/Swap/state/tradeCurrencyStateTypes'
import { getParsedChainId } from '~/utils/params/chainParams'
import { parseCurrencyFromURLParameter } from '~/utils/params/currencyParams'

function parseFromURLParameter(urlParam: ParsedQs[string]): string | undefined {
  if (typeof urlParam === 'string') {
    return urlParam
  }
  return undefined
}

interface BaseSwapParams {
  chainId?: UniverseChainId
  outputChainId?: UniverseChainId
  inputCurrency?: string
  outputCurrency?: string
  typedValue?: string
  independentField?: CurrencyField
}

function createBaseSwapURLParams({
  chainId,
  outputChainId,
  inputCurrency,
  outputCurrency,
  typedValue,
  independentField,
}: BaseSwapParams): URLSearchParams {
  const params = new URLSearchParams()

  if (chainId) {
    params.set('chain', getChainInfo(chainId).interfaceName)
  }

  if (outputChainId && outputChainId !== chainId) {
    params.set('outputChain', getChainInfo(outputChainId).interfaceName)
  }

  if (inputCurrency) {
    params.set('inputCurrency', inputCurrency)
  }

  if (outputCurrency) {
    params.set('outputCurrency', outputCurrency)
  }

  if (typedValue) {
    params.set('value', typedValue)
  }

  if (independentField) {
    params.set('field', independentField)
  }

  return params
}

export function serializeSwapStateToURLParameters(
  state: CurrencyState & Partial<SwapState> & { chainId: UniverseChainId },
): string {
  const { inputCurrency, outputCurrency, typedValue, independentField, chainId } = state
  const hasValidInput = (inputCurrency || outputCurrency) && typedValue

  return (
    '?' +
    createBaseSwapURLParams({
      chainId,
      outputChainId: outputCurrency?.chainId !== inputCurrency?.chainId ? outputCurrency?.chainId : undefined,
      inputCurrency: inputCurrency ? (inputCurrency.isNative ? NATIVE_CHAIN_ID : inputCurrency.address) : undefined,
      outputCurrency: outputCurrency ? (outputCurrency.isNative ? NATIVE_CHAIN_ID : outputCurrency.address) : undefined,
      typedValue: hasValidInput ? typedValue : undefined,
      independentField: hasValidInput ? independentField : undefined,
    }).toString()
  )
}

export function serializeSwapAddressesToURLParameters({
  inputTokenAddress,
  outputTokenAddress,
  chainId,
  outputChainId,
  exactCurrencyField,
  exactAmountToken,
}: {
  inputTokenAddress?: string
  outputTokenAddress?: string
  chainId?: UniverseChainId | null
  outputChainId?: UniverseChainId | null
  exactCurrencyField?: CurrencyField
  exactAmountToken?: string
}): string {
  const chainIdOrDefault = chainId ?? UniverseChainId.Mainnet

  return (
    '?' +
    createBaseSwapURLParams({
      chainId: chainId ?? undefined,
      outputChainId: outputChainId ?? undefined,
      inputCurrency: inputTokenAddress
        ? inputTokenAddress === getNativeAddress(chainIdOrDefault)
          ? NATIVE_CHAIN_ID
          : inputTokenAddress
        : undefined,
      outputCurrency: outputTokenAddress
        ? outputTokenAddress === getNativeAddress(outputChainId ?? chainIdOrDefault)
          ? NATIVE_CHAIN_ID
          : outputTokenAddress
        : undefined,
      typedValue: exactAmountToken,
      independentField: exactCurrencyField,
    }).toString()
  )
}

export function queryParametersToCurrencyState(parsedQs: ParsedQs): SerializedCurrencyState {
  const chainId = getParsedChainId(parsedQs)
  const outputChainId = getParsedChainId(parsedQs, CurrencyField.OUTPUT)
  const parsedInputCurrencyAddress = parseCurrencyFromURLParameter(
    parsedQs.inputCurrency || parsedQs.inputcurrency,
    chainIdToPlatform(chainId ?? UniverseChainId.Mainnet),
  )
  const parsedOutputCurrencyAddress = parseCurrencyFromURLParameter(
    parsedQs.outputCurrency || parsedQs.outputcurrency,
    chainIdToPlatform(outputChainId ?? UniverseChainId.Mainnet),
  )
  const outputCurrencyAddress =
    parsedOutputCurrencyAddress === parsedInputCurrencyAddress && outputChainId === chainId
      ? undefined
      : parsedOutputCurrencyAddress
  const hasCurrencyInput = parsedInputCurrencyAddress || outputCurrencyAddress
  const value = hasCurrencyInput ? parseFromURLParameter(parsedQs.value) : undefined
  const field = value ? parseFromURLParameter(parsedQs.field) : undefined

  return {
    inputCurrencyAddress: parsedInputCurrencyAddress,
    outputCurrencyAddress,
    value,
    field,
    chainId,
    outputChainId,
  }
}
