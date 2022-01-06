import { TokenInfo } from '@uniswap/token-lists'

import fetchTokenList, { DEFAULT_TOKEN_LIST, getTokenInfo } from './fetchTokenList'

const INVALID_TOKEN: TokenInfo = {
  name: 'Dai Stablecoin',
  address: '0xD3ADB33F',
  symbol: 'DAI',
  decimals: 18,
  chainId: 1,
}

const INLINE_TOKEN_LIST = [
  {
    name: 'Dai Stablecoin',
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    symbol: 'DAI',
    decimals: 18,
    chainId: 1,
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
  },
  {
    name: 'USDCoin',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    decimals: 6,
    chainId: 1,
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  },
]

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

describe('getTokenInfo', () => {
  it('throws on invalid tokens', async () => {
    await expect(getTokenInfo([INVALID_TOKEN])).rejects.toThrowError(/^Token list failed validation:.*address/)
  })

  it('validates the passed token info', async () => {
    await expect(getTokenInfo(INLINE_TOKEN_LIST)).resolves.toBe(INLINE_TOKEN_LIST)
  })
})
