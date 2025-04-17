import { useMemo } from 'react'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { AssetType, CurrencyAsset } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SwapFormState } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { DEFAULT_PROTOCOL_OPTIONS } from 'uniswap/src/features/transactions/swap/utils/protocols'
import { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { CurrencyField } from 'uniswap/src/types/currency'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'

export function useSwapPrefilledState(initialState: TransactionState | undefined): SwapFormState | undefined {
  const swapPrefilledState = useMemo((): SwapFormState | undefined => {
    if (!initialState) {
      return undefined
    }

    const inputChainFilterOverride =
      initialState?.selectingCurrencyField === CurrencyField.INPUT && initialState?.selectingCurrencyChainId
        ? initialState?.selectingCurrencyChainId
        : undefined
    const outputChainFilterOverride =
      initialState?.selectingCurrencyField === CurrencyField.OUTPUT && initialState?.selectingCurrencyChainId
        ? initialState?.selectingCurrencyChainId
        : undefined

    return {
      exactAmountFiat: initialState.exactAmountFiat,
      exactAmountToken: initialState.exactAmountToken,
      exactCurrencyField: initialState.exactCurrencyField,
      filteredChainIds: {
        [CurrencyField.INPUT]: inputChainFilterOverride ?? initialState.output?.chainId,
        [CurrencyField.OUTPUT]: outputChainFilterOverride ?? initialState.input?.chainId,
      },
      focusOnCurrencyField: getFocusOnCurrencyFieldFromInitialState(initialState),
      input: initialState.input ?? undefined,
      output: initialState.output ?? undefined,
      selectingCurrencyField: initialState.selectingCurrencyField,
      txId: initialState.txId,
      isFiatMode: false,
      isSubmitting: false,
      isMax: false,
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

  const opposedToken = areAddressesEqual(nativeTokenAddress, currencyAddress) ? null : nativeToken

  const swapFormState: TransactionState = {
    exactCurrencyField: currencyField,
    exactAmountToken: '',
    [CurrencyField.INPUT]: currencyField === CurrencyField.INPUT ? chosenToken : opposedToken,
    [CurrencyField.OUTPUT]: currencyField === CurrencyField.OUTPUT ? chosenToken : opposedToken,
    selectedProtocols: DEFAULT_PROTOCOL_OPTIONS,
  }

  return swapFormState
}
