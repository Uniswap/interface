import { ApolloCache, NormalizedCacheObject } from '@apollo/client'
import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fetchOnChainCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { fetchOnChainBalances } from 'uniswap/src/features/portfolio/portfolioUpdates/fetchOnChainBalances'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

jest.mock('uniswap/src/data/apiClients/tradingApi/useTradingApiIndicativeQuoteQuery', () => ({
  fetchTradingApiIndicativeQuote: jest.fn().mockResolvedValue({
    output: {
      token: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      chainId: 8453,
      amount: '99750',
    },
  }),
}))

jest.mock('uniswap/src/features/portfolio/api', () => ({
  fetchOnChainCurrencyBalance: jest.fn(),
}))

const mockGetOnChainBalancesFetch = fetchOnChainCurrencyBalance as jest.MockedFunction<
  typeof fetchOnChainCurrencyBalance
>

const TEST_ACCOUNT = '0x1234567890123456789012345678901234567890'
const TEST_TOKEN_ADDRESS = '0xabcdef0123456789abcdef0123456789abcdef01'
const TEST_CHAIN_ID = UniverseChainId.Mainnet

const mockToken = {
  id: TEST_TOKEN_ADDRESS,
  name: 'Test Token',
  symbol: 'TEST',
  decimals: 18,
  chain: 'ETHEREUM',
  address: TEST_TOKEN_ADDRESS,
  project: {
    id: 'test-project',
    __typename: 'TokenProject' as const,
  },
  __typename: 'Token' as const,
}

describe(fetchOnChainBalances, () => {
  const mockApolloCache = {
    readQuery: jest.fn(),
  } as unknown as ApolloCache<NormalizedCacheObject>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches on-chain balances for valid currency IDs', async () => {
    const currencyId = buildCurrencyId(TEST_CHAIN_ID, TEST_TOKEN_ADDRESS)
    const mockBalance = '1000000000000000000' // 1 ETH

    mockGetOnChainBalancesFetch.mockResolvedValueOnce({
      balance: mockBalance,
    })
    ;(mockApolloCache.readQuery as jest.Mock).mockReturnValueOnce({
      token: mockToken,
    })

    const result = await fetchOnChainBalances({
      apolloCache: mockApolloCache,
      accountAddress: TEST_ACCOUNT,
      currencyIds: new Set([currencyId]),
      cachedPortfolio: {
        id: 'test-portfolio',
        tokenBalances: [],
      },
    })

    expect(mockGetOnChainBalancesFetch).toHaveBeenCalledWith({
      currencyAddress: TEST_TOKEN_ADDRESS,
      chainId: TEST_CHAIN_ID,
      currencyIsNative: false,
      accountAddress: TEST_ACCOUNT,
    })

    expect(mockApolloCache.readQuery).toHaveBeenCalledWith({
      query: GraphQLApi.TokenDocument,
      variables: {
        chain: 'ETHEREUM',
        address: TEST_TOKEN_ADDRESS,
      },
    })

    const onchainBalance = result.get(currencyId)
    expect(onchainBalance).toBeDefined()
    expect(onchainBalance?.rawBalance).toBe(mockBalance)
    expect(onchainBalance?.quantity).toBe(1)
  })

  it('handles native currency correctly', async () => {
    const nativeCurrencyAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    const currencyId = buildCurrencyId(TEST_CHAIN_ID, nativeCurrencyAddress)
    const mockBalance = '2000000000000000000' // 2 ETH

    mockGetOnChainBalancesFetch.mockResolvedValueOnce({
      balance: mockBalance,
    })
    ;(mockApolloCache.readQuery as jest.Mock).mockReturnValueOnce({
      token: {
        ...mockToken,
        address: nativeCurrencyAddress,
      },
    })

    const result = await fetchOnChainBalances({
      apolloCache: mockApolloCache,
      accountAddress: TEST_ACCOUNT,
      currencyIds: new Set([currencyId]),
      cachedPortfolio: {
        id: 'test-portfolio',
        tokenBalances: [],
      },
    })

    expect(mockGetOnChainBalancesFetch).toHaveBeenCalledWith({
      currencyAddress: nativeCurrencyAddress,
      chainId: TEST_CHAIN_ID,
      currencyIsNative: true,
      accountAddress: TEST_ACCOUNT,
    })

    const balanceInfo = result.get(currencyId)
    expect(balanceInfo).toBeDefined()
    expect(balanceInfo?.rawBalance).toBe(mockBalance)
    expect(balanceInfo?.quantity).toBe(2)
  })

  it('returns undefined if the token is not found in the Apollo cache', async () => {
    const currencyId = buildCurrencyId(TEST_CHAIN_ID, TEST_TOKEN_ADDRESS)

    mockGetOnChainBalancesFetch.mockResolvedValueOnce({
      balance: '1000000000000000000',
    })
    ;(mockApolloCache.readQuery as jest.Mock).mockReturnValueOnce({
      token: null,
    })

    const result = await fetchOnChainBalances({
      apolloCache: mockApolloCache,
      accountAddress: TEST_ACCOUNT,
      currencyIds: new Set([currencyId]),
      cachedPortfolio: {
        id: 'test-portfolio',
        tokenBalances: [],
      },
    })

    const balanceInfo = result.get(currencyId)
    expect(balanceInfo).toBeUndefined()
  })

  it('returns undefined for an invalid currencyId', async () => {
    const invalidCurrencyId = 'invalid-currency-id'

    const result = await fetchOnChainBalances({
      apolloCache: mockApolloCache,
      accountAddress: TEST_ACCOUNT,
      currencyIds: new Set([invalidCurrencyId]),
      cachedPortfolio: {
        id: 'test-portfolio',
        tokenBalances: [],
      },
    })

    expect(result.size).toBe(0)
    expect(mockGetOnChainBalancesFetch).not.toHaveBeenCalled()
  })

  it('processes multiple currency IDs in parallel', async () => {
    const currencyId1 = buildCurrencyId(TEST_CHAIN_ID, TEST_TOKEN_ADDRESS)
    const currencyId2 = buildCurrencyId(TEST_CHAIN_ID, '0x2222222222222222222222222222222222222222')

    mockGetOnChainBalancesFetch
      .mockResolvedValueOnce({ balance: '1000000000000000000' })
      .mockResolvedValueOnce({ balance: '2000000000000000000' })
    ;(mockApolloCache.readQuery as jest.Mock).mockReturnValueOnce({ token: mockToken }).mockReturnValueOnce({
      token: { ...mockToken, address: '0x2222222222222222222222222222222222222222' },
    })

    const result = await fetchOnChainBalances({
      apolloCache: mockApolloCache,
      accountAddress: TEST_ACCOUNT,
      currencyIds: new Set([currencyId1, currencyId2]),
      cachedPortfolio: {
        id: 'test-portfolio',
        tokenBalances: [],
      },
    })

    expect(result.size).toBe(2)
    expect(mockGetOnChainBalancesFetch).toHaveBeenCalledTimes(2)
  })
})
