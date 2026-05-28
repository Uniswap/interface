import { TokenList } from '@uniswap/token-lists'
import { RING_DEFAULT_ACTIVE_LIST_URLS } from 'constants/lists'
import { useTokenSelectorListSearch } from 'hooks/useTokenSelectorListSearch'
import { renderHook } from 'test-utils/render'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TokenList as CurrencyTokenList } from 'uniswap/src/features/dataApi/types'

jest.mock('state/lists/hooks', () => ({
  useAllLists: jest.fn(),
}))

const { useAllLists } = jest.requireMock('state/lists/hooks') as {
  useAllLists: jest.Mock
}

const TEST_LIST: TokenList = {
  name: 'Test token list',
  timestamp: '2026-03-14T00:00:00.000Z',
  version: { major: 1, minor: 0, patch: 0 },
  tokens: [
    {
      chainId: UniverseChainId.Mainnet,
      address: '0xb33Ff54b9F7242EF1593d2C9Bcd8f9df46c77935',
      decimals: 18,
      symbol: 'FAI',
      name: 'FAI',
      logoURI: 'https://example.com/fai.png',
    },
    {
      chainId: UniverseChainId.Mainnet,
      address: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942',
      decimals: 18,
      symbol: 'MANA',
      name: 'Decentraland',
      logoURI: 'https://example.com/mana.png',
    },
  ],
}

describe('useTokenSelectorListSearch', () => {
  beforeEach(() => {
    useAllLists.mockReturnValue({
      [RING_DEFAULT_ACTIVE_LIST_URLS[0]]: {
        current: TEST_LIST,
      },
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns a listed token for an exact address search', () => {
    const { result } = renderHook(() => useTokenSelectorListSearch())

    const searchResults = result.current({
      chainFilter: UniverseChainId.Mainnet,
      searchFilter: '0xb33Ff54b9F7242EF1593d2C9Bcd8f9df46c77935',
    })

    expect(searchResults).toHaveLength(1)
    expect(searchResults?.[0]?.currency.symbol).toBe('FAI')
    expect(searchResults?.[0]?.safetyInfo?.tokenList).toBe(CurrencyTokenList.Default)
  })

  it('returns listed tokens for symbol search and marks them as default list tokens', () => {
    const { result } = renderHook(() => useTokenSelectorListSearch())

    const faiResults = result.current({
      chainFilter: UniverseChainId.Mainnet,
      searchFilter: 'fai',
    })
    const manaResults = result.current({
      chainFilter: UniverseChainId.Mainnet,
      searchFilter: 'mana',
    })

    expect(faiResults?.map((item) => item.currency.symbol)).toEqual(['FAI'])
    expect(manaResults?.map((item) => item.currency.symbol)).toEqual(['MANA'])
    expect(manaResults?.[0]?.safetyInfo?.tokenList).toBe(CurrencyTokenList.Default)
  })
})
