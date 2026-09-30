import userEvent from '@testing-library/user-event'
import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, TICK_SPACINGS, TickMath, Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool, Position as V4Position } from '@uniswap/v4-sdk'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DAI, nativeOnChain } from 'uniswap/src/constants/tokens'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import sourceTranslations from 'uniswap/src/i18n/locales/source/en-US.json'
import { WETH } from 'uniswap/src/test/fixtures/lib/sdk'
import { describe, expect, it } from 'vitest'
import { FeesCellContent, getPositionValueDistribution, RangeCellContent } from '~/features/Liquidity/PositionsTableRow'
import { render, screen } from '~/test-utils/render'

const ONE_UNIT = '1000000000000000000'
const TWO_UNITS = '2000000000000000000'
const THREE_UNITS = '3000000000000000000'
const THREE_THOUSAND_DAI = '3000000000000000000000'
const ZERO = '0'

const SQRT_PRICE_1_1 = TickMath.getSqrtRatioAtTick(0)

function expectSplit(
  distribution: ReturnType<typeof getPositionValueDistribution>,
  percent0: string,
  percent1: string,
  markerPosition: number,
): void {
  expect(distribution?.percent0.toFixed(2)).toBe(percent0)
  expect(distribution?.percent1.toFixed(2)).toBe(percent1)
  expect(distribution?.markerPosition).toBe(markerPosition)
}

const concentratedPools: [string, V3Pool | V4Pool][] = [
  ['V3', new V3Pool(WETH, DAI, FeeAmount.MEDIUM, SQRT_PRICE_1_1, ONE_UNIT, 0)],
  [
    'V4',
    new V4Pool(WETH, DAI, FeeAmount.MEDIUM, TICK_SPACINGS[FeeAmount.MEDIUM], ZERO_ADDRESS, SQRT_PRICE_1_1, ONE_UNIT, 0),
  ],
]

