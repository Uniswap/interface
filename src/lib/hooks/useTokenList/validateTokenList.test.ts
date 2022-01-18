import { TokenInfo } from '@uniswap/token-lists'

import { validateTokens } from './validateTokenList'

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

describe('validateTokens', () => {
  it('throws on invalid tokens', async () => {
    await expect(validateTokens([INVALID_TOKEN])).rejects.toThrowError(/^Token list failed validation:.*address/)
  })

  it('validates the passed token info', async () => {
    await expect(validateTokens(INLINE_TOKEN_LIST)).resolves.toBe(INLINE_TOKEN_LIST)
  })
})
