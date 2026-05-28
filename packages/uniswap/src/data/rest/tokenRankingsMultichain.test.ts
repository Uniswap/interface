import { ChainToken, TokenRankingsStat } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { tokenRankingsStatToSearchResult } from 'uniswap/src/data/rest/tokenRankingsMultichain'

function createTokenRankingsStat(
  overrides: Partial<ConstructorParameters<typeof TokenRankingsStat>[0]> = {},
): TokenRankingsStat {
  return new TokenRankingsStat({
    chain: 'ETHEREUM',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    name: 'USD Coin',
    symbol: 'USDC',
    logo: 'https://example.com/usdc.png',
    chainTokens: [new ChainToken({ chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 })],
    ...overrides,
  })
}

describe('tokenRankingsStatToSearchResult', () => {
  it('should convert a stat with multiple chain tokens', () => {
    const stat = createTokenRankingsStat({
      chainTokens: [
        new ChainToken({ chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 }),
        new ChainToken({ chainId: 137, address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 }),
      ],
    })

    const result = tokenRankingsStatToSearchResult(stat)

    expect(result).toBeDefined()
    expect(result?.id).toBe('ETHEREUM_0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    expect(result?.name).toBe('USD Coin')
    expect(result?.symbol).toBe('USDC')
    expect(result?.logoUrl).toBe('https://example.com/usdc.png')
    expect(result?.tokens).toHaveLength(2)
    expect(result?.tokens[0]?.currency.chainId).toBe(1)
    expect(result?.tokens[1]?.currency.chainId).toBe(137)
  })

  it('should return undefined when chainTokens is empty', () => {
    const stat = createTokenRankingsStat({ chainTokens: [] })

    expect(tokenRankingsStatToSearchResult(stat)).toBeUndefined()
  })

  it('should return undefined when all chain tokens fail currency construction', () => {
    const stat = createTokenRankingsStat({
      chainTokens: [new ChainToken({ chainId: 0, address: '', decimals: 6 })],
    })

    expect(tokenRankingsStatToSearchResult(stat)).toBeUndefined()
  })

  it('should skip invalid chain tokens but keep valid ones', () => {
    const stat = createTokenRankingsStat({
      chainTokens: [
        new ChainToken({ chainId: 0, address: '', decimals: 6 }),
        new ChainToken({ chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 }),
      ],
    })

    const result = tokenRankingsStatToSearchResult(stat)

    expect(result?.tokens).toHaveLength(1)
    expect(result?.tokens[0]?.currency.chainId).toBe(1)
  })

  it('should convert ETH address to native currency', () => {
    const stat = createTokenRankingsStat({
      symbol: 'ETH',
      name: 'Ethereum',
      chainTokens: [new ChainToken({ chainId: 1, address: 'ETH', decimals: 18 })],
    })

    const result = tokenRankingsStatToSearchResult(stat)

    expect(result?.tokens).toHaveLength(1)
    expect(result?.tokens[0]?.currency.isNative).toBe(true)
  })

  it('should populate safetyInfo from parent stat', () => {
    const stat = createTokenRankingsStat({ safetyLevel: 'VERIFIED' })

    const result = tokenRankingsStatToSearchResult(stat)

    expect(result?.safetyInfo).toBeDefined()
  })

  it('should use shared logoUrl on each CurrencyInfo', () => {
    const stat = createTokenRankingsStat({ logo: 'https://example.com/token.png' })

    const result = tokenRankingsStatToSearchResult(stat)

    expect(result?.tokens[0]?.logoUrl).toBe('https://example.com/token.png')
  })

  it('should set logoUrl to undefined when logo is empty string', () => {
    const stat = createTokenRankingsStat({ logo: '' })

    const result = tokenRankingsStatToSearchResult(stat)

    expect(result?.logoUrl).toBeUndefined()
  })

  it('should forward feeData from parent stat to currency', () => {
    const stat = createTokenRankingsStat({
      feeData: { buyFeeBps: '100', sellFeeBps: '200' },
      chainTokens: [
        new ChainToken({ chainId: 1, address: '0x1111111111111111111111111111111111111111', decimals: 18 }),
      ],
    })

    const result = tokenRankingsStatToSearchResult(stat)

    expect(result?.tokens[0]?.currency.isToken).toBe(true)
    if (result?.tokens[0]?.currency.isToken) {
      expect(result.tokens[0].currency.buyFeeBps?.toString()).toBe('100')
      expect(result.tokens[0].currency.sellFeeBps?.toString()).toBe('200')
    }
  })

  it('should default name and symbol to empty string when undefined', () => {
    const stat = createTokenRankingsStat({ name: undefined, symbol: undefined })

    const result = tokenRankingsStatToSearchResult(stat)

    expect(result?.name).toBe('')
    expect(result?.symbol).toBe('')
  })

  it('should preserve canonical name when first chainToken is an L2 native token', () => {
    const stat = createTokenRankingsStat({
      chain: 'ETHEREUM',
      name: 'Ethereum',
      symbol: 'ETH',
      chainTokens: [
        new ChainToken({ chainId: 42161, address: '', decimals: 18 }),
        new ChainToken({ chainId: 8453, address: '', decimals: 18 }),
        new ChainToken({ chainId: 1, address: '', decimals: 18 }),
      ],
    })

    const result = tokenRankingsStatToSearchResult(stat)

    expect(result?.name).toBe('Ethereum')
    expect(result?.symbol).toBe('ETH')
    expect(result?.tokens.length).toBeGreaterThanOrEqual(1)
  })
})
