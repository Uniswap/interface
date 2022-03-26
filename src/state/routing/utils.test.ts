import { Token, TradeType } from '@uniswap/sdk-core'

import { nativeOnChain } from '../../constants/tokens'
import { computeRoutes } from './utils'

const USDC = new Token(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC')
const DAI = new Token(1, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 6, 'DAI')
const MKR = new Token(1, '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', 6, 'MKR')

const ETH = nativeOnChain(1)

// helper function to make amounts more readable
const amount = (raw: TemplateStringsArray) => (parseInt(raw[0]) * 1e6).toString()

describe('#useRoute', () => {
  it('handles an undefined payload', () => {
    const result = computeRoutes(undefined, undefined, TradeType.EXACT_INPUT, undefined)

    expect(result).toBeUndefined()
  })

  it('handles empty edges and nodes', () => {
    const result = computeRoutes(USDC, DAI, TradeType.EXACT_INPUT, {
      route: [],
    })

    expect(result).toEqual([])
  })

  it('handles a single route trade from DAI to USDC from v3', () => {
    const result = computeRoutes(DAI, USDC, TradeType.EXACT_INPUT, {
      route: [
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
            tokenIn: DAI,
            tokenOut: USDC,
          },
        ],
      ],
    })

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
    const result = computeRoutes(DAI, USDC, TradeType.EXACT_INPUT, {
      route: [
        [
          {
            type: 'v2-pool',
            address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            amountIn: amount`1`,
            amountOut: amount`5`,
            tokenIn: DAI,
            tokenOut: USDC,
            reserve0: {
              token: DAI,
              quotient: amount`100`,
            },
            reserve1: {
              token: USDC,
              quotient: amount`200`,
            },
          },
        ],
      ],
    })

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
    const result = computeRoutes(DAI, USDC, TradeType.EXACT_OUTPUT, {
      route: [
        [
          {
            type: 'v2-pool',
            address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            amountIn: amount`5`,
            amountOut: amount`6`,
            tokenIn: DAI,
            tokenOut: USDC,
            reserve0: {
              token: DAI,
              quotient: amount`1000`,
            },
            reserve1: {
              token: USDC,
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
            tokenIn: DAI,
            tokenOut: MKR,
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
            tokenIn: MKR,
            tokenOut: USDC,
            sqrtRatioX96: '2437312313659959819381354528',
            liquidity: '10272714736694327408',
            tickCurrent: '-69633',
          },
        ],
      ],
    })

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
    const result = computeRoutes(DAI, USDC, TradeType.EXACT_INPUT, {
      route: [
        [
          {
            type: 'v3-pool',
            address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            amountIn: amount`1`,
            amountOut: amount`5`,
            fee: '500',
            tokenIn: DAI,
            tokenOut: USDC,
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
            tokenIn: DAI,
            tokenOut: USDC,
            sqrtRatioX96: '2437312313659959819381354528',
            liquidity: '10272714736694327408',
            tickCurrent: '-69633',
          },
        ],
      ],
    })

    expect(result).toBeDefined()
    expect(result?.length).toBe(2)
    expect(result?.[0].routev3?.input).toStrictEqual(DAI)
    expect(result?.[0].routev3?.output).toStrictEqual(USDC)
    expect(result?.[0].routev3?.tokenPath).toEqual([DAI, USDC])
    expect(result?.[0].inputAmount.toSignificant()).toBe('1')
  })

  describe('with ETH', () => {
    it('outputs native ETH as input currency', () => {
      const WETH = ETH.wrapped

      const result = computeRoutes(ETH, USDC, TradeType.EXACT_OUTPUT, {
        route: [
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
              tokenIn: WETH,
              tokenOut: USDC,
            },
          ],
        ],
      })

      expect(result).toBeDefined()
      expect(result?.length).toBe(1)
      expect(result?.[0].routev3?.input).toStrictEqual(ETH)
      expect(result?.[0].routev3?.output).toStrictEqual(USDC)
      expect(result?.[0].routev3?.tokenPath).toStrictEqual([WETH, USDC])
      expect(result && result[0].outputAmount.toSignificant()).toBe('5')
    })

    it('outputs native ETH as output currency', () => {
      const WETH = new Token(1, ETH.wrapped.address, 18, 'WETH')
      const result = computeRoutes(USDC, ETH, TradeType.EXACT_OUTPUT, {
        route: [
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
              tokenIn: USDC,
              tokenOut: WETH,
            },
          ],
        ],
      })

      expect(result?.length).toBe(1)
      expect(result?.[0].routev3?.input).toStrictEqual(USDC)
      expect(result?.[0].routev3?.output).toStrictEqual(ETH)
      expect(result?.[0].routev3?.tokenPath).toStrictEqual([USDC, WETH])
      expect(result?.[0].outputAmount.toSignificant()).toBe('1')
    })

    it('outputs native ETH as input currency for v2 routes', () => {
      const WETH = ETH.wrapped

      const result = computeRoutes(ETH, USDC, TradeType.EXACT_OUTPUT, {
        route: [
          [
            {
              type: 'v2-pool',
              address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
              amountIn: (1e18).toString(),
              amountOut: amount`5`,
              tokenIn: WETH,
              tokenOut: USDC,
              reserve0: {
                token: WETH,
                quotient: amount`100`,
              },
              reserve1: {
                token: USDC,
                quotient: amount`200`,
              },
            },
          ],
        ],
      })

      expect(result).toBeDefined()
      expect(result?.length).toBe(1)
      expect(result?.[0].routev2?.input).toStrictEqual(ETH)
      expect(result?.[0].routev2?.output).toStrictEqual(USDC)
      expect(result?.[0].routev2?.path).toStrictEqual([WETH, USDC])
      expect(result && result[0].outputAmount.toSignificant()).toBe('5')
    })

    it('outputs native ETH as output currency for v2 routes', () => {
      const WETH = new Token(1, ETH.wrapped.address, 18, 'WETH')
      const result = computeRoutes(USDC, ETH, TradeType.EXACT_OUTPUT, {
        route: [
          [
            {
              type: 'v2-pool',
              address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
              amountIn: amount`5`,
              amountOut: (1e18).toString(),
              tokenIn: USDC,
              tokenOut: WETH,
              reserve0: {
                token: WETH,
                quotient: amount`100`,
              },
              reserve1: {
                token: USDC,
                quotient: amount`200`,
              },
            },
          ],
        ],
      })

      expect(result?.length).toBe(1)
      expect(result?.[0].routev2?.input).toStrictEqual(USDC)
      expect(result?.[0].routev2?.output).toStrictEqual(ETH)
      expect(result?.[0].routev2?.path).toStrictEqual([USDC, WETH])
      expect(result?.[0].outputAmount.toSignificant()).toBe('1')
    })
  })
})
