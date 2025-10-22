import type { RefObject } from 'react'
import { type MutableRefObject } from 'react'
import type { TextInputProps } from 'react-native'
import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import { isMaxPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/utils'
import type { CurrencyInputPanelRef } from 'uniswap/src/components/CurrencyInputPanel/types'
import type { DecimalPadInputRef } from 'uniswap/src/features/transactions/components/DecimalPadInput/DecimalPadInput'
import { useDecimalPadControlledField } from 'uniswap/src/features/transactions/swap/form/hooks/useDecimalPadControlledField'
import { useOnToggleIsFiatMode } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/hooks/useOnToggleIsFiatMode'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { maybeLogFirstSwapAction } from 'uniswap/src/features/transactions/swap/utils/maybeLogFirstSwapAction'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isWebPlatform } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

const ON_SELECTION_CHANGE_WAIT_TIME_MS = 500

export function useSwapFormScreenCallbacks({
  exactOutputWouldFailIfCurrenciesSwitched,
  exactFieldIsInput,
  isBridge,
  formattedDerivedValueRef,
  inputRef,
  outputRef,
  decimalPadRef,
  inputSelectionRef,
  outputSelectionRef,
}: {
  exactOutputWouldFailIfCurrenciesSwitched: boolean
  exactFieldIsInput: boolean
  isBridge: boolean
  formattedDerivedValueRef: MutableRefObject<string>
  inputRef: RefObject<CurrencyInputPanelRef>
  outputRef: RefObject<CurrencyInputPanelRef>
  decimalPadRef: RefObject<DecimalPadInputRef>
  inputSelectionRef: MutableRefObject<TextInputProps['selection']>
  outputSelectionRef: MutableRefObject<TextInputProps['selection']>
}): {
  resetSelection: (args: { start: number; end?: number; currencyField?: CurrencyField }) => void
  moveCursorToEnd: (args: { targetInputRef: MutableRefObject<string> }) => void
  onDecimalPadTriggerInputShake: () => void
  onInputSelectionChange: (start: number, end: number) => void
  onOutputSelectionChange: (start: number, end: number) => void
  onFocusInput: () => void
  onFocusOutput: () => void
  onShowTokenSelectorInput: () => void
  onShowTokenSelectorOutput: () => void
  onSetExactAmount: (currencyField: CurrencyField, amount: string) => void
  onSetExactAmountInput: (amount: string) => void
  onSetExactAmountOutput: (amount: string) => void
  onSetPresetValue: (amount: string, percentage: PresetPercentage) => void
  onToggleIsFiatMode: (currencyField: CurrencyField) => void
  onSwitchCurrencies: () => void
} {
  const trace = useTrace()

  const {
    amountUpdatedTimeRef,
    exactAmountTokenRef,
    exactCurrencyField,
    focusOnCurrencyField,
    input,
    isFiatMode,
    output,
    updateSwapForm,
  } = useSwapFormStore((s) => ({
    amountUpdatedTimeRef: s.amountUpdatedTimeRef,
    exactAmountTokenRef: s.exactAmountTokenRef,
    exactCurrencyField: s.exactCurrencyField,
    focusOnCurrencyField: s.focusOnCurrencyField,
    isFiatMode: s.isFiatMode,
    output: s.output,
    input: s.input,
    updateSwapForm: s.updateSwapForm,
  }))

  const decimalPadControlledField = useDecimalPadControlledField()

  const resetSelection = useEvent(
    ({ start, end, currencyField }: { start: number; end?: number; currencyField?: CurrencyField }) => {
      // Update refs first to have the latest selection state available in the DecimalPadInput
      // component and properly update disabled keys of the decimal pad.
      // We reset the native selection on the next tick because we need to wait for the native input to be updated.
      // This is needed because of the combination of state (delayed update) + ref (instant update) to improve performance.
      const _currencyField = currencyField ?? decimalPadControlledField
      const selectionRef = _currencyField === CurrencyField.INPUT ? inputSelectionRef : outputSelectionRef
      const inputFieldRef =
        _currencyField === CurrencyField.INPUT ? inputRef.current?.textInputRef : outputRef.current?.textInputRef

      selectionRef.current = { start, end }

      if (!isWebPlatform && inputFieldRef) {
        setTimeout(() => {
          inputFieldRef.current?.setNativeProps({ selection: { start, end } })
        }, 0)
      }
    },
  )

  const moveCursorToEnd = useEvent(({ targetInputRef }: { targetInputRef: MutableRefObject<string> }) => {
    resetSelection({
      start: targetInputRef.current.length,
      end: targetInputRef.current.length,
    })
  })

  const onDecimalPadTriggerInputShake = useEvent(() => {
    switch (decimalPadControlledField) {
      case CurrencyField.INPUT:
        inputRef.current?.triggerShakeAnimation()
        break
      case CurrencyField.OUTPUT:
        outputRef.current?.triggerShakeAnimation()
        break
    }
  })

  const onInputSelectionChange = useEvent((start: number, end: number) => {
    if (Date.now() - amountUpdatedTimeRef.current < ON_SELECTION_CHANGE_WAIT_TIME_MS) {
      // We only want to trigger this callback when the user is manually moving the cursor,
      // but this function is also triggered when the input value is updated, which causes issues on Android.
      // We use `amountUpdatedTimeRef` to check if the input value was updated recently, and if so, we assume that the user is actually typing and not manually moving the cursor.
      return
    }
    inputSelectionRef.current = { start, end }
    decimalPadRef.current?.updateDisabledKeys()
  })

  const onOutputSelectionChange = useEvent((start: number, end: number) => {
    if (Date.now() - amountUpdatedTimeRef.current < ON_SELECTION_CHANGE_WAIT_TIME_MS) {
      // See explanation in `onInputSelectionChange`.
      return
    }
    outputSelectionRef.current = { start, end }
    decimalPadRef.current?.updateDisabledKeys()
  })

  const onFocusInput = useEvent((): void =>
    updateSwapForm({
      focusOnCurrencyField: CurrencyField.INPUT,
    }),
  )

  const onFocusOutput = useEvent((): void =>
    updateSwapForm({
      focusOnCurrencyField: CurrencyField.OUTPUT,
    }),
  )

  const onShowTokenSelectorInput = useEvent((): void => {
    updateSwapForm({
      selectingCurrencyField: CurrencyField.INPUT,
    })
  })

  const onShowTokenSelectorOutput = useEvent((): void => {
    updateSwapForm({
      selectingCurrencyField: CurrencyField.OUTPUT,
    })
  })

  const onSetExactAmount = useEvent((currencyField: CurrencyField, amount: string) => {
    const currentIsFiatMode = isFiatMode && focusOnCurrencyField === exactCurrencyField
    updateSwapForm({
      exactAmountFiat: currentIsFiatMode ? amount : undefined,
      exactAmountToken: currentIsFiatMode ? undefined : amount,
      exactCurrencyField: currencyField,
      isFiatMode: currentIsFiatMode,
      presetPercentage: undefined,
    })

    maybeLogFirstSwapAction(trace)
  })

  const onSetExactAmountInput = useEvent((amount: string) => {
    onSetExactAmount(CurrencyField.INPUT, amount)
  })

  const onSetExactAmountOutput = useEvent((amount: string) => {
    onSetExactAmount(CurrencyField.OUTPUT, amount)
  })

  const onSetPresetValue = useEvent((amount: string, percentage: PresetPercentage): void => {
    updateSwapForm({
      exactAmountFiat: undefined,
      exactAmountToken: amount,
      exactCurrencyField: CurrencyField.INPUT,
      focusOnCurrencyField: undefined,
      isMax: isMaxPercentage(percentage),
      presetPercentage: percentage,
    })

    // We want this update to happen on the next tick, after the input value is updated.
    setTimeout(() => {
      moveCursorToEnd({ targetInputRef: exactAmountTokenRef })
      decimalPadRef.current?.updateDisabledKeys()
    }, 0)

    maybeLogFirstSwapAction(trace)
  })

  // Reset selection based the new input value (token, or fiat), and toggle fiat mode
  const onToggleIsFiatMode = useOnToggleIsFiatMode({
    formattedDerivedValueRef,
    moveCursorToEnd,
  })

  const onSwitchCurrencies = useEvent(() => {
    // If exact output would fail if currencies switch, we never want to have OUTPUT as exact field / focused field
    const newExactCurrencyField = isBridge
      ? CurrencyField.INPUT
      : exactOutputWouldFailIfCurrenciesSwitched
        ? CurrencyField.INPUT
        : exactFieldIsInput
          ? CurrencyField.OUTPUT
          : CurrencyField.INPUT

    // If for a bridge, when currencies are switched, update the new output to the old output chainId and change input to all networks
    const newFilteredChainIds = isBridge
      ? {
          input: undefined,
          output: output?.chainId,
        }
      : undefined

    updateSwapForm({
      exactCurrencyField: newExactCurrencyField,
      focusOnCurrencyField: newExactCurrencyField,
      input: output,
      output: input,
      // Preserve the derived output amount if we force exact field to be input to keep USD value of the trade constant after switching
      ...(exactOutputWouldFailIfCurrenciesSwitched && exactFieldIsInput && !isFiatMode
        ? { exactAmountToken: formattedDerivedValueRef.current }
        : undefined),
      ...(isBridge ? { filteredChainIds: newFilteredChainIds } : undefined),
    })

    // When we have FOT disable exact output logic, the cursor gets out of sync when switching currencies
    setTimeout(() => {
      moveCursorToEnd({ targetInputRef: exactAmountTokenRef })
    }, 0)

    maybeLogFirstSwapAction(trace)
  })

  return {
    resetSelection,
    moveCursorToEnd,
    onDecimalPadTriggerInputShake,
    onInputSelectionChange,
    onOutputSelectionChange,
    onFocusInput,
    onFocusOutput,
    onShowTokenSelectorInput,
    onShowTokenSelectorOutput,
    onSetExactAmount,
    onSetExactAmountInput,
    onSetExactAmountOutput,
    onSetPresetValue,
    onToggleIsFiatMode,
    onSwitchCurrencies,
  }
}
