import { describe, expect, it, vi } from 'vitest'
import { tokenStatsToRankedMultichainTokens } from '~/features/Explore/state/listTokens/services/legacy/legacyToRankedMultichainTokens'
import type { ExploreStatVolumeAmounts, TokenStat, TokenStatWithExploreVolumes } from '~/types/explore'
import { getChainIdFromChainUrlParam } from '~/utils/params/chainParams'

vi.mock('~/utils/params/chainParams', () => ({
  getChainIdFromChainUrlParam: vi.fn(),
}))

const mockGetChainIdFromChainUrlParam = vi.mocked(getChainIdFromChainUrlParam)

/** Plain-object overrides for tests; TokenStat uses protobuf Amount/TokenProject at runtime. */
type AmountLike = { value: number }
type ExploreStatVolumeOverrides = {
  [K in keyof ExploreStatVolumeAmounts]?: AmountLike
}
type TokenStatOverrides = Partial<
  Omit<
    TokenStat,
    'volume' | 'project' | 'price' | 'fullyDilutedValuation' | 'pricePercentChange1Hour' | 'pricePercentChange1Day'
  >
> &
  ExploreStatVolumeOverrides & {
    volume?: AmountLike
    project?: { name?: string; safetyLevel?: string; isSpam?: boolean }
    price?: AmountLike
    fullyDilutedValuation?: AmountLike
    pricePercentChange1Hour?: AmountLike
    pricePercentChange1Day?: AmountLike
  }

function createTokenStat(overrides: TokenStatOverrides = {}): TokenStatWithExploreVolumes {
  return {
    chain: 'ethereum',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logo: 'https://example.com/usdc.png',
    volume: { value: 1_000_000 } as TokenStat['volume'],
    project: { name: 'Circle', safetyLevel: '1', isSpam: false } as TokenStat['project'],
    ...overrides,
  } as TokenStatWithExploreVolumes
}

