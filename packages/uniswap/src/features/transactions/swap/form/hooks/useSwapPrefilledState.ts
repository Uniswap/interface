import { useMemo } from 'react'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import type { CurrencyAsset } from 'uniswap/src/entities/assets'
import { AssetType } from 'uniswap/src/entities/assets'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { SwapFormState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'
import { DEFAULT_PROTOCOL_OPTIONS } from 'uniswap/src/features/transactions/swap/utils/protocols'
import type { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { CurrencyField } from 'uniswap/src/types/currency'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'

export function useSwapPrefilledState(initialState: TransactionState | undefined): SwapFormState | undefined {
  const swapPrefilledState = useMemo((): SwapFormState | undefined => {
    if (!initialState) {
      return undefined
    }

    const inputChainFilterOverride =
      initialState.filteredChainIdsOverride?.input ??
      (initialState.selectingCurrencyField === CurrencyField.INPUT ? initialState.selectingCurrencyChainId : undefined)
    const outputChainFilterOverride =
      initialState.filteredChainIdsOverride?.output ??
      (initialState.selectingCurrencyField === CurrencyField.OUTPUT ? initialState.selectingCurrencyChainId : undefined)

    return {
      exactAmountFiat: initialState.exactAmountFiat,
      exactAmountToken: initialState.exactAmountToken,
      exactCurrencyField: initialState.exactCurrencyField,
      filteredChainIds: {
        [CurrencyField.INPUT]: inputChainFilterOverride,
        [CurrencyField.OUTPUT]: outputChainFilterOverride,
      },
      focusOnCurrencyField: getFocusOnCurrencyFieldFromInitialState(initialState),
      input: initialState.input ?? undefined,
      output: initialState.output ?? undefined,
      selectingCurrencyField: initialState.selectingCurrencyField,
      txId: initialState.txId,
      isFiatMode: false,
      isSubmitting: false,
      isConfirmed: false,
      isMax: false,
      showPendingUI: false,
      instantReceiptFetchTime: undefined,
      instantOutputAmountRaw: undefined,
      txHash: undefined,
      txHashReceivedTime: undefined,
    }
  }, [initialState])

  return swapPrefilledState
}

export function getFocusOnCurrencyFieldFromInitialState({
  focusOnCurrencyField,
  skipFocusOnCurrencyField,
  input,
  output,
  exactCurrencyField,
}: TransactionState): CurrencyField | undefined {
  if (skipFocusOnCurrencyField) {
    return undefined
  }

  if (focusOnCurrencyField) {
    return focusOnCurrencyField
  }

  if (input && exactCurrencyField === CurrencyField.INPUT) {
    return CurrencyField.INPUT
  }

  if (output && exactCurrencyField === CurrencyField.OUTPUT) {
    return CurrencyField.OUTPUT
  }

  return undefined
}

export function getSwapPrefilledState({
  currencyAddress,
  currencyChainId,
  currencyField,
}: {
  currencyAddress: Address
  currencyChainId: UniverseChainId
  currencyField: CurrencyField
}): TransactionState {
  const nativeTokenAddress = getNativeAddress(currencyChainId)

  const nativeToken: CurrencyAsset = {
    address: nativeTokenAddress,
    chainId: currencyChainId,
    type: AssetType.Currency,
  }

  const chosenToken: CurrencyAsset = {
    address: currencyAddress,
    chainId: currencyChainId,
    type: AssetType.Currency,
  }

  const opposedToken = areAddressesEqual({
    addressInput1: { address: nativeTokenAddress, chainId: currencyChainId },
    addressInput2: { address: currencyAddress, chainId: currencyChainId },
  })
    ? null
    : nativeToken

  const swapFormState: TransactionState = {
    exactCurrencyField: currencyField,
    exactAmountToken: '',
    [CurrencyField.INPUT]: currencyField === CurrencyField.INPUT ? chosenToken : opposedToken,
    [CurrencyField.OUTPUT]: currencyField === CurrencyField.OUTPUT ? chosenToken : opposedToken,
    selectedProtocols: DEFAULT_PROTOCOL_OPTIONS,
  }

  return swapFormState
}
