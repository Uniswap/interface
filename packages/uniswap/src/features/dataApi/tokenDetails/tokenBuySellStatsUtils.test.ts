import { TokenBuySellStats } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { mapTokenBuySellStats } from 'uniswap/src/features/dataApi/tokenDetails/tokenBuySellStatsUtils'

function buildStats(overrides: Partial<TokenBuySellStats> = {}): TokenBuySellStats {
  return new TokenBuySellStats({
    buyCount: 120,
    sellCount: 80,
    buyVolumeUsd: 60_000,
    sellVolumeUsd: 40_000,
    uniqueBuyers: 90,
    uniqueSellers: 50,
    buyVolumeTokenAmount: '1500.5',
    sellVolumeTokenAmount: '999.5',
    ...overrides,
  })
}

describe(mapTokenBuySellStats, () => {
  it('maps each side and sums USD volume', () => {
    expect(mapTokenBuySellStats(buildStats())).toEqual({
      buys: { count: 120, volumeUsd: 60_000, tokenAmount: 1500.5, uniqueWallets: 90 },
      sells: { count: 80, volumeUsd: 40_000, tokenAmount: 999.5, uniqueWallets: 50 },
      totalVolumeUsd: 100_000,
      totalTokenAmount: 2500,
      isTokenUnits: false,
    })
  })

  it('switches to token units when a side has swaps but no USD volume', () => {
    const result = mapTokenBuySellStats(buildStats({ sellVolumeUsd: undefined }))

    expect(result?.isTokenUnits).toBe(true)
    expect(result?.totalVolumeUsd).toBeUndefined()
    expect(result?.totalTokenAmount).toBe(2500)
    expect(result?.buys.volumeUsd).toBe(60_000)
  })

  it('renders a window with no priced swaps in token units', () => {
    // The backend unsets USD for both sides together when no swap in the window had a credible price.
    const result = mapTokenBuySellStats(buildStats({ buyVolumeUsd: undefined, sellVolumeUsd: undefined }))

    expect(result).toEqual({
      buys: { count: 120, volumeUsd: undefined, tokenAmount: 1500.5, uniqueWallets: 90 },
      sells: { count: 80, volumeUsd: undefined, tokenAmount: 999.5, uniqueWallets: 50 },
      totalVolumeUsd: undefined,
      totalTokenAmount: 2500,
      isTokenUnits: true,
    })
  })

  it('returns undefined when the unpriced side reports no token amount', () => {
    expect(mapTokenBuySellStats(buildStats({ sellVolumeUsd: undefined, sellVolumeTokenAmount: '0' }))).toBeUndefined()
  })

  it('returns undefined when the priced side reports no token amount in token units', () => {
    expect(mapTokenBuySellStats(buildStats({ sellVolumeUsd: undefined, buyVolumeTokenAmount: '0' }))).toBeUndefined()
  })

  it('stays in token units when only a side without swaps has no token amount', () => {
    const result = mapTokenBuySellStats(
      buildStats({ sellVolumeUsd: undefined, buyCount: 0, buyVolumeUsd: 0, buyVolumeTokenAmount: '0' }),
    )

    expect(result?.isTokenUnits).toBe(true)
    expect(result?.totalTokenAmount).toBe(999.5)
  })

  it('keeps USD volume when a side has swaps but no token amount', () => {
    const result = mapTokenBuySellStats(buildStats({ sellVolumeTokenAmount: '0' }))

    expect(result?.isTokenUnits).toBe(false)
    expect(result?.totalVolumeUsd).toBe(100_000)
  })

  it('stays in USD when a side with no USD volume also has no swaps', () => {
    const result = mapTokenBuySellStats(buildStats({ sellCount: 0, sellVolumeUsd: undefined }))

    expect(result?.isTokenUnits).toBe(false)
    expect(result?.totalVolumeUsd).toBe(60_000)
  })

  it('returns zeros for a window with no swaps', () => {
    const result = mapTokenBuySellStats(
      new TokenBuySellStats({
        buyVolumeUsd: 0,
        sellVolumeUsd: 0,
        buyVolumeTokenAmount: '0',
        sellVolumeTokenAmount: '0',
      }),
    )

    expect(result?.totalVolumeUsd).toBe(0)
    expect(result?.totalTokenAmount).toBe(0)
    expect(result?.isTokenUnits).toBe(false)
  })

  it('treats an unparseable token amount as zero', () => {
    expect(mapTokenBuySellStats(buildStats({ buyVolumeTokenAmount: '' }))?.buys.tokenAmount).toBe(0)
    expect(mapTokenBuySellStats(buildStats({ buyVolumeTokenAmount: 'abc' }))?.buys.tokenAmount).toBe(0)
  })
})
