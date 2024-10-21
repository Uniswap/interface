import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { AssetType, TradeableAsset } from 'uniswap/src/entities/assets'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import { useSwapAnalytics } from 'uniswap/src/features/transactions/swap/analytics'
import { useDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/hooks/useDerivedSwapInfo'
import { DEFAULT_CUSTOM_DEADLINE } from 'uniswap/src/features/transactions/swap/settings/useDeadlineSettings'
import {
  DEFAULT_PROTOCOL_OPTIONS,
  FrontendSupportedProtocol,
} from 'uniswap/src/features/transactions/swap/utils/protocols'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { logContextUpdate } from 'utilities/src/logger/contextEnhancer'
import { usePrevious } from 'utilities/src/react/hooks'
import { useDebounceWithStatus } from 'utilities/src/time/timing'

const SWAP_FORM_DEBOUNCE_TIME_MS = 250

export type SwapFormState = {
  customSlippageTolerance?: number
  customDeadline?: number
  exactAmountFiat?: string
  exactAmountToken?: string
  exactCurrencyField: CurrencyField
  focusOnCurrencyField?: CurrencyField
  filteredChainIds: { [key in CurrencyField]?: UniverseChainId }
  input?: TradeableAsset
  output?: TradeableAsset
  selectingCurrencyField?: CurrencyField
  txId?: string
  isFiatMode: boolean
  isSubmitting: boolean
  hideFooter?: boolean
  hideSettings?: boolean
  selectedProtocols: FrontendSupportedProtocol[]
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
  isSubmitting: false,
  selectedProtocols: DEFAULT_PROTOCOL_OPTIONS,
  customDeadline: DEFAULT_CUSTOM_DEADLINE,
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
        }
      })
    }
  }, [prefilledState?.selectingCurrencyField])

  const updateSwapForm = useCallback(
    (newState: Parameters<SwapFormContextState['updateSwapForm']>[0]): void => {
      if ('exactAmountFiat' in newState || 'exactAmountToken' in newState) {
        amountUpdatedTimeRef.current = Date.now()
      }

      if ('exactAmountFiat' in newState) {
        exactAmountFiatRef.current = newState.exactAmountFiat ?? ''
      }

      if ('exactAmountToken' in newState) {
        exactAmountTokenRef.current = newState.exactAmountToken ?? ''
      }

      setSwapForm((prevState) => {
        const updatedState = { ...prevState, ...newState }
        logContextUpdate('SwapFormContext', updatedState, datadogEnabled)
        return updatedState
      })
    },
    [setSwapForm, datadogEnabled],
  )

  const [debouncedExactAmountToken, isDebouncingExactAmountToken] = useDebounceWithStatus(
    swapForm.exactAmountToken,
    SWAP_FORM_DEBOUNCE_TIME_MS,
  )

  const [debouncedExactAmountFiat, isDebouncingExactAmountFiat] = useDebounceWithStatus(
    swapForm.exactAmountFiat,
    SWAP_FORM_DEBOUNCE_TIME_MS,
  )

  const derivedSwapInfo = useDerivedSwapInfo({
    txId: swapForm.txId,
    [CurrencyField.INPUT]: swapForm.input ?? null,
    [CurrencyField.OUTPUT]: swapForm.output ?? null,
    exactCurrencyField: swapForm.exactCurrencyField,
    exactAmountToken: debouncedExactAmountToken ?? '',
    exactAmountFiat: debouncedExactAmountFiat,
    focusOnCurrencyField: swapForm.focusOnCurrencyField,
    selectingCurrencyField: swapForm.selectingCurrencyField,
    customSlippageTolerance: swapForm.customSlippageTolerance,
    customDeadline: swapForm.customDeadline,
    selectedProtocols: swapForm.selectedProtocols,
    isDebouncing: isDebouncingExactAmountToken || isDebouncingExactAmountFiat,
  })

  useSwapAnalytics(derivedSwapInfo)

  const state = useMemo<SwapFormContextState>(
    (): SwapFormContextState => ({
      amountUpdatedTimeRef,
      customSlippageTolerance: swapForm.customSlippageTolerance,
      customDeadline: swapForm.customDeadline,
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
      isSubmitting: swapForm.isSubmitting,
      output: swapForm.output,
      selectedProtocols: swapForm.selectedProtocols,
      selectingCurrencyField: swapForm.selectingCurrencyField,
      txId: swapForm.txId,
      hideFooter,
      hideSettings,
      updateSwapForm,
    }),
    [
      swapForm.customSlippageTolerance,
      swapForm.customDeadline,
      swapForm.exactAmountFiat,
      swapForm.exactAmountToken,
      swapForm.exactCurrencyField,
      swapForm.focusOnCurrencyField,
      swapForm.filteredChainIds,
      swapForm.input,
      swapForm.isFiatMode,
      swapForm.isSubmitting,
      swapForm.output,
      swapForm.selectedProtocols,
      swapForm.selectingCurrencyField,
      swapForm.txId,
      derivedSwapInfo,
      hideSettings,
      hideFooter,
      updateSwapForm,
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
