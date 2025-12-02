import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { CurrencyInputPanel } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import { SectionName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useCurrencyInputFocusedStyle } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/hooks/useCurrencyInputFocusedStyle'
import { WalletRestoreButton } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/WalletRestoreButton'
import { useSwapFormScreenStore } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/useSwapFormScreenStore'
import { usePriceDifference } from 'uniswap/src/features/transactions/swap/hooks/usePriceDifference'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isWebPlatform } from 'utilities/src/platform'

export function SwapFormCurrencyOutputPanel(): JSX.Element {
  const { t } = useTranslation()

  const derivedSwapInfo = useSwapFormStore((s) => s.derivedSwapInfo)
  const { priceDifferencePercentage } = usePriceDifference(derivedSwapInfo)

  const {
    outputRef,
    focusOnCurrencyField,
    currencies,
    currencyAmounts,
    currencyBalances,
    selectingCurrencyField,
    isFiatMode,
    exactFieldIsOutput,
    exactOutputDisabled,
    resetSelection,
    currencyAmountsUSDValue,
    exactValue,
    formattedDerivedValue,
    tokenColor,
    walletNeedsRestore,
    isBridge,
    trade,
    onSetPresetValue,
    onToggleIsFiatMode,
    onFocusOutput,
    onOutputSelectionChange,
    onSetExactAmountOutput,
    onShowTokenSelectorOutput,
    showTemporaryExactOutputUnavailableWarning,
  } = useSwapFormScreenStore((s) => ({
    outputRef: s.outputRef,
    focusOnCurrencyField: s.focusOnCurrencyField,
    currencies: s.currencies,
    currencyAmounts: s.currencyAmounts,
    currencyBalances: s.currencyBalances,
    selectingCurrencyField: s.selectingCurrencyField,
    isFiatMode: s.isFiatMode,
    exactFieldIsOutput: s.exactFieldIsOutput,
    exactOutputDisabled: s.exactOutputDisabled,
    resetSelection: s.resetSelection,
    currencyAmountsUSDValue: s.currencyAmountsUSDValue,
    exactValue: s.exactValue,
    formattedDerivedValue: s.formattedDerivedValue,
    tokenColor: s.tokenColor,
    walletNeedsRestore: s.walletNeedsRestore,
    isBridge: s.isBridge,
    trade: s.trade,
    onSetPresetValue: s.onSetPresetValue,
    onToggleIsFiatMode: s.onToggleIsFiatMode,
    onFocusOutput: s.onFocusOutput,
    onOutputSelectionChange: s.onOutputSelectionChange,
    onSetExactAmountOutput: s.onSetExactAmountOutput,
    onShowTokenSelectorOutput: s.onShowTokenSelectorOutput,
    showTemporaryExactOutputUnavailableWarning: s.showTemporaryExactOutputUnavailableWarning,
  }))

  const focusedStyles = useCurrencyInputFocusedStyle(focusOnCurrencyField === CurrencyField.OUTPUT)

  return (
    <Trace section={SectionName.CurrencyOutputPanel}>
      <Flex borderRadius="$rounded20" borderWidth="$spacing1" {...focusedStyles}>
        <CurrencyInputPanel
          ref={outputRef}
          headerLabel={isWebPlatform ? t('common.button.buy') : undefined}
          currencyAmount={currencyAmounts[CurrencyField.OUTPUT]}
          currencyBalance={currencyBalances[CurrencyField.OUTPUT]}
          currencyField={CurrencyField.OUTPUT}
          currencyInfo={currencies[CurrencyField.OUTPUT]}
          disabled={exactOutputDisabled}
          // We do not want to force-focus the input when the token selector is open.
          focus={selectingCurrencyField ? undefined : focusOnCurrencyField === CurrencyField.OUTPUT}
          isFiatMode={isFiatMode && exactFieldIsOutput}
          isLoading={!exactFieldIsOutput && trade.isFetching}
          priceDifferencePercentage={priceDifferencePercentage}
          resetSelection={resetSelection}
          showSoftInputOnFocus={false}
          usdValue={currencyAmountsUSDValue[CurrencyField.OUTPUT]}
          value={exactFieldIsOutput ? exactValue : formattedDerivedValue}
          valueIsIndicative={!exactFieldIsOutput && trade.indicativeTrade && !trade.trade}
          tokenColor={tokenColor}
          onPressDisabled={isBridge ? undefined : showTemporaryExactOutputUnavailableWarning}
          onPressIn={onFocusOutput}
          onSelectionChange={onOutputSelectionChange}
          onSetExactAmount={onSetExactAmountOutput}
          onSetPresetValue={onSetPresetValue}
          onShowTokenSelector={onShowTokenSelectorOutput}
          onToggleIsFiatMode={onToggleIsFiatMode}
        />
        {walletNeedsRestore && <WalletRestoreButton />}
      </Flex>
    </Trace>
  )
}
