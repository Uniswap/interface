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
import useParsedQueryString from 'hooks/useParsedQueryString'
import { ReactNode, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { InterfaceTrade, TradeState } from 'state/routing/types'
import { isPreviewTrade } from 'state/routing/utils'
import { queryParametersToSwapState } from 'state/swap/hooks'
import { SwapContext, SwapContextProvider, SwapState } from 'state/swap/SwapContext'

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

  const location = useLocation()

  const supportedChainId = asSupportedChain(connectedChainId)
  const parsedQs = useParsedQueryString()

  const parsedSwapState = useMemo(() => {
    return queryParametersToSwapState(parsedQs)
  }, [parsedQs])

  return (
    <Trace page={InterfacePageName.SWAP_PAGE} shouldLogImpression>
      <PageWrapper>
        <Swap
          className={className}
          chainId={supportedChainId ?? ChainId.MAINNET}
          disableTokenInputs={supportedChainId === undefined}
          initialInputCurrencyId={parsedSwapState?.inputCurrencyId}
          initialOutputCurrencyId={parsedSwapState?.outputCurrencyId}
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
  disableTokenInputs = false,
}: {
  className?: string
  chainId?: ChainId
  onCurrencyChange?: (selected: Pick<SwapState, 'inputCurrencyId' | 'outputCurrencyId'>) => void
  disableTokenInputs?: boolean
  initialInputCurrencyId?: string | null
  initialOutputCurrencyId?: string | null
}) {
  const isDark = useIsDarkMode()

  return (
    <SwapContextProvider
      chainId={chainId}
      initialInputCurrencyId={initialInputCurrencyId}
      initialOutputCurrencyId={initialOutputCurrencyId}
    >
      <SwapContext.Consumer>
        {({ currentTab }) => (
          <SwapWrapper isDark={isDark} className={className} id="swap-page">
            <SwapHeader />
            {/* todo: build Limit UI */}
            {currentTab === SwapTab.Swap ? (
              <SwapForm onCurrencyChange={onCurrencyChange} disableTokenInputs={disableTokenInputs} />
            ) : undefined}
          </SwapWrapper>
        )}
      </SwapContext.Consumer>
    </SwapContextProvider>
  )
}
