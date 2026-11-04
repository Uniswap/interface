import { TradeType } from '@uniswap/sdk-core'
import { type GasFeeResult, TradingApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { USDC, WBTC } from 'uniswap/src/constants/tokens'
import { RoutingInfo } from 'uniswap/src/features/transactions/swap/components/RoutingInfo/RoutingInfo'
import { createBridgeTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { renderWithProviders } from 'uniswap/src/test/render'

const gasFee: GasFeeResult = { value: '0', displayValue: '0', isLoading: false, error: null }

function renderBridgeRoutingInfo(
  provider: TradingApi.BridgeProvider | undefined,
): ReturnType<typeof renderWithProviders> {
  const trade = createBridgeTrade({
    quote: {
      quote: {
        input: { amount: '1000', maximumAmount: '1000' },
        output: { amount: '990', minimumAmount: '990' },
        provider,
      },
      requestId: '123',
      routing: TradingApi.Routing.BRIDGE,
      permitData: null,
    },
    currencyIn: USDC,
    currencyOut: WBTC,
    tradeType: TradeType.EXACT_INPUT,
  })
  if (!trade) {
    throw new Error('Expected test bridge trade to be created')
  }

  return renderWithProviders(<RoutingInfo trade={trade} chainId={UniverseChainId.Mainnet} gasFee={gasFee} />)
}

describe(RoutingInfo, () => {
  it.each([
    { provider: TradingApi.BridgeProvider.RELAY, shown: 'Relay API', hidden: 'Across API' },
    { provider: TradingApi.BridgeProvider.ACROSS, shown: 'Across API', hidden: 'Relay API' },
    { provider: undefined, shown: 'Across API', hidden: 'Relay API' },
  ])('labels a bridge served by provider $provider as $shown', ({ provider, shown, hidden }) => {
    const { queryByText } = renderBridgeRoutingInfo(provider)

    expect(queryByText(shown)).toBeTruthy()
    expect(queryByText(hidden)).toBeNull()
  })
})
