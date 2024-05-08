import { BigNumber } from '@ethersproject/bignumber'
import { Token } from '@uniswap/sdk-core'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import { PoolType } from 'wallet/src/features/transactions/swap/trade/legacy/types'
import { computeRoutes } from './routeUtils'

const ETH = NativeCurrency.onChain(1)

const USDC_INFO = {
  chainId: 1,
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  decimals: 6,
  symbol: 'USDC',
}
const DAI_INFO = {
  chainId: 1,
  address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  decimals: 6,
  symbol: 'DAI',
}
const MKR_INFO = {
  chainId: 1,
  address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
  decimals: 6,
  symbol: 'MKR',
}
const WETH_INFO = {
  chainId: ETH.wrapped.chainId,
  address: ETH.wrapped.address,
  symbol: ETH.wrapped.symbol,
  decimals: ETH.wrapped.decimals,
  name: ETH.wrapped.name,
}

const USDC_TOKEN = new Token(1, USDC_INFO.address, USDC_INFO.decimals, USDC_INFO.symbol)
const DAI_TOKEN = new Token(1, DAI_INFO.address, DAI_INFO.decimals, DAI_INFO.symbol)
const MKR_TOKEN = new Token(1, MKR_INFO.address, MKR_INFO.decimals, MKR_INFO.symbol)
const WETH_TOKEN = new Token(
  1,
  WETH_INFO.address,
  WETH_INFO.decimals,
  WETH_INFO.symbol,
  WETH_INFO.name
)

// helper function to make amounts more readable
const amount = (raw: TemplateStringsArray): string => BigNumber.from(raw[0]).mul(1e6).toString()

