import type { BottomSheetView } from '@gorhom/bottom-sheet'
import type { ComponentProps } from 'react'
import { Flex } from 'ui/src'
import { TransactionModalInnerContainer } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { SwapFormSettings } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/SwapFormSettings'
import { TradeRoutingPreference } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/TradeRoutingPreference/TradeRoutingPreference'
import { Slippage } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/slippage/Slippage/Slippage'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { SwapFormCurrencyInputPanel } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormCurrencyInputPanel'
import { SwapFormCurrencyOutputPanel } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormCurrencyOutputPanel'
import { SwapFormDecimalPad } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormDecimalPad'
import { SwapFormHeader } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormHeader/SwapFormHeader'
import { SwapFormScreenDetails } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenDetails'
import { SwapTokenSelector } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapTokenSelector/SwapTokenSelector'
import { SwitchCurrenciesButton } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwitchCurrenciesButton'
import { YouReceiveDetails } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/YouReceiveDetails/YouReceiveDetails'
import { useSwapFormScreenState } from 'uniswap/src/features/transactions/swap/form/context/SwapFormScreenContext'
import { SwapFormScreenContextProvider } from 'uniswap/src/features/transactions/swap/form/context/SwapFormScreenContextProvider'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import { BridgeTrade } from 'uniswap/src/features/transactions/swap/types/trade'
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
  const priceUXEnabled = usePriceUXEnabled()

  const {
    // References
    decimalPadRef,
    inputSelectionRef,
    outputSelectionRef,
    decimalPadValueRef,

    // State values
    resetSelection,
    isBridge,

    // Trade-related values
    trade,

    // Event handlers
    onSetPresetValue,
    onSwitchCurrencies,
    onDecimalPadTriggerInputShake,
  } = useSwapFormScreenState()

  return (
    <Flex grow gap="$spacing8" justifyContent="space-between">
      <Flex gap="$spacing4" animation="quick" exitStyle={{ opacity: 0 }} grow={isExtension}>
        <Flex gap="$spacing2">
          <SwapFormCurrencyInputPanel />

          <SwitchCurrenciesButton onSwitchCurrencies={onSwitchCurrencies} />

          <SwapFormCurrencyOutputPanel />
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
