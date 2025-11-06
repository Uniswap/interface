import { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb.d'
import { type Token as SearchToken } from '@uniswap/client-search/dist/search/v1/api_pb'
import * as searchTokensAndPools from 'uniswap/src/data/rest/searchTokensAndPools'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fetchOnChainCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { fetchOnChainBalancesRest } from 'uniswap/src/features/portfolio/portfolioUpdates/rest/fetchOnChainBalancesRest'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  createLogger: jest.fn(() => ({
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}))

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

jest.mock('uniswap/src/data/rest/searchTokensAndPools', () => ({
  ...jest.requireActual('uniswap/src/data/rest/searchTokensAndPools'),
  fetchTokenByAddress: jest.fn(),
}))

const mockGetOnChainBalancesFetch = fetchOnChainCurrencyBalance as jest.MockedFunction<
  typeof fetchOnChainCurrencyBalance
>

const mockFetchTokenByAddress = searchTokensAndPools.fetchTokenByAddress as jest.MockedFunction<
  typeof searchTokensAndPools.fetchTokenByAddress
>

const TEST_ACCOUNT = '0x1234567890123456789012345678901234567890'
const TEST_TOKEN_ADDRESS = '0xabcdef0123456789abcdef0123456789abcdef01'
const TEST_CHAIN_ID = UniverseChainId.Mainnet

const MOCK_BALANCE_1_ETH = '1000000000000000000'
const MOCK_BALANCE_2_ETH = '2000000000000000000'
const MOCK_BALANCE_3_ETH = '3000000000000000000'

const MOCK_TOKEN_ADDRESS_2 = '0x2222222222222222222222222222222222222222'
const MOCK_TOKEN_ADDRESS_3 = '0x3333333333333333333333333333333333333333'
const NATIVE_CURRENCY_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

const mockToken = {
  id: TEST_TOKEN_ADDRESS,
  name: 'Test Token',
  symbol: 'TEST',
  decimals: 18,
  chain: 'ETHEREUM',
  address: TEST_TOKEN_ADDRESS,
  project: {
    id: 'test-project',
    __typename: 'TokenProject',
  },
  __typename: 'Token',
}

const mockCachedPortfolio = {
  balances: [
    {
      token: {
        chainId: TEST_CHAIN_ID,
        address: TEST_TOKEN_ADDRESS,
        decimals: 18,
        symbol: 'TEST',
        name: 'Test Token',
      },
      amount: {
        amount: 1,
        raw: '1000000000000000000',
      },
      valueUsd: 100,
    },
  ],
} as NonNullable<GetPortfolioResponse['portfolio']>

describe('fetchOnChainBalancesRest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches on-chain balances for valid currency IDs', async () => {
    const currencyId = buildCurrencyId(TEST_CHAIN_ID, TEST_TOKEN_ADDRESS)
    const mockBalance = MOCK_BALANCE_1_ETH // 1 ETH

    mockGetOnChainBalancesFetch.mockResolvedValueOnce({
      balance: mockBalance,
    })

    const result = await fetchOnChainBalancesRest({
      cachedPortfolio: mockCachedPortfolio,
      accountAddress: TEST_ACCOUNT,
      currencyIds: new Set([currencyId]),
    })

    expect(mockGetOnChainBalancesFetch).toHaveBeenCalledWith({
      currencyAddress: TEST_TOKEN_ADDRESS,
      chainId: TEST_CHAIN_ID,
      currencyIsNative: false,
      accountAddress: TEST_ACCOUNT,
    })

    const onchainBalance = result.get(currencyId)
    expect(onchainBalance).toBeDefined()
    expect(onchainBalance?.amount?.raw).toBe(mockBalance)
    expect(onchainBalance?.amount?.amount).toBe(1)
    expect(onchainBalance?.token?.address).toBe(TEST_TOKEN_ADDRESS)
    expect(onchainBalance?.token?.chainId).toBe(TEST_CHAIN_ID)
  })

  it('handles native currency correctly', async () => {
    const currencyId = buildCurrencyId(TEST_CHAIN_ID, NATIVE_CURRENCY_ADDRESS)
    const mockBalance = MOCK_BALANCE_2_ETH // 2 ETH

    mockGetOnChainBalancesFetch.mockResolvedValueOnce({
      balance: mockBalance,
    })

    const mockCachedPortfolioWithNative = {
      balances: [
        {
          token: {
            chainId: TEST_CHAIN_ID,
            address: NATIVE_CURRENCY_ADDRESS,
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum',
          },
          amount: {
            amount: 1,
            raw: MOCK_BALANCE_1_ETH,
          },
          valueUsd: 100,
        },
      ],
    } as NonNullable<GetPortfolioResponse['portfolio']>

    const result = await fetchOnChainBalancesRest({
      cachedPortfolio: mockCachedPortfolioWithNative,
      accountAddress: TEST_ACCOUNT,
      currencyIds: new Set([currencyId]),
    })

    expect(mockGetOnChainBalancesFetch).toHaveBeenCalledWith({
      currencyAddress: NATIVE_CURRENCY_ADDRESS,
      chainId: TEST_CHAIN_ID,
      currencyIsNative: true,
      accountAddress: TEST_ACCOUNT,
    })

    const balanceInfo = result.get(currencyId)
    expect(balanceInfo).toBeDefined()
    expect(balanceInfo?.amount?.raw).toBe(mockBalance)
    expect(balanceInfo?.amount?.amount).toBe(2)
  })

  it('returns undefined for invalid currency ID', async () => {
    const invalidCurrencyId = 'invalid-currency-id'

    const result = await fetchOnChainBalancesRest({
      cachedPortfolio: mockCachedPortfolio,
      accountAddress: TEST_ACCOUNT,
      currencyIds: new Set([invalidCurrencyId]),
    })

    expect(result.size).toBe(0)
    expect(mockGetOnChainBalancesFetch).not.toHaveBeenCalled()
  })

  it('handles new tokens not in cached portfolio', async () => {
    const currencyId = buildCurrencyId(TEST_CHAIN_ID, MOCK_TOKEN_ADDRESS_2)
    const mockBalance = MOCK_BALANCE_3_ETH

    mockGetOnChainBalancesFetch.mockResolvedValueOnce({
      balance: mockBalance,
    })

    // Mock REST search for new token
    mockFetchTokenByAddress.mockResolvedValueOnce({
      chainId: TEST_CHAIN_ID,
      address: MOCK_TOKEN_ADDRESS_2,
      symbol: 'NEW',
      name: 'New Token',
      decimals: 18,
      logoUrl: '',
      feeData: undefined,
      safetyLevel: 0,
      protectionInfo: undefined,
    } as unknown as SearchToken)

    const result = await fetchOnChainBalancesRest({
      cachedPortfolio: mockCachedPortfolio, // doesn't contain new token
      accountAddress: TEST_ACCOUNT,
      currencyIds: new Set([currencyId]),
    })

    expect(mockFetchTokenByAddress).toHaveBeenCalledWith({
      chainId: TEST_CHAIN_ID,
      address: MOCK_TOKEN_ADDRESS_2,
    })

    const balanceInfo = result.get(currencyId)
    expect(balanceInfo).toBeDefined()
    expect(balanceInfo?.amount?.amount).toBe(3)
    expect(balanceInfo?.token?.address).toBe(MOCK_TOKEN_ADDRESS_2)
    expect(balanceInfo?.token?.symbol).toBe('NEW')
  })

  it('skips tokens when REST token search fails', async () => {
    const currencyId = buildCurrencyId(TEST_CHAIN_ID, MOCK_TOKEN_ADDRESS_3)
    const mockBalance = MOCK_BALANCE_1_ETH

    mockGetOnChainBalancesFetch.mockResolvedValueOnce({
      balance: mockBalance,
    })

    // Mock REST search to return null (token not found)
    mockFetchTokenByAddress.mockResolvedValueOnce(null)

    const result = await fetchOnChainBalancesRest({
      cachedPortfolio: mockCachedPortfolio,
      accountAddress: TEST_ACCOUNT,
      currencyIds: new Set([currencyId]),
    })

    expect(result.size).toBe(0)
  })

  it('processes multiple currency IDs in parallel', async () => {
    const currencyId1 = buildCurrencyId(TEST_CHAIN_ID, TEST_TOKEN_ADDRESS)
    const currencyId2 = buildCurrencyId(TEST_CHAIN_ID, MOCK_TOKEN_ADDRESS_2)

    const mockCachedPortfolioMultiple = {
      balances: [
        {
          token: {
            chainId: TEST_CHAIN_ID,
            address: TEST_TOKEN_ADDRESS,
            decimals: 18,
            symbol: 'TEST1',
            name: 'Test Token 1',
          },
          amount: { amount: 1, raw: '1000000000000000000' },
          valueUsd: 100,
        },
        {
          token: {
            chainId: TEST_CHAIN_ID,
            address: MOCK_TOKEN_ADDRESS_2,
            decimals: 18,
            symbol: 'TEST2',
            name: 'Test Token 2',
          },
          amount: { amount: 2, raw: MOCK_BALANCE_2_ETH },
          valueUsd: 200,
        },
      ],
    } as NonNullable<GetPortfolioResponse['portfolio']>

    mockGetOnChainBalancesFetch
      .mockResolvedValueOnce({ balance: MOCK_BALANCE_1_ETH })
      .mockResolvedValueOnce({ balance: MOCK_BALANCE_2_ETH })

    const result = await fetchOnChainBalancesRest({
      cachedPortfolio: mockCachedPortfolioMultiple,
      accountAddress: TEST_ACCOUNT,
      currencyIds: new Set([currencyId1, currencyId2]),
    })

    expect(result.size).toBe(2)
    expect(mockGetOnChainBalancesFetch).toHaveBeenCalledTimes(2)

    const balance1 = result.get(currencyId1)
    const balance2 = result.get(currencyId2)

    expect(balance1?.amount?.amount).toBe(1)
    expect(balance2?.amount?.amount).toBe(2)
  })

  it('handles errors gracefully and continues processing other currencies', async () => {
    const currencyId1 = buildCurrencyId(TEST_CHAIN_ID, TEST_TOKEN_ADDRESS)
    const currencyId2 = buildCurrencyId(TEST_CHAIN_ID, MOCK_TOKEN_ADDRESS_2)

    // First call succeeds, second call fails
    mockGetOnChainBalancesFetch
      .mockResolvedValueOnce({ balance: MOCK_BALANCE_1_ETH })
      .mockRejectedValueOnce(new Error('Network error'))

    const result = await fetchOnChainBalancesRest({
      cachedPortfolio: mockCachedPortfolio,
      accountAddress: TEST_ACCOUNT,
      currencyIds: new Set([currencyId1, currencyId2]),
    })

    // Should have one successful result
    expect(result.size).toBe(1)
    expect(result.get(currencyId1)).toBeDefined()
    expect(result.get(currencyId2)).toBeUndefined()
  })

  it('calculates inferred USD value from cached balance proportionally', async () => {
    const currencyId = buildCurrencyId(TEST_CHAIN_ID, TEST_TOKEN_ADDRESS)
    const mockBalance = MOCK_BALANCE_2_ETH

    mockGetOnChainBalancesFetch.mockResolvedValueOnce({
      balance: mockBalance,
    })

    // Cached portfolio has 1 token worth $100
    const result = await fetchOnChainBalancesRest({
      cachedPortfolio: mockCachedPortfolio,
      accountAddress: TEST_ACCOUNT,
      currencyIds: new Set([currencyId]),
    })

    const balanceInfo = result.get(currencyId)
    expect(balanceInfo?.valueUsd).toBe(200) // 2 tokens * ($100 / 1 token) = $200
  })
})
