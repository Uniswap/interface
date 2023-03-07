import defaultTokenList from '@uniswap/default-token-list'
import fetch from 'jest-fetch-mock'

import fetchTokenList, { DEFAULT_TOKEN_LIST } from './fetchTokenList'

fetch.enableMocks()

describe('fetchTokenList', () => {
  const resolver = jest.fn()

  beforeEach(() => {
    jest.spyOn(console, 'debug').mockReturnValue(undefined)
    resolver.mockReset()
  })

  it('throws on an invalid list url', async () => {
    const url = 'https://example.com/invalid-tokenlist.json'
    fetch.mockOnceIf(url, () => {
      throw new Error()
    })
    await expect(fetchTokenList(url, resolver)).rejects.toThrow(`failed to fetch list: ${url}`)
    expect(console.debug).toHaveBeenCalled()
    expect(resolver).not.toHaveBeenCalled()
  })

  it('tries to fetch an ENS address using the passed resolver', async () => {
    const url = 'example.eth'
    const contenthash = '0xD3ADB33F'
    resolver.mockResolvedValue(contenthash)
    await expect(fetchTokenList(url, resolver)).rejects.toThrow(
      `failed to translate contenthash to URI: ${contenthash}`
    )
    expect(resolver).toHaveBeenCalledWith(url)
  })

  it('fetches and validates the default token list', async () => {
    fetch.mockOnceIf(DEFAULT_TOKEN_LIST, () => Promise.resolve(JSON.stringify(defaultTokenList)))
    await expect(fetchTokenList(DEFAULT_TOKEN_LIST, resolver)).resolves.toStrictEqual(defaultTokenList)
    expect(resolver).not.toHaveBeenCalled()
  })
})
