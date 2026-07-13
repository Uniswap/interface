import type { BottomSheetView } from '@gorhom/bottom-sheet'
import { isExtensionApp, isWebApp } from '@universe/environment'
import type { ComponentProps } from 'react'
import { useEffect } from 'react'
import type { FlexProps } from 'ui/src'
import { Flex } from 'ui/src'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { TransactionModalInnerContainer } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { Slippage } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/slippage/Slippage/Slippage'
import { TradeRoutingPreference } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/TradeRoutingPreference/TradeRoutingPreference'
import { SwapFormSettings } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/SwapFormSettings'
import { SwapFormScreenStoreContextProvider } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/SwapFormScreenStoreContextProvider'
import { SwapFormCurrencyInputPanel } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormCurrencyInputPanel'
import { SwapFormCurrencyOutputPanel } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormCurrencyOutputPanel'
import { SwapFormDecimalPad } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormDecimalPad/SwapFormDecimalPad'
import { SwapFormHeader } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormHeader/SwapFormHeader'
import { SwapFormScreenDetails } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenDetails'
import { SwapTokenSelector } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapTokenSelector/SwapTokenSelector'
import { SwitchCurrenciesButton } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwitchCurrenciesButton'
import { useResetGasOverridesOnTokenChange } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/useResetGasOverridesOnTokenChange'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useSwapFlowTimer } from 'uniswap/src/features/transactions/swap/utils/SwapFlowTimerContext'
import { DDRumManualTiming } from 'utilities/src/logger/datadog/datadogEvents'
import { usePerformanceLogger } from 'utilities/src/logger/usePerformanceLogger'

interface SwapFormScreenProps {
  hideContent: boolean
  hideFooter?: boolean
  settings: TransactionSettingConfig[]
  tokenColor?: string
  focusHook?: ComponentProps<typeof BottomSheetView>['focusHook']
  onCurrencyPanelsLayout?: (height: number) => void
}

const EXIT_STYLE: FlexProps['exitStyle'] = { opacity: 0 }

/**
 * IMPORTANT: In the Extension, this component remains mounted when the user moves to the `SwapReview` screen.
 *            Make sure you take this into consideration when adding/modifying any hooks that run on this component.
 */
export function SwapFormScreen({
  hideContent,
  settings = [Slippage, TradeRoutingPreference],
  tokenColor,
  focusHook,
  onCurrencyPanelsLayout,
}: SwapFormScreenProps): JSX.Element {
  const { bottomSheetViewStyles } = useTransactionModalContext()
  const tracker = useSwapFlowTimer()

  useEffect(() => {
    tracker?.mark(DDRumManualTiming.SwapFormScreenMount)
  }, [tracker])

  const selectingCurrencyField = useSwapFormStore((s) => s.selectingCurrencyField)

  useResetGasOverridesOnTokenChange()

  const showTokenSelector = !hideContent && !!selectingCurrencyField

  return (
    <TransactionModalInnerContainer fullscreen bottomSheetViewStyles={bottomSheetViewStyles}>
      {!isWebApp && <SwapFormHeader /> /* Interface renders its own header with multiple tabs */}
      {/* On web the settings gear lives in the page header row alongside the tabs */}
      {!isWebApp && <SwapFormSettings settings={settings} />}

      {!hideContent && (
        <SwapFormScreenStoreContextProvider tokenColor={tokenColor}>
          <SwapFormContent onCurrencyPanelsLayout={onCurrencyPanelsLayout} />
        </SwapFormScreenStoreContextProvider>
      )}

      <SwapTokenSelector isModalOpen={showTokenSelector} focusHook={focusHook} />
    </TransactionModalInnerContainer>
  )
}

function SwapFormContent({
  onCurrencyPanelsLayout,
}: {
  onCurrencyPanelsLayout?: (height: number) => void
}): JSX.Element {
  usePerformanceLogger(DDRumManualTiming.SwapFormContentRender, [])

  return (
    <Flex grow gap="$spacing8" justifyContent="space-between">
      <Flex gap="$spacing4" animation="quick" exitStyle={EXIT_STYLE} grow={isExtensionApp}>
        <Flex gap="$spacing2" onLayout={(e) => onCurrencyPanelsLayout?.(e.nativeEvent.layout.height)}>
          <SwapFormCurrencyInputPanel />
          <SwitchCurrenciesButton />
          <SwapFormCurrencyOutputPanel />
        </Flex>

        <Flex>
          <SwapFormScreenDetails />
        </Flex>
      </Flex>
      <SwapFormDecimalPad />
    </Flex>
  )
}
