import { Code, ConnectError } from '@connectrpc/connect'
import { GetTokenMarketsMultiChainResponse, ListTokensResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { MultichainTokenMarket, TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import {
  getGetTokenMarketsMultiChainQueryOptions,
  getListTokensQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { createRankedMultichainToken } from 'uniswap/src/test/fixtures/dataApi/rankedMultichainToken'

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: {
    getTokenMarketsMultiChain: vi.fn(),
    listTokens: vi.fn(),
  },
}))

vi.mock('utilities/src/logger/logger', () => ({
  logger: { error: vi.fn() },
}))

const mockClient = vi.mocked(dataApiServiceClientV2)

/** Query options' `queryFn` ignores the react-query context object it's normally invoked with. */
async function runQueryFn<T>(options: { queryFn?: unknown }): Promise<T> {
  const queryFn = options.queryFn as () => Promise<T>
  return queryFn()
}

const TOKEN_IDENTIFIER = { chainId: 1, address: '0xabc' }

describe('getGetTokenMarketsMultiChainQueryOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the multichain markets response as-is on success', async () => {
    mockClient.getTokenMarketsMultiChain.mockResolvedValue(
      new GetTokenMarketsMultiChainResponse({
        markets: [new MultichainTokenMarket({ multichainId: 'mc-1', stats: { volumeUsd: 250 } })],
      }),
    )

    const options = getGetTokenMarketsMultiChainQueryOptions({
      params: { identifier: { case: 'tokens', value: { tokens: [TOKEN_IDENTIFIER] } }, duration: 1 },
    })
    const data = await runQueryFn<{ markets: { stats?: { volumeUsd?: number } }[] }>(options)

    expect(data.markets[0]?.stats?.volumeUsd).toBe(250)
    expect(mockClient.getTokenMarketsMultiChain).toHaveBeenCalledTimes(1)
  })

  it('retries without chainIds when the backend rejects an unrecognized chainId', async () => {
    mockClient.getTokenMarketsMultiChain
      .mockRejectedValueOnce(new ConnectError('Unrecognized chainId: 999', Code.InvalidArgument))
      .mockResolvedValueOnce(
        new GetTokenMarketsMultiChainResponse({
          markets: [new MultichainTokenMarket({ multichainId: 'mc-1', stats: { volumeUsd: 100 } })],
        }),
      )

    const options = getGetTokenMarketsMultiChainQueryOptions({
      params: {
        identifier: { case: 'tokens', value: { tokens: [TOKEN_IDENTIFIER] } },
        duration: 1,
        chainIds: [999],
      },
    })
    const data = await runQueryFn<{ markets: { stats?: { volumeUsd?: number } }[] }>(options)

    expect(mockClient.getTokenMarketsMultiChain).toHaveBeenCalledTimes(2)
    expect(mockClient.getTokenMarketsMultiChain).toHaveBeenLastCalledWith(
      expect.objectContaining({ chainIds: undefined }),
    )
    expect(data.markets[0]?.stats?.volumeUsd).toBe(100)
  })

  it('rethrows other errors without retrying', async () => {
    mockClient.getTokenMarketsMultiChain.mockRejectedValue(new ConnectError('not found', Code.NotFound))

    const options = getGetTokenMarketsMultiChainQueryOptions({
      params: { identifier: { case: 'tokens', value: { tokens: [TOKEN_IDENTIFIER] } }, duration: 1 },
    })

    await expect(runQueryFn(options)).rejects.toThrow()
    expect(mockClient.getTokenMarketsMultiChain).toHaveBeenCalledTimes(1)
  })
})

describe('getListTokensQueryOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes the request through unchanged and returns the page as plain data', async () => {
    mockClient.listTokens.mockResolvedValue(
      new ListTokensResponse({ multichainTokens: [createRankedMultichainToken({ symbol: 'USDC' })] }),
    )
    const params = {
      chainIds: [1, 137],
      page: { pageSize: 8 },
      sort: { orderBy: TokensOrderBy.VOLUME_1D, ascending: false },
    }

    const options = getListTokensQueryOptions({ params })
    const data = await runQueryFn<{ multichainTokens: { multichainToken?: { symbol: string } }[] }>(options)

    expect(mockClient.listTokens).toHaveBeenCalledWith(params)
    expect(data.multichainTokens).toHaveLength(1)
    expect(data.multichainTokens[0]?.multichainToken?.symbol).toBe('USDC')
    expect(options.queryKey).toEqual(['DataApiService', 'listTokens', params])
  })

  it('is disabled without params', () => {
    expect(getListTokensQueryOptions({}).enabled).toBe(false)
  })
})
