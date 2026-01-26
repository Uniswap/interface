import type { BottomSheetView } from '@gorhom/bottom-sheet'
import type { ComponentProps } from 'react'
import type { FlexProps } from 'ui/src'
import { Flex, Text } from 'ui/src'
import { chainIdToPlatform } from 'uniswap/src/features/platforms/utils/chains'
import { useSlippageSettings } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/useSlippageSettings'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { filterSettingsByPlatform } from 'uniswap/src/features/transactions/components/settings/utils'
import { TransactionModalInnerContainer } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { SwapFormSettings } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/SwapFormSettings'
import { Slippage } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/slippage/Slippage/Slippage'
import { TradeRoutingPreference } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/TradeRoutingPreference/TradeRoutingPreference'
import { SwapFormCurrencyInputPanel } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormCurrencyInputPanel'
import { SwapFormCurrencyOutputPanel } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormCurrencyOutputPanel'
import { SwapFormDecimalPad } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormDecimalPad/SwapFormDecimalPad'
import { SwapFormHeader } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormHeader/SwapFormHeader'
import { SwapFormScreenDetails } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenDetails'
import { SwapTokenSelector } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapTokenSelector/SwapTokenSelector'
import { SwitchCurrenciesButton } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwitchCurrenciesButton'
import { YouReceiveDetails } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/YouReceiveDetails/YouReceiveDetails'
import { SwapFormScreenStoreContextProvider } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/SwapFormScreenStoreContextProvider'
import { useSwapFormScreenStore } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/useSwapFormScreenStore'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import {
  useSwapFormStore,
  useSwapFormStoreDerivedSwapInfo,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { BridgeTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isExtensionApp, isWebApp } from 'utilities/src/platform'

interface SwapFormScreenProps {
  hideContent: boolean
  hideFooter?: boolean
  settings: TransactionSettingConfig[]
  tokenColor?: string
  focusHook?: ComponentProps<typeof BottomSheetView>['focusHook']
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
}: SwapFormScreenProps): JSX.Element {
  const { bottomSheetViewStyles } = useTransactionModalContext()
  const { selectingCurrencyField, hideSettings } = useSwapFormStore((s) => ({
    selectingCurrencyField: s.selectingCurrencyField,
    hideSettings: s.hideSettings,
  }))

  const { trade, chainId } = useSwapFormStoreDerivedSwapInfo((s) => ({ trade: s.trade, chainId: s.chainId }))

  const filteredSettings = filterSettingsByPlatform(settings, chainIdToPlatform(chainId))

  const showTokenSelector = !hideContent && !!selectingCurrencyField
  const isBridgeTrade = trade instanceof BridgeTrade

  return (
    <TransactionModalInnerContainer fullscreen bottomSheetViewStyles={bottomSheetViewStyles}>
      {!isWebApp && <SwapFormHeader /> /* Interface renders its own header with multiple tabs */}
      {/* Original Swap+Settings button moved to swapblock position below */}
      {/* {!hideSettings && <SwapFormSettings settings={filteredSettings} isBridgeTrade={isBridgeTrade} />} */}

      {!hideContent && (
        <SwapFormScreenStoreContextProvider tokenColor={tokenColor}>
          <SwapFormContent
            hideSettings={hideSettings ?? false}
            filteredSettings={filteredSettings}
            isBridgeTrade={isBridgeTrade ?? false}
          />
        </SwapFormScreenStoreContextProvider>
      )}

      <SwapTokenSelector isModalOpen={showTokenSelector} focusHook={focusHook} />
    </TransactionModalInnerContainer>
  )
}

function SwapFormContent({
  hideSettings,
  filteredSettings,
  isBridgeTrade,
}: {
  hideSettings: boolean
  filteredSettings: TransactionSettingConfig[]
  isBridgeTrade: boolean
}): JSX.Element {
  const { trade, isCrossChain } = useSwapFormScreenStore((state) => ({
    trade: state.trade,
    isCrossChain: state.isCrossChain,
  }))

  const priceUXEnabled = usePriceUXEnabled()
  const { autoSlippageTolerance } = useSlippageSettings()

  return (
    <Flex grow gap="$spacing8" justifyContent="space-between">
      <Flex gap="$spacing4" animation="quick" exitStyle={EXIT_STYLE} grow={isExtensionApp}>
        {/* Original Swap+Settings button moved here to occupy space within the border */}
        {!hideSettings && (
          <>
            <Flex row width="100%" height={50} justifyContent="space-between" alignItems="center">
              {/* Swap text */}
              <Text variant="buttonLabel3" color="$neutral1" tag="h1">
                Swap
              </Text>
              {/* Settings button */}
              <SwapFormSettings
                settings={filteredSettings}
                isBridgeTrade={isBridgeTrade}
                position="static"
                adjustTopAlignment={false}
                adjustRightAlignment={false}
              />
            </Flex>
            {/* Border below Swap+Settings with 8px left/right extension */}
            <Flex width="calc(100% + 48px)" height={1} backgroundColor="$surface3" ml={-24} mr={-24} />
          </>
        )}
        <Flex gap="$spacing4" mt="$spacing6">
          <SwapFormCurrencyInputPanel />
          <SwitchCurrenciesButton />
          <SwapFormCurrencyOutputPanel />
        </Flex>

        <Flex>
          {priceUXEnabled && (
            <YouReceiveDetails
              isIndicative={Boolean(trade.indicativeTrade && !trade.trade)}
              isLoadingIndicative={trade.isIndicativeLoading}
              isLoading={Boolean(trade.isFetching)}
              isBridge={isCrossChain}
            />
          )}
          <SwapFormScreenDetails />
        </Flex>
      </Flex>
      <SwapFormDecimalPad />
    </Flex>
  )
}
