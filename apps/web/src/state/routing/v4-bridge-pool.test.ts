import { Token, TradeType } from '@uniswap/sdk-core'
import { GetQuoteArgs, PoolType, RouterPreference, TokenInRoute, URAQuoteType } from 'state/routing/types'
import { computeRoutes } from 'state/routing/utils'

const USDC = new Token(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', undefined, false)
const FEW_USDC = new Token(1, '0x9e2B31AA04C45897b90e24F5B8E1f98EE3566942', 6, 'fewUSDC', undefined, false)
const WETH = new Token(1, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18, 'WETH', undefined, false)
const FEW_WETH = new Token(1, '0xe2b1A1e14e3786Ae5aC8CF40E3BC0c4b5b836578', 18, 'fewWETH', undefined, false)

function toTokenInRoute(token: Token): TokenInRoute {
  return {
    address: token.address,
    chainId: token.chainId,
    symbol: token.symbol,
    decimals: token.decimals,
  }
}

function constructArgs(tokenIn: Token, tokenOut: Token): GetQuoteArgs {
  return {
    amount: '1000000',
    routerPreference: RouterPreference.API,
    tradeType: TradeType.EXACT_INPUT,
    needsWrapIfUniswapX: false,
    uniswapXForceSyntheticQuotes: false,
    sendPortionEnabled: true,
    tokenInAddress: tokenIn.address,
    tokenInChainId: tokenIn.chainId,
    tokenInDecimals: tokenIn.decimals,
    tokenInSymbol: tokenIn.symbol,
    tokenOutAddress: tokenOut.address,
    tokenOutChainId: tokenOut.chainId,
    tokenOutDecimals: tokenOut.decimals,
    tokenOutSymbol: tokenOut.symbol,
    routingType: URAQuoteType.CLASSIC,
  }
}

describe('V4 Bridge Pool + FewV2 Mixed Route', () => {
  it('parses a mixed route with V4 bridge pool (WETH → fewWETH) + FewV2 pool (fewWETH/fewUSDC)', () => {
    const result = computeRoutes(constructArgs(WETH, FEW_USDC), [
      [
        {
          type: PoolType.V4Pool,
          address: '0xBridgePoolId',
          amountIn: '1000000000000000000',
          amountOut: '1000000000000000000',
          fee: '0',
          tickSpacing: '0',
          hooks: '0x0000000000000000000000000000000000000000',
          sqrtRatioX96: '79228162514264337593543950336',
          liquidity: '0',
          tickCurrent: '0',
          tokenIn: toTokenInRoute(WETH),
          tokenOut: toTokenInRoute(FEW_WETH),
        },
        {
          type: PoolType.FewV2Pool,
          address: '0xFewV2PoolAddress',
          amountIn: undefined,
          amountOut: '3000000000',
          tokenIn: toTokenInRoute(FEW_WETH),
          tokenOut: toTokenInRoute(FEW_USDC),
          reserve0: {
            token: toTokenInRoute(FEW_WETH),
            quotient: '100000000000000000000',
          },
          reserve1: {
            token: toTokenInRoute(FEW_USDC),
            quotient: '300000000000',
          },
        },
      ],
    ])

    expect(result).toBeDefined()
    expect(result?.length).toBe(1)

    const r = result![0]
    expect(r.routev3).toBeNull()
    expect(r.routev2).toBeNull()
    expect(r.fewV2Route).toBeNull()
    expect(r.mixedRoute).not.toBeNull()

    expect(r.mixedRoute!.path).toHaveLength(3)
    expect(r.mixedRoute!.path[0].symbol).toBe('WETH')
    expect(r.mixedRoute!.path[1].symbol).toBe('fewWETH')
    expect(r.mixedRoute!.path[2].symbol).toBe('fewUSDC')

    expect(r.mixedRoute!.pools).toHaveLength(2)

    expect(r.inputAmount.toExact()).toBe('1')
    expect(r.outputAmount.toExact()).toBe('3000')
  })

  it('parses a pure V4 bridge pool route as mixed (not v3)', () => {
    const result = computeRoutes(constructArgs(USDC, FEW_USDC), [
      [
        {
          type: PoolType.V4Pool,
          address: '0xBridgePoolId',
          amountIn: '1000000',
          amountOut: '1000000',
          fee: '0',
          tickSpacing: '0',
          hooks: '0x0000000000000000000000000000000000000000',
          sqrtRatioX96: '79228162514264337593543950336',
          liquidity: '0',
          tickCurrent: '0',
          tokenIn: toTokenInRoute(USDC),
          tokenOut: toTokenInRoute(FEW_USDC),
        },
      ],
    ])

    expect(result).toBeDefined()
    expect(result?.length).toBe(1)

    const r = result![0]
    expect(r.routev3).toBeNull()
    expect(r.routev2).toBeNull()
    expect(r.fewV2Route).toBeNull()
    expect(r.mixedRoute).not.toBeNull()
    expect(r.mixedRoute!.pools).toHaveLength(1)
  })

  it('parses a 3-hop mixed route: V3 → V4 bridge → FewV2', () => {
    const DAI = new Token(1, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', undefined, false)

    const result = computeRoutes(constructArgs(DAI, FEW_USDC), [
      [
        {
          type: PoolType.V3Pool,
          address: '0xV3PoolAddress',
          amountIn: '1000000000000000000',
          amountOut: '1000000',
          fee: '500',
          sqrtRatioX96: '2437312313659959819381354528',
          liquidity: '10272714736694327408',
          tickCurrent: '-69633',
          tokenIn: toTokenInRoute(DAI),
          tokenOut: toTokenInRoute(USDC),
        },
        {
          type: PoolType.V4Pool,
          address: '0xBridgePoolId',
          amountIn: undefined,
          amountOut: undefined,
          fee: '0',
          tickSpacing: '0',
          hooks: '0x0000000000000000000000000000000000000000',
          sqrtRatioX96: '79228162514264337593543950336',
          liquidity: '0',
          tickCurrent: '0',
          tokenIn: toTokenInRoute(USDC),
          tokenOut: toTokenInRoute(FEW_USDC),
        },
        {
          type: PoolType.FewV2Pool,
          address: '0xFewV2PoolAddress',
          amountIn: undefined,
          amountOut: '2000000000000000000',
          tokenIn: toTokenInRoute(FEW_USDC),
          tokenOut: toTokenInRoute(FEW_WETH),
          reserve0: {
            token: toTokenInRoute(FEW_USDC),
            quotient: '300000000000',
          },
          reserve1: {
            token: toTokenInRoute(FEW_WETH),
            quotient: '100000000000000000000',
          },
        },
      ],
    ])

    expect(result).toBeDefined()
    expect(result?.length).toBe(1)

    const r = result![0]
    expect(r.routev3).toBeNull()
    expect(r.routev2).toBeNull()
    expect(r.fewV2Route).toBeNull()
    expect(r.mixedRoute).not.toBeNull()

    expect(r.mixedRoute!.path).toHaveLength(4)
    expect(r.mixedRoute!.path[0].symbol).toBe('DAI')
    expect(r.mixedRoute!.path[1].symbol).toBe('USDC')
    expect(r.mixedRoute!.path[2].symbol).toBe('fewUSDC')
    expect(r.mixedRoute!.path[3].symbol).toBe('fewWETH')

    expect(r.mixedRoute!.pools).toHaveLength(3)
  })
})
