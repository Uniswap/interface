import { TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { RoutingLabel } from 'uniswap/src/components/RoutingDiagram/RoutingLabel'
import { USDC, WBTC } from 'uniswap/src/constants/tokens'
import { createBridgeTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { renderWithProviders } from 'uniswap/src/test/render'

describe(RoutingLabel, () => {
  it.each([
    { provider: TradingApi.BridgeProvider.RELAY, shown: 'Relay API', hidden: 'Across API' },
    { provider: TradingApi.BridgeProvider.ACROSS, shown: 'Across API', hidden: 'Relay API' },
    { provider: undefined, shown: 'Across API', hidden: 'Relay API' },
  ])('names a bridge served by provider $provider as $shown', ({ provider, shown, hidden }) => {
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

    const { queryByText } = renderWithProviders(<RoutingLabel trade={trade} />)

    expect(queryByText(shown)).toBeTruthy()
    expect(queryByText(hidden)).toBeNull()
  })
})
