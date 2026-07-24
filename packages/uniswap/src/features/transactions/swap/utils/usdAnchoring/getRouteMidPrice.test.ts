import { Token } from '@uniswap/sdk-core'
import type { TradingApi } from '@universe/api'
import type { ClassicQuoteRoute } from 'uniswap/src/features/transactions/swap/utils/usdAnchoring/getRouteMidPrice'
import { getRouteMidPrice } from 'uniswap/src/features/transactions/swap/utils/usdAnchoring/getRouteMidPrice'
import { logger } from 'utilities/src/logger/logger'

const CHAIN_ID = 1

// Addresses chosen so lexicographic order (= on-chain token0/token1 sort order) is explicit.
const ADDRESS_LOW = `0x${'1'.repeat(40)}`
const ADDRESS_MID = `0x${'2'.repeat(40)}`
const ADDRESS_HIGH = `0x${'3'.repeat(40)}`
const ADDRESS_ZERO = `0x${'0'.repeat(40)}`

const USD6 = new Token(CHAIN_ID, ADDRESS_LOW, 6, 'USD6', 'Six Decimal Dollar')
const WETH18 = new Token(CHAIN_ID, ADDRESS_MID, 18, 'WETH', 'Wrapped Ether')
const DAI18 = new Token(CHAIN_ID, ADDRESS_HIGH, 18, 'DAI', 'Dai')

const SQRT_RATIO_1_TO_1 = '79228162514264337593543950336' // 2^96 → raw token1/token0 price of 1
const SQRT_RATIO_4_TO_1 = '158456325028528675187087900672' // 2*2^96 → raw token1/token0 price of 4
// sqrt(2000e6/1e18) * 2^96 → 2000 USD6 (6 decimals) per 1 native (18 decimals), see INFRA-2364 worksheet
const SQRT_RATIO_NATIVE_2000_USD6 = '3543191142285914205922034'

function tokenInRoute(token: Token): TradingApi.TokenInRoute {
  return {
    address: token.address,
    chainId: token.chainId,
    symbol: token.symbol,
    decimals: String(token.decimals),
  }
}

function v3Pool({
  tokenIn,
  tokenOut,
  sqrtRatioX96,
  amountIn,
}: {
  tokenIn: TradingApi.TokenInRoute
  tokenOut: TradingApi.TokenInRoute
  sqrtRatioX96?: string
  amountIn?: string
}): TradingApi.V3PoolInRoute {
  return {
    type: 'v3-pool',
    address: `0x${'a'.repeat(40)}`,
    tokenIn,
    tokenOut,
    sqrtRatioX96,
    liquidity: '1000000',
    tickCurrent: '0',
    fee: '500',
    amountIn,
  }
}

function v2Pool({
  tokenIn,
  tokenOut,
  reserveIn,
  reserveOut,
  amountIn,
}: {
  tokenIn: TradingApi.TokenInRoute
  tokenOut: TradingApi.TokenInRoute
  reserveIn?: string
  reserveOut?: string
  amountIn?: string
}): TradingApi.V2PoolInRoute {
  return {
    type: 'v2-pool',
    address: `0x${'b'.repeat(40)}`,
    tokenIn,
    tokenOut,
    reserve0: { token: tokenIn, quotient: reserveIn },
    reserve1: { token: tokenOut, quotient: reserveOut },
    amountIn,
  }
}

