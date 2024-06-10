import { InterfacePageName } from '@uniswap/analytics-events'
import { ChainId, Currency } from '@uniswap/sdk-core'
import { NetworkAlert } from 'components/NetworkAlert/NetworkAlert'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import SwapHeader from 'components/swap/SwapHeader'
import { PageWrapper, SwapWrapper } from 'components/swap/styled'
import { useSupportedChainId } from 'constants/chains'
import { useScreenSize } from 'hooks/screenSize'
import { useAccount } from 'hooks/useAccount'
import { SendForm } from 'pages/Swap/Send/SendForm'
import { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { InterfaceTrade, TradeState } from 'state/routing/types'
import { isPreviewTrade } from 'state/routing/utils'
import { SwapAndLimitContextProvider, SwapContextProvider } from 'state/swap/SwapContext'
import { useInitialCurrencyState } from 'state/swap/hooks'
import { CurrencyState, SwapAndLimitContext } from 'state/swap/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { useIsDarkMode } from '../../theme/components/ThemeToggle'
import { LimitFormWrapper } from './Limit/LimitForm'
import { SwapForm } from './SwapForm'

export function getIsReviewableQuote(
  trade: InterfaceTrade | undefined,
  tradeState: TradeState,
  swapInputError?: ReactNode
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

  const { initialInputCurrency, initialOutputCurrency, chainId } = useInitialCurrencyState()
  const shouldDisableTokenInputs = useSupportedChainId(useAccount().chainId) === undefined

  return (
    <Trace logImpression page={InterfacePageName.SWAP_PAGE}>
      <PageWrapper>
        <Swap
          className={className}
          chainId={chainId}
          disableTokenInputs={shouldDisableTokenInputs}
          initialInputCurrency={initialInputCurrency}
          initialOutputCurrency={initialOutputCurrency}
          syncTabToUrl={true}
        />
        {location.pathname !== '/limit' && <NetworkAlert />}
      </PageWrapper>
      {location.pathname === '/swap' && <SwitchLocaleLink />}
    </Trace>
  )
}

/**
 * The swap component displays the swap interface, manages state for the swap, and triggers onchain swaps.
 *
 * In most cases, chainId should refer to the connected chain, i.e. `useWeb3React().chainId`.
 * However if this component is being used in a context that displays information from a different, unconnected
 * chain (e.g. the TDP), then chainId should refer to the unconnected chain.
 */
export function Swap({
  className,
  initialInputCurrency,
  initialOutputCurrency,
  chainId,
  onCurrencyChange,
  disableTokenInputs = false,
  compact = false,
  syncTabToUrl,
}: {
  className?: string
  chainId?: ChainId
  onCurrencyChange?: (selected: CurrencyState) => void
  disableTokenInputs?: boolean
  initialInputCurrency?: Currency
  initialOutputCurrency?: Currency
  compact?: boolean
  syncTabToUrl: boolean
}) {
  const isDark = useIsDarkMode()
  const screenSize = useScreenSize()

  return (
    <SwapAndLimitContextProvider
      chainId={chainId}
      initialInputCurrency={initialInputCurrency}
      initialOutputCurrency={initialOutputCurrency}
    >
      {/* TODO: Move SwapContextProvider inside Swap tab ONLY after SwapHeader removes references to trade / autoSlippage */}
      <SwapAndLimitContext.Consumer>
        {({ currentTab }) => (
          <SwapContextProvider>
            <SwapWrapper isDark={isDark} className={className} id="swap-page">
              <SwapHeader compact={compact || !screenSize.sm} syncTabToUrl={syncTabToUrl} />
             
              {currentTab === SwapTab.Swap && (
                <SwapForm onCurrencyChange={onCurrencyChange} disableTokenInputs={disableTokenInputs} />
              )}
              {currentTab === SwapTab.Limit && <LimitFormWrapper onCurrencyChange={onCurrencyChange} />}
              {currentTab === SwapTab.Send && (
                <SendForm disableTokenInputs={disableTokenInputs} onCurrencyChange={onCurrencyChange} />
              )}
            </SwapWrapper>
          </SwapContextProvider>
        )}
      </SwapAndLimitContext.Consumer>
    </SwapAndLimitContextProvider>
  )
}
