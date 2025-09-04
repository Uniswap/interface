import defaultTokenList from '@uniswap/default-token-list'
import fetchTokenList from 'lib/hooks/useTokenList/fetchTokenList'
import contenthashToUri from 'lib/utils/contenthashToUri'
import { mocked } from 'test-utils/mocked'
import { logger } from 'utilities/src/logger/logger'
import createFetchMock from 'vitest-fetch-mock'

vi.mock('lib/utils/contenthashToUri', () => ({
  default: vi.fn(),
}))

vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

const fetchMocker = createFetchMock(vi)
const mockContenthashToUri = mocked(contenthashToUri)
const mockLoggerDebug = mocked(logger.debug)

// eslint-disable-next-line jest/no-disabled-tests
describe.skip('fetchTokenList', () => {
  const resolver = vi.fn()

  beforeEach(() => {
    fetchMocker.enableMocks()
    fetchMocker.resetMocks()
    resolver.mockReset()
    mockContenthashToUri.mockReset()
    mockLoggerDebug.mockReset()
  })

  afterEach(() => {
    fetchMocker.disableMocks()
  })

  it('throws on an invalid list url', async () => {
    const url = 'https://example.com/invalid-tokenlist.json'
    fetchMocker.mockOnceIf(url, () => {
      throw new Error()
    })
    await expect(fetchTokenList({ listUrl: url, resolveENSContentHash: resolver })).rejects.toThrow(
      `No valid token list found at any URLs derived from ${url}.`,
    )
    expect(mockLoggerDebug).toHaveBeenCalledWith(
      'fetchTokenList',
      'fetchTokenList',
      `failed to fetch list: ${url} (${url})`,
      expect.any(Error),
    )
    expect(resolver).not.toHaveBeenCalled()
  })

  it('tries to fetch an ENS address using the passed resolver', async () => {
    mockContenthashToUri.mockImplementation(() => {
      throw new Error('test')
    })
    const url = 'example.eth'
    const contenthash = '0xD3ADB33F'
    resolver.mockResolvedValue(contenthash)
    await expect(fetchTokenList({ listUrl: url, resolveENSContentHash: resolver })).rejects.toThrow(
      `failed to translate contenthash to URI: ${contenthash}`,
    )
    expect(resolver).toHaveBeenCalledWith(url)
  })

  it('throws an error when the ENS resolver throws', async () => {
    const url = 'example.eth'
    const error = new Error('ENS resolver error')
    resolver.mockRejectedValue(error)
    await expect(fetchTokenList({ listUrl: url, resolveENSContentHash: resolver })).rejects.toThrow(
      `failed to resolve ENS name: ${url}`,
    )
    expect(resolver).toHaveBeenCalledWith(url)
  })

  it('fetches and validates a list from an ENS address', async () => {
    mockContenthashToUri.mockImplementation(() => 'ipfs://QmPgEqyV3m8SB52BS2j2mJpu9zGprhj2BGCHtRiiw2fdM1')
    const url = 'example.eth'
    const contenthash = '0xe3010170122013e051d1cfff20606de36845d4fe28deb9861a319a5bc8596fa4e610e8803918'
    const translatedUri = 'https://ipfs.io/ipfs/QmPgEqyV3m8SB52BS2j2mJpu9zGprhj2BGCHtRiiw2fdM1/'
    resolver.mockResolvedValue(contenthash)
    fetchMocker.mockOnceIf(translatedUri, () => Promise.resolve(JSON.stringify(defaultTokenList)))
    await expect(fetchTokenList({ listUrl: url, resolveENSContentHash: resolver })).resolves.toStrictEqual(
      defaultTokenList,
    )
  })

  it('throws for an unrecognized list URL protocol', async () => {
    const url = 'unknown://example.com/invalid-tokenlist.json'
    fetchMocker.mockOnceIf(url, () => Promise.resolve(''))
    await expect(fetchTokenList({ listUrl: url, resolveENSContentHash: resolver })).rejects.toThrow(
      `Unrecognized list URL protocol.`,
    )
  })

  it('logs a debug statement if the response is not successful', async () => {
    const url = 'https://example.com/invalid-tokenlist.json'
    fetchMocker.mockOnceIf(url, () => Promise.resolve({ status: 404 }))
    await expect(fetchTokenList({ listUrl: url, resolveENSContentHash: resolver })).rejects.toThrow(
      `No valid token list found at any URLs derived from ${url}.`,
    )
    expect(mockLoggerDebug).toHaveBeenCalledWith(
      'fetchTokenList',
      'fetchTokenList',
      `failed to fetch list ${url} (${url})`,
      'Not Found',
    )
    expect(resolver).not.toHaveBeenCalled()
  })

  it('throws for a list with invalid json response', async () => {
    const url = 'https://example.com/invalid-tokenlist.json'
    fetchMocker.mockOnceIf(url, () => Promise.resolve('invalid json'))
    await expect(fetchTokenList({ listUrl: url, resolveENSContentHash: resolver })).rejects.toThrow(
      `No valid token list found at any URLs derived from ${url}.`,
    )
    expect(mockLoggerDebug).toHaveBeenCalledWith(
      'fetchTokenList',
      'fetchTokenList',
      `failed to parse and validate list response: ${url} (${url})`,
      expect.any(Error),
    )
    expect(resolver).not.toHaveBeenCalled()
  })

  it('uses cached value the second time', async () => {
    const url = 'https://example.com/invalid-tokenlist.json'
    fetchMocker.mockOnceIf(url, () => Promise.resolve(JSON.stringify(defaultTokenList)))
    await expect(fetchTokenList({ listUrl: url, resolveENSContentHash: resolver })).resolves.toStrictEqual(
      defaultTokenList,
    )
    await expect(fetchTokenList({ listUrl: url, resolveENSContentHash: resolver })).resolves.toStrictEqual(
      defaultTokenList,
    )
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
