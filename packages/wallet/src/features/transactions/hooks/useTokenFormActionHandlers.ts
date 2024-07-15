import { AnyAction } from '@reduxjs/toolkit'
import { useCallback } from 'react'
import { transactionStateActions } from 'wallet/src/features/transactions/transactionState/transactionState'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'

/** Set of handlers wrapping actions involving user input */
export function useTokenFormActionHandlers(dispatch: React.Dispatch<AnyAction>): {
  onCreateTxId: (txId: string) => void
  onFocusInput: () => void
  onFocusOutput: () => void
  onSwitchCurrencies: () => void
  onToggleFiatInput: (isFiatInput: boolean) => void
  onSetExactAmount: (field: CurrencyField, value: string, isFiatInput?: boolean) => void
  onSetMax: (amount: string) => void
} {
  const onUpdateExactTokenAmount = useCallback(
    (field: CurrencyField, amount: string) =>
      dispatch(transactionStateActions.updateExactAmountToken({ field, amount })),
    [dispatch]
  )

  const onUpdateExactUSDAmount = useCallback(
    (field: CurrencyField, amount: string) =>
      dispatch(transactionStateActions.updateExactAmountFiat({ field, amount })),
    [dispatch]
  )

  const onSetExactAmount = useCallback(
    (field: CurrencyField, value: string, isFiatInput?: boolean) => {
      const updater = isFiatInput ? onUpdateExactUSDAmount : onUpdateExactTokenAmount
      updater(field, value)
    },
    [onUpdateExactUSDAmount, onUpdateExactTokenAmount]
  )

  const onSetMax = useCallback(
    (amount: string) => {
      // when setting max amount, always switch to token mode because
      // our token/usd updater doesnt handle this case yet
      dispatch(transactionStateActions.toggleFiatInput(false))
      dispatch(
        transactionStateActions.updateExactAmountToken({ field: CurrencyField.INPUT, amount })
      )
      // Unfocus the CurrencyInputField by setting focusOnCurrencyField to null
      dispatch(transactionStateActions.onFocus(null))
    },
    [dispatch]
  )

  const onSwitchCurrencies = useCallback(() => {
    dispatch(transactionStateActions.switchCurrencySides())
  }, [dispatch])

  const onToggleFiatInput = useCallback(
    (isFiatInput: boolean) => dispatch(transactionStateActions.toggleFiatInput(isFiatInput)),
    [dispatch]
  )

  const onCreateTxId = useCallback(
    (txId: string) => dispatch(transactionStateActions.setTxId(txId)),
    [dispatch]
  )

  const onFocusInput = useCallback(
    () => dispatch(transactionStateActions.onFocus(CurrencyField.INPUT)),
    [dispatch]
  )
  const onFocusOutput = useCallback(
    () => dispatch(transactionStateActions.onFocus(CurrencyField.OUTPUT)),
    [dispatch]
  )
  return {
    onCreateTxId,
    onFocusInput,
    onFocusOutput,
    onSwitchCurrencies,
    onToggleFiatInput,
    onSetExactAmount,
    onSetMax,
  }
}
