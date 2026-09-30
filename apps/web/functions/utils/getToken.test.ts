import { META_TAG_FETCH_TIMEOUT_MS } from 'functions/constants'
import getToken from 'functions/utils/getToken'

const { mockDataApiServicePost } = vi.hoisted(() => ({ mockDataApiServicePost: vi.fn() }))

// Stub the transport so the assertions don't depend on which gateway URL the environment resolves
// (CI points CLOUD_FUNCTIONS_DATA_API_ENDPOINT_OVERRIDE at the local fixture server).
vi.mock('functions/utils/dataApiService', () => ({
  dataApiServicePost: mockDataApiServicePost,
}))

describe('getToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('formats token metadata from the data-api GetToken response', async () => {
    mockDataApiServicePost.mockResolvedValue({
      token: {
        symbol: 'UNI',
        name: 'Uniswap',
        project: {
          logoUrl: 'https://example.com/uni.png',
        },
      },
    })

    const result = await getToken({
      networkName: 'ethereum',
      tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      url: 'https://app.uniswap.org/explore/tokens/ethereum/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    })

    expect(mockDataApiServicePost).toHaveBeenCalledWith('GetToken', {
      chainId: 1,
      address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
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

  test('queries the native token under its REST address', async () => {
    mockDataApiServicePost.mockResolvedValue({ token: { symbol: 'ETH', name: 'Ethereum' } })

    await getToken({
      networkName: 'ethereum',
      tokenAddress: 'NATIVE',
      url: 'https://app.uniswap.org/explore/tokens/ethereum/NATIVE',
    })

    expect(mockDataApiServicePost).toHaveBeenCalledWith('GetToken', {
      chainId: 1,
      address: '0x0000000000000000000000000000000000000000',
    })
  })

  test('returns undefined for an unknown network without fetching', async () => {
    mockDataApiServicePost.mockResolvedValue({ token: { symbol: 'UNI', name: 'Uniswap' } })

    const result = await getToken({
      networkName: 'ethereun',
      tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      url: 'https://app.uniswap.org/explore/tokens/ethereun/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    })

    expect(mockDataApiServicePost).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  test('returns undefined when the response has no token', async () => {
    mockDataApiServicePost.mockResolvedValue({})

    const result = await getToken({
      networkName: 'ethereum',
      tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      url: 'https://app.uniswap.org/explore/tokens/ethereum/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    })

    expect(result).toBeUndefined()
  })

  test('returns undefined when the token metadata query times out', async () => {
    vi.useFakeTimers()
    mockDataApiServicePost.mockReturnValue(new Promise(() => {}))

    const resultPromise = getToken({
      networkName: 'ethereum',
      tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      url: 'https://app.uniswap.org/explore/tokens/ethereum/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    })

    await vi.advanceTimersByTimeAsync(META_TAG_FETCH_TIMEOUT_MS)
    await expect(resultPromise).resolves.toBeUndefined()
  })
})
