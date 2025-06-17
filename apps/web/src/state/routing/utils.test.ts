import { Currency, Token, TradeType } from '@uniswap/sdk-core'
import { GetQuoteArgs, PoolType, RouterPreference, TokenInRoute, URAQuoteType } from 'state/routing/types'
import { computeRoutes } from 'state/routing/utils'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const USDC = new Token(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', undefined, false)
const USDC_IN_ROUTE = toTokenInRoute(USDC)
const DAI = new Token(1, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 6, 'DAI', undefined, false)
const DAI_IN_ROUTE = toTokenInRoute(DAI)
const MKR = new Token(1, '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', 6, 'MKR', undefined, false)
const MKR_IN_ROUTE = toTokenInRoute(MKR)

const ETH = nativeOnChain(UniverseChainId.Mainnet)
const WETH_IN_ROUTE = toTokenInRoute(ETH.wrapped)

// helper function to make amounts more readable
const amount = (raw: TemplateStringsArray) => (parseInt(raw[0]) * 1e6).toString()

const BASE_ARGS = {
  amount: '100',
  routerPreference: RouterPreference.API,
  tradeType: TradeType.EXACT_INPUT,
  needsWrapIfUniswapX: false,
  uniswapXForceSyntheticQuotes: false,
  sendPortionEnabled: true,
}

// eslint-disable-next-line max-params
function constructArgs(currencyIn: Currency, currencyOut: Currency, routingType: URAQuoteType): GetQuoteArgs {
  return {
    ...BASE_ARGS,
    tokenInAddress: currencyIn.isNative ? 'ETH' : currencyIn.address,
    tokenInChainId: currencyIn.chainId,
    tokenInDecimals: currencyIn.decimals,
    tokenInSymbol: currencyIn.symbol,
    tokenOutAddress: currencyOut.isNative ? 'ETH' : currencyOut.address,
    tokenOutChainId: currencyOut.chainId,
    tokenOutDecimals: currencyOut.decimals,
    tokenOutSymbol: currencyOut.symbol,
    routingType,
  }
}

function toTokenInRoute(token: Token): TokenInRoute {
  return {
    address: token.address,
    chainId: token.chainId,
    symbol: token.symbol,
    decimals: token.decimals,
    buyFeeBps: token.buyFeeBps?.toString(),
    sellFeeBps: token.sellFeeBps?.toString(),
  }
}

describe('#useRoute', () => {
  it('handles empty edges and nodes', () => {
    const result = computeRoutes(constructArgs(USDC, DAI, URAQuoteType.CLASSIC), [])
    expect(result).toEqual([])
  })

  it('handles a single route trade from DAI to USDC from v3', () => {
    const result = computeRoutes(constructArgs(DAI, USDC, URAQuoteType.CLASSIC), [
      [
        {
          type: 'v3-pool',
          address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
          amountIn: amount`1`,
          amountOut: amount`5`,
          fee: '500',
          sqrtRatioX96: '2437312313659959819381354528',
          liquidity: '10272714736694327408',
          tickCurrent: '-69633',
          tokenIn: toTokenInRoute(DAI),
          tokenOut: toTokenInRoute(USDC),
        },
      ],
    ])

    const r = result?.[0]

    expect(result).toBeDefined()
    expect(result?.length).toBe(1)
    expect(r?.routev3?.input).toStrictEqual(DAI)
    expect(r?.routev3?.output).toStrictEqual(USDC)
    expect(r?.routev3?.tokenPath).toStrictEqual([DAI, USDC])
    expect(r?.routev2).toBeNull()
    expect(r?.inputAmount.toSignificant()).toBe('1')
    expect(r?.outputAmount.toSignificant()).toBe('5')
  })

  it('handles a single route trade from DAI to USDC from v2', () => {
    const result = computeRoutes(constructArgs(DAI, USDC, URAQuoteType.CLASSIC), [
      [
        {
          type: 'v2-pool',
          address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
          amountIn: amount`1`,
          amountOut: amount`5`,
          tokenIn: DAI_IN_ROUTE,
          tokenOut: USDC_IN_ROUTE,
          reserve0: {
            token: DAI_IN_ROUTE,
            quotient: amount`100`,
          },
          reserve1: {
            token: USDC_IN_ROUTE,
            quotient: amount`200`,
          },
        },
      ],
    ])

    const r = result?.[0]

    expect(result).toBeDefined()
    expect(result?.length).toBe(1)
    expect(r?.routev2?.input).toStrictEqual(DAI)
    expect(r?.routev2?.output).toStrictEqual(USDC)
    expect(r?.routev2?.path).toStrictEqual([DAI, USDC])
    expect(r?.routev3).toBeNull()
    expect(r?.inputAmount.toSignificant()).toBe('1')
    expect(r?.outputAmount.toSignificant()).toBe('5')
  })

  it('handles a multi-route trade from DAI to USDC', () => {
    const result = computeRoutes(constructArgs(DAI, USDC, URAQuoteType.CLASSIC), [
      [
        {
          type: 'v2-pool',
          address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
          amountIn: amount`5`,
          amountOut: amount`6`,
          tokenIn: DAI_IN_ROUTE,
          tokenOut: USDC_IN_ROUTE,
          reserve0: {
            token: DAI_IN_ROUTE,
            quotient: amount`1000`,
          },
          reserve1: {
            token: USDC_IN_ROUTE,
            quotient: amount`500`,
          },
        },
      ],
      [
        {
          type: 'v3-pool',
          address: '0x2f8F72aA9304c8B593d555F12eF6589cC3A579A2',
          amountIn: amount`10`,
          amountOut: amount`1`,
          fee: '3000',
          tokenIn: DAI_IN_ROUTE,
          tokenOut: MKR_IN_ROUTE,
          sqrtRatioX96: '2437312313659959819381354528',
          liquidity: '10272714736694327408',
          tickCurrent: '-69633',
        },
        {
          type: 'v3-pool',
          address: '0x3f8F72aA9304c8B593d555F12eF6589cC3A579A2',
          amountIn: amount`1`,
          amountOut: amount`200`,
          fee: '10000',
          tokenIn: MKR_IN_ROUTE,
          tokenOut: USDC_IN_ROUTE,
          sqrtRatioX96: '2437312313659959819381354528',
          liquidity: '10272714736694327408',
          tickCurrent: '-69633',
        },
      ],
    ])

    expect(result).toBeDefined()
    expect(result?.length).toBe(2)

    // first route is v2
    expect(result?.[0].routev2?.input).toStrictEqual(DAI)
    expect(result?.[0].routev2?.output).toStrictEqual(USDC)
    expect(result?.[0].routev2?.path).toEqual([DAI, USDC])
    expect(result?.[0].routev3).toBeNull()

    // second route is v3
    expect(result?.[1].routev3?.input).toStrictEqual(DAI)
    expect(result?.[1].routev3?.output).toStrictEqual(USDC)
    expect(result?.[1].routev3?.tokenPath).toEqual([DAI, MKR, USDC])
    expect(result?.[1].routev2).toBeNull()

    expect(result?.[0].outputAmount.toSignificant()).toBe('6')
    expect(result?.[1].outputAmount.toSignificant()).toBe('200')
  })

  it('handles a single route trade with same token pair, different fee tiers', () => {
    const result = computeRoutes(constructArgs(DAI, USDC, URAQuoteType.CLASSIC), [
      [
        {
          type: 'v3-pool',
          address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
          amountIn: amount`1`,
          amountOut: amount`5`,
          fee: '500',
          tokenIn: DAI_IN_ROUTE,
          tokenOut: USDC_IN_ROUTE,
          sqrtRatioX96: '2437312313659959819381354528',
          liquidity: '10272714736694327408',
          tickCurrent: '-69633',
        },
      ],
      [
        {
          type: 'v3-pool',
          address: '0x2f8F72aA9304c8B593d555F12eF6589cC3A579A2',
          amountIn: amount`10`,
          amountOut: amount`50`,
          fee: '3000',
          tokenIn: DAI_IN_ROUTE,
          tokenOut: USDC_IN_ROUTE,
          sqrtRatioX96: '2437312313659959819381354528',
          liquidity: '10272714736694327408',
          tickCurrent: '-69633',
        },
      ],
    ])

    expect(result).toBeDefined()
    expect(result?.length).toBe(2)
    expect(result?.[0].routev3?.input).toStrictEqual(DAI)
    expect(result?.[0].routev3?.output).toStrictEqual(USDC)
    expect(result?.[0].routev3?.tokenPath).toEqual([DAI, USDC])
    expect(result?.[0].inputAmount.toSignificant()).toBe('1')
  })

  it('computes mixed routes correctly', () => {
    const result = computeRoutes(constructArgs(DAI, MKR, URAQuoteType.CLASSIC), [
      [
        {
          type: PoolType.V3Pool,
          address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
          amountIn: amount`1`,
          amountOut: amount`5`,
          fee: '500',
          tokenIn: DAI_IN_ROUTE,
          tokenOut: USDC_IN_ROUTE,
          sqrtRatioX96: '2437312313659959819381354528',
          liquidity: '10272714736694327408',
          tickCurrent: '-69633',
        },
        {
          type: PoolType.V2Pool,
          address: 'x2f8F72aA9304c8B593d555F12eF6589cC3A579A2',
          amountIn: amount`10`,
          amountOut: amount`50`,
          tokenIn: USDC_IN_ROUTE,
          tokenOut: MKR_IN_ROUTE,
          reserve0: {
            token: USDC_IN_ROUTE,
            quotient: amount`100`,
          },
          reserve1: {
            token: MKR_IN_ROUTE,
            quotient: amount`200`,
          },
        },
      ],
    ])

    expect(result).toBeDefined()
    expect(result?.length).toBe(1)
    expect(result?.[0].routev3).toBeNull()
    expect(result?.[0].routev2).toBeNull()
    expect(result?.[0].mixedRoute?.output).toStrictEqual(MKR)
    expect(result?.[0].inputAmount.toSignificant()).toBe('1')
  })

  describe('with ETH', () => {
    it('outputs native ETH as input currency', () => {
      const WETH = ETH.wrapped

      const result = computeRoutes(constructArgs(ETH, USDC, URAQuoteType.CLASSIC), [
        [
          {
            type: 'v3-pool',
            address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            amountIn: (1e18).toString(),
            amountOut: amount`5`,
            fee: '500',
            sqrtRatioX96: '2437312313659959819381354528',
            liquidity: '10272714736694327408',
            tickCurrent: '-69633',
            tokenIn: WETH_IN_ROUTE,
            tokenOut: USDC_IN_ROUTE,
          },
        ],
      ])

      expect(result).toBeDefined()
      expect(result?.length).toBe(1)
      expect(result?.[0].routev3?.input).toStrictEqual(ETH)
      expect(result?.[0].routev3?.output).toStrictEqual(USDC)
      expect(result?.[0].routev3?.tokenPath).toStrictEqual([WETH, USDC])
      expect(result && result[0].outputAmount.toSignificant()).toBe('5')
    })

    it('outputs native ETH as output currency', () => {
      const WETH = new Token(1, ETH.wrapped.address, 18, 'WETH')
      const result = computeRoutes(constructArgs(USDC, ETH, URAQuoteType.CLASSIC), [
        [
          {
            type: 'v3-pool',
            address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            amountIn: amount`5`,
            amountOut: (1e18).toString(),
            fee: '500',
            sqrtRatioX96: '2437312313659959819381354528',
            liquidity: '10272714736694327408',
            tickCurrent: '-69633',
            tokenIn: USDC_IN_ROUTE,
            tokenOut: WETH_IN_ROUTE,
          },
        ],
      ])

      expect(result?.length).toBe(1)
      expect(result?.[0].routev3?.input).toStrictEqual(USDC)
      expect(result?.[0].routev3?.output).toStrictEqual(ETH)
      expect(result?.[0].routev3?.tokenPath).toStrictEqual([USDC, WETH])
      expect(result?.[0].outputAmount.toSignificant()).toBe('1')
    })

    it('outputs native ETH as input currency for v2 routes', () => {
      const WETH = ETH.wrapped

      const result = computeRoutes(constructArgs(ETH, USDC, URAQuoteType.CLASSIC), [
        [
          {
            type: 'v2-pool',
            address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            amountIn: (1e18).toString(),
            amountOut: amount`5`,
            tokenIn: WETH_IN_ROUTE,
            tokenOut: USDC_IN_ROUTE,
            reserve0: {
              token: WETH_IN_ROUTE,
              quotient: amount`100`,
            },
            reserve1: {
              token: USDC_IN_ROUTE,
              quotient: amount`200`,
            },
          },
        ],
      ])

      expect(result).toBeDefined()
      expect(result?.length).toBe(1)
      expect(result?.[0].routev2?.input).toStrictEqual(ETH)
      expect(result?.[0].routev2?.output).toStrictEqual(USDC)
      expect(result?.[0].routev2?.path).toStrictEqual([WETH, USDC])
      expect(result && result[0].outputAmount.toSignificant()).toBe('5')
    })

    it('outputs native ETH as output currency for v2 routes', () => {
      const WETH = new Token(1, ETH.wrapped.address, 18, 'WETH')
      const result = computeRoutes(constructArgs(USDC, ETH, URAQuoteType.CLASSIC), [
        [
          {
            type: 'v2-pool',
            address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            amountIn: amount`5`,
            amountOut: (1e18).toString(),
            tokenIn: USDC_IN_ROUTE,
            tokenOut: WETH_IN_ROUTE,
            reserve0: {
              token: WETH_IN_ROUTE,
              quotient: amount`100`,
            },
            reserve1: {
              token: USDC_IN_ROUTE,
              quotient: amount`200`,
            },
          },
        ],
      ])

      expect(result?.length).toBe(1)
      expect(result?.[0].routev2?.input).toStrictEqual(USDC)
      expect(result?.[0].routev2?.output).toStrictEqual(ETH)
      expect(result?.[0].routev2?.path).toStrictEqual([USDC, WETH])
      expect(result?.[0].outputAmount.toSignificant()).toBe('1')
    })
  })
})

describe('#useRoute X v2', () => {
  it('handles empty edges and nodes', () => {
    const result = computeRoutes(constructArgs(USDC, DAI, URAQuoteType.DUTCH_V2), [])
    expect(result).toEqual([])
  })

  it('handles a single route trade from DAI to USDC from v3', () => {
    const result = computeRoutes(constructArgs(DAI, USDC, URAQuoteType.DUTCH_V2), [
      [
        {
          type: 'v3-pool',
          address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
          amountIn: amount`1`,
          amountOut: amount`5`,
          fee: '500',
          sqrtRatioX96: '2437312313659959819381354528',
          liquidity: '10272714736694327408',
          tickCurrent: '-69633',
          tokenIn: toTokenInRoute(DAI),
          tokenOut: toTokenInRoute(USDC),
        },
      ],
    ])

    const r = result?.[0]

    expect(result).toBeDefined()
    expect(result?.length).toBe(1)
    expect(r?.routev3?.input).toStrictEqual(DAI)
    expect(r?.routev3?.output).toStrictEqual(USDC)
    expect(r?.routev3?.tokenPath).toStrictEqual([DAI, USDC])
    expect(r?.routev2).toBeNull()
    expect(r?.inputAmount.toSignificant()).toBe('1')
    expect(r?.outputAmount.toSignificant()).toBe('5')
  })

  it('handles a single route trade from DAI to USDC from v2', () => {
    const result = computeRoutes(constructArgs(DAI, USDC, URAQuoteType.DUTCH_V2), [
      [
        {
          type: 'v2-pool',
          address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
          amountIn: amount`1`,
          amountOut: amount`5`,
          tokenIn: DAI_IN_ROUTE,
          tokenOut: USDC_IN_ROUTE,
          reserve0: {
            token: DAI_IN_ROUTE,
            quotient: amount`100`,
          },
          reserve1: {
            token: USDC_IN_ROUTE,
            quotient: amount`200`,
          },
        },
      ],
    ])

    const r = result?.[0]

    expect(result).toBeDefined()
    expect(result?.length).toBe(1)
    expect(r?.routev2?.input).toStrictEqual(DAI)
    expect(r?.routev2?.output).toStrictEqual(USDC)
    expect(r?.routev2?.path).toStrictEqual([DAI, USDC])
    expect(r?.routev3).toBeNull()
    expect(r?.inputAmount.toSignificant()).toBe('1')
    expect(r?.outputAmount.toSignificant()).toBe('5')
  })

  it('handles a multi-route trade from DAI to USDC', () => {
    const result = computeRoutes(constructArgs(DAI, USDC, URAQuoteType.DUTCH_V2), [
      [
        {
          type: 'v2-pool',
          address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
          amountIn: amount`5`,
          amountOut: amount`6`,
          tokenIn: DAI_IN_ROUTE,
          tokenOut: USDC_IN_ROUTE,
          reserve0: {
            token: DAI_IN_ROUTE,
            quotient: amount`1000`,
          },
          reserve1: {
            token: USDC_IN_ROUTE,
            quotient: amount`500`,
          },
        },
      ],
      [
        {
          type: 'v3-pool',
          address: '0x2f8F72aA9304c8B593d555F12eF6589cC3A579A2',
          amountIn: amount`10`,
          amountOut: amount`1`,
          fee: '3000',
          tokenIn: DAI_IN_ROUTE,
          tokenOut: MKR_IN_ROUTE,
          sqrtRatioX96: '2437312313659959819381354528',
          liquidity: '10272714736694327408',
          tickCurrent: '-69633',
        },
        {
          type: 'v3-pool',
          address: '0x3f8F72aA9304c8B593d555F12eF6589cC3A579A2',
          amountIn: amount`1`,
          amountOut: amount`200`,
          fee: '10000',
          tokenIn: MKR_IN_ROUTE,
          tokenOut: USDC_IN_ROUTE,
          sqrtRatioX96: '2437312313659959819381354528',
          liquidity: '10272714736694327408',
          tickCurrent: '-69633',
        },
      ],
    ])

    expect(result).toBeDefined()
    expect(result?.length).toBe(2)

    // first route is v2
    expect(result?.[0].routev2?.input).toStrictEqual(DAI)
    expect(result?.[0].routev2?.output).toStrictEqual(USDC)
    expect(result?.[0].routev2?.path).toEqual([DAI, USDC])
    expect(result?.[0].routev3).toBeNull()

    // second route is v3
    expect(result?.[1].routev3?.input).toStrictEqual(DAI)
    expect(result?.[1].routev3?.output).toStrictEqual(USDC)
    expect(result?.[1].routev3?.tokenPath).toEqual([DAI, MKR, USDC])
    expect(result?.[1].routev2).toBeNull()

    expect(result?.[0].outputAmount.toSignificant()).toBe('6')
    expect(result?.[1].outputAmount.toSignificant()).toBe('200')
  })

  it('handles a single route trade with same token pair, different fee tiers', () => {
    const result = computeRoutes(constructArgs(DAI, USDC, URAQuoteType.DUTCH_V2), [
      [
        {
          type: 'v3-pool',
          address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
          amountIn: amount`1`,
          amountOut: amount`5`,
          fee: '500',
          tokenIn: DAI_IN_ROUTE,
          tokenOut: USDC_IN_ROUTE,
          sqrtRatioX96: '2437312313659959819381354528',
          liquidity: '10272714736694327408',
          tickCurrent: '-69633',
        },
      ],
      [
        {
          type: 'v3-pool',
          address: '0x2f8F72aA9304c8B593d555F12eF6589cC3A579A2',
          amountIn: amount`10`,
          amountOut: amount`50`,
          fee: '3000',
          tokenIn: DAI_IN_ROUTE,
          tokenOut: USDC_IN_ROUTE,
          sqrtRatioX96: '2437312313659959819381354528',
          liquidity: '10272714736694327408',
          tickCurrent: '-69633',
        },
      ],
    ])

    expect(result).toBeDefined()
    expect(result?.length).toBe(2)
    expect(result?.[0].routev3?.input).toStrictEqual(DAI)
    expect(result?.[0].routev3?.output).toStrictEqual(USDC)
    expect(result?.[0].routev3?.tokenPath).toEqual([DAI, USDC])
    expect(result?.[0].inputAmount.toSignificant()).toBe('1')
  })

  it('computes mixed routes correctly', () => {
    const result = computeRoutes(constructArgs(DAI, MKR, URAQuoteType.DUTCH_V2), [
      [
        {
          type: PoolType.V3Pool,
          address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
          amountIn: amount`1`,
          amountOut: amount`5`,
          fee: '500',
          tokenIn: DAI_IN_ROUTE,
          tokenOut: USDC_IN_ROUTE,
          sqrtRatioX96: '2437312313659959819381354528',
          liquidity: '10272714736694327408',
          tickCurrent: '-69633',
        },
        {
          type: PoolType.V2Pool,
          address: 'x2f8F72aA9304c8B593d555F12eF6589cC3A579A2',
          amountIn: amount`10`,
          amountOut: amount`50`,
          tokenIn: USDC_IN_ROUTE,
          tokenOut: MKR_IN_ROUTE,
          reserve0: {
            token: USDC_IN_ROUTE,
            quotient: amount`100`,
          },
          reserve1: {
            token: MKR_IN_ROUTE,
            quotient: amount`200`,
          },
        },
      ],
    ])

    expect(result).toBeDefined()
    expect(result?.length).toBe(1)
    expect(result?.[0].routev3).toBeNull()
    expect(result?.[0].routev2).toBeNull()
    expect(result?.[0].mixedRoute?.output).toStrictEqual(MKR)
    expect(result?.[0].inputAmount.toSignificant()).toBe('1')
  })

  describe('with ETH', () => {
    it('outputs native ETH as input currency', () => {
      const WETH = ETH.wrapped

      const result = computeRoutes(constructArgs(ETH, USDC, URAQuoteType.DUTCH_V2), [
        [
          {
            type: 'v3-pool',
            address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            amountIn: (1e18).toString(),
            amountOut: amount`5`,
            fee: '500',
            sqrtRatioX96: '2437312313659959819381354528',
            liquidity: '10272714736694327408',
            tickCurrent: '-69633',
            tokenIn: WETH_IN_ROUTE,
            tokenOut: USDC_IN_ROUTE,
          },
        ],
      ])

      expect(result).toBeDefined()
      expect(result?.length).toBe(1)
      expect(result?.[0].routev3?.input).toStrictEqual(ETH)
      expect(result?.[0].routev3?.output).toStrictEqual(USDC)
      expect(result?.[0].routev3?.tokenPath).toStrictEqual([WETH, USDC])
      expect(result && result[0].outputAmount.toSignificant()).toBe('5')
    })

    it('outputs native ETH as output currency', () => {
      const WETH = new Token(1, ETH.wrapped.address, 18, 'WETH')
      const result = computeRoutes(constructArgs(USDC, ETH, URAQuoteType.DUTCH_V2), [
        [
          {
            type: 'v3-pool',
            address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            amountIn: amount`5`,
            amountOut: (1e18).toString(),
            fee: '500',
            sqrtRatioX96: '2437312313659959819381354528',
            liquidity: '10272714736694327408',
            tickCurrent: '-69633',
            tokenIn: USDC_IN_ROUTE,
            tokenOut: WETH_IN_ROUTE,
          },
        ],
      ])

      expect(result?.length).toBe(1)
      expect(result?.[0].routev3?.input).toStrictEqual(USDC)
      expect(result?.[0].routev3?.output).toStrictEqual(ETH)
      expect(result?.[0].routev3?.tokenPath).toStrictEqual([USDC, WETH])
      expect(result?.[0].outputAmount.toSignificant()).toBe('1')
    })

    it('outputs native ETH as input currency for v2 routes', () => {
      const WETH = ETH.wrapped

      const result = computeRoutes(constructArgs(ETH, USDC, URAQuoteType.DUTCH_V2), [
        [
          {
            type: 'v2-pool',
            address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            amountIn: (1e18).toString(),
            amountOut: amount`5`,
            tokenIn: WETH_IN_ROUTE,
            tokenOut: USDC_IN_ROUTE,
            reserve0: {
              token: WETH_IN_ROUTE,
              quotient: amount`100`,
            },
            reserve1: {
              token: USDC_IN_ROUTE,
              quotient: amount`200`,
            },
          },
        ],
      ])

      expect(result).toBeDefined()
      expect(result?.length).toBe(1)
      expect(result?.[0].routev2?.input).toStrictEqual(ETH)
      expect(result?.[0].routev2?.output).toStrictEqual(USDC)
      expect(result?.[0].routev2?.path).toStrictEqual([WETH, USDC])
      expect(result && result[0].outputAmount.toSignificant()).toBe('5')
    })

    it('outputs native ETH as output currency for v2 routes', () => {
      const WETH = new Token(1, ETH.wrapped.address, 18, 'WETH')
      const result = computeRoutes(constructArgs(USDC, ETH, URAQuoteType.DUTCH_V2), [
        [
          {
            type: 'v2-pool',
            address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            amountIn: amount`5`,
            amountOut: (1e18).toString(),
            tokenIn: USDC_IN_ROUTE,
            tokenOut: WETH_IN_ROUTE,
            reserve0: {
              token: WETH_IN_ROUTE,
              quotient: amount`100`,
            },
            reserve1: {
              token: USDC_IN_ROUTE,
              quotient: amount`200`,
            },
          },
        ],
      ])

      expect(result?.length).toBe(1)
      expect(result?.[0].routev2?.input).toStrictEqual(USDC)
      expect(result?.[0].routev2?.output).toStrictEqual(ETH)
      expect(result?.[0].routev2?.path).toStrictEqual([USDC, WETH])
      expect(result?.[0].outputAmount.toSignificant()).toBe('1')
    })
  })
})
