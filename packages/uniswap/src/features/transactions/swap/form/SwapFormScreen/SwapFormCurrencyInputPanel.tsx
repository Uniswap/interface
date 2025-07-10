import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { CurrencyInputPanel } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { SectionName } from 'uniswap/src/features/telemetry/constants'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { getCurrencyInputFocusedStyle } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/utils/getCurrencyInputFocusedStyle'
import { useSwapFormScreenState } from 'uniswap/src/features/transactions/swap/form/context/SwapFormScreenContext'
import { usePriceDifference } from 'uniswap/src/features/transactions/swap/hooks/usePriceDifference'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isInterface } from 'utilities/src/platform'

export function SwapFormCurrencyInputPanel(): JSX.Element {
  const { t } = useTranslation()
  const { derivedSwapInfo } = useSwapFormContext()
  const { priceDifferencePercentage } = usePriceDifference(derivedSwapInfo)

  const {
    // References
    inputRef,

    // State values
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

    // Trade-related values
    trade,

    // Event handlers
    onFocusInput,
    onInputSelectionChange,
    onSetExactAmountInput,
    onSetPresetValue,
    onShowTokenSelectorInput,
    onToggleIsFiatMode,
  } = useSwapFormScreenState()

  const focusedStyles = getCurrencyInputFocusedStyle(focusOnCurrencyField === CurrencyField.INPUT)

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
          headerLabel={isInterface ? t('common.button.sell') : undefined}
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
