import type { PropsWithChildren } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import type { TradeableAsset } from 'uniswap/src/entities/assets'
import { useMaxAmountSpend } from 'uniswap/src/features/gas/hooks/useMaxAmountSpend'
import { useSwapAnalytics } from 'uniswap/src/features/transactions/swap/analytics'
import {
  createSwapFormStore,
  INITIAL_SWAP_FORM_STATE,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/createSwapFormStore'
import { useDebouncedSwapFormAmounts } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/hooks/useDebouncedSwapFormAmounts'
import { useDefaultSwapFormState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/hooks/useDefaultSwapFormState'
import { useDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/hooks/useDerivedSwapInfo'
import { useFreezeWhileSubmitting } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/hooks/useFreezeWhileSubmitting'
import { useOpenOutputSelectorOnPrefilledStateChange } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/hooks/useOpenOutputSelectorOnPrefilledStateChange'
import { useUpdateSwapFormFromPrefilledCurrencies } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/hooks/useUpdateSwapFormFromPrefilledCurrencies'
import { SwapFormStoreContext } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/SwapFormStoreContext'
import type {
  SwapFormState,
  SwapFormStateForConsumers,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useEvent } from 'utilities/src/react/hooks'
import { useValueAsRef } from 'utilities/src/react/useValueAsRef'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'

const useCalculatedInitialDerivedSwapInfo = (
  partialSwapFormState: Pick<
    ReturnType<typeof useDefaultSwapFormState>,
    | 'exactAmountFiat'
    | 'exactAmountToken'
    | 'exactCurrencyField'
    | 'focusOnCurrencyField'
    | 'input'
    | 'output'
    | 'selectingCurrencyField'
    | 'txId'
  >,
): DerivedSwapInfo => {
  const {
    debouncedExactAmountToken,
    isDebouncingExactAmountToken,
    debouncedExactAmountFiat,
    isDebouncingExactAmountFiat,
  } = useDebouncedSwapFormAmounts({
    exactCurrencyField: partialSwapFormState.exactCurrencyField,
    exactAmountToken: partialSwapFormState.exactAmountToken,
    exactAmountFiat: partialSwapFormState.exactAmountFiat,
  })

  return useDerivedSwapInfo({
    txId: partialSwapFormState.txId,
    [CurrencyField.INPUT]: partialSwapFormState.input ?? null,
    [CurrencyField.OUTPUT]: partialSwapFormState.output ?? null,
    exactCurrencyField: partialSwapFormState.exactCurrencyField,
    exactAmountToken: debouncedExactAmountToken,
    exactAmountFiat: debouncedExactAmountFiat,
    focusOnCurrencyField: partialSwapFormState.focusOnCurrencyField,
    selectingCurrencyField: partialSwapFormState.selectingCurrencyField,
    isDebouncing: isDebouncingExactAmountToken || isDebouncingExactAmountFiat,
  })
}

// Initializer component: computes initial derived swap info using heavy hook (`useCalculatedInitialDerivedSwapInfo`) once,
// then passes it to the base provider and unmounts
function SwapFormStoreContextProviderInitializer({
  initialState,
  onReady,
}: {
  initialState: SwapFormState
  onReady: (d: DerivedSwapInfo) => void
}): JSX.Element | null {
  const initialDerived = useCalculatedInitialDerivedSwapInfo({
    exactAmountFiat: initialState.exactAmountFiat ?? INITIAL_SWAP_FORM_STATE.exactAmountFiat,
    exactAmountToken: initialState.exactAmountToken ?? INITIAL_SWAP_FORM_STATE.exactAmountToken,
    exactCurrencyField: initialState.exactCurrencyField,
    focusOnCurrencyField: initialState.focusOnCurrencyField ?? INITIAL_SWAP_FORM_STATE.focusOnCurrencyField,
    input: initialState.input ?? INITIAL_SWAP_FORM_STATE.input,
    output: initialState.output ?? INITIAL_SWAP_FORM_STATE.output,
    selectingCurrencyField: initialState.selectingCurrencyField ?? INITIAL_SWAP_FORM_STATE.selectingCurrencyField,
    txId: initialState.txId ?? INITIAL_SWAP_FORM_STATE.txId,
  })

  useEffect(() => {
    onReady(initialDerived)
  }, [initialDerived, onReady])

  return null
}

// Base provider: assumes initialDerivedSwapInfo is provided and creates the store with it
function SwapFormStoreContextProviderBase({
  children,
  hideFooter,
  hideSettings,
  prefilledState,
  initialStateToUse,
  initialDerivedSwapInfo,
}: PropsWithChildren<{
  hideFooter?: boolean
  hideSettings?: boolean
  prefilledState?: SwapFormState
  initialStateToUse: SwapFormState
  initialDerivedSwapInfo: DerivedSwapInfo
}>): JSX.Element {
  const dispatch = useDispatch()

  // Create store with default state and prefilled state
  const [{ store, cleanup }] = useState(() =>
    createSwapFormStore({
      hideFooter,
      hideSettings,
      initialState: initialStateToUse,
      derivedSwapInfo: initialDerivedSwapInfo,
      dependenciesForSideEffect: {
        dispatch,
      },
    }),
  )

  // Cleanup store subscriptions on unmount
  useEffect(() => () => cleanup(), [cleanup])

  // Access store state
  const {
    amountUpdatedTimeRef,
    exactAmountFiatRef,
    exactAmountTokenRef,
    exactAmountFiat,
    exactAmountToken,
    exactCurrencyField,
    focusOnCurrencyField,
    input,
    isMax,
    isSelectingCurrencyFieldPrefilled,
    isSubmitting,
    output,
    selectingCurrencyField,
    txId,
  } = useStore(
    store,
    useShallow((s) => ({
      amountUpdatedTimeRef: s.amountUpdatedTimeRef,
      exactAmountFiatRef: s.exactAmountFiatRef,
      exactAmountTokenRef: s.exactAmountTokenRef,
      exactAmountFiat: s.exactAmountFiat,
      exactAmountToken: s.exactAmountToken,
      exactCurrencyField: s.exactCurrencyField,
      focusOnCurrencyField: s.focusOnCurrencyField,
      input: s.input,
      isMax: s.isMax,
      isSelectingCurrencyFieldPrefilled: s.isSelectingCurrencyFieldPrefilled,
      isSubmitting: s.isSubmitting,
      output: s.output,
      selectingCurrencyField: s.selectingCurrencyField,
      txId: s.txId,
      hideFooter,
      hideSettings,
    })),
  )

  // Access store actions
  const { setSwapFormState, setUpdateSwapForm } = useStore(
    store,
    useShallow((s) => s.actions),
  )

  // prefilled state may load in -- i.e. `outputCurrency` URL param pulling from gql
  useUpdateSwapFormFromPrefilledCurrencies({
    prefilledState,
    setSwapForm: setSwapFormState,
  })

  // Enable launching the output token selector through a change to the prefilled state
  useOpenOutputSelectorOnPrefilledStateChange({
    prefilledSelectingCurrencyField: prefilledState?.selectingCurrencyField,
    prefilledFilteredChainIds: prefilledState?.filteredChainIds,
    setSwapForm: setSwapFormState,
  })

  const latestDerivedSwapInfo = useCalculatedInitialDerivedSwapInfo({
    exactAmountFiat,
    exactAmountToken,
    exactCurrencyField,
    focusOnCurrencyField,
    input,
    output,
    selectingCurrencyField,
    txId,
  })

  // This prevents the swap form from displaying a new trade while an old one is still being submitted.
  const derivedSwapInfo = useFreezeWhileSubmitting(latestDerivedSwapInfo, isSubmitting)

  const inputAmount = derivedSwapInfo.currencyAmounts[CurrencyField.INPUT]
  const inputBalanceAmount = derivedSwapInfo.currencyBalances[CurrencyField.INPUT]

  useSwapAnalytics(derivedSwapInfo)

  // for native transfers, this is the balance - (estimated gas fee for one transaction * multiplier from flag);
  // for ERC20 transfers, this is the balance
  const maxInputAmountAsRef = useValueAsRef(
    useMaxAmountSpend({
      currencyAmount: inputBalanceAmount,
      txType: TransactionType.Swap,
      isExtraTx: true,
    })?.toExact(),
  )

  const maybeUpdatedIsMax = useMemo((): boolean => {
    // exact-input-field forms are handled in `updateSwapForm()`
    const inputAmountString = inputAmount?.toExact()

    if (
      derivedSwapInfo.exactCurrencyField === CurrencyField.OUTPUT &&
      inputAmountString &&
      maxInputAmountAsRef.current
    ) {
      const isMaxThreshold = !!(parseFloat(inputAmountString) >= parseFloat(maxInputAmountAsRef.current))

      // do not rerender if isMax is unchanged
      if (isMaxThreshold !== isMax) {
        return isMaxThreshold
      }
    }

    return isMax
  }, [derivedSwapInfo.exactCurrencyField, inputAmount, isMax, maxInputAmountAsRef])

  // Create `updateSwapForm` function, to be set, once, in the store
  const updateSwapForm = useEvent((newState: Partial<SwapFormState>): void => {
    const updatedState = { ...newState }

    const isAmountUpdated = updatedState.exactAmountFiat !== undefined || updatedState.exactAmountToken !== undefined

    if (isAmountUpdated) {
      amountUpdatedTimeRef.current = Date.now()
    }

    if (updatedState.exactAmountFiat !== undefined) {
      exactAmountFiatRef.current = updatedState.exactAmountFiat
    }

    if (updatedState.exactAmountToken !== undefined) {
      exactAmountTokenRef.current = updatedState.exactAmountToken
    }

    if (isAmountUpdated || updatedState.exactCurrencyField !== CurrencyField.OUTPUT) {
      const isMaxTokenAmount =
        !!maxInputAmountAsRef.current &&
        !!updatedState.exactAmountToken &&
        parseFloat(maxInputAmountAsRef.current) <= parseFloat(updatedState.exactAmountToken)

      // if max value is explicitly set, use that
      // otherwise, check the token amount again the maxInputAmount
      updatedState.isMax = updatedState.isMax ?? isMaxTokenAmount
    }

    setSwapFormState(updatedState)
  })

  // Set `updateSwapForm` function in the store
  useEffect(() => {
    setUpdateSwapForm(updateSwapForm)
    // These are fine as they're both referentially stable
  }, [setUpdateSwapForm, updateSwapForm])

  const prefilledCurrencies = useMemo(
    () => [prefilledState?.input, prefilledState?.output].filter((asset): asset is TradeableAsset => Boolean(asset)),
    [prefilledState?.input, prefilledState?.output],
  )

  const derivedState: Partial<SwapFormStateForConsumers> = useMemo(
    () => ({
      derivedSwapInfo,
      hideFooter,
      hideSettings,
      prefilledCurrencies,
      isSelectingCurrencyFieldPrefilled,
      isMax: maybeUpdatedIsMax,
    }),
    [
      derivedSwapInfo,
      hideFooter,
      hideSettings,
      prefilledCurrencies,
      isSelectingCurrencyFieldPrefilled,
      maybeUpdatedIsMax,
    ],
  )

  // Sync derived state to the store
  // We do want it to run on every render, including the first, as the store is not initialized with this derived state
  useEffect(() => {
    setSwapFormState(derivedState)
  }, [derivedState, setSwapFormState])

  return <SwapFormStoreContext.Provider value={store}>{children}</SwapFormStoreContext.Provider>
}

// Orchestrator: computes initial state, bootstraps initial derived swap info, then renders the base provider
export const SwapFormStoreContextProvider = ({
  children,
  hideFooter,
  hideSettings,
  prefilledState,
}: PropsWithChildren<{
  hideFooter?: boolean
  hideSettings?: boolean
  prefilledState?: SwapFormState
}>): JSX.Element => {
  // Get default state for store initialization
  const defaultState = useDefaultSwapFormState()

  const initialStateToUse = useMemo(() => {
    return prefilledState ?? defaultState
  }, [prefilledState, defaultState])

  const [initialDerivedSwapInfo, setInitialDerivedSwapInfo] = useState<DerivedSwapInfo | null>(null)

  if (!initialDerivedSwapInfo) {
    return (
      <SwapFormStoreContextProviderInitializer initialState={initialStateToUse} onReady={setInitialDerivedSwapInfo} />
    )
  }

  return (
    <SwapFormStoreContextProviderBase
      hideFooter={hideFooter}
      hideSettings={hideSettings}
      prefilledState={prefilledState}
      initialStateToUse={initialStateToUse}
      initialDerivedSwapInfo={initialDerivedSwapInfo}
    >
      {children}
    </SwapFormStoreContextProviderBase>
  )
}
