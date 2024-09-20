import { InterfacePageName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import { NetworkAlert } from 'components/NetworkAlert'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import SwapHeader from 'components/swap/SwapHeader'
import { Field } from 'components/swap/constants'
import { PageWrapper, SwapWrapper } from 'components/swap/styled'
import { useSupportedChainId } from 'constants/chains'
import { useScreenSize } from 'hooks/screenSize/useScreenSize'
import { useAccount } from 'hooks/useAccount'
import { BuyForm } from 'pages/Swap/Buy/BuyForm'
import { LimitFormWrapper } from 'pages/Swap/Limit/LimitForm'
import { SendForm } from 'pages/Swap/Send/SendForm'
import { SwapForm } from 'pages/Swap/SwapForm'
import { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { InterfaceTrade, TradeState } from 'state/routing/types'
import { isPreviewTrade } from 'state/routing/utils'
import { SwapAndLimitContextProvider, SwapContextProvider } from 'state/swap/SwapContext'
import { useInitialCurrencyState } from 'state/swap/hooks'
import { CurrencyState, SwapAndLimitContext } from 'state/swap/types'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { Flex } from 'ui/src'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { SwapFlow } from 'uniswap/src/features/transactions/swap/SwapFlow'
import { InterfaceChainId } from 'uniswap/src/types/chains'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import noop from 'utilities/src/react/noop'

export function getIsReviewableQuote(
  trade: InterfaceTrade | undefined,
  tradeState: TradeState,
  swapInputError?: ReactNode,
): boolean {
  if (swapInputError) {
    return false
  }
  // if the current quote is a preview quote, allow the user to progress to the Swap review screen
  if (isPreviewTrade(trade)) {
    return true
  }

  return Boolean(trade && tradeState === TradeState.VALID)
}

export default function SwapPage({ className }: { className?: string }) {
  const location = useLocation()
  const multichainUXEnabled = useFeatureFlag(FeatureFlags.MultichainUX)
  // (WEB-4737): Remove this line after completing A/A Test on Web
  useFeatureFlag(FeatureFlags.AATestWeb)

  const {
    initialInputCurrency,
    initialOutputCurrency,
    initialChainId,
    initialTypedValue,
    initialField,
    initialCurrencyLoading,
  } = useInitialCurrencyState()
  const isUnsupportedConnectedChain = useSupportedChainId(useAccount().chainId) === undefined
  const shouldDisableTokenInputs = multichainUXEnabled ? false : isUnsupportedConnectedChain

  return (
    <Trace logImpression page={InterfacePageName.SWAP_PAGE}>
      <PageWrapper>
        <Swap
          className={className}
          chainId={initialChainId}
          multichainUXEnabled={multichainUXEnabled}
          disableTokenInputs={shouldDisableTokenInputs}
          initialInputCurrency={initialInputCurrency}
          initialOutputCurrency={initialOutputCurrency}
          initialTypedValue={initialTypedValue}
          initialIndependentField={initialField}
          initialCurrencyLoading={initialCurrencyLoading}
          syncTabToUrl={true}
        />
      </PageWrapper>
      {location.pathname === '/swap' && <SwitchLocaleLink />}
    </Trace>
  )
}

/**
 * The swap component displays the swap interface, manages state for the swap, and triggers onchain swaps.
 *
 * In most cases, chainId should refer to the connected chain, i.e. `useAccount().chainId`.
 * However if this component is being used in a context that displays information from a different, unconnected
 * chain (e.g. the TDP), then chainId should refer to the unconnected chain.
 */
export function Swap({
  className,
  initialInputCurrency,
  initialOutputCurrency,
  initialTypedValue,
  initialIndependentField,
  initialCurrencyLoading = false,
  chainId,
  hideHeader = false,
  onCurrencyChange,
  multichainUXEnabled = false,
  disableTokenInputs = false,
  compact = false,
  syncTabToUrl,
}: {
  className?: string
  chainId?: InterfaceChainId
  onCurrencyChange?: (selected: CurrencyState) => void
  disableTokenInputs?: boolean
  initialInputCurrency?: Currency
  initialOutputCurrency?: Currency
  initialTypedValue?: string
  initialIndependentField?: Field
  initialCurrencyLoading?: boolean
  compact?: boolean
  syncTabToUrl: boolean
  multichainUXEnabled?: boolean
  hideHeader?: boolean
}) {
  const isDark = useIsDarkMode()
  const screenSize = useScreenSize()
  const forAggregatorEnabled = useFeatureFlag(FeatureFlags.ForAggregator)
  const universalSwapFlow = useFeatureFlag(FeatureFlags.UniversalSwap)

  return (
    <SwapAndLimitContextProvider
      initialChainId={chainId}
      initialInputCurrency={initialInputCurrency}
      initialOutputCurrency={initialOutputCurrency}
      multichainUXEnabled={multichainUXEnabled}
    >
      {/* TODO: Move SwapContextProvider inside Swap tab ONLY after SwapHeader removes references to trade / autoSlippage */}
      <SwapAndLimitContext.Consumer>
        {({ currentTab }) => (
          <SwapContextProvider
            initialTypedValue={initialTypedValue}
            initialIndependentField={initialIndependentField}
            multichainUXEnabled={multichainUXEnabled}
          >
            <Flex width="100%">
              <SwapWrapper isDark={isDark} className={className} id="swap-page">
                {!hideHeader && <SwapHeader compact={compact || !screenSize.sm} syncTabToUrl={syncTabToUrl} />}
                {currentTab === SwapTab.Swap &&
                  (universalSwapFlow ? (
                    <Flex fill p="$spacing12">
                      <SwapFlow onClose={noop} swapCallback={noop} wrapCallback={noop} />
                    </Flex>
                  ) : (
                    <SwapForm
                      onCurrencyChange={onCurrencyChange}
                      initialCurrencyLoading={initialCurrencyLoading}
                      disableTokenInputs={disableTokenInputs}
                    />
                  ))}
                {currentTab === SwapTab.Limit && <LimitFormWrapper onCurrencyChange={onCurrencyChange} />}
                {currentTab === SwapTab.Send && (
                  <SendForm disableTokenInputs={disableTokenInputs} onCurrencyChange={onCurrencyChange} />
                )}
                {currentTab === SwapTab.Buy && forAggregatorEnabled && <BuyForm disabled={disableTokenInputs} />}
              </SwapWrapper>
              <NetworkAlert />
            </Flex>
          </SwapContextProvider>
        )}
      </SwapAndLimitContext.Consumer>
    </SwapAndLimitContextProvider>
  )
}
