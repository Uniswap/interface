import { TradingApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import {
  buildRouteDiagram,
  getRouteDiagramPoolHref,
  getRouteDiagramTokenHref,
} from 'uniswap/src/utils/routingDiagram/routeGraph/buildRouteDiagram'

const CHAIN_ID = UniverseChainId.Mainnet
const USDC = { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', chainId: 1, symbol: 'USDC', decimals: '6' }
const USDS = { address: '0xdC035D45d973E3EC169d2276DDab16f1e407384F', chainId: 1, symbol: 'USDS' }
const WETH = { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', chainId: 1, symbol: 'WETH', decimals: '18' }
const ETH = { address: '0x0000000000000000000000000000000000000000', chainId: 1, symbol: 'ETH', decimals: '18' }

// Trimmed from the GuideStar sample in Uniswap/backend#14714 (1M USDC -> ETH).
const GUIDESTAR_GRAPH: TradingApi.RouteGraph = {
  pools: [
    {
      protocol: TradingApi.RouteGraphPool.protocol.V4,
      address: '0x563a406490261c3f4d9152e5320f28590d7011d7b084d2e58513e9fc0464391b',
      hooks: '0x958A0904940f744f8c6b72c043CeeE3EA34AE888',
      fee: '0',
      tokenIn: USDC,
      tokenOut: USDS,
      shareOfInputBps: 1980,
      usdIn: '198000',
      usdOut: '197994.17120027303',
    },
    {
      protocol: TradingApi.RouteGraphPool.protocol.V3,
      address: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
      fee: '500',
      tokenIn: USDC,
      tokenOut: WETH,
      shareOfInputBps: 8020,
      usdIn: '802000',
      usdOut: '801000',
    },
    {
      protocol: TradingApi.RouteGraphPool.protocol.WRAP,
      tokenIn: WETH,
      tokenOut: ETH,
      shareOfInputBps: 8090,
      usdIn: '807183.7777350309',
      usdOut: '807183.7777350309',
    },
  ],
}

describe(buildRouteDiagram, () => {
  it('returns undefined without a graph or pools', () => {
    expect(buildRouteDiagram({ routeGraph: undefined, chainId: CHAIN_ID })).toBeUndefined()
    expect(buildRouteDiagram({ routeGraph: { pools: [] }, chainId: CHAIN_ID })).toBeUndefined()
  })

  it('makes one node per token and one link per pool hop', () => {
    const diagram = buildRouteDiagram({ routeGraph: GUIDESTAR_GRAPH, chainId: CHAIN_ID })
    expect(diagram?.nodes.map((node) => node.symbol)).toEqual(['USDC', 'USDS', 'WETH', 'ETH'])
    expect(diagram?.links).toHaveLength(3)
    const [hooked, , wrap] = diagram?.links ?? []
    expect(hooked).toMatchObject({
      protocol: TradingApi.RouteGraphPool.protocol.V4,
      hooks: '0x958A0904940f744f8c6b72c043CeeE3EA34AE888',
      feePips: 0,
      isDynamicFee: false,
      shareBps: 1980,
      usdIn: 198000,
    })
    expect(wrap).toMatchObject({ protocol: TradingApi.RouteGraphPool.protocol.WRAP, poolAddress: undefined })
  })

  it('keys native ETH on the chain native currency id, apart from WETH', () => {
    const diagram = buildRouteDiagram({ routeGraph: GUIDESTAR_GRAPH, chainId: CHAIN_ID })
    const eth = diagram?.nodes.find((node) => node.symbol === 'ETH')
    const weth = diagram?.nodes.find((node) => node.symbol === 'WETH')
    expect(eth?.id).not.toEqual(weth?.id)
    expect(diagram?.links[2]).toMatchObject({ source: weth?.id, target: eth?.id })
  })

  it('reads a uniroute graph without USD amounts', () => {
    const diagram = buildRouteDiagram({
      routeGraph: {
        pools: [
          {
            protocol: TradingApi.RouteGraphPool.protocol.V4,
            address: '0x599326d9cd5e1ea0893305c87d5ec3199e7f05e94d72159f35dea381479a615e',
            isDynamicFee: true,
            tokenIn: USDC,
            tokenOut: ETH,
            shareOfInputBps: 10000,
          },
        ],
      },
      chainId: CHAIN_ID,
    })
    expect(diagram?.links[0]).toMatchObject({ isDynamicFee: true, feePips: undefined, usdIn: undefined })
  })

  it('makes a later visit of a token its own node, sharing the token key', () => {
    // USDC -> WETH -> USDC (visit 1) -> USDS: the route returns to USDC mid-route.
    const diagram = buildRouteDiagram({
      routeGraph: {
        pools: [
          {
            protocol: TradingApi.RouteGraphPool.protocol.V3,
            address: '0x01',
            tokenIn: USDC,
            tokenOut: WETH,
            shareOfInputBps: 10000,
          },
          {
            protocol: TradingApi.RouteGraphPool.protocol.V3,
            address: '0x02',
            tokenIn: WETH,
            tokenOut: USDC,
            tokenOutVisit: 1,
            shareOfInputBps: 10000,
          },
          {
            protocol: TradingApi.RouteGraphPool.protocol.V4,
            address: '0x03',
            tokenIn: USDC,
            tokenInVisit: 1,
            tokenOut: USDS,
            shareOfInputBps: 10000,
          },
        ],
      },
      chainId: CHAIN_ID,
    })
    const usdcNodes = diagram?.nodes.filter((node) => node.symbol === 'USDC') ?? []
    expect(usdcNodes).toHaveLength(2)
    expect(usdcNodes[0]?.tokenKey).toBe(usdcNodes[1]?.tokenKey)
    expect(usdcNodes[0]?.id).not.toBe(usdcNodes[1]?.id)
    expect(diagram?.links[1]?.target).toBe(diagram?.links[2]?.source)
    expect(diagram?.links[0]?.source).not.toBe(diagram?.links[2]?.source)
  })

  it('omits the diagram when a token has no address', () => {
    const routeGraph = { pools: [{ ...GUIDESTAR_GRAPH.pools[0]!, tokenOut: { symbol: 'USDS' } }] }
    expect(buildRouteDiagram({ routeGraph, chainId: CHAIN_ID })).toBeUndefined()
  })
})

describe('route diagram hrefs', () => {
  const diagram = buildRouteDiagram({ routeGraph: GUIDESTAR_GRAPH, chainId: CHAIN_ID })!

  it('links pool hops to their pool page and leaves WRAP unlinked', () => {
    expect(getRouteDiagramPoolHref({ link: diagram.links[1]!, chainId: CHAIN_ID })).toBe(
      '/explore/pools/ethereum/0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
    )
    expect(getRouteDiagramPoolHref({ link: diagram.links[2]!, chainId: CHAIN_ID })).toBeUndefined()
  })

  it('links tokens to their token page', () => {
    expect(getRouteDiagramTokenHref({ node: diagram.nodes[0]!, chainId: CHAIN_ID })).toContain(
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    )
  })
})