describe('getPositionValueDistribution', () => {
  it('treats a V2 pair as 50/50 by value regardless of reserve ratio', () => {
    const pair = new Pair(
      CurrencyAmount.fromRawAmount(WETH, ONE_UNIT),
      CurrencyAmount.fromRawAmount(DAI, THREE_THOUSAND_DAI),
    )

    expectSplit(
      getPositionValueDistribution({
        currency0Amount: pair.reserve0,
        currency1Amount: pair.reserve1,
        poolOrPair: pair,
      }),
      '50.00',
      '50.00',
      0.5,
    )
  })

  describe.each(concentratedPools)('%s', (_label, pool) => {
    const distribute = (raw0: string, raw1: string): ReturnType<typeof getPositionValueDistribution> =>
      getPositionValueDistribution({
        currency0Amount: CurrencyAmount.fromRawAmount(pool.token0, raw0),
        currency1Amount: CurrencyAmount.fromRawAmount(pool.token1, raw1),
        poolOrPair: pool,
      })

    it('splits 50/50 when both tokens hold equal value', () => {
      expectSplit(distribute(ONE_UNIT, ONE_UNIT), '50.00', '50.00', 0.5)
    })

    it('weights by pool price for an unequal split', () => {
      expectSplit(distribute(THREE_UNITS, ONE_UNIT), '75.00', '25.00', 0.75)
    })

    it('returns 100% token0 when out of range below the position', () => {
      expectSplit(distribute(ONE_UNIT, ZERO), '100.00', '0.00', 1)
    })

    it('returns 100% token1 when out of range above the position', () => {
      expectSplit(distribute(ZERO, TWO_UNITS), '0.00', '100.00', 0)
    })

    it('returns undefined for an empty position', () => {
      expect(distribute(ZERO, ZERO)).toBeUndefined()
    })
  })

  // A pool row served with its price pinned to the bottom of the tick range makes token0 worth
  // ~1e-39 raw token1 units, so a position holding only token0 is worth a positive fraction of a
  // single raw token1 unit. Splitting on `.quotient` truncated that to 0/0, and Percent.toFixed
  // then threw "[big.js] Division by zero" out of a render-phase useMemo, taking down the whole
  // positions route. Values are from the wallet on LP-1564: V4 tokenId 1039089, Base ETH/USDC.
  describe('pool price pinned at MIN_TICK', () => {
    const BASE_CHAIN_ID = 8453
    const nativeEth = nativeOnChain(BASE_CHAIN_ID)
    const usdcBase = new Token(BASE_CHAIN_ID, '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 6, 'USDC', 'USD Coin')
    const MIN_TICK_SQRT_PRICE = TickMath.getSqrtRatioAtTick(TickMath.MIN_TICK)

    const degeneratePool = new V4Pool(
      nativeEth,
      usdcBase,
      30,
      1,
      ZERO_ADDRESS,
      MIN_TICK_SQRT_PRICE,
      ZERO,
      TickMath.MIN_TICK,
    )
    const dustPosition = new V4Position({
      pool: degeneratePool,
      liquidity: '612822055934',
      tickLower: -198100,
      tickUpper: -195750,
    })

    it('values the whole position below one raw unit of token1', () => {
      const totalValue = degeneratePool.token0Price.quote(dustPosition.amount0).add(dustPosition.amount1)

      expect(totalValue.greaterThan(0)).toBe(true)
      expect(totalValue.quotient.toString()).toBe('0')
    })

    it('splits the value without throwing', () => {
      expectSplit(
        getPositionValueDistribution({
          currency0Amount: dustPosition.amount0,
          currency1Amount: dustPosition.amount1,
          poolOrPair: degeneratePool,
        }),
        '100.00',
        '0.00',
        1,
      )
    })
  })
})

const EN_DASH = '\u2013'
const V2_FEES_TOOLTIP = sourceTranslations['fee.unavailable']

const positionWithoutFees = (version: ProtocolVersion): PositionInfo =>
  ({ version, uncollectedFeesUsd: undefined }) as PositionInfo

describe('FeesCellContent', () => {
  it('explains the dash on hover for a v2 position', async () => {
    render(<FeesCellContent position={positionWithoutFees(ProtocolVersion.V2)} />)

    await userEvent.hover(screen.getByText(EN_DASH))

    expect(await screen.findByText(V2_FEES_TOOLTIP)).toBeInTheDocument()
  })

  // The dash is not v2-exclusive: a v3/v4 position whose valuation was not served renders it too,
  // and the v2 explanation would be wrong there.
  it.each([
    ['v3', ProtocolVersion.V3],
    ['v4', ProtocolVersion.V4],
  ])('leaves the dash unexplained for an unvalued %s position', async (_label, version) => {
    render(<FeesCellContent position={positionWithoutFees(version)} />)

    await userEvent.hover(screen.getByText(EN_DASH))

    expect(screen.queryByText(V2_FEES_TOOLTIP)).toBeNull()
  })

  // Defensive: the liquidity-service parser never serves fees for v2 today, so this pairs the gate
  // with the "the dash is permanent" claim the tooltip makes rather than fixing a reachable bug.
  it('leaves a served v2 value unexplained', async () => {
    render(<FeesCellContent position={{ version: ProtocolVersion.V2, uncollectedFeesUsd: 12.34 } as PositionInfo} />)

    await userEvent.hover(screen.getByText('$12.34'))

    expect(screen.queryByText(V2_FEES_TOOLTIP)).toBeNull()
  })
})

describe('RangeCellContent current price', () => {
  // ≈ 0.001 token1 per token0, so the inverted quote is ≈ 1,000 and the two orientations can't be confused.
  const TICK_ONE_THOUSANDTH = -69082

  function rangeCellPosition(tokenA: Token, tokenB: Token): PositionInfo {
    const pool = new V3Pool(
      tokenA,
      tokenB,
      FeeAmount.MEDIUM,
      TickMath.getSqrtRatioAtTick(TICK_ONE_THOUSANDTH),
      ONE_UNIT,
      TICK_ONE_THOUSANDTH,
    )
    return {
      version: ProtocolVersion.V3,
      status: PositionStatus.OUT_OF_RANGE,
      currency0Amount: CurrencyAmount.fromRawAmount(pool.token0, ONE_UNIT),
      currency1Amount: CurrencyAmount.fromRawAmount(pool.token1, ZERO),
      poolOrPair: pool,
    } as unknown as PositionInfo
  }

  // DAI sorts below WETH by address, so the pool's token0Price is WETH per DAI while the range above
  // the current price is displayed as DAI per WETH (stablecoin quote). The hover price must follow.
  it("quotes in the range's asset when the pair is reversed for display", () => {
    render(<RangeCellContent position={rangeCellPosition(WETH, DAI)} />)

    const currentPrice = screen.getByText(/Current price:/)
    expect(currentPrice).toHaveTextContent(/(999|1,?000)/)
    expect(currentPrice).toHaveTextContent(/DAI$/)
    expect(currentPrice).not.toHaveTextContent('WETH')
  })

  it("keeps the pool's token0Price when both tokens share a waterfall tier", () => {
    const abc = new Token(1, '0x0000000000000000000000000000000000000001', 18, 'ABC', 'Abc')
    const def = new Token(1, '0x0000000000000000000000000000000000000002', 18, 'DEF', 'Def')
    render(<RangeCellContent position={rangeCellPosition(abc, def)} />)

    const currentPrice = screen.getByText(/Current price:/)
    expect(currentPrice).toHaveTextContent(/0\.001/)
    expect(currentPrice).toHaveTextContent(/DEF$/)
  })
})
