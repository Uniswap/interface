import type { MutableRefObject, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { TextInputProps } from 'react-native'
import type { CurrencyInputPanelRef } from 'uniswap/src/components/CurrencyInputPanel/types'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { usePrefetchSwappableTokens } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiSwappableTokensQuery'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/safetyUtils'
import type { DecimalPadInputRef } from 'uniswap/src/features/transactions/components/DecimalPadInput/DecimalPadInput'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useDecimalPadControlledField } from 'uniswap/src/features/transactions/swap/form/hooks/useDecimalPadControlledField'
import { useSyncFiatAndTokenAmountUpdater } from 'uniswap/src/features/transactions/swap/form/hooks/useSyncFiatAndTokenAmountUpdater'
import { createSwapFormScreenStore } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/createSwapFormScreenStore'
import { useSwapNetworkChangeEffect } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/hooks/useSwapNetworkChangeEffect'
import { useTemporaryExactOutputUnavailableWarning } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/hooks/useTemporaryExactOutputUnavailableWarning'
import { useUpdateSwapFormOnMountIfExactOutputWillFail } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/hooks/useUpdateSwapFormOnMountIfExactOutputWillFail'
import { SwapFormScreenStoreContext } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/SwapFormScreenStoreContext'
import { useSwapFormScreenCallbacks } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/useSwapFormScreenCallbacks'

