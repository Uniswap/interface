import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { CurrencyInputPanel } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { SectionName } from 'uniswap/src/features/telemetry/constants'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { WalletRestoreButton } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/WalletRestoreButton'
import { getCurrencyInputFocusedStyle } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/utils/getCurrencyInputFocusedStyle'
import { useSwapFormScreenState } from 'uniswap/src/features/transactions/swap/form/context/SwapFormScreenContext'
import { usePriceDifference } from 'uniswap/src/features/transactions/swap/hooks/usePriceDifference'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isInterface } from 'utilities/src/platform'

export function SwapFormCurrencyOutputPanel(): JSX.Element {
  const { t } = useTranslation()
  const { derivedSwapInfo } = useSwapFormContext()
  const { priceDifferencePercentage } = usePriceDifference(derivedSwapInfo)

  const {
    // References
    outputRef,

    // State values
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

    // Trade-related values
    trade,

    // Event handlers
    onSetPresetValue,
    onToggleIsFiatMode,
    onFocusOutput,
    onOutputSelectionChange,
    onSetExactAmountOutput,
    onShowTokenSelectorOutput,
    showTemporaryFoTWarning,
  } = useSwapFormScreenState()

  const focusedStyles = getCurrencyInputFocusedStyle(focusOnCurrencyField === CurrencyField.OUTPUT)

  return (
    <Trace section={SectionName.CurrencyOutputPanel}>
      <Flex borderRadius="$rounded20" borderWidth="$spacing1" {...focusedStyles}>
        <CurrencyInputPanel
          ref={outputRef}
          headerLabel={isInterface ? t('common.button.buy') : undefined}
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
          onPressDisabled={isBridge ? undefined : showTemporaryFoTWarning}
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
