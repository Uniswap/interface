import { ProtectionResult, SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { searchTokenToCurrencyInfo } from 'uniswap/src/data/rest/searchTokens'
import { TokenList } from 'uniswap/src/features/dataApi/types'

jest.mock('@uniswap/client-search/dist/search/v1/api_pb', () => ({
  SearchType: { TOKEN: 1 },
  SpamCode: { NOT_SPAM: 0, SPAM: 1, SPAM_URL: 2 },
}))
jest.mock('@uniswap/client-search/dist/search/v1/api-searchService_connectquery', () => ({
  searchTokens: {},
}))

describe('searchTokenToCurrencyInfo', () => {
  it('parses safety metadata and fee data from REST search results', () => {
    const result = searchTokenToCurrencyInfo({
      chainId: 1,
      address: '0xba11d00c5f74255f56a5e366f4f77f5a186d7f55',
      decimals: 18,
      symbol: 'BAND',
      name: 'Band Protocol',
      logoUrl: 'https://example.com/band.png',
      safetyLevel: SafetyLevel.Verified,
      spamCode: 1,
      feeData: {
        buyFeeBps: '123',
        sellFeeBps: '456',
      },
      protectionInfo: {
        result: ProtectionResult.Benign.toLowerCase(),
        attackTypes: [],
      },
    } as never)

    expect(result).toMatchObject({
      logoUrl: 'https://example.com/band.png',
      isSpam: true,
      safetyInfo: {
        tokenList: TokenList.Default,
        protectionResult: ProtectionResult.Benign,
      },
    })
    expect(result?.currency.isToken).toBe(true)
    if (!result?.currency.isToken) {
      throw new Error('Expected BAND result to be a token')
    }
    expect(result.currency.buyFeeBps?.toString()).toBe('123')
    expect(result.currency.sellFeeBps?.toString()).toBe('456')
  })

  it('returns null for tokens on unknown chain ids', () => {
    const result = searchTokenToCurrencyInfo({
      chainId: 999999,
      address: '0xba11d00c5f74255f56a5e366f4f77f5a186d7f55',
      decimals: 18,
      symbol: 'BAND',
      name: 'Band Protocol',
      spamCode: 0,
    } as never)

    expect(result).toBeNull()
  })
})