describe('#useRoute', () => {
  it('handles an undefined payload', () => {
    const result = computeRoutes(false, false, undefined)

    expect(result).toBeUndefined()
  })

  it('handles empty edges and nodes', () => {
    const result = computeRoutes(false, false, {
      route: [],
    })

    expect(result).toEqual(undefined)
  })

  it('handles a single route trade from DAI to USDC from v3', () => {
    const result = computeRoutes(false, false, {
      route: [
        [
          {
            type: PoolType.V3Pool,
            address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            amountIn: amount`1`,
            amountOut: amount`5`,
            fee: '500',
            sqrtRatioX96: '2437312313659959819381354528',
            liquidity: '10272714736694327408',
            tickCurrent: '-69633',
            tokenIn: DAI_INFO,
            tokenOut: USDC_INFO,
          },
        ],
      ],
    })

    const r = result?.[0]

    expect(result).toBeDefined()
    expect(result?.length).toBe(1)
    expect(r?.routev3?.input).toStrictEqual(DAI_TOKEN)
    expect(r?.routev3?.output).toStrictEqual(USDC_TOKEN)
    expect(r?.routev3?.tokenPath).toStrictEqual([DAI_TOKEN, USDC_TOKEN])
    expect(r?.routev2).toBeNull()
    expect(r?.inputAmount.toSignificant()).toBe('1')
    expect(r?.outputAmount.toSignificant()).toBe('5')
  })

  it('handles a single route trade from DAI to USDC from v2', () => {
    const result = computeRoutes(false, false, {
      route: [
        [
          {
            type: PoolType.V2Pool,
            address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            amountIn: amount`1`,
            amountOut: amount`5`,
            tokenIn: DAI_INFO,
            tokenOut: USDC_INFO,
            reserve0: {
              token: DAI_INFO,
              quotient: amount`100`,
            },
            reserve1: {
              token: USDC_INFO,
              quotient: amount`200`,
            },
          },
        ],
      ],
    })

    const r = result?.[0]

    expect(result).toBeDefined()
    expect(result?.length).toBe(1)
    expect(r?.routev2?.input).toStrictEqual(DAI_TOKEN)
    expect(r?.routev2?.output).toStrictEqual(USDC_TOKEN)
    expect(r?.routev2?.path).toStrictEqual([DAI_TOKEN, USDC_TOKEN])
    expect(r?.routev3).toBeNull()
    expect(r?.inputAmount.toSignificant()).toBe('1')
    expect(r?.outputAmount.toSignificant()).toBe('5')
  })

  it('handles a multi-route trade from DAI to USDC', () => {
    const result = computeRoutes(false, false, {
      route: [
        [
          {
            type: PoolType.V2Pool,
            address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            amountIn: amount`5`,
            amountOut: amount`6`,
            tokenIn: DAI_INFO,
            tokenOut: USDC_INFO,
            reserve0: {
              token: DAI_INFO,
              quotient: amount`1000`,
            },
            reserve1: {
              token: USDC_INFO,
              quotient: amount`500`,
            },
          },
        ],
        [
          {
            type: PoolType.V3Pool,
            address: '0x2f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            amountIn: amount`10`,
            amountOut: amount`1`,
            fee: '3000',
            tokenIn: DAI_INFO,
            tokenOut: MKR_INFO,
            sqrtRatioX96: '2437312313659959819381354528',
            liquidity: '10272714736694327408',
            tickCurrent: '-69633',
          },
          {
            type: PoolType.V3Pool,
            address: '0x3f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            amountIn: amount`1`,
            amountOut: amount`200`,
            fee: '10000',
            tokenIn: MKR_INFO,
            tokenOut: USDC_INFO,
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
    expect(result?.[0]?.routev2?.input).toStrictEqual(DAI_TOKEN)
    expect(result?.[0]?.routev2?.output).toStrictEqual(USDC_TOKEN)
    expect(result?.[0]?.routev2?.path).toEqual([DAI_TOKEN, USDC_TOKEN])
    expect(result?.[0]?.routev3).toBeNull()

    // second route is v3
    expect(result?.[1]?.routev3?.input).toStrictEqual(DAI_TOKEN)
    expect(result?.[1]?.routev3?.output).toStrictEqual(USDC_TOKEN)
    expect(result?.[1]?.routev3?.tokenPath).toEqual([DAI_TOKEN, MKR_TOKEN, USDC_TOKEN])
    expect(result?.[1]?.routev2).toBeNull()

    expect(result?.[0]?.outputAmount.toSignificant()).toBe('6')
    expect(result?.[1]?.outputAmount.toSignificant()).toBe('200')
  })

  it('handles a single route trade with same token pair, different fee tiers', () => {
    const result = computeRoutes(false, false, {
      route: [
        [
          {
            type: PoolType.V3Pool,
            address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            amountIn: amount`1`,
            amountOut: amount`5`,
            fee: '500',
            tokenIn: DAI_INFO,
            tokenOut: USDC_INFO,
            sqrtRatioX96: '2437312313659959819381354528',
            liquidity: '10272714736694327408',
            tickCurrent: '-69633',
          },
        ],
        [
          {
            type: PoolType.V3Pool,
            address: '0x2f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            amountIn: amount`10`,
            amountOut: amount`50`,
            fee: '3000',
            tokenIn: DAI_INFO,
            tokenOut: USDC_INFO,
            sqrtRatioX96: '2437312313659959819381354528',
            liquidity: '10272714736694327408',
            tickCurrent: '-69633',
          },
        ],
      ],
    })

    expect(result).toBeDefined()
    expect(result?.length).toBe(2)
    expect(result?.[0]?.routev3?.input).toStrictEqual(DAI_TOKEN)
    expect(result?.[0]?.routev3?.output).toStrictEqual(USDC_TOKEN)
    expect(result?.[0]?.routev3?.tokenPath).toEqual([DAI_TOKEN, USDC_TOKEN])
    expect(result?.[0]?.inputAmount.toSignificant()).toBe('1')
  })

  it('computes mixed routes correctly', () => {
    const result = computeRoutes(false, false, {
      route: [
        [
          {
            type: PoolType.V3Pool,
            address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            amountIn: amount`1`,
            amountOut: amount`5`,
            fee: '500',
            tokenIn: DAI_INFO,
            tokenOut: ETH,
            sqrtRatioX96: '2437312313659959819381354528',
            liquidity: '10272714736694327408',
            tickCurrent: '-69633',
          },
          {
            type: PoolType.V2Pool,
            address: '0x2f8F72aA9304c8B593d555F12eF6589cC3A579A2',
            amountIn: amount`10`,
            amountOut: amount`50`,
            tokenIn: ETH,
            tokenOut: USDC_INFO,
            reserve0: {
              token: ETH,
              quotient: amount`100`,
            },
            reserve1: {
              token: USDC_INFO,
              quotient: amount`200`,
            },
          },
        ],
      ],
    })

    expect(result).toBeDefined()
    expect(result?.length).toBe(1)
    expect(result?.[0]?.routev3).toBeNull()
    expect(result?.[0]?.routev2).toBeNull()
    expect(result?.[0]?.mixedRoute?.output).toStrictEqual(USDC_TOKEN)
    expect(result?.[0]?.inputAmount.toSignificant()).toBe('1')
  })

  describe('with ETH', () => {
    it('outputs native ETH as input currency', () => {
      const result = computeRoutes(true, false, {
        route: [
          [
            {
              type: PoolType.V3Pool,
              address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
              amountIn: (1e18).toString(),
              amountOut: amount`5`,
              fee: '500',
              sqrtRatioX96: '2437312313659959819381354528',
              liquidity: '10272714736694327408',
              tickCurrent: '-69633',
              tokenIn: WETH_INFO,
              tokenOut: USDC_INFO,
            },
          ],
        ],
      })

      expect(result).toBeDefined()
      expect(result?.length).toBe(1)
      expect(result?.[0]?.routev3?.input).toStrictEqual(ETH)
      expect(result?.[0]?.routev3?.output).toStrictEqual(USDC_TOKEN)
      expect(result?.[0]?.routev3?.tokenPath).toStrictEqual([WETH_TOKEN, USDC_TOKEN])
      expect(result?.[0]?.outputAmount.toSignificant()).toBe('5')
    })

    it('outputs native ETH as output currency', () => {
      const result = computeRoutes(false, true, {
        route: [
          [
            {
              type: PoolType.V3Pool,
              address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
              amountIn: amount`5`,
              amountOut: (1e18).toString(),
              fee: '500',
              sqrtRatioX96: '2437312313659959819381354528',
              liquidity: '10272714736694327408',
              tickCurrent: '-69633',
              tokenIn: USDC_INFO,
              tokenOut: WETH_INFO,
            },
          ],
        ],
      })

      expect(result?.length).toBe(1)
      expect(result?.[0]?.routev3?.input).toStrictEqual(USDC_TOKEN)
      expect(result?.[0]?.routev3?.output).toStrictEqual(ETH)
      expect(result?.[0]?.routev3?.tokenPath).toStrictEqual([USDC_TOKEN, WETH_TOKEN])
      expect(result?.[0]?.outputAmount.toSignificant()).toBe('1')
    })

    it('outputs native ETH as input currency for v2 routes', () => {
      const result = computeRoutes(true, false, {
        route: [
          [
            {
              type: PoolType.V2Pool,
              address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
              amountIn: (1e18).toString(),
              amountOut: amount`5`,
              tokenIn: WETH_INFO,
              tokenOut: USDC_INFO,
              reserve0: {
                token: WETH_INFO,
                quotient: amount`100`,
              },
              reserve1: {
                token: USDC_INFO,
                quotient: amount`200`,
              },
            },
          ],
        ],
      })

      expect(result).toBeDefined()
      expect(result?.length).toBe(1)
      expect(result?.[0]?.routev2?.input).toStrictEqual(ETH)
      expect(result?.[0]?.routev2?.output).toStrictEqual(USDC_TOKEN)
      expect(result?.[0]?.routev2?.path).toStrictEqual([WETH_TOKEN, USDC_TOKEN])
      expect(result?.[0]?.outputAmount.toSignificant()).toBe('5')
    })

    it('outputs native ETH as output currency for v2 routes', () => {
      const result = computeRoutes(false, true, {
        route: [
          [
            {
              type: PoolType.V2Pool,
              address: '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2',
              amountIn: amount`5`,
              amountOut: (1e18).toString(),
              tokenIn: USDC_INFO,
              tokenOut: WETH_INFO,
              reserve0: {
                token: WETH_INFO,
                quotient: amount`100`,
              },
              reserve1: {
                token: USDC_INFO,
                quotient: amount`200`,
              },
            },
          ],
        ],
      })

      expect(result?.length).toBe(1)
      expect(result?.[0]?.routev2?.input).toStrictEqual(USDC_TOKEN)
      expect(result?.[0]?.routev2?.output).toStrictEqual(ETH)
      expect(result?.[0]?.routev2?.path).toStrictEqual([USDC_TOKEN, WETH_TOKEN])
      expect(result?.[0]?.outputAmount.toSignificant()).toBe('1')
    })
  })
})
