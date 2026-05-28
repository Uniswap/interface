import defaultTokenList from '@uniswap/default-token-list'
import fetch from 'jest-fetch-mock'
import fetchTokenList from 'lib/hooks/useTokenList/fetchTokenList'

fetch.enableMocks()

describe('fetchTokenList', () => {
  const resolver = jest.fn()

  beforeEach(() => {
    jest.spyOn(console, 'debug').mockReturnValue(undefined)
  })

  it('throws on an invalid list url', async () => {
    const url = 'https://example.com/invalid-tokenlist.json'
    fetch.mockOnceIf(url, () => {
      throw new Error()
    })
    await expect(fetchTokenList(url, resolver)).rejects.toThrow(
      `No valid token list found at any URLs derived from ${url}.`,
    )
    expect(console.debug).toHaveBeenCalled()
    expect(resolver).not.toHaveBeenCalled()
  })

  it('tries to fetch an ENS address using the passed resolver', async () => {
    const url = 'example.eth'
    const contenthash = '0xD3ADB33F'
    resolver.mockResolvedValue(contenthash)
    await expect(fetchTokenList(url, resolver)).rejects.toThrow(
      `failed to translate contenthash to URI: ${contenthash}`,
    )
    expect(resolver).toHaveBeenCalledWith(url)
  })

  it('throws an error when the ENS resolver throws', async () => {
    const url = 'example.eth'
    const error = new Error('ENS resolver error')
    resolver.mockRejectedValue(error)
    await expect(fetchTokenList(url, resolver)).rejects.toThrow(`failed to resolve ENS name: ${url}`)
    expect(resolver).toHaveBeenCalledWith(url)
  })

  it('fetches and validates a list from an ENS address', async () => {
    jest.mock('../../utils/contenthashToUri', () =>
      jest.fn().mockImplementation(() => 'ipfs://QmPgEqyV3m8SB52BS2j2mJpu9zGprhj2BGCHtRiiw2fdM1'),
    )
    const url = 'example.eth'
    const contenthash = '0xe3010170122013e051d1cfff20606de36845d4fe28deb9861a319a5bc8596fa4e610e8803918'
    const translatedUri = 'https://ipfs.io/ipfs/QmPgEqyV3m8SB52BS2j2mJpu9zGprhj2BGCHtRiiw2fdM1/'
    resolver.mockResolvedValue(contenthash)
    fetch.mockOnceIf(translatedUri, () => Promise.resolve(JSON.stringify(defaultTokenList)))
    await expect(fetchTokenList(url, resolver)).resolves.toStrictEqual(defaultTokenList)
  })

  it('throws for an unrecognized list URL protocol', async () => {
    const url = 'unknown://example.com/invalid-tokenlist.json'
    fetch.mockOnceIf(url, () => Promise.resolve(''))
    await expect(fetchTokenList(url, resolver)).rejects.toThrow(`Unrecognized list URL protocol.`)
  })

  it('logs a debug statement if the response is not successful', async () => {
    const url = 'https://example.com/invalid-tokenlist.json'
    fetch.mockOnceIf(url, () => Promise.resolve({ status: 404 }))
    await expect(fetchTokenList(url, resolver)).rejects.toThrow(
      `No valid token list found at any URLs derived from ${url}.`,
    )
    expect(console.debug).toHaveBeenCalled()
    expect(resolver).not.toHaveBeenCalled()
  })

  it('throws for a list with invalid json response', async () => {
    const url = 'https://example.com/invalid-tokenlist.json'
    fetch.mockOnceIf(url, () => Promise.resolve('invalid json'))
    await expect(fetchTokenList(url, resolver)).rejects.toThrow(
      `No valid token list found at any URLs derived from ${url}.`,
    )
    expect(console.debug).toHaveBeenCalled()
    expect(resolver).not.toHaveBeenCalled()
  })

  it('uses cached value the second time', async () => {
    const url = 'https://example.com/invalid-tokenlist.json'
    fetch.mockOnceIf(url, () => Promise.resolve(JSON.stringify(defaultTokenList)))
    await expect(fetchTokenList(url, resolver)).resolves.toStrictEqual(defaultTokenList)
    await expect(fetchTokenList(url, resolver)).resolves.toStrictEqual(defaultTokenList)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('normalizes legacy chain token arrays into a token list', async () => {
    const url = 'https://raw.githubusercontent.com/RingProtocol/token-list/master/base.tokenlist.json'
    fetch.mockOnceIf(url, () =>
      Promise.resolve(
        JSON.stringify([
          {
            address: '0xb33Ff54b9F7242EF1593d2C9Bcd8f9df46c77935',
            name: 'FAI',
            symbol: 'FAI',
            decimals: 18,
            logoURI: 'https://example.com/fai.png',
          },
        ]),
      ),
    )

    await expect(fetchTokenList(url, resolver)).resolves.toMatchObject({
      name: 'Ring base token list',
      tokens: [
        {
          chainId: 8453,
          address: '0xb33Ff54b9F7242EF1593d2C9Bcd8f9df46c77935',
          name: 'FAI',
          symbol: 'FAI',
          decimals: 18,
          logoURI: 'https://example.com/fai.png',
        },
      ],
    })
  })
})
