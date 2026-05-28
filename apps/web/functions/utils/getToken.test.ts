import { ApolloQueryResult } from '@apollo/client'
import { GraphQLApi } from '@universe/api'
import client from 'functions/client'
import { META_TAG_FETCH_TIMEOUT_MS } from 'functions/constants'
import getToken from 'functions/utils/getToken'
import { mocked } from '~/test-utils/mocked'

vi.mock('functions/client', () => ({
  default: {
    query: vi.fn(),
  },
}))

describe('getToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('queries token metadata without using the shared Apollo cache', async () => {
    mocked(client.query).mockResolvedValueOnce({
      data: {
        token: {
          symbol: 'UNI',
          name: 'Uniswap',
          project: {
            logoUrl: 'https://example.com/uni.png',
          },
        },
      },
      loading: false,
      networkStatus: 7,
    } as ApolloQueryResult<GraphQLApi.TokenWebQuery>)

    const result = await getToken({
      networkName: 'ethereum',
      tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      url: 'https://app.uniswap.org/explore/tokens/ethereum/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    })

    expect(client.query).toHaveBeenCalledWith({
      query: GraphQLApi.TokenWebDocument,
      variables: {
        chain: 'ETHEREUM',
        address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      },
      errorPolicy: 'all',
      fetchPolicy: 'no-cache',
    })
    expect(result).toEqual({
      title: 'Get UNI on Uniswap',
      image: 'https://app.uniswap.org/api/image/tokens/ethereum/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      url: 'https://app.uniswap.org/explore/tokens/ethereum/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      tokenData: {
        symbol: 'UNI',
      },
      ogImage: 'https://example.com/uni.png',
      name: 'Uniswap',
    })
  })

  test('returns undefined when the token metadata query times out', async () => {
    vi.useFakeTimers()
    mocked(client.query).mockImplementationOnce(() => new Promise(() => {}))

    const resultPromise = getToken({
      networkName: 'ethereum',
      tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      url: 'https://app.uniswap.org/explore/tokens/ethereum/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    })

    await vi.advanceTimersByTimeAsync(META_TAG_FETCH_TIMEOUT_MS)
    await expect(resultPromise).resolves.toBeUndefined()
  })
})
