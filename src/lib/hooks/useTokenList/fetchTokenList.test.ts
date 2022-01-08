import fetchTokenList, { DEFAULT_TOKEN_LIST } from './fetchTokenList'

describe('fetchTokenList', () => {
  const resolver = jest.fn()

  it('throws on an invalid list url', async () => {
    const url = 'https://example.com'
    await expect(fetchTokenList(url, resolver)).rejects.toThrowError(`failed to fetch list: ${url}`)
    expect(resolver).not.toHaveBeenCalled()
  })

  it('tries to fetch an ENS address using the passed resolver', async () => {
    const url = 'example.eth'
    const contenthash = '0xD3ADB33F'
    resolver.mockResolvedValue(contenthash)
    await expect(fetchTokenList(url, resolver)).rejects.toThrow()
    expect(resolver).toHaveBeenCalledWith(url)
  })

  it('fetches and validates the default token list', async () => {
    const list = await (await fetch(DEFAULT_TOKEN_LIST)).json()
    await expect(fetchTokenList(DEFAULT_TOKEN_LIST, resolver)).resolves.toStrictEqual(list)
    expect(resolver).not.toHaveBeenCalled()
  })
})
