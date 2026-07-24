import { dataApiMultichainTokenV2ToSearchResult } from 'uniswap/src/data/rest/dataApiMultichainTokenV2'
import { createRankedMultichainToken } from 'uniswap/src/test/fixtures/dataApi/rankedMultichainToken'

describe('dataApiMultichainTokenV2ToSearchResult', () => {
  it('should convert a RankedMultichainToken with multiple chains', () => {
    const token = createRankedMultichainToken({
      addresses: {
        '1': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        '137': '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      },
    })

    const result = dataApiMultichainTokenV2ToSearchResult(token)

    expect(result).toBeDefined()
    expect(result?.id).toBe('mc:1_0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    expect(result?.name).toBe('USD Coin')
    expect(result?.symbol).toBe('USDC')
    expect(result?.logoUrl).toBe('https://example.com/usdc.png')
    expect(result?.tokens).toHaveLength(2)
    expect(result?.tokens.map((t) => t.currency.chainId).sort()).toEqual([1, 137])
  })

  it('should return undefined when multichainToken is missing', () => {
    const token = createRankedMultichainToken()
    token.multichainToken = undefined

    expect(dataApiMultichainTokenV2ToSearchResult(token)).toBeUndefined()
  })

  it('should return undefined when addresses is empty', () => {
    const token = createRankedMultichainToken({ addresses: {} })

    expect(dataApiMultichainTokenV2ToSearchResult(token)).toBeUndefined()
  })

  it('should return undefined when all chain addresses fail currency construction', () => {
    const token = createRankedMultichainToken({ addresses: { '0': '' } })

    expect(dataApiMultichainTokenV2ToSearchResult(token)).toBeUndefined()
  })

  it('should skip invalid chain addresses but keep valid ones', () => {
    const token = createRankedMultichainToken({
      addresses: { '0': '', '1': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
    })

    const result = dataApiMultichainTokenV2ToSearchResult(token)

    expect(result?.tokens).toHaveLength(1)
    expect(result?.tokens[0]?.currency.chainId).toBe(1)
  })

  it('should handle ETH native token', () => {
    const token = createRankedMultichainToken({
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      addresses: { '1': 'ETH' },
    })

    const result = dataApiMultichainTokenV2ToSearchResult(token)

    expect(result?.tokens).toHaveLength(1)
    expect(result?.tokens[0]?.currency.isNative).toBe(true)
  })

  it('should populate parent-level safetyInfo from v2 TokenSafety', () => {
    const token = createRankedMultichainToken({ isVerified: true })

    const result = dataApiMultichainTokenV2ToSearchResult(token)

    expect(result?.safetyInfo).toBeDefined()
    expect(result?.safetyInfo?.tokenList).toBeDefined()
  })

  it('should use shared project logoUrl on each CurrencyInfo', () => {
    const token = createRankedMultichainToken({ logoUrl: 'https://example.com/token.png' })

    const result = dataApiMultichainTokenV2ToSearchResult(token)

    expect(result?.tokens[0]?.logoUrl).toBe('https://example.com/token.png')
  })

  it('should propagate isSpam onto each CurrencyInfo from the parent TokenSafety', () => {
    const token = createRankedMultichainToken({ isSpam: true })

    const result = dataApiMultichainTokenV2ToSearchResult(token)

    expect(result?.tokens[0]?.isSpam).toBe(true)
  })
})
