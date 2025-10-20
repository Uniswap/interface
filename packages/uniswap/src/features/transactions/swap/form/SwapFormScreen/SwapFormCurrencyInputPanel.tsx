import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { CurrencyInputPanel } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import { SectionName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { useCurrencyInputFocusedStyle } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/hooks/useCurrencyInputFocusedStyle'
import { useSwapFormScreenStore } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/useSwapFormScreenStore'
import { usePriceDifference } from 'uniswap/src/features/transactions/swap/hooks/usePriceDifference'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isWebPlatform } from 'utilities/src/platform'

export function SwapFormCurrencyInputPanel(): JSX.Element {
  const { t } = useTranslation()
  const derivedSwapInfo = useSwapFormStore((s) => s.derivedSwapInfo)
  const { priceDifferencePercentage } = usePriceDifference(derivedSwapInfo)

  const {
    inputRef,
    focusOnCurrencyField,
    currencies,
    currencyAmounts,
    currencyBalances,
    selectingCurrencyField,
    isFiatMode,
    exactFieldIsInput,
    resetSelection,
    currencyAmountsUSDValue,
    exactValue,
    formattedDerivedValue,
    tokenColor,
    trade,
    onFocusInput,
    onInputSelectionChange,
    onSetExactAmountInput,
    onSetPresetValue,
    onShowTokenSelectorInput,
    onToggleIsFiatMode,
  } = useSwapFormScreenStore((s) => ({
    inputRef: s.inputRef,
    focusOnCurrencyField: s.focusOnCurrencyField,
    currencies: s.currencies,
    currencyAmounts: s.currencyAmounts,
    currencyBalances: s.currencyBalances,
    selectingCurrencyField: s.selectingCurrencyField,
    isFiatMode: s.isFiatMode,
    exactFieldIsInput: s.exactFieldIsInput,
    resetSelection: s.resetSelection,
    currencyAmountsUSDValue: s.currencyAmountsUSDValue,
    exactValue: s.exactValue,
    formattedDerivedValue: s.formattedDerivedValue,
    tokenColor: s.tokenColor,
    trade: s.trade,
    onFocusInput: s.onFocusInput,
    onInputSelectionChange: s.onInputSelectionChange,
    onSetExactAmountInput: s.onSetExactAmountInput,
    onSetPresetValue: s.onSetPresetValue,
    onShowTokenSelectorInput: s.onShowTokenSelectorInput,
    onToggleIsFiatMode: s.onToggleIsFiatMode,
  }))

  const focusedStyles = useCurrencyInputFocusedStyle(focusOnCurrencyField === CurrencyField.INPUT)

  return (
    <Trace section={SectionName.CurrencyInputPanel}>
      <Flex
        animation="simple"
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        overflow="hidden"
        pb={currencies[CurrencyField.INPUT] ? '$spacing4' : '$none'}
        {...focusedStyles}
      >
        <CurrencyInputPanel
          ref={inputRef}
          headerLabel={isWebPlatform ? t('common.button.sell') : undefined}
          currencyAmount={currencyAmounts[CurrencyField.INPUT]}
          currencyBalance={currencyBalances[CurrencyField.INPUT]}
          currencyField={CurrencyField.INPUT}
          currencyInfo={currencies[CurrencyField.INPUT]}
          // We do not want to force-focus the input when the token selector is open.
          focus={selectingCurrencyField ? undefined : focusOnCurrencyField === CurrencyField.INPUT}
          isFiatMode={isFiatMode && exactFieldIsInput}
          isIndicativeLoading={trade.isIndicativeLoading}
          isLoading={!exactFieldIsInput && trade.isFetching}
          priceDifferencePercentage={priceDifferencePercentage}
          resetSelection={resetSelection}
          showSoftInputOnFocus={false}
          usdValue={currencyAmountsUSDValue[CurrencyField.INPUT]}
          value={exactFieldIsInput ? exactValue : formattedDerivedValue}
          valueIsIndicative={!exactFieldIsInput && trade.indicativeTrade && !trade.trade}
          tokenColor={tokenColor}
          onPressIn={onFocusInput}
          onSelectionChange={onInputSelectionChange}
          onSetExactAmount={onSetExactAmountInput}
          onSetPresetValue={onSetPresetValue}
          onShowTokenSelector={onShowTokenSelectorInput}
          onToggleIsFiatMode={onToggleIsFiatMode}
        />
      </Flex>
    </Trace>
  )
}