describe(getRouteMidPrice, () => {
  describe('v3 pools', () => {
    it('returns the pool mid price when tokenIn is token0', () => {
      const price = getRouteMidPrice({
        route: [
          [v3Pool({ tokenIn: tokenInRoute(WETH18), tokenOut: tokenInRoute(DAI18), sqrtRatioX96: SQRT_RATIO_4_TO_1 })],
        ],
        inputCurrency: WETH18,
        outputCurrency: DAI18,
      })

      expect(price?.baseCurrency).toBe(WETH18)
      expect(price?.quoteCurrency).toBe(DAI18)
      expect(price?.toSignificant(6)).toBe('4')
    })

    it('inverts the pool mid price when tokenIn is token1', () => {
      const price = getRouteMidPrice({
        route: [
          [v3Pool({ tokenIn: tokenInRoute(DAI18), tokenOut: tokenInRoute(WETH18), sqrtRatioX96: SQRT_RATIO_4_TO_1 })],
        ],
        inputCurrency: DAI18,
        outputCurrency: WETH18,
      })

      expect(price?.toSignificant(6)).toBe('0.25')
    })

    it('adjusts for differing token decimals', () => {
      // token0 = USD6 (6 decimals), token1 = WETH18 (18 decimals), 1:1 raw ratio
      // Human price: 1 raw-per-raw × 10^(6-18)… i.e. 10^-12 WETH per USD6 raw → 1e-12 * 1e(18-6)?
      // Selling WETH18 (token1) into USD6: raw USD6 per raw WETH = 1 → human = 1 × 10^(18-6) = 10^12
      const price = getRouteMidPrice({
        route: [
          [v3Pool({ tokenIn: tokenInRoute(WETH18), tokenOut: tokenInRoute(USD6), sqrtRatioX96: SQRT_RATIO_1_TO_1 })],
        ],
        inputCurrency: WETH18,
        outputCurrency: USD6,
      })

      expect(price?.toSignificant(6)).toBe('1000000000000')
    })

    it('returns undefined when sqrtRatioX96 is missing', () => {
      const price = getRouteMidPrice({
        route: [[v3Pool({ tokenIn: tokenInRoute(WETH18), tokenOut: tokenInRoute(DAI18) })]],
        inputCurrency: WETH18,
        outputCurrency: DAI18,
      })

      expect(price).toBeUndefined()
    })

    it('returns undefined when sqrtRatioX96 is zero', () => {
      const price = getRouteMidPrice({
        route: [[v3Pool({ tokenIn: tokenInRoute(WETH18), tokenOut: tokenInRoute(DAI18), sqrtRatioX96: '0' })]],
        inputCurrency: WETH18,
        outputCurrency: DAI18,
      })

      expect(price).toBeUndefined()
    })
  })

  describe('v2 pools', () => {
    it('computes mid price from reserves', () => {
      // 1000 WETH vs 2,000,000 USD6 → 2000 USD6 per WETH
      const price = getRouteMidPrice({
        route: [
          [
            v2Pool({
              tokenIn: tokenInRoute(WETH18),
              tokenOut: tokenInRoute(USD6),
              reserveIn: '1000000000000000000000',
              reserveOut: '2000000000000',
            }),
          ],
        ],
        inputCurrency: WETH18,
        outputCurrency: USD6,
      })

      expect(price?.toSignificant(6)).toBe('2000')
    })

    it('matches reserves to tokens by address rather than position', () => {
      // Same pool but reserve0/reserve1 swapped relative to tokenIn/tokenOut
      const pool = v2Pool({
        tokenIn: tokenInRoute(WETH18),
        tokenOut: tokenInRoute(USD6),
      })
      pool.reserve0 = { token: tokenInRoute(USD6), quotient: '2000000000000' }
      pool.reserve1 = { token: tokenInRoute(WETH18), quotient: '1000000000000000000000' }

      const price = getRouteMidPrice({ route: [[pool]], inputCurrency: WETH18, outputCurrency: USD6 })

      expect(price?.toSignificant(6)).toBe('2000')
    })

    it('returns undefined when a reserve is missing or zero', () => {
      const missing = getRouteMidPrice({
        route: [[v2Pool({ tokenIn: tokenInRoute(WETH18), tokenOut: tokenInRoute(USD6), reserveIn: '1000' })]],
        inputCurrency: WETH18,
        outputCurrency: USD6,
      })
      const zero = getRouteMidPrice({
        route: [
          [v2Pool({ tokenIn: tokenInRoute(WETH18), tokenOut: tokenInRoute(USD6), reserveIn: '0', reserveOut: '10' })],
        ],
        inputCurrency: WETH18,
        outputCurrency: USD6,
      })

      expect(missing).toBeUndefined()
      expect(zero).toBeUndefined()
    })
  })

  describe('v4 pools', () => {
    it('treats the zero address (native currency) as token0', () => {
      const nativeInRoute: TradingApi.TokenInRoute = {
        address: ADDRESS_ZERO,
        chainId: CHAIN_ID,
        symbol: 'ETH',
        decimals: '18',
      }
      const pool: TradingApi.V4PoolInRoute = {
        type: 'v4-pool',
        address: `0x${'c'.repeat(40)}`,
        tokenIn: nativeInRoute,
        tokenOut: tokenInRoute(USD6),
        sqrtRatioX96: SQRT_RATIO_NATIVE_2000_USD6,
        liquidity: '1000000',
        tickCurrent: '0',
        fee: '500',
        tickSpacing: 10,
        hooks: ADDRESS_ZERO,
      }

      const price = getRouteMidPrice({ route: [[pool]], inputCurrency: WETH18, outputCurrency: USD6 })

      expect(parseFloat(price?.toSignificant(6) ?? '0')).toBeCloseTo(2000, 3)
    })
  })

  describe('multi-hop and split routes', () => {
    it('chains hop mid prices across a path', () => {
      // WETH → USD6 at 2000, then USD6 → DAI18 at 1 → 2000 DAI per WETH
      const price = getRouteMidPrice({
        route: [
          [
            v2Pool({
              tokenIn: tokenInRoute(WETH18),
              tokenOut: tokenInRoute(USD6),
              reserveIn: '1000000000000000000000',
              reserveOut: '2000000000000',
            }),
            v2Pool({
              tokenIn: tokenInRoute(USD6),
              tokenOut: tokenInRoute(DAI18),
              reserveIn: '1000000000000',
              reserveOut: '1000000000000000000000000',
            }),
          ],
        ],
        inputCurrency: WETH18,
        outputCurrency: DAI18,
      })

      expect(price?.toSignificant(6)).toBe('2000')
    })

    it('weights split routes by their input amounts', () => {
      // Path A: mid 2000, 3 WETH in. Path B: mid 1000, 1 WETH in → (3×2000 + 1×1000)/4 = 1750
      const price = getRouteMidPrice({
        route: [
          [
            v2Pool({
              tokenIn: tokenInRoute(WETH18),
              tokenOut: tokenInRoute(USD6),
              reserveIn: '1000000000000000000000',
              reserveOut: '2000000000000',
              amountIn: '3000000000000000000',
            }),
          ],
          [
            v2Pool({
              tokenIn: tokenInRoute(WETH18),
              tokenOut: tokenInRoute(USD6),
              reserveIn: '1000000000000000000000',
              reserveOut: '1000000000000',
              amountIn: '1000000000000000000',
            }),
          ],
        ],
        inputCurrency: WETH18,
        outputCurrency: USD6,
      })

      expect(price?.toSignificant(6)).toBe('1750')
    })

    it('falls back to equal weights when any path is missing its input amount', () => {
      const price = getRouteMidPrice({
        route: [
          [
            v2Pool({
              tokenIn: tokenInRoute(WETH18),
              tokenOut: tokenInRoute(USD6),
              reserveIn: '1000000000000000000000',
              reserveOut: '2000000000000',
              amountIn: '3000000000000000000',
            }),
          ],
          [
            v2Pool({
              tokenIn: tokenInRoute(WETH18),
              tokenOut: tokenInRoute(USD6),
              reserveIn: '1000000000000000000000',
              reserveOut: '1000000000000',
            }),
          ],
        ],
        inputCurrency: WETH18,
        outputCurrency: USD6,
      })

      expect(price?.toSignificant(6)).toBe('1500')
    })
  })

  describe('degenerate routes', () => {
    it('returns undefined for a missing route', () => {
      expect(getRouteMidPrice({ route: undefined, inputCurrency: WETH18, outputCurrency: USD6 })).toBeUndefined()
    })

    it('returns undefined for an empty route', () => {
      expect(getRouteMidPrice({ route: [], inputCurrency: WETH18, outputCurrency: USD6 })).toBeUndefined()
    })

    it('returns undefined when any path is empty', () => {
      const route = [
        [
          v2Pool({
            tokenIn: tokenInRoute(WETH18),
            tokenOut: tokenInRoute(USD6),
            reserveIn: '1000000000000000000000',
            reserveOut: '2000000000000',
          }),
        ],
        [],
      ]

      expect(getRouteMidPrice({ route, inputCurrency: WETH18, outputCurrency: USD6 })).toBeUndefined()
    })

    it('returns undefined for an unknown pool type', () => {
      const pool = { type: 'v5-pool' } as unknown as TradingApi.V3PoolInRoute

      expect(getRouteMidPrice({ route: [[pool]], inputCurrency: WETH18, outputCurrency: USD6 })).toBeUndefined()
    })
  })

  describe('malformed API data (crash hardening)', () => {
    beforeEach(() => {
      vi.spyOn(logger, 'error').mockImplementation(() => undefined)
    })

    const priceOf = (route: ClassicQuoteRoute | undefined): ReturnType<typeof getRouteMidPrice> =>
      getRouteMidPrice({ route, inputCurrency: WETH18, outputCurrency: USD6 })

    it.each(['garbage', '1.5', '1e18', 'NaN', '-1000', ''])(
      'returns undefined without throwing for sqrtRatioX96 = %j',
      (sqrtRatioX96) => {
        const route = [[v3Pool({ tokenIn: tokenInRoute(WETH18), tokenOut: tokenInRoute(USD6), sqrtRatioX96 })]]

        expect(() => priceOf(route)).not.toThrow()
        expect(priceOf(route)).toBeUndefined()
      },
    )

    it.each(['garbage', '1.5', '1e18', 'NaN', '-1000', ''])(
      'returns undefined without throwing for a reserve quotient = %j',
      (reserveIn) => {
        const route = [
          [v2Pool({ tokenIn: tokenInRoute(WETH18), tokenOut: tokenInRoute(USD6), reserveIn, reserveOut: '1000' })],
        ]

        expect(() => priceOf(route)).not.toThrow()
        expect(priceOf(route)).toBeUndefined()
      },
    )

    it('returns undefined for a zero sqrtRatioX96 in both price directions', () => {
      // tokenIn = token0 (no inversion) and tokenIn = token1 (zero would become a denominator).
      const noInvert = [[v3Pool({ tokenIn: tokenInRoute(WETH18), tokenOut: tokenInRoute(DAI18), sqrtRatioX96: '0' })]]
      const inverted = [[v3Pool({ tokenIn: tokenInRoute(DAI18), tokenOut: tokenInRoute(WETH18), sqrtRatioX96: '0' })]]

      expect(() => getRouteMidPrice({ route: noInvert, inputCurrency: WETH18, outputCurrency: DAI18 })).not.toThrow()
      expect(getRouteMidPrice({ route: noInvert, inputCurrency: WETH18, outputCurrency: DAI18 })).toBeUndefined()
      expect(() => getRouteMidPrice({ route: inverted, inputCurrency: DAI18, outputCurrency: WETH18 })).not.toThrow()
      expect(getRouteMidPrice({ route: inverted, inputCurrency: DAI18, outputCurrency: WETH18 })).toBeUndefined()
    })

    it('handles 2^256-scale values without overflow', () => {
      // 2^256, far beyond Number precision.
      const huge = '115792089237316195423570985008687907853269984665640564039457584007913129639936'
      const route = [
        [
          v2Pool({
            tokenIn: tokenInRoute(WETH18),
            tokenOut: tokenInRoute(USD6),
            reserveIn: huge,
            reserveOut: huge,
            amountIn: huge,
          }),
        ],
      ]

      expect(() => priceOf(route)).not.toThrow()
      expect(priceOf(route)?.toSignificant(6)).toBe('1000000000000')
    })

    it.each(['NaN', '1.5', '-3000000000000000000', '0', ''])(
      'falls back to equal path weights when a split-route amountIn = %j',
      (amountIn) => {
        // Same split as the weighting test above; unparseable/degenerate weights → (2000 + 1000) / 2.
        const route = [
          [
            v2Pool({
              tokenIn: tokenInRoute(WETH18),
              tokenOut: tokenInRoute(USD6),
              reserveIn: '1000000000000000000000',
              reserveOut: '2000000000000',
              amountIn,
            }),
          ],
          [
            v2Pool({
              tokenIn: tokenInRoute(WETH18),
              tokenOut: tokenInRoute(USD6),
              reserveIn: '1000000000000000000000',
              reserveOut: '1000000000000',
              amountIn,
            }),
          ],
        ]

        expect(() => priceOf(route)).not.toThrow()
        expect(priceOf(route)?.toSignificant(6)).toBe('1500')
      },
    )

    it('ignores garbage decimals in route token metadata (currency args are authoritative)', () => {
      const tokenIn = { ...tokenInRoute(WETH18), decimals: 'garbage' }
      const tokenOut = { ...tokenInRoute(USD6), decimals: '255' }
      const route = [[v2Pool({ tokenIn, tokenOut, reserveIn: '1000000000000000000000', reserveOut: '2000000000000' })]]

      expect(() => priceOf(route)).not.toThrow()
      expect(priceOf(route)?.toSignificant(6)).toBe('2000')
    })

    it('returns undefined and logs when a token address is not a string', () => {
      const pool = v3Pool({ tokenIn: tokenInRoute(WETH18), tokenOut: tokenInRoute(USD6), sqrtRatioX96: '1' })
      ;(pool.tokenIn as unknown as { address: number }).address = 12345

      expect(() => priceOf([[pool]])).not.toThrow()
      expect(priceOf([[pool]])).toBeUndefined()
      expect(logger.error).toHaveBeenCalledWith(expect.any(Error), expect.any(Object))
    })

    it('returns undefined and logs when a pool in a path is null', () => {
      const route = [[null]] as unknown as ClassicQuoteRoute

      expect(() => priceOf(route)).not.toThrow()
      expect(priceOf(route)).toBeUndefined()
      expect(logger.error).toHaveBeenCalledWith(expect.any(Error), expect.any(Object))
    })

    it('returns undefined and logs when the route or a path is not an array', () => {
      const nonArrayRoute = {} as unknown as ClassicQuoteRoute
      const nonArrayPath = ['not-a-path'] as unknown as ClassicQuoteRoute

      expect(() => priceOf(nonArrayRoute)).not.toThrow()
      expect(priceOf(nonArrayRoute)).toBeUndefined()
      expect(() => priceOf(nonArrayPath)).not.toThrow()
      expect(priceOf(nonArrayPath)).toBeUndefined()
      expect(logger.error).toHaveBeenCalledWith(expect.any(Error), expect.any(Object))
    })

    it('returns undefined when reserve token fields are missing entirely', () => {
      const pool = v2Pool({ tokenIn: tokenInRoute(WETH18), tokenOut: tokenInRoute(USD6) })
      ;(pool as unknown as { reserve0?: unknown }).reserve0 = undefined
      ;(pool as unknown as { reserve1?: unknown }).reserve1 = undefined

      expect(() => priceOf([[pool]])).not.toThrow()
      expect(priceOf([[pool]])).toBeUndefined()
    })
  })
})