describe('tokenStatsToRankedMultichainTokens', () => {
  beforeEach(() => {
    mockGetChainIdFromChainUrlParam.mockReturnValue(1)
  })

  it('should return empty result when tokenStats is undefined', () => {
    expect(tokenStatsToRankedMultichainTokens(undefined)).toEqual({
      multichainTokens: [],
      priceHistoryByMultichainId: {},
    })
  })

  it('should return empty result when tokenStats is empty', () => {
    expect(tokenStatsToRankedMultichainTokens([])).toEqual({
      multichainTokens: [],
      priceHistoryByMultichainId: {},
    })
  })

  it('should transform one TokenStat into one RankedMultichainToken with one chain deployment', () => {
    const stat = createTokenStat({
      chain: 'ethereum',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      standard: 'ERC20',
      volume: { value: 1_000_000 },
      project: { name: 'Circle', safetyLevel: '1', isSpam: false },
    })

    const { multichainTokens } = tokenStatsToRankedMultichainTokens([stat])

    expect(multichainTokens).toHaveLength(1)
    const ranked = multichainTokens[0]!
    const mc = ranked.multichainToken!
    expect(mc.multichainId).toBe('mc:1_0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    expect(mc.symbol).toBe('USDC')
    expect(mc.name).toBe('USD Coin')
    expect(mc.decimals).toBe(6)
    expect(mc.addresses).toEqual({ '1': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' })
    expect(mc.safety?.isVerified).toBe(true)
    expect(mc.safety?.isBlocked).toBe(false)
    expect(mc.safety?.isSpam).toBe(false)
    expect(ranked.chainStats).toHaveLength(1)
    expect(ranked.chainStats[0]?.chainId).toBe(1)
    expect(ranked.chainStats[0]?.stats?.volume1d).toBe(1_000_000)
    expect(ranked.stats?.volume1d).toBe(1_000_000)
  })

  it('should map pricePercentChange1Hour/1Day onto multichainToken.price (flag-off table rows read this field directly)', () => {
    const stat = createTokenStat({
      pricePercentChange1Hour: { value: 1.5 },
      pricePercentChange1Day: { value: -2.5 },
    })

    const { multichainTokens } = tokenStatsToRankedMultichainTokens([stat])

    expect(multichainTokens[0]?.multichainToken?.price?.percentChange1h).toBe(1.5)
    expect(multichainTokens[0]?.multichainToken?.price?.percentChange1d).toBe(-2.5)
  })

  it('should map stat.chainTokens to addresses map and per-chain chainStats', () => {
    const polygonUsdc = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
    const stat = createTokenStat({
      chain: 'ethereum',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      volume: { value: 1_000_000 },
      chainTokens: [
        { chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
        { chainId: 137, address: polygonUsdc, decimals: 6, isBridged: true },
      ],
    })

    const { multichainTokens } = tokenStatsToRankedMultichainTokens([stat])

    const ranked = multichainTokens[0]!
    expect(ranked.multichainToken?.addresses).toEqual({
      '1': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      '137': polygonUsdc,
    })
    expect(ranked.chainStats).toHaveLength(2)
    expect(ranked.stats?.volume1d).toBe(1_000_000)
  })

  it('should use per-chain volume1d on chainStats when present', () => {
    const stat = createTokenStat({
      volume: { value: 1_000_000 },
      chainTokens: [
        { chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, volume1d: 900_000 },
        { chainId: 137, address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6, volume1d: 100_000 },
      ],
    })

    const { multichainTokens } = tokenStatsToRankedMultichainTokens([stat])
    const ranked = multichainTokens[0]!
    expect(ranked.chainStats[0]?.stats?.volume1d).toBe(900_000)
    expect(ranked.chainStats[1]?.stats?.volume1d).toBe(100_000)
  })

  it('should fall back to single chain deployment when chainTokens is empty', () => {
    const stat = createTokenStat({ chainTokens: [] })

    const { multichainTokens } = tokenStatsToRankedMultichainTokens([stat])

    expect(multichainTokens[0]?.chainStats).toHaveLength(1)
    expect(multichainTokens[0]?.chainStats[0]?.chainId).toBe(1)
  })

  it('should transform multiple TokenStats into multiple RankedMultichainTokens', () => {
    mockGetChainIdFromChainUrlParam.mockImplementation((param) => (param === 'ethereum' ? 1 : 8453))
    const stat1 = createTokenStat({ address: '0xToken1', symbol: 'TK1', chain: 'ethereum' })
    const stat2 = createTokenStat({ address: '0xToken2', symbol: 'TK2', chain: 'base' })

    const { multichainTokens } = tokenStatsToRankedMultichainTokens([stat1, stat2])

    expect(multichainTokens).toHaveLength(2)
    expect(multichainTokens[0]?.multichainToken?.multichainId).toBe('mc:1_0xToken1')
    expect(multichainTokens[0]?.multichainToken?.symbol).toBe('TK1')
    expect(multichainTokens[1]?.multichainToken?.multichainId).toBe('mc:8453_0xToken2')
    expect(multichainTokens[1]?.multichainToken?.symbol).toBe('TK2')
  })

  it('should use chainId 1 when chain is unknown or missing', () => {
    mockGetChainIdFromChainUrlParam.mockReturnValue(undefined)
    const stat = createTokenStat({ chain: 'unknown' })

    const { multichainTokens } = tokenStatsToRankedMultichainTokens([stat])

    expect(multichainTokens[0]?.multichainToken?.multichainId).toBe('mc:1_0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    expect(multichainTokens[0]?.chainStats[0]?.chainId).toBe(1)
  })

  it('should default decimals to 18 when missing', () => {
    const stat = createTokenStat({ decimals: undefined })

    const { multichainTokens } = tokenStatsToRankedMultichainTokens([stat])

    expect(multichainTokens[0]?.multichainToken?.decimals).toBe(18)
  })

  it('should set isVerified/isBlocked false and isSpam false when project is missing', () => {
    const stat = createTokenStat({ project: undefined })

    const { multichainTokens } = tokenStatsToRankedMultichainTokens([stat])

    expect(multichainTokens[0]?.multichainToken?.safety?.isVerified).toBe(false)
    expect(multichainTokens[0]?.multichainToken?.safety?.isBlocked).toBe(false)
    expect(multichainTokens[0]?.multichainToken?.safety?.isSpam).toBe(false)
  })

  it('should set isSpam true when project.isSpam is true', () => {
    const stat = createTokenStat({ project: { name: 'X', safetyLevel: '0', isSpam: true } })

    const { multichainTokens } = tokenStatsToRankedMultichainTokens([stat])

    expect(multichainTokens[0]?.multichainToken?.safety?.isSpam).toBe(true)
  })

  it('should map priceHistory into priceHistoryByMultichainId, keyed by multichainId', () => {
    const stat = createTokenStat({
      priceHistory: [
        { timestamp: 1000, value: 1.1 },
        { timestamp: 2000, value: 1.2 },
      ],
    })

    const { multichainTokens, priceHistoryByMultichainId } = tokenStatsToRankedMultichainTokens([stat])
    const multichainId = multichainTokens[0]!.multichainToken!.multichainId

    expect(priceHistoryByMultichainId[multichainId]).toEqual([
      { timestamp: 1000, value: 1.1 },
      { timestamp: 2000, value: 1.2 },
    ])
  })

  it('should pass lowercase chain to getChainIdFromChainUrlParam', () => {
    const stat = createTokenStat({ chain: 'ETHEREUM' })
    tokenStatsToRankedMultichainTokens([stat])
    expect(mockGetChainIdFromChainUrlParam).toHaveBeenCalledWith('ethereum')
  })
})
