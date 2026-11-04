import 'utilities/src/logger/mocks'
import { Code, ConnectError } from '@connectrpc/connect'
import { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb.d'
import { SharedQueryClient } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import isEqual from 'lodash/isEqual'
import { getGetTokenQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { fetchTradingApiIndicativeQuoteIgnoring404 } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiIndicativeQuoteQuery'
import { fetchOnChainCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { fetchOnChainBalances } from 'uniswap/src/features/portfolio/portfolioUpdates/fetchOnChainBalances'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import type { MockedFunction } from 'vitest'

vi.mock('uniswap/src/data/apiClients/tradingApi/useTradingApiIndicativeQuoteQuery', () => ({
  fetchTradingApiIndicativeQuoteIgnoring404: vi.fn().mockResolvedValue({
    quote: {
      output: {
        token: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        chainId: 8453,
        amount: '99750',
      },
    },
  }),
}))

vi.mock('uniswap/src/features/portfolio/api', () => ({
  fetchOnChainCurrencyBalance: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/tokens/queries', () => ({
  getGetTokenQueryOptions: vi.fn(),
}))

const mockGetOnChainBalancesFetch = fetchOnChainCurrencyBalance as MockedFunction<typeof fetchOnChainCurrencyBalance>
const mockFetchIndicativeQuote = fetchTradingApiIndicativeQuoteIgnoring404 as MockedFunction<
  typeof fetchTradingApiIndicativeQuoteIgnoring404
>

const mockGetGetTokenQueryOptions = getGetTokenQueryOptions as MockedFunction<typeof getGetTokenQueryOptions>

// Routes the mocked getGetTokenQueryOptions through SharedQueryClient.fetchQuery like the real
// options would, resolving (or rejecting) with the given GetToken response.
function mockGetTokenQueryOnce({ token, error }: { token?: Record<string, unknown>; error?: Error }): void {
  mockGetGetTokenQueryOptions.mockImplementationOnce((({
    params,
  }: {
    params: { chainId: number; address: string }
  }) => ({
    queryKey: ['test-getToken', params.chainId, params.address],
    queryFn: async (): Promise<unknown> => {
      if (error) {
        throw error
      }
      return { token }
    },
  })) as unknown as typeof getGetTokenQueryOptions)
}

const TEST_ACCOUNT = '0x1234567890123456789012345678901234567890'
const TEST_TOKEN_ADDRESS = '0xabcdef0123456789abcdef0123456789abcdef01'
const TEST_CHAIN_ID = UniverseChainId.Mainnet

const MOCK_BALANCE_1_ETH = '1000000000000000000'
const MOCK_BALANCE_2_ETH = '2000000000000000000'
const MOCK_BALANCE_3_ETH = '3000000000000000000'

const MOCK_TOKEN_ADDRESS_2 = '0x2222222222222222222222222222222222222222'
const MOCK_TOKEN_ADDRESS_3 = '0x3333333333333333333333333333333333333333'
const NATIVE_CURRENCY_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

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

const MOCK_GET_TOKEN_RESPONSE_TOKEN = {
  chainId: TEST_CHAIN_ID,
  address: MOCK_TOKEN_ADDRESS_2,
  symbol: 'NEW',
  name: 'New Token',
  decimals: 18,
  project: { logoUrl: 'https://example.com/logo.png' },
}

describe('fetchOnChainBalancesRest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // fetchQuery caches by queryKey — clear so each test controls its own GetToken response.
    SharedQueryClient.clear()
  })

  it('fetches on-chain balances for valid currency IDs', async () => {
    const currencyId = buildCurrencyId(TEST_CHAIN_ID, TEST_TOKEN_ADDRESS)
    const mockBalance = MOCK_BALANCE_1_ETH // 1 ETH

    mockGetOnChainBalancesFetch.mockResolvedValueOnce({
      balance: mockBalance,
    })

    const result = await fetchOnChainBalances({
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

  it('skips balances that cannot be converted to a currency amount', async () => {
    const currencyId = buildCurrencyId(TEST_CHAIN_ID, TEST_TOKEN_ADDRESS)

    mockGetOnChainBalancesFetch.mockResolvedValueOnce({
      balance: undefined,
    })

    const result = await fetchOnChainBalances({
      cachedPortfolio: mockCachedPortfolio,
      accountAddress: TEST_ACCOUNT,
      currencyIds: new Set([currencyId]),
    })

    expect(result.has(currencyId)).toBe(false)
  })

  it('skips balances whose numeric amount is not finite', async () => {
    const currencyId = buildCurrencyId(TEST_CHAIN_ID, TEST_TOKEN_ADDRESS)
    const rawBalanceThatOverflowsNumber = `1${'0'.repeat(400)}`

    mockGetOnChainBalancesFetch.mockResolvedValueOnce({
      balance: rawBalanceThatOverflowsNumber,
    })

    const result = await fetchOnChainBalances({
      cachedPortfolio: mockCachedPortfolio,
      accountAddress: TEST_ACCOUNT,
      currencyIds: new Set([currencyId]),
    })

    expect(result.has(currencyId)).toBe(false)
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

    const result = await fetchOnChainBalances({
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

    const result = await fetchOnChainBalances({
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

    mockGetTokenQueryOnce({ token: MOCK_GET_TOKEN_RESPONSE_TOKEN })

    const result = await fetchOnChainBalances({
      cachedPortfolio: mockCachedPortfolio, // doesn't contain new token
      accountAddress: TEST_ACCOUNT,
      currencyIds: new Set([currencyId]),
    })

    expect(mockGetGetTokenQueryOptions).toHaveBeenCalledWith({
      params: { chainId: TEST_CHAIN_ID, address: MOCK_TOKEN_ADDRESS_2 },
    })

    const balanceInfo = result.get(currencyId)
    expect(balanceInfo).toBeDefined()
    expect(balanceInfo?.amount?.amount).toBe(3)
    expect(balanceInfo?.token?.address).toBe(MOCK_TOKEN_ADDRESS_2)
    expect(balanceInfo?.token?.symbol).toBe('NEW')
    expect(balanceInfo?.token?.metadata?.logoUrl).toBe('https://example.com/logo.png')
  })

  it('preserves a new token balance when the indicative quote omits quote data', async () => {
    const currencyId = buildCurrencyId(TEST_CHAIN_ID, MOCK_TOKEN_ADDRESS_2)

    mockGetOnChainBalancesFetch.mockResolvedValueOnce({
      balance: MOCK_BALANCE_3_ETH,
    })
    mockGetTokenQueryOnce({ token: MOCK_GET_TOKEN_RESPONSE_TOKEN })
    mockFetchIndicativeQuote.mockResolvedValueOnce(
      {} as NonNullable<Awaited<ReturnType<typeof fetchTradingApiIndicativeQuoteIgnoring404>>>,
    )

    const result = await fetchOnChainBalances({
      cachedPortfolio: mockCachedPortfolio,
      accountAddress: TEST_ACCOUNT,
      currencyIds: new Set([currencyId]),
    })

    expect(result.get(currencyId)?.amount?.amount).toBe(3)
    expect(result.get(currencyId)?.valueUsd).toBeUndefined()
  })

  it('preserves a new token balance when USD valuation throws', async () => {
    const currencyId = buildCurrencyId(TEST_CHAIN_ID, MOCK_TOKEN_ADDRESS_2)
    const malformedQuoteResponse = {}
    Object.defineProperty(malformedQuoteResponse, 'quote', {
      get: (): never => {
        throw new Error('Malformed quote response')
      },
    })

    mockGetOnChainBalancesFetch.mockResolvedValueOnce({
      balance: MOCK_BALANCE_3_ETH,
    })
    mockGetTokenQueryOnce({ token: MOCK_GET_TOKEN_RESPONSE_TOKEN })
    mockFetchIndicativeQuote.mockResolvedValueOnce(
      malformedQuoteResponse as NonNullable<Awaited<ReturnType<typeof fetchTradingApiIndicativeQuoteIgnoring404>>>,
    )

    const result = await fetchOnChainBalances({
      cachedPortfolio: mockCachedPortfolio,
      accountAddress: TEST_ACCOUNT,
      currencyIds: new Set([currencyId]),
    })

    expect(result.get(currencyId)?.amount?.amount).toBe(3)
    expect(result.get(currencyId)?.valueUsd).toBeUndefined()
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

    const result = await fetchOnChainBalances({
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

    const result = await fetchOnChainBalances({
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
    const result = await fetchOnChainBalances({
      cachedPortfolio: mockCachedPortfolio,
      accountAddress: TEST_ACCOUNT,
      currencyIds: new Set([currencyId]),
    })

    const balanceInfo = result.get(currencyId)
    expect(balanceInfo?.valueUsd).toBe(200) // 2 tokens * ($100 / 1 token) = $200
  })

  it('omits explicitly undefined optional fields from fetched balances', async () => {
    const currencyId = buildCurrencyId(TEST_CHAIN_ID, TEST_TOKEN_ADDRESS)
    const cachedPortfolioWithoutOptionalTokenFields = {
      balances: [
        {
          token: {
            chainId: TEST_CHAIN_ID,
            address: TEST_TOKEN_ADDRESS,
            decimals: 18,
          },
          amount: {
            amount: 1,
            raw: MOCK_BALANCE_1_ETH,
          },
        },
      ],
    } as NonNullable<GetPortfolioResponse['portfolio']>

    mockGetOnChainBalancesFetch.mockResolvedValueOnce({
      balance: MOCK_BALANCE_1_ETH,
    })

    const snapshot = (
      await fetchOnChainBalances({
        cachedPortfolio: cachedPortfolioWithoutOptionalTokenFields,
        accountAddress: TEST_ACCOUNT,
        currencyIds: new Set([currencyId]),
      })
    ).get(currencyId)

    expect(snapshot).toBeDefined()
    expect(snapshot?.token).not.toHaveProperty('symbol')
    expect(snapshot?.token).not.toHaveProperty('name')
    expectNoExplicitUndefinedValues(snapshot)
    expect(isEqual(snapshot, JSON.parse(JSON.stringify(snapshot)))).toBe(true)
  })

  it('skips tokens when GetToken rejects with NotFound', async () => {
    const currencyId = buildCurrencyId(TEST_CHAIN_ID, MOCK_TOKEN_ADDRESS_3)

    mockGetOnChainBalancesFetch.mockResolvedValueOnce({ balance: MOCK_BALANCE_1_ETH })
    mockGetTokenQueryOnce({ error: new ConnectError('token not found', Code.NotFound) })

    const result = await fetchOnChainBalances({
      cachedPortfolio: mockCachedPortfolio,
      accountAddress: TEST_ACCOUNT,
      currencyIds: new Set([currencyId]),
    })

    expect(result.size).toBe(0)
  })

  it('skips tokens when GetToken fails with an unexpected error', async () => {
    const currencyId = buildCurrencyId(TEST_CHAIN_ID, MOCK_TOKEN_ADDRESS_3)

    mockGetOnChainBalancesFetch.mockResolvedValueOnce({ balance: MOCK_BALANCE_1_ETH })
    mockGetTokenQueryOnce({ error: new Error('network error') })

    const result = await fetchOnChainBalances({
      cachedPortfolio: mockCachedPortfolio,
      accountAddress: TEST_ACCOUNT,
      currencyIds: new Set([currencyId]),
    })

    expect(result.size).toBe(0)
  })

  it('still resolves cached tokens without calling GetToken', async () => {
    const currencyId = buildCurrencyId(TEST_CHAIN_ID, TEST_TOKEN_ADDRESS)

    mockGetOnChainBalancesFetch.mockResolvedValueOnce({ balance: MOCK_BALANCE_1_ETH })

    const result = await fetchOnChainBalances({
      cachedPortfolio: mockCachedPortfolio,
      accountAddress: TEST_ACCOUNT,
      currencyIds: new Set([currencyId]),
    })

    expect(mockGetGetTokenQueryOptions).not.toHaveBeenCalled()
    expect(result.get(currencyId)?.amount?.amount).toBe(1)
  })
})

function expectNoExplicitUndefinedValues(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(expectNoExplicitUndefinedValues)
    return
  }

  if (value && typeof value === 'object') {
    Object.values(value).forEach((nestedValue) => {
      expect(nestedValue).not.toBeUndefined()
      expectNoExplicitUndefinedValues(nestedValue)
    })
  }
}
