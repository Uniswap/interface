import { mergeCurrencySearchResults } from 'uniswap/src/components/TokenSelector/hooks/useTokenSectionsForSearchResults'
import { ProtectionResult } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils'
import { currencyId } from 'uniswap/src/utils/currencyId'

jest.mock('@uniswap/client-search/dist/search/v1/api_pb', () => ({
  SearchType: { TOKEN: 1 },
  SpamCode: { NOT_SPAM: 0, SPAM: 1, SPAM_URL: 2 },
}))
jest.mock('@uniswap/client-search/dist/search/v1/api-searchService_connectquery', () => ({
  searchTokens: {},
}))

function createCurrencyInfo({
  address,
  symbol,
  name,
  logoUrl,
  withSafetyInfo = true,
}: {
  address: string
  symbol: string
  name?: string
  logoUrl?: string | null
  withSafetyInfo?: boolean
}): ReturnType<typeof buildCurrencyInfo> {
  const currency = buildCurrency({
    chainId: 1,
    address,
    decimals: 18,
    symbol,
    name: name ?? symbol,
  })

  if (!currency) {
    throw new Error(`Unable to build currency for ${symbol}`)
  }

  return buildCurrencyInfo({
    currency,
    currencyId: currencyId(currency),
    logoUrl,
    safetyInfo: withSafetyInfo
      ? {
          tokenList: TokenList.Default,
          protectionResult: ProtectionResult.Benign,
        }
      : undefined,
  })
}

describe('mergeCurrencySearchResults', () => {
  it('keeps primary ordering while filling missing metadata from fallback results', () => {
    const primaryBand = createCurrencyInfo({
      address: '0xba11d00c5f74255f56a5e366f4f77f5a186d7f55',
      symbol: 'BAND',
      logoUrl: 'https://example.com/band-primary.png',
      withSafetyInfo: false,
    })
    const fallbackBand = createCurrencyInfo({
      address: '0xba11d00c5f74255f56a5e366f4f77f5a186d7f55',
      symbol: 'BAND',
      logoUrl: 'https://example.com/band-fallback.png',
    })
    const fallbackEth = createCurrencyInfo({
      address: '0x0000000000000000000000000000000000000001',
      symbol: 'ETHX',
    })

    expect(mergeCurrencySearchResults([primaryBand], [fallbackBand, fallbackEth])).toEqual([
      {
        ...primaryBand,
        safetyInfo: fallbackBand.safetyInfo,
      },
      fallbackEth,
    ])
  })

  it('upgrades non-default safety info to default when a listed token is otherwise benign', () => {
    const primaryBand = createCurrencyInfo({
      address: '0xba11d00c5f74255f56a5e366f4f77f5a186d7f55',
      symbol: 'BAND',
      logoUrl: 'https://example.com/band-primary.png',
    })
    const listedBand = createCurrencyInfo({
      address: '0xba11d00c5f74255f56a5e366f4f77f5a186d7f55',
      symbol: 'BAND',
      logoUrl: 'https://example.com/band-listed.png',
    })

    expect(
      mergeCurrencySearchResults(
        [
          {
            ...primaryBand,
            safetyInfo: {
              tokenList: TokenList.NonDefault,
              protectionResult: ProtectionResult.Benign,
            },
          },
        ],
        [listedBand],
      ),
    ).toEqual([
      {
        ...primaryBand,
        safetyInfo: listedBand.safetyInfo,
      },
    ])
  })

  it('prefers token list safety info even when the search result includes an attack type', () => {
    const primaryToken = createCurrencyInfo({
      address: '0xb33Ff54b9F7242EF1593d2C9Bcd8f9df46c77935',
      symbol: 'FAI',
      logoUrl: 'https://example.com/fai-primary.png',
    })
    const listedToken = createCurrencyInfo({
      address: '0xb33Ff54b9F7242EF1593d2C9Bcd8f9df46c77935',
      symbol: 'FAI',
      logoUrl: 'https://example.com/fai-listed.png',
    })

    expect(
      mergeCurrencySearchResults(
        [
          {
            ...primaryToken,
            safetyInfo: {
              tokenList: TokenList.NonDefault,
              protectionResult: ProtectionResult.Benign,
              attackType: 'other' as never,
            },
          },
        ],
        [listedToken],
      ),
    ).toEqual([
      {
        ...primaryToken,
        safetyInfo: listedToken.safetyInfo,
      },
    ])
  })

  it('deduplicates same token by chain and address even when currencyId differs by casing', () => {
    const checksummedBand = createCurrencyInfo({
      address: '0xBA11d00c5F74255F56A5E366F4F77F5A186d7F55',
      symbol: 'BAND',
      logoUrl: undefined,
      withSafetyInfo: false,
    })
    const lowercasedBand = {
      ...createCurrencyInfo({
        address: '0xba11d00c5f74255f56a5e366f4f77f5a186d7f55',
        symbol: 'BAND',
        logoUrl: 'https://example.com/band-listed.png',
      }),
      currencyId: '1-0xba11d00c5f74255f56a5e366f4f77f5a186d7f55',
    }

    expect(mergeCurrencySearchResults([checksummedBand], [lowercasedBand])).toEqual([
      {
        ...checksummedBand,
        logoUrl: 'https://example.com/band-listed.png',
        safetyInfo: lowercasedBand.safetyInfo,
      },
    ])
  })

  it('prefers listed token metadata when the primary result is an unknown placeholder', () => {
    const unknownFai = createCurrencyInfo({
      address: '0xb33Ff54b9F7242EF1593d2C9Bcd8f9df46c77935',
      symbol: '',
      name: '',
      withSafetyInfo: false,
    })
    const listedFai = createCurrencyInfo({
      address: '0xb33Ff54b9F7242EF1593d2C9Bcd8f9df46c77935',
      symbol: 'FAI',
      name: 'FAI',
      logoUrl: 'https://example.com/fai-listed.png',
    })

    expect(mergeCurrencySearchResults([unknownFai], [listedFai])).toEqual([
      {
        ...listedFai,
        isFromOtherNetwork: unknownFai.isFromOtherNetwork,
      },
    ])
  })
})
