import { InterfacePageName } from '@uniswap/analytics-events'
import { ChainId } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { Trace } from 'analytics'
import { NetworkAlert } from 'components/NetworkAlert/NetworkAlert'
import { SwapTab } from 'components/swap/constants'
import { PageWrapper, SwapWrapper } from 'components/swap/styled'
import SwapHeader from 'components/swap/SwapHeader'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { asSupportedChain } from 'constants/chains'
import { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { InterfaceTrade, TradeState } from 'state/routing/types'
import { isPreviewTrade } from 'state/routing/utils'
import { Field } from 'state/swap/actions'
import { useDefaultsFromURLSearch } from 'state/swap/hooks'
import { SwapState } from 'state/swap/reducer'
import { SwapContext, SwapContextProvider } from 'state/swap/SwapContext'

import { useIsDarkMode } from '../../theme/components/ThemeToggle'
import { SwapForm } from './SwapForm'

export function getIsReviewableQuote(
  trade: InterfaceTrade | undefined,
  tradeState: TradeState,
  swapInputError?: ReactNode
): boolean {
  if (swapInputError) return false
  // if the current quote is a preview quote, allow the user to progress to the Swap review screen
  if (isPreviewTrade(trade)) return true

  return Boolean(trade && tradeState === TradeState.VALID)
}

export default function SwapPage({ className }: { className?: string }) {
  const { chainId: connectedChainId } = useWeb3React()
  const loadedUrlParams = useDefaultsFromURLSearch()

  const location = useLocation()

  const supportedChainId = asSupportedChain(connectedChainId)

  return (
    <Trace page={InterfacePageName.SWAP_PAGE} shouldLogImpression>
      <PageWrapper>
        <Swap
          className={className}
          chainId={supportedChainId ?? ChainId.MAINNET}
          initialInputCurrencyId={loadedUrlParams?.[Field.INPUT]?.currencyId}
          initialOutputCurrencyId={loadedUrlParams?.[Field.OUTPUT]?.currencyId}
          disableTokenInputs={supportedChainId === undefined}
        />
        <NetworkAlert />
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
  initialInputCurrencyId,
  initialOutputCurrencyId,
  chainId,
  onCurrencyChange,
  disableTokenInputs,
}: {
  className?: string
  initialInputCurrencyId?: string | null
  initialOutputCurrencyId?: string | null
  chainId?: ChainId
  onCurrencyChange?: (selected: Pick<SwapState, Field.INPUT | Field.OUTPUT>) => void
  disableTokenInputs?: boolean
}) {
  const isDark = useIsDarkMode()

  return (
    <SwapContextProvider
      chainId={chainId}
      initialInputCurrencyId={initialInputCurrencyId}
      initialOutputCurrencyId={initialOutputCurrencyId}
    >
      <SwapContext.Consumer>
        {({ state }) => (
          <SwapWrapper isDark={isDark} className={className} id="swap-page">
            <SwapHeader />
            {/* todo: build Limit UI */}
            {state.currentTab === SwapTab.Swap ? (
              <SwapForm
                initialInputCurrencyId={initialInputCurrencyId}
                initialOutputCurrencyId={initialOutputCurrencyId}
                onCurrencyChange={onCurrencyChange}
                disableTokenInputs={disableTokenInputs}
              />
            ) : undefined}
          </SwapWrapper>
        )}
      </SwapContext.Consumer>
    </SwapContextProvider>
  )
}
