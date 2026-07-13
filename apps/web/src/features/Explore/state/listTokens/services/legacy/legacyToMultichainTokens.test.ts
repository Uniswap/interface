import { SafetyLevel, SpamCode, TokenType } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { describe, expect, it, vi } from 'vitest'
import { tokenStatsToMultichainTokens } from '~/features/Explore/state/listTokens/services/legacy/legacyToMultichainTokens'
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

describe('tokenStatsToMultichainTokens', () => {
  beforeEach(() => {
    mockGetChainIdFromChainUrlParam.mockReturnValue(1)
  })

  it('should return empty array when tokenStats is undefined', () => {
    expect(tokenStatsToMultichainTokens(undefined)).toEqual([])
  })

  it('should return empty array when tokenStats is empty', () => {
    expect(tokenStatsToMultichainTokens([])).toEqual([])
  })

  it('should transform one TokenStat into one MultichainToken with one ChainToken', () => {
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

    const result = tokenStatsToMultichainTokens([stat])

    expect(result).toHaveLength(1)
    const mc = result[0]!
    expect(mc.multichainId).toBe('mc:1_0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    expect(mc.symbol).toBe('USDC')
    expect(mc.name).toBe('USD Coin')
    expect(mc.type).toBe(TokenType.ERC20)
    expect(mc.projectName).toBe('Circle')
    expect(mc.logoUrl).toBe('https://example.com/usdc.png')
    expect(mc.safetyLevel).toBe(SafetyLevel.VERIFIED)
    expect(mc.spamCode).toBe(SpamCode.NOT_SPAM)
    expect(mc.chainTokens).toHaveLength(1)
    expect(mc.chainTokens[0]?.chainId).toBe(1)
    expect(mc.chainTokens[0]?.address).toBe('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    expect(mc.chainTokens[0]?.decimals).toBe(6)
    expect(mc.chainTokens[0]?.isBridged).toBe(false)
    expect(mc.chainTokens[0]?.stats?.volume1d).toBe(1_000_000)
    expect(mc.stats?.volume1d).toBe(1_000_000)
  })

  it('should map stat.chainTokens to MultichainToken.chainTokens without copying aggregate volume', () => {
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

    const result = tokenStatsToMultichainTokens([stat])

    expect(result).toHaveLength(1)
    const mc = result[0]!
    expect(mc.chainTokens).toHaveLength(2)
    expect(mc.chainTokens[0]).toMatchObject({
      chainId: 1,
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
      isBridged: false,
    })
    expect(mc.chainTokens[0]?.stats).toBeUndefined()
    expect(mc.chainTokens[1]).toMatchObject({
      chainId: 137,
      address: polygonUsdc,
      decimals: 6,
      isBridged: true,
    })
    expect(mc.chainTokens[1]?.stats).toBeUndefined()
    expect(mc.stats?.volume1d).toBe(1_000_000)
  })

  it('should use per-chain volume1d on chainTokens when present', () => {
    const stat = createTokenStat({
      volume: { value: 1_000_000 },
      chainTokens: [
        { chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, volume1d: 900_000 },
        { chainId: 137, address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6, volume1d: 100_000 },
      ],
    })

    const mc = tokenStatsToMultichainTokens([stat])[0]!
    expect(mc.chainTokens[0]?.stats?.volume1d).toBe(900_000)
    expect(mc.chainTokens[1]?.stats?.volume1d).toBe(100_000)
  })

  it('should map all per-chain volume periods from explore ChainToken fields', () => {
    const stat = createTokenStat({
      volume: undefined,
      volume1Day: { value: 1_000_000 },
      volume1Week: { value: 5_000_000 },
      chainTokens: [
        {
          chainId: 1,
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          decimals: 6,
          volume1d: 200_000,
          volume7d: 900_000,
        },
        {
          chainId: 137,
          address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
          decimals: 6,
          volume1d: 50_000,
          volume7d: 100_000,
        },
      ],
    } satisfies TokenStatOverrides)

    const mc = tokenStatsToMultichainTokens([stat])[0]!
    expect(mc.chainTokens[0]?.stats?.volume7d).toBe(900_000)
    expect(mc.chainTokens[1]?.stats?.volume7d).toBe(100_000)
    expect(mc.stats?.volume1d).toBe(1_000_000)
    expect(mc.stats?.volume7d).toBe(5_000_000)
  })

  it('should leave missing per-chain volume undefined', () => {
    const stat = createTokenStat({
      volume: { value: 1_000_000 },
      chainTokens: [
        { chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, volume1d: 900_000 },
        { chainId: 137, address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 },
      ],
    })

    const mc = tokenStatsToMultichainTokens([stat])[0]!
    expect(mc.chainTokens[0]?.stats?.volume1d).toBe(900_000)
    expect(mc.chainTokens[1]?.stats).toBeUndefined()
    expect(mc.stats?.volume1d).toBe(1_000_000)
  })

  it('should fall back to single ChainToken when chainTokens is empty', () => {
    const stat = createTokenStat({ chainTokens: [] })

    const result = tokenStatsToMultichainTokens([stat])

    expect(result[0]?.chainTokens).toHaveLength(1)
    expect(result[0]?.chainTokens[0]?.chainId).toBe(1)
  })

  it('should transform multiple TokenStats into multiple MultichainTokens', () => {
    mockGetChainIdFromChainUrlParam.mockImplementation((param) => (param === 'ethereum' ? 1 : 8453))
    const stat1 = createTokenStat({ address: '0xToken1', symbol: 'TK1', chain: 'ethereum' })
    const stat2 = createTokenStat({ address: '0xToken2', symbol: 'TK2', chain: 'base' })

    const result = tokenStatsToMultichainTokens([stat1, stat2])

    expect(result).toHaveLength(2)
    expect(result[0]?.multichainId).toBe('mc:1_0xToken1')
    expect(result[0]?.symbol).toBe('TK1')
    expect(result[1]?.multichainId).toBe('mc:8453_0xToken2')
    expect(result[1]?.symbol).toBe('TK2')
  })

  it('should use chainId 1 when chain is unknown or missing', () => {
    mockGetChainIdFromChainUrlParam.mockReturnValue(undefined)
    const stat = createTokenStat({ chain: 'unknown' })

    const result = tokenStatsToMultichainTokens([stat])

    expect(result[0]?.multichainId).toBe('mc:1_0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    expect(result[0]?.chainTokens[0]?.chainId).toBe(1)
  })

  it('should default decimals to 18 when missing', () => {
    const stat = createTokenStat({ decimals: undefined })

    const result = tokenStatsToMultichainTokens([stat])

    expect(result[0]?.chainTokens[0]?.decimals).toBe(18)
  })

  it('should default projectName and logoUrl to empty string when missing', () => {
    const stat = createTokenStat({ project: undefined, logo: undefined })

    const result = tokenStatsToMultichainTokens([stat])

    expect(result[0]?.projectName).toBe('')
    expect(result[0]?.logoUrl).toBe('')
  })

  it('should set safetyLevel to UNKNOWN and spamCode to NOT_SPAM when project is missing', () => {
    const stat = createTokenStat({ project: undefined })

    const result = tokenStatsToMultichainTokens([stat])

    expect(result[0]?.safetyLevel).toBe(SafetyLevel.UNKNOWN)
    expect(result[0]?.spamCode).toBe(SpamCode.NOT_SPAM)
  })

  it('should set spamCode to SPAM when project.isSpam is true', () => {
    const stat = createTokenStat({ project: { name: 'X', safetyLevel: '0', isSpam: true } })

    const result = tokenStatsToMultichainTokens([stat])

    expect(result[0]?.spamCode).toBe(SpamCode.SPAM)
  })

  it('should fall back to UNKNOWN when safetyLevel is invalid (non-numeric or out of range)', () => {
    const statInvalidString = createTokenStat({ project: { name: 'X', safetyLevel: 'VERIFIED', isSpam: false } })
    const statEmptyString = createTokenStat({ project: { name: 'X', safetyLevel: '', isSpam: false } })

    expect(tokenStatsToMultichainTokens([statInvalidString])[0]?.safetyLevel).toBe(SafetyLevel.UNKNOWN)
    expect(tokenStatsToMultichainTokens([statEmptyString])[0]?.safetyLevel).toBe(SafetyLevel.UNKNOWN)
  })

  it('should set type to UNKNOWN when stat.standard is missing', () => {
    const stat = createTokenStat({ standard: undefined })

    const result = tokenStatsToMultichainTokens([stat])

    expect(result[0]?.type).toBe(TokenType.UNKNOWN)
  })

  it('should map stat.standard to TokenType when present', () => {
    const erc721Stat = createTokenStat({ standard: 'ERC721' })
    const result = tokenStatsToMultichainTokens([erc721Stat])
    expect(result[0]?.type).toBe(TokenType.ERC721)
  })

  it('should not add chainToken stats when volume is missing', () => {
    const stat = createTokenStat({ volume: undefined })

    const result = tokenStatsToMultichainTokens([stat])

    expect(result[0]?.chainTokens[0]?.stats).toBeUndefined()
  })

  it('should add token-level stats with volume1d when only volume is set (no price/fdv/priceChange/priceHistory)', () => {
    const stat = createTokenStat({
      volume: { value: 100 },
      price: undefined,
      fullyDilutedValuation: undefined,
      pricePercentChange1Hour: undefined,
      pricePercentChange1Day: undefined,
      priceHistory: undefined,
    })

    const result = tokenStatsToMultichainTokens([stat])

    expect(result[0]?.chainTokens[0]?.stats?.volume1d).toBe(100)
    expect(result[0]?.stats).toBeDefined()
    expect(result[0]?.stats?.volume1d).toBe(100)
  })

  it('should add token-level stats when price is set', () => {
    const stat = createTokenStat({
      price: { value: 2.5 },
      volume: { value: 500 },
    })

    const result = tokenStatsToMultichainTokens([stat])

    expect(result[0]?.stats).toBeDefined()
    expect(result[0]?.stats?.price).toBe(2.5)
    expect(result[0]?.stats?.volume1d).toBe(500)
  })

  it('should map priceHistory to TimestampedValue with BigInt timestamp', () => {
    const stat = createTokenStat({
      priceHistory: [
        { timestamp: 1000, value: 1.1 },
        { timestamp: 2000, value: 1.2 },
      ],
    })

    const result = tokenStatsToMultichainTokens([stat])

    expect(result[0]?.stats?.priceHistory1d).toHaveLength(2)
    expect(result[0]?.stats?.priceHistory1d[0]?.timestamp).toBe(BigInt(1000))
    expect(result[0]?.stats?.priceHistory1d[0]?.value).toBe(1.1)
    expect(result[0]?.stats?.priceHistory1d[1]?.timestamp).toBe(BigInt(2000))
    expect(result[0]?.stats?.priceHistory1d[1]?.value).toBe(1.2)
  })

  it('should pass lowercase chain to getChainIdFromChainUrlParam', () => {
    const stat = createTokenStat({ chain: 'ETHEREUM' })
    tokenStatsToMultichainTokens([stat])
    expect(mockGetChainIdFromChainUrlParam).toHaveBeenCalledWith('ethereum')
  })
})
