/* eslint-disable complexity */
import type { BottomSheetView } from '@gorhom/bottom-sheet'
import type { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { CurrencyInputPanel } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { SectionName } from 'uniswap/src/features/telemetry/constants'
import { TransactionModalInnerContainer } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { SwapFormDecimalPad } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormDecimalPad'
import { SwapFormHeader } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormHeader/SwapFormHeader'
import { SwapFormScreenDetails } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenDetails'
import { SwitchCurrenciesButton } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwitchCurrenciesButton'
import { WalletRestoreButton } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/WalletRestoreButton'
import { YouReceiveDetails } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/YouReceiveDetails/YouReceiveDetails'
import { SwapTokenSelector } from 'uniswap/src/features/transactions/swap/form/body/SwapTokenSelector/SwapTokenSelector'
import { useSwapFormScreenState } from 'uniswap/src/features/transactions/swap/form/context/SwapFormScreenContext'
import { SwapFormScreenContextProvider } from 'uniswap/src/features/transactions/swap/form/context/SwapFormScreenContextProvider'
import { SwapFormSettings } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/SwapFormSettings'
import { TradeRoutingPreference } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/TradeRoutingPreference/TradeRoutingPreference'
import { Slippage } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/slippage/Slippage/Slippage'
import { usePriceDifference } from 'uniswap/src/features/transactions/swap/hooks/usePriceDifference'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import { BridgeTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isExtension, isInterface, isWeb } from 'utilities/src/platform'

interface SwapFormScreenProps {
  hideContent: boolean
  hideFooter?: boolean
  settings: TransactionSettingConfig[]
  tokenColor?: string
  focusHook?: ComponentProps<typeof BottomSheetView>['focusHook']
}

/**
 * IMPORTANT: In the Extension, this component remains mounted when the user moves to the `SwapReview` screen.
 *            Make sure you take this into consideration when adding/modifying any hooks that run on this component.
 */
export function SwapFormScreen({
  hideContent,
  settings = [Slippage, TradeRoutingPreference],
  tokenColor,
  focusHook,
}: SwapFormScreenProps): JSX.Element {
  const { bottomSheetViewStyles } = useTransactionModalContext()
  const { selectingCurrencyField, hideSettings, derivedSwapInfo } = useSwapFormContext()

  const showTokenSelector = !hideContent && !!selectingCurrencyField
  const isBridgeTrade = derivedSwapInfo.trade.trade instanceof BridgeTrade

  return (
    <TransactionModalInnerContainer fullscreen bottomSheetViewStyles={bottomSheetViewStyles}>
      {!isInterface && <SwapFormHeader /> /* Interface renders its own header with multiple tabs */}
      {!hideSettings && <SwapFormSettings settings={settings} isBridgeTrade={isBridgeTrade} />}

      {!hideContent && (
        <SwapFormScreenContextProvider tokenColor={tokenColor}>
          <SwapFormContent />
        </SwapFormScreenContextProvider>
      )}

      <SwapTokenSelector isModalOpen={showTokenSelector} focusHook={focusHook} />
    </TransactionModalInnerContainer>
  )
}

function SwapFormContent(): JSX.Element {
  const { t } = useTranslation()
  const priceUXEnabled = usePriceUXEnabled()

  const { derivedSwapInfo } = useSwapFormContext()
  const { priceDifferencePercentage } = usePriceDifference(derivedSwapInfo)

  const {
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
    onFocusInput,
    onInputSelectionChange,
    onSetExactAmountInput,
    onSetPresetValue,
    onShowTokenSelectorInput,
    onToggleIsFiatMode,
    onSwitchCurrencies,
    onFocusOutput,
    onOutputSelectionChange,
    onSetExactAmountOutput,
    onShowTokenSelectorOutput,
    showTemporaryFoTWarning,
    onDecimalPadTriggerInputShake,

    // Styles
    hoverStyles,
  } = useSwapFormScreenState()

  return (
    <Flex grow gap="$spacing8" justifyContent="space-between">
      <Flex gap="$spacing4" animation="quick" exitStyle={{ opacity: 0 }} grow={isExtension}>
        <Flex gap="$spacing2">
          <Trace section={SectionName.CurrencyInputPanel}>
            <Flex
              animation="simple"
              borderColor={focusOnCurrencyField === CurrencyField.INPUT ? '$surface3' : '$transparent'}
              borderRadius="$rounded20"
              backgroundColor={focusOnCurrencyField === CurrencyField.INPUT ? '$surface1' : '$surface2'}
              borderWidth="$spacing1"
              overflow="hidden"
              pb={currencies[CurrencyField.INPUT] ? '$spacing4' : '$none'}
              hoverStyle={hoverStyles.input}
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

          <SwitchCurrenciesButton onSwitchCurrencies={onSwitchCurrencies} />

          <Trace section={SectionName.CurrencyOutputPanel}>
            <Flex
              borderRadius="$rounded20"
              borderWidth="$spacing1"
              borderColor={focusOnCurrencyField === CurrencyField.OUTPUT ? '$surface3' : '$transparent'}
              backgroundColor={focusOnCurrencyField === CurrencyField.OUTPUT ? '$surface1' : '$surface2'}
              hoverStyle={hoverStyles.output}
            >
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
        </Flex>

        <Flex>
          {priceUXEnabled && isWeb && (
            <YouReceiveDetails
              isIndicative={Boolean(trade.indicativeTrade && !trade.trade)}
              isLoadingIndicative={trade.isIndicativeLoading}
              isLoading={Boolean(trade.isFetching)}
              isBridge={isBridge}
            />
          )}
          <SwapFormScreenDetails />
        </Flex>
      </Flex>

      {!isWeb && (
        <SwapFormDecimalPad
          decimalPadRef={decimalPadRef}
          resetSelection={resetSelection}
          inputSelectionRef={inputSelectionRef}
          outputSelectionRef={outputSelectionRef}
          decimalPadValueRef={decimalPadValueRef}
          onDecimalPadTriggerInputShake={onDecimalPadTriggerInputShake}
          onSetPresetValue={onSetPresetValue}
        />
      )}
    </Flex>
  )
}
