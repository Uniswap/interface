import { fireEvent as rtlFireEvent } from '@testing-library/react'
import { TradingApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { RouteSankey } from 'uniswap/src/features/transactions/swap/components/RoutingInfo/RouteDiagram/RouteSankey.web'
import { renderWithProviders } from 'uniswap/src/test/render'
import { act } from 'uniswap/src/test/test-utils'
import { buildRouteDiagram } from 'uniswap/src/utils/routingDiagram/routeGraph/buildRouteDiagram'

vi.mock('utilities/src/react/useContainerWidth', () => ({ useContainerWidth: () => 600 }))

const WETH = { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', chainId: 1, symbol: 'WETH' }
const USDC = { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', chainId: 1, symbol: 'USDC' }
const ETH = { address: '0x0000000000000000000000000000000000000000', chainId: 1, symbol: 'ETH' }

const diagram = buildRouteDiagram({
  routeGraph: {
    pools: [
      {
        protocol: TradingApi.RouteGraphPool.protocol.WRAP,
        tokenIn: ETH,
        tokenOut: WETH,
        shareOfInputBps: 10000,
      },
      {
        protocol: TradingApi.RouteGraphPool.protocol.V3,
        address: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
        fee: '500',
        tokenIn: WETH,
        tokenOut: USDC,
        shareOfInputBps: 6000,
        usdIn: '600',
        usdOut: '599.5',
      },
      {
        protocol: TradingApi.RouteGraphPool.protocol.V4,
        address: '0x21c67e77068de97969ba93d4aab21826d33ca12bb9f565d8496e8fda8a82ca27',
        hooks: '0x958A0904940f744f8c6b72c043CeeE3EA34AE888',
        isDynamicFee: true,
        tokenIn: WETH,
        tokenOut: USDC,
        shareOfInputBps: 4000,
        usdIn: '400',
        usdOut: '399.8',
      },
    ],
  },
  chainId: UniverseChainId.Mainnet,
})!

function renderSankey(): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(
    <RouteSankey
      diagram={diagram}
      chainId={UniverseChainId.Mainnet}
      height={360}
      iconSize={18}
      logoUrlByTokenKey={new Map()}
    />,
  )
}

describe(RouteSankey, () => {
  it('draws one bar per token and one ribbon per pool hop', () => {
    const { getAllByTestId, getByText } = renderSankey()
    expect(getAllByTestId('route-sankey-ribbon')).toHaveLength(3)
    for (const symbol of ['ETH', 'WETH', 'USDC']) {
      expect(getByText(symbol)).toBeTruthy()
    }
  })

  it('shows pool details on ribbon hover', () => {
    const { getAllByTestId, getByText } = renderSankey()
    // Ribbons paint thickest first, so the 60% V3 pool is the first one after the 100% wrap.
    const v3Ribbon = getAllByTestId('route-sankey-ribbon')[1] as unknown as Element
    act(() => {
      rtlFireEvent.mouseMove(v3Ribbon, { clientX: 10, clientY: 10 })
    })
    expect(getByText('WETH/USDC')).toBeTruthy()
    expect(getByText('v3')).toBeTruthy()
    // USD in -> out with what the hop cost.
    expect(getByText('$600.00 → $599.50 (-0.08%)')).toBeTruthy()
  })

  it('labels each token with its share of the trade when it has no logo', () => {
    const { getAllByText } = renderSankey()
    // ETH, WETH and USDC each carry the whole trade.
    expect(getAllByText('100%')).toHaveLength(3)
  })
})
