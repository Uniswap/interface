import { useMemo } from 'react'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { AssetType, CurrencyAsset } from 'uniswap/src/entities/assets'
import {
  CurrencyField,
  TradeProtocolPreference,
  TransactionState,
} from 'uniswap/src/features/transactions/transactionState/types'
import { WalletChainId } from 'uniswap/src/types/chains'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { SwapFormState } from 'wallet/src/features/transactions/contexts/SwapFormContext'

export function useSwapPrefilledState(initialState: TransactionState | undefined): SwapFormState | undefined {
  const swapPrefilledState = useMemo(
    (): SwapFormState | undefined =>
      initialState
        ? {
            customSlippageTolerance: initialState.customSlippageTolerance,
            exactAmountFiat: initialState.exactAmountFiat,
            exactAmountToken: initialState.exactAmountToken,
            exactCurrencyField: initialState.exactCurrencyField,
            focusOnCurrencyField: getFocusOnCurrencyFieldFromInitialState(initialState),
            input: initialState.input ?? undefined,
            output: initialState.output ?? undefined,
            selectingCurrencyField: initialState.selectingCurrencyField,
            txId: initialState.txId,
            isFiatMode: false,
            isSubmitting: false,
            tradeProtocolPreference: TradeProtocolPreference.Default,
          }
        : undefined,
    [initialState],
  )

  return swapPrefilledState
}

export function getFocusOnCurrencyFieldFromInitialState({
  focusOnCurrencyField,
  input,
  output,
  exactCurrencyField,
}: TransactionState): CurrencyField | undefined {
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
  currencyChainId: WalletChainId
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
  }

  return swapFormState
}
