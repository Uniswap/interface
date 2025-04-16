import { ReactNode, useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import type { TextInputProps } from 'react-native'
import { CurrencyInputPanelRef } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { usePrefetchSwappableTokens } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiSwappableTokensQuery'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/safetyUtils'
import { DecimalPadInputRef } from 'uniswap/src/features/transactions/DecimalPadInput/DecimalPadInput'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useDecimalPadControlledField } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/hooks/useDecimalPadControlledField'
import { useSwapFormHoverStyles } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/hooks/useSwapFormHoverStyles'
import { useTemporaryFoTWarning } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/hooks/useTemporaryFoTWarning'
import { useUpdateSwapFormOnMountIfExactOutputWillFail } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/hooks/useUpdateSwapFormOnMountIfExactOutputWillFail'
import {
  SwapFormScreenContext,
  SwapFormScreenContextState,
} from 'uniswap/src/features/transactions/swap/form/context/SwapFormScreenContext'
import { useSwapFormScreenCallbacks } from 'uniswap/src/features/transactions/swap/form/context/hooks/useSwapFormScreenCallbacks'
import { useSwapNetworkNotification } from 'uniswap/src/features/transactions/swap/form/hooks/useSwapNetworkNotification'
import { useSyncFiatAndTokenAmountUpdater } from 'uniswap/src/features/transactions/swap/form/hooks/useSyncFiatAndTokenAmountUpdater'
import { getExactOutputWillFail } from 'uniswap/src/features/transactions/swap/utils/getExactOutputWillFail'
import { isWrapAction } from 'uniswap/src/features/transactions/swap/utils/wrap'
import { CurrencyField } from 'uniswap/src/types/currency'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { formatCurrencyAmount } from 'utilities/src/format/localeBased'
import { NumberType } from 'utilities/src/format/types'
import { isMobileApp } from 'utilities/src/platform'

const useExactValueRef = (): MutableRefObject<string> => {
  const { exactAmountFiatRef, exactAmountTokenRef, isFiatMode } = useSwapFormContext()

  return isFiatMode ? exactAmountFiatRef : exactAmountTokenRef
}

export function SwapFormScreenContextProvider({
  tokenColor,
  children,
}: {
  tokenColor?: string
  children: ReactNode
}): JSX.Element {
  const { walletNeedsRestore, screen } = useTransactionModalContext()

  const {
    derivedSwapInfo,
    exactAmountFiat,
    exactAmountToken,
    exactCurrencyField,
    focusOnCurrencyField,
    selectingCurrencyField,
    input,
    isFiatMode,
    output,
    hideFooter,
  } = useSwapFormContext()

  const { currencyAmounts, currencyBalances, currencies, currencyAmountsUSDValue, wrapType, trade } = derivedSwapInfo

  // When using fiat input mode, this hook updates the token amount based on the latest fiat conversion rate (currently polled every 15s).
  // In the Extension, the `SwapForm` is not unmounted when the user moves to the `SwapReview` screen,
  // so we need to skip these updates because we don't want the amounts being reviewed to keep changing.
  // If we don't skip this, it also causes a cache-miss on `useTrade`, which would trigger a loading spinner because of a missing `trade`.
  useSyncFiatAndTokenAmountUpdater({ skip: screen !== TransactionScreen.Form })

  useSwapNetworkNotification({
    inputChainId: input?.chainId,
    outputChainId: output?.chainId,
  })

  usePrefetchSwappableTokens(input)
  usePrefetchSwappableTokens(output)

  const { outputTokenHasBuyTax, exactOutputWillFail, exactOutputWouldFailIfCurrenciesSwitched } = useMemo(
    () => getExactOutputWillFail({ currencies }),
    [currencies],
  )

  useUpdateSwapFormOnMountIfExactOutputWillFail(exactOutputWillFail)

  const exactFieldIsInput = exactCurrencyField === CurrencyField.INPUT
  const exactFieldIsOutput = exactCurrencyField === CurrencyField.OUTPUT
  const derivedCurrencyField = exactFieldIsInput ? CurrencyField.OUTPUT : CurrencyField.INPUT

  const decimalPadControlledField = useDecimalPadControlledField()

  // Quote is being fetched for first time or refetching
  const isSwapDataLoading = Boolean(!isWrapAction(wrapType) && trade.isFetching)

  const inputRef = useRef<CurrencyInputPanelRef>(null)
  const outputRef = useRef<CurrencyInputPanelRef>(null)
  const decimalPadRef = useRef<DecimalPadInputRef>(null)

  const inputSelectionRef = useRef<TextInputProps['selection']>()
  const outputSelectionRef = useRef<TextInputProps['selection']>()

  // Swap input requires numeric values, not localized ones
  const formattedDerivedValue = formatCurrencyAmount({
    amount: currencyAmounts[derivedCurrencyField],
    locale: 'en-US',
    type: NumberType.SwapTradeAmount,
    placeholder: '',
  })

  const formattedDerivedValueRef = useRef(formattedDerivedValue)
  formattedDerivedValueRef.current = formattedDerivedValue

  // If exact output will fail due to FoT tokens, the field should be disabled and un-focusable.
  // Also, for bridging, the output field should be disabled since Across does not have exact in vs. exact out.
  const isBridge = Boolean(input && output && input?.chainId !== output?.chainId)
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

  useEffect(() => {
    if (decimalPadControlledField === exactCurrencyField) {
      return
    }

    // When the `formattedDerivedValue` changes while the field that is not set as the `exactCurrencyField` is focused, we want to reset the cursor selection to the end of the input.
    // This to prevent an issue that happens with the cursor selection getting out of sync when a user changes focus from one input to another while a quote request in in flight.
    callbacks.moveCursorToEnd({ targetInputRef: formattedDerivedValueRef })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formattedDerivedValue])

  const exactValue = isFiatMode ? exactAmountFiat : exactAmountToken
  const exactValueRef = useExactValueRef()

  const decimalPadValueRef = decimalPadControlledField === exactCurrencyField ? exactValueRef : formattedDerivedValueRef

  const { showWarning, showTemporaryFoTWarning } = useTemporaryFoTWarning()

  const hoverStyles = useSwapFormHoverStyles()

  const isBlockedTokens =
    getTokenWarningSeverity(currencies.input) === WarningSeverity.Blocked ||
    getTokenWarningSeverity(currencies.output) === WarningSeverity.Blocked

  /**
   * *********** IMPORTANT! ***********
   *
   * We *always* want to show the footer on native mobile!
   *
   * We do not want `GasAndWarningsRows` to be conditionally rendered
   * because it's used to calculate the available space for the `DecimalPad`,
   * and we don't want it to be resized when gas and warnings show up.
   *
   * *********** IMPORTANT! ***********
   */
  const showFooter = Boolean(!hideFooter && (isMobileApp || (!isBlockedTokens && input && output && exactAmountToken)))

  const contextValue: SwapFormScreenContextState = {
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
    isSwapDataLoading,
    resetSelection: callbacks.resetSelection,
    currencyAmountsUSDValue,
    exactValue,
    formattedDerivedValue,
    tokenColor,
    walletNeedsRestore,
    showFooter,
    showWarning,
    outputTokenHasBuyTax,
    exactAmountToken,
    isBridge,

    // Trade-related values
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
    showTemporaryFoTWarning,
    onDecimalPadTriggerInputShake: callbacks.onDecimalPadTriggerInputShake,

    // Styles
    hoverStyles,
  }

  return <SwapFormScreenContext.Provider value={contextValue}>{children}</SwapFormScreenContext.Provider>
}
