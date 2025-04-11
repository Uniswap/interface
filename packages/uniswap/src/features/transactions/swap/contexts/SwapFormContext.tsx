import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { AssetType, TradeableAsset } from 'uniswap/src/entities/assets'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useMaxAmountSpend } from 'uniswap/src/features/gas/useMaxAmountSpend'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useSwapAnalytics } from 'uniswap/src/features/transactions/swap/analytics'
import { useDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/hooks/useDerivedSwapInfo'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { logContextUpdate } from 'utilities/src/logger/contextEnhancer'
import { usePrevious } from 'utilities/src/react/hooks'
import { useValueAsRef } from 'utilities/src/react/useValueAsRef'
import { useDebounceWithStatus } from 'utilities/src/time/timing'

const SWAP_FORM_DEBOUNCE_TIME_MS = 250

export type SwapFormState = {
  exactAmountFiat?: string
  exactAmountToken?: string
  exactCurrencyField: CurrencyField
  focusOnCurrencyField?: CurrencyField
  filteredChainIds: { [key in CurrencyField]?: UniverseChainId }
  input?: TradeableAsset
  output?: TradeableAsset
  selectingCurrencyField?: CurrencyField
  isSelectingCurrencyFieldPrefilled?: boolean
  txId?: string
  isFiatMode: boolean
  isMax: boolean
  isSubmitting: boolean
  hideFooter?: boolean
  hideSettings?: boolean
  prefilledCurrencies?: TradeableAsset[]
  isPrefilled?: boolean
}

type DerivedSwapFormState = {
  derivedSwapInfo: ReturnType<typeof useDerivedSwapInfo>
}

type SwapFormContextState = {
  amountUpdatedTimeRef: React.MutableRefObject<number>
  exactAmountFiatRef: React.MutableRefObject<string>
  exactAmountTokenRef: React.MutableRefObject<string>
  updateSwapForm: (newState: Partial<SwapFormState>) => void
} & SwapFormState &
  DerivedSwapFormState

function getDefaultInputCurrency(chainId: UniverseChainId): TradeableAsset {
  return {
    address: getNativeAddress(chainId),
    chainId,
    type: AssetType.Currency,
  }
}

export const getDefaultState = (defaultChainId: UniverseChainId): Readonly<Omit<SwapFormState, 'account'>> => ({
  exactAmountFiat: undefined,
  exactAmountToken: '',
  exactCurrencyField: CurrencyField.INPUT,
  focusOnCurrencyField: CurrencyField.INPUT,
  filteredChainIds: {},
  input: getDefaultInputCurrency(defaultChainId),
  output: undefined,
  isFiatMode: false,
  isMax: false,
  isSubmitting: false,
})

export const SwapFormContext = createContext<SwapFormContextState | undefined>(undefined)

export function SwapFormContextProvider({
  children,
  hideFooter,
  hideSettings,
  prefilledState,
}: {
  children: ReactNode
  hideFooter?: boolean
  hideSettings?: boolean
  prefilledState?: SwapFormState
}): JSX.Element {
  const amountUpdatedTimeRef = useRef<number>(0)
  const exactAmountFiatRef = useRef<string>('')
  const exactAmountTokenRef = useRef<string>('')
  const { defaultChainId } = useEnabledChains()
  const defaultState = useMemo(() => getDefaultState(defaultChainId), [defaultChainId])
  const [swapForm, setSwapForm] = useState<SwapFormState>(prefilledState ?? defaultState)
  const datadogEnabled = useFeatureFlag(FeatureFlags.Datadog)

  // prefilled state may load in -- i.e. `outputCurrency` URL param pulling from gql
  const previousInitialInputCurrency = usePrevious(prefilledState?.input)
  const previousInitialOutputCurrency = usePrevious(prefilledState?.output)
  useEffect(() => {
    const previousInputCurrencyId = previousInitialInputCurrency && currencyId(previousInitialInputCurrency)
    const previousOutputCurrencyId = previousInitialOutputCurrency && currencyId(previousInitialOutputCurrency)

    if (
      previousInputCurrencyId !== (prefilledState?.input && currencyId(prefilledState.input)) ||
      previousOutputCurrencyId !== (prefilledState?.output && currencyId(prefilledState.output))
    ) {
      setSwapForm(prefilledState ?? defaultState)
    }
  }, [prefilledState, previousInitialInputCurrency, previousInitialOutputCurrency, defaultState])

  // Enable launching the output token selector through a change to the prefilled state
  useEffect(() => {
    // Only rerender the swap form value when true, not when false/undefined
    if (prefilledState?.selectingCurrencyField) {
      setSwapForm((oldVal) => {
        return {
          ...oldVal,
          selectingCurrencyField: prefilledState?.selectingCurrencyField,
          filteredChainIds: prefilledState.filteredChainIds,
          isSelectingCurrencyFieldPrefilled: true,
        }
      })
    }
  }, [prefilledState?.selectingCurrencyField, prefilledState?.filteredChainIds])

  const previousExactCurrencyField = usePrevious(swapForm.exactCurrencyField)
  // If the exact currency field is changed, the amount may have changed as well
  // so we'll skip debouncing in this case
  const hasExactCurrencyFieldChanged = previousExactCurrencyField !== swapForm.exactCurrencyField

  const [debouncedExactAmountToken, isDebouncingExactAmountToken] = useDebounceWithStatus({
    value: swapForm.exactAmountToken,
    delay: SWAP_FORM_DEBOUNCE_TIME_MS,
    skipDebounce: hasExactCurrencyFieldChanged,
  })

  const [debouncedExactAmountFiat, isDebouncingExactAmountFiat] = useDebounceWithStatus({
    value: swapForm.exactAmountFiat,
    delay: SWAP_FORM_DEBOUNCE_TIME_MS,
    skipDebounce: hasExactCurrencyFieldChanged,
  })

  const derivedSwapInfo = useDerivedSwapInfo({
    txId: swapForm.txId,
    [CurrencyField.INPUT]: swapForm.input ?? null,
    [CurrencyField.OUTPUT]: swapForm.output ?? null,
    exactCurrencyField: swapForm.exactCurrencyField,
    exactAmountToken: debouncedExactAmountToken ?? '',
    exactAmountFiat: debouncedExactAmountFiat,
    focusOnCurrencyField: swapForm.focusOnCurrencyField,
    selectingCurrencyField: swapForm.selectingCurrencyField,
    isDebouncing: isDebouncingExactAmountToken || isDebouncingExactAmountFiat,
  })

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

  // update `isMax` when inputAmount changes indirectly (eg output amount is set)
  useEffect(() => {
    // exact-input-field forms are handled in `updateSwapForm()`
    const inputAmountString = inputAmount?.toExact()
    const maxInputAmountThresholdString = maxInputAmountAsRef.current

    if (
      derivedSwapInfo.exactCurrencyField === CurrencyField.OUTPUT &&
      inputAmountString &&
      maxInputAmountThresholdString
    ) {
      const isMaxThreshold = !!(parseFloat(inputAmountString) >= parseFloat(maxInputAmountThresholdString))

      // do not rerender if isMax is unchanged
      setSwapForm((prevState) =>
        prevState.isMax === isMaxThreshold
          ? prevState
          : {
              ...prevState,
              isMax: isMaxThreshold,
            },
      )
    }
    // `maxInputAmountAsRef` is a ref so it does not trigger a rerender on change
  }, [inputAmount, derivedSwapInfo.exactCurrencyField, maxInputAmountAsRef])

  const updateSwapForm = useCallback(
    (newState: Parameters<SwapFormContextState['updateSwapForm']>[0]): void => {
      let isAmountUpdated = false

      if ('exactAmountFiat' in newState || 'exactAmountToken' in newState) {
        amountUpdatedTimeRef.current = Date.now()
        isAmountUpdated = true
      }

      if ('exactAmountFiat' in newState) {
        exactAmountFiatRef.current = newState.exactAmountFiat ?? ''
      }

      if ('exactAmountToken' in newState) {
        exactAmountTokenRef.current = newState.exactAmountToken ?? ''
      }

      setSwapForm((prevState) => {
        const updatedState = { ...prevState, ...newState }

        if (isAmountUpdated || newState.exactCurrencyField !== CurrencyField.OUTPUT) {
          const isMaxTokenAmount =
            maxInputAmountAsRef.current &&
            updatedState.exactAmountToken &&
            parseFloat(maxInputAmountAsRef.current) <= parseFloat(updatedState.exactAmountToken)

          // if max value is explicitly set, use that
          // otherwise, check the token amount again the maxInputAmount
          updatedState.isMax = newState.isMax ?? !!isMaxTokenAmount
        }

        logContextUpdate('SwapFormContext', updatedState, datadogEnabled)

        return updatedState
      })
    },
    // avoid rerenders unless absolutely necessary since this component is widely used
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setSwapForm, datadogEnabled],
  )

  const state = useMemo<SwapFormContextState>(
    (): SwapFormContextState => ({
      amountUpdatedTimeRef,
      derivedSwapInfo,
      exactAmountFiat: swapForm.exactAmountFiat,
      exactAmountFiatRef,
      exactAmountToken: swapForm.exactAmountToken,
      exactAmountTokenRef,
      exactCurrencyField: swapForm.exactCurrencyField,
      focusOnCurrencyField: swapForm.focusOnCurrencyField,
      filteredChainIds: swapForm.filteredChainIds,
      input: swapForm.input,
      isFiatMode: swapForm.isFiatMode,
      isMax: swapForm.isMax,
      isSubmitting: swapForm.isSubmitting,
      output: swapForm.output,
      selectingCurrencyField: swapForm.selectingCurrencyField,
      txId: swapForm.txId,
      hideFooter,
      hideSettings,
      updateSwapForm,
      prefilledCurrencies: [prefilledState?.input, prefilledState?.output].filter((asset): asset is TradeableAsset =>
        Boolean(asset),
      ),
      isSelectingCurrencyFieldPrefilled: swapForm.isSelectingCurrencyFieldPrefilled,
    }),
    [
      derivedSwapInfo,
      swapForm.exactAmountFiat,
      swapForm.exactAmountToken,
      swapForm.exactCurrencyField,
      swapForm.focusOnCurrencyField,
      swapForm.filteredChainIds,
      swapForm.input,
      swapForm.isFiatMode,
      swapForm.isMax,
      swapForm.isSubmitting,
      swapForm.output,
      swapForm.selectingCurrencyField,
      swapForm.txId,
      swapForm.isSelectingCurrencyFieldPrefilled,
      hideFooter,
      hideSettings,
      updateSwapForm,
      prefilledState?.input,
      prefilledState?.output,
    ],
  )

  return <SwapFormContext.Provider value={state}>{children}</SwapFormContext.Provider>
}

export const useSwapFormContext = (): SwapFormContextState => {
  const swapContext = useContext(SwapFormContext)

  if (swapContext === undefined) {
    throw new Error('`useSwapFormContext` must be used inside of `SwapFormContextProvider`')
  }

  return swapContext
}
