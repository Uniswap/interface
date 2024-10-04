import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { AssetType, TradeableAsset } from 'uniswap/src/entities/assets'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useSwapAnalytics } from 'uniswap/src/features/transactions/swap/analytics'
import { useDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/hooks/useDerivedSwapInfo'
import { DEFAULT_CUSTOM_DEADLINE } from 'uniswap/src/features/transactions/swap/settings/useDeadlineSettings'
import { TradeProtocolPreference } from 'uniswap/src/features/transactions/types/transactionState'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { CurrencyField } from 'uniswap/src/types/currency'
import { logContextUpdate } from 'utilities/src/logger/contextEnhancer'
import { useDebounceWithStatus } from 'utilities/src/time/timing'

const SWAP_FORM_DEBOUNCE_TIME_MS = 250

export type SwapFormState = {
  customSlippageTolerance?: number
  customDeadline?: number
  exactAmountFiat?: string
  exactAmountToken?: string
  exactCurrencyField: CurrencyField
  focusOnCurrencyField?: CurrencyField
  filteredChainId?: UniverseChainId
  input?: TradeableAsset
  output?: TradeableAsset
  selectingCurrencyField?: CurrencyField
  txId?: string
  isFiatMode: boolean
  isSubmitting: boolean
  tradeProtocolPreference: TradeProtocolPreference
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

const ETH_TRADEABLE_ASSET: Readonly<TradeableAsset> = {
  address: getNativeAddress(UniverseChainId.Mainnet),
  chainId: UniverseChainId.Mainnet,
  type: AssetType.Currency,
}

const DEFAULT_STATE: Readonly<Omit<SwapFormState, 'account'>> = {
  exactAmountFiat: undefined,
  exactAmountToken: '',
  exactCurrencyField: CurrencyField.INPUT,
  focusOnCurrencyField: CurrencyField.INPUT,
  filteredChainId: undefined,
  input: ETH_TRADEABLE_ASSET,
  output: undefined,
  isFiatMode: false,
  isSubmitting: false,
  tradeProtocolPreference: TradeProtocolPreference.Default,
  customDeadline: DEFAULT_CUSTOM_DEADLINE,
}

export const SwapFormContext = createContext<SwapFormContextState | undefined>(undefined)

export function SwapFormContextProvider({
  children,
  prefilledState,
}: {
  children: ReactNode
  prefilledState?: SwapFormState
}): JSX.Element {
  const amountUpdatedTimeRef = useRef<number>(0)
  const exactAmountFiatRef = useRef<string>('')
  const exactAmountTokenRef = useRef<string>('')
  const [swapForm, setSwapForm] = useState<SwapFormState>(prefilledState ?? DEFAULT_STATE)
  const datadogEnabled = useFeatureFlag(FeatureFlags.Datadog)

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
    input: swapForm.input ?? null,
    output: swapForm.output ?? null,
    exactCurrencyField: swapForm.exactCurrencyField,
    exactAmountToken: debouncedExactAmountToken ?? '',
    exactAmountFiat: debouncedExactAmountFiat,
    focusOnCurrencyField: swapForm.focusOnCurrencyField,
    selectingCurrencyField: swapForm.selectingCurrencyField,
    customSlippageTolerance: swapForm.customSlippageTolerance,
    customDeadline: swapForm.customDeadline,
    tradeProtocolPreference: swapForm.tradeProtocolPreference,
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
      filteredChainId: swapForm.filteredChainId,
      input: swapForm.input,
      isFiatMode: swapForm.isFiatMode,
      isSubmitting: swapForm.isSubmitting,
      output: swapForm.output,
      tradeProtocolPreference: swapForm.tradeProtocolPreference,
      selectingCurrencyField: swapForm.selectingCurrencyField,
      txId: swapForm.txId,
      updateSwapForm,
    }),
    [
      swapForm.customSlippageTolerance,
      swapForm.customDeadline,
      swapForm.exactAmountFiat,
      swapForm.exactAmountToken,
      swapForm.exactCurrencyField,
      swapForm.focusOnCurrencyField,
      swapForm.filteredChainId,
      swapForm.input,
      swapForm.isFiatMode,
      swapForm.isSubmitting,
      swapForm.output,
      swapForm.tradeProtocolPreference,
      swapForm.selectingCurrencyField,
      swapForm.txId,
      derivedSwapInfo,
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
