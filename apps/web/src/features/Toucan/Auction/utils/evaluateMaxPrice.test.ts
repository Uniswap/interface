import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { calculateMaxValidBidQ96 } from '@universe/cca'
import { q96ToRawAmount } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import { evaluateMaxPrice } from '~/features/Toucan/Auction/utils/evaluateMaxPrice'

// Sepolia auction 0xA91986C3…, the first deployment carrying a MaxBidPriceValidationHook.
// Floor 1e-08/token, tick 1e-10/token, ceiling 1e-06/token — 9900 ticks above the floor.
const DECIMALS = 18
const FLOOR = 792281625142643375900n
const TICK = 7922816251426433759n
const CEILING = 79228162514264337593543n

const BID_TOKEN = new Token(1, '0x0000000000000000000000000000000000000001', DECIMALS, 'ETH')

function evaluate(rawAmount: bigint): ReturnType<typeof evaluateMaxPrice> {
  return evaluateMaxPrice({
    bidTokenDecimals: DECIMALS,
    auctionTokenDecimals: DECIMALS,
    maxValuationCurrencyAmount: CurrencyAmount.fromRawAmount(BID_TOKEN, rawAmount.toString()),
    tickSizeQ96: TICK,
    clearingPriceQ96: FLOOR,
    floorPriceQ96: FLOOR,
    minMaxPriceQ96: FLOOR + TICK,
    minValidPriceDisplay: '0.00000001',
    minValidPriceDisplayFormatted: '0.00000001',
    maxBidPriceQ96: CEILING,
    bidTokenSymbol: 'ETH',
    formatMinError: ({ value, symbol }) => `Minimum FDV is ${value}${symbol}`,
  })
}

describe('evaluateMaxPrice ceiling handling', () => {
  const topTickQ96 = calculateMaxValidBidQ96({ maxBidPriceQ96: CEILING, floorPriceQ96: FLOOR, tickSizeQ96: TICK })!

  it('accepts the highest legal tick after the display round-trip', () => {
    // What the slider hands the field: the top tick, written out as a decimal and read back.
    // Both q96 conversions round half-up, so the reconstruction overshoots the ceiling by 1
    // Q96 unit even though the tick itself sits 3543 units below it.
    expect(topTickQ96).toBeLessThanOrEqual(CEILING)

    const { error, sanitizedQ96, cappedToMax } = evaluate(q96ToRawAmount(topTickQ96, DECIMALS))

    expect(error).toBeUndefined()
    expect(sanitizedQ96).toBe(topTickQ96)
    // The slider's own end. A legal value, so it must not report having been capped.
    expect(cappedToMax).toBe(false)
  })

  it('caps a genuinely over-ceiling amount instead of erroring', () => {
    const { error, sanitizedQ96, cappedToMax } = evaluate(q96ToRawAmount(topTickQ96 + TICK * 10n, DECIMALS))

    expect(error).toBeUndefined()
    expect(sanitizedQ96).toBe(topTickQ96)
    expect(cappedToMax).toBe(true)
  })

  it('leaves an ordinary in-range amount on its own tick', () => {
    const inRange = FLOOR + TICK * 100n
    const { error, sanitizedQ96, cappedToMax } = evaluate(q96ToRawAmount(inRange, DECIMALS))

    expect(error).toBeUndefined()
    expect(sanitizedQ96).toBe(inRange)
    expect(cappedToMax).toBe(false)
  })
})