import {
  useSwapFormStore,
  useSwapFormStoreDerivedSwapInfo,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { getExactOutputWillFail } from 'uniswap/src/features/transactions/swap/utils/getExactOutputWillFail'
import { CurrencyField } from 'uniswap/src/types/currency'
// biome-ignore lint/style/noRestrictedImports: legacy import will be migrated
import { formatCurrencyAmount } from 'utilities/src/format/localeBased'
import { NumberType } from 'utilities/src/format/types'
import { isMobileApp } from 'utilities/src/platform'
import { useHasValueChanged } from 'utilities/src/react/useHasValueChanged'

const useExactValueRef = (): MutableRefObject<string> => {
  return useSwapFormStore((s) => (s.isFiatMode ? s.exactAmountFiatRef : s.exactAmountTokenRef))
}

export interface SwapFormScreenStoreContextProviderProps {
  children: ReactNode
  tokenColor?: string
}

export const SwapFormScreenStoreContextProvider = ({
  children,
  tokenColor,
}: SwapFormScreenStoreContextProviderProps): JSX.Element => {
  const { walletNeedsRestore, screen } = useTransactionModalContext()

  const {
    exactAmountFiat,
    exactAmountToken,
    exactCurrencyField,
    focusOnCurrencyField,
    selectingCurrencyField,
    input,
    isFiatMode,
    output,
    hideFooter,
  } = useSwapFormStore((s) => ({
    exactAmountFiat: s.exactAmountFiat,
    exactAmountToken: s.exactAmountToken,
    exactCurrencyField: s.exactCurrencyField,
    focusOnCurrencyField: s.focusOnCurrencyField,
    selectingCurrencyField: s.selectingCurrencyField,
    input: s.input,
    isFiatMode: s.isFiatMode,
    output: s.output,
    hideFooter: s.hideFooter,
  }))

  const { currencyAmounts, currencyBalances, currencies, currencyAmountsUSDValue, trade } =
    useSwapFormStoreDerivedSwapInfo((s) => ({
      currencyAmounts: s.currencyAmounts,
      currencyBalances: s.currencyBalances,
      currencies: s.currencies,
      currencyAmountsUSDValue: s.currencyAmountsUSDValue,
      trade: s.trade,
    }))

  // Sync fiat↔token amounts unless we are not on the form screen (extension flow)
  useSyncFiatAndTokenAmountUpdater({ skip: screen !== TransactionScreen.Form })

  // React to network changes
  useSwapNetworkChangeEffect({ inputChainId: input?.chainId, outputChainId: output?.chainId })

  // Prefetch swappable tokens
  usePrefetchSwappableTokens(input)
  usePrefetchSwappableTokens(output)

  const { outputTokenHasBuyTax, exactOutputWillFail, exactOutputWouldFailIfCurrenciesSwitched } = useMemo(
    () => getExactOutputWillFail({ currencies }),
    [currencies],
  )

  // If exact output will fail at mount, update form accordingly
  useUpdateSwapFormOnMountIfExactOutputWillFail(exactOutputWillFail)

  const exactFieldIsInput = exactCurrencyField === CurrencyField.INPUT
  const exactFieldIsOutput = exactCurrencyField === CurrencyField.OUTPUT
  const derivedCurrencyField = exactFieldIsInput ? CurrencyField.OUTPUT : CurrencyField.INPUT

  const decimalPadControlledField = useDecimalPadControlledField()

  // Refs
  const inputRef = useRef<CurrencyInputPanelRef>(null)
  const outputRef = useRef<CurrencyInputPanelRef>(null)
  const decimalPadRef = useRef<DecimalPadInputRef>(null)

  const inputSelectionRef = useRef<TextInputProps['selection']>()
  const outputSelectionRef = useRef<TextInputProps['selection']>()

  // Non-localized formatted derived value (swap amounts must be plain numbers)
  const formattedDerivedValue = formatCurrencyAmount({
    amount: currencyAmounts[derivedCurrencyField],
    locale: 'en-US',
    type: NumberType.SwapTradeAmount,
    placeholder: '',
  })

  const formattedDerivedValueRef = useRef(formattedDerivedValue)
  formattedDerivedValueRef.current = formattedDerivedValue

  // Bridging means different chains → Across only supports exact-in
  const isBridge = Boolean(input && output && input.chainId !== output.chainId)
  const exactOutputDisabled = isBridge || exactOutputWillFail

  const callbacks = useSwapFormScreenCallbacks({
    exactOutputWouldFailIfCurrenciesSwitched,
    exactFieldIsInput,
    isBridge,
    formattedDerivedValueRef,
    inputRef,
    outputRef,
    decimalPadRef,
    inputSelectionRef,
    outputSelectionRef,
  })

  // Keep cursor synced when derived value changes while opposite field is focused
  // biome-ignore lint/correctness/useExhaustiveDependencies: -callbacks.moveCursorToEnd, decimalPadControlledField, exactCurrencyField
  useEffect(() => {
    if (decimalPadControlledField === exactCurrencyField) {
      return
    }
    callbacks.moveCursorToEnd({ targetInputRef: formattedDerivedValueRef })
  }, [formattedDerivedValue])

  const exactValue = isFiatMode ? exactAmountFiat : exactAmountToken
  const exactValueRef = useExactValueRef()
  const decimalPadValueRef = decimalPadControlledField === exactCurrencyField ? exactValueRef : formattedDerivedValueRef

  const { showExactOutputUnavailableWarning, showTemporaryExactOutputUnavailableWarning } =
    useTemporaryExactOutputUnavailableWarning()

  const isBlockedTokens =
    getTokenWarningSeverity(currencies.input) === WarningSeverity.Blocked ||
    getTokenWarningSeverity(currencies.output) === WarningSeverity.Blocked

  // Always show footer on native mobile; otherwise only when we have tokens & amount & not blocked, or when we have an exact output unavailable warning
  const showFooter = Boolean(
    !hideFooter &&
      (isMobileApp || (!isBlockedTokens && input && output && exactAmountToken) || showExactOutputUnavailableWarning),
  )

  // Compose full state object (same shape as SwapFormScreenStoreState)
  const derivedState = useMemo(
    () => ({
      // References
      inputRef,
      outputRef,
      decimalPadRef,
      inputSelectionRef,
      outputSelectionRef,
      decimalPadValueRef,

      // State values
      focusOnCurrencyField,
      currencies,
      currencyAmounts,
      currencyBalances,
      selectingCurrencyField,
      isFiatMode,
      exactFieldIsInput,
      exactFieldIsOutput,
      exactOutputDisabled,
      resetSelection: callbacks.resetSelection,
      currencyAmountsUSDValue,
      exactValue,
      formattedDerivedValue,
      tokenColor,
      walletNeedsRestore,
      showFooter,
      showExactOutputUnavailableWarning,
      outputTokenHasBuyTax,
      exactAmountToken,
      isBridge,

      // Trade
      trade,

      // Event handlers
      onFocusInput: callbacks.onFocusInput,
      onInputSelectionChange: callbacks.onInputSelectionChange,
      onSetExactAmountInput: callbacks.onSetExactAmountInput,
      onSetPresetValue: callbacks.onSetPresetValue,
      onShowTokenSelectorInput: callbacks.onShowTokenSelectorInput,
      onToggleIsFiatMode: callbacks.onToggleIsFiatMode,
      onSwitchCurrencies: callbacks.onSwitchCurrencies,
      onFocusOutput: callbacks.onFocusOutput,
      onOutputSelectionChange: callbacks.onOutputSelectionChange,
      onSetExactAmountOutput: callbacks.onSetExactAmountOutput,
      onShowTokenSelectorOutput: callbacks.onShowTokenSelectorOutput,
      showTemporaryExactOutputUnavailableWarning,
      onDecimalPadTriggerInputShake: callbacks.onDecimalPadTriggerInputShake,
    }),
    [
      decimalPadValueRef,
      focusOnCurrencyField,
      currencies,
      currencyAmounts,
      currencyBalances,
      selectingCurrencyField,
      isFiatMode,
      exactFieldIsInput,
      exactFieldIsOutput,
      exactOutputDisabled,
      callbacks.resetSelection,
      callbacks.onFocusInput,
      callbacks.onInputSelectionChange,
      callbacks.onSetExactAmountInput,
      callbacks.onSetPresetValue,
      callbacks.onShowTokenSelectorInput,
      callbacks.onToggleIsFiatMode,
      callbacks.onSwitchCurrencies,
      callbacks.onFocusOutput,
      callbacks.onOutputSelectionChange,
      callbacks.onSetExactAmountOutput,
      callbacks.onShowTokenSelectorOutput,
      callbacks.onDecimalPadTriggerInputShake,
      currencyAmountsUSDValue,
      exactValue,
      formattedDerivedValue,
      tokenColor,
      walletNeedsRestore,
      showFooter,
      showExactOutputUnavailableWarning,
      showTemporaryExactOutputUnavailableWarning,
      outputTokenHasBuyTax,
      exactAmountToken,
      isBridge,
      trade,
    ],
  )

  // Store creation & syncing
  const [store] = useState(() => createSwapFormScreenStore(derivedState))
  const hasDerivedStateChanged = useHasValueChanged(derivedState)

  useEffect(() => {
    if (hasDerivedStateChanged) {
      store.setState(derivedState)
    }
  }, [derivedState, hasDerivedStateChanged, store])

  return <SwapFormScreenStoreContext.Provider value={store}>{children}</SwapFormScreenStoreContext.Provider>
}
