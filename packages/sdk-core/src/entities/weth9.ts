import { Token } from './token'

/**
 * Known WETH9 implementation addresses, used in our implementation of Ether#wrapped
 */
export const WETH9: { [chainId: number]: Token } = {
  1: new Token(1, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18, 'WETH', 'Wrapped Ether'),
  3: new Token(3, '0xc778417E063141139Fce010982780140Aa0cD5Ab', 18, 'WETH', 'Wrapped Ether'),
  4: new Token(4, '0xc778417E063141139Fce010982780140Aa0cD5Ab', 18, 'WETH', 'Wrapped Ether'),
  5: new Token(5, '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6', 18, 'WETH', 'Wrapped Ether'),
  42: new Token(42, '0xd0A1E359811322d97991E03f863a0C30C2cF029C', 18, 'WETH', 'Wrapped Ether'),

  10: new Token(10, '0x4200000000000000000000000000000000000006', 18, 'WETH', 'Wrapped Ether'),
  69: new Token(69, '0x4200000000000000000000000000000000000006', 18, 'WETH', 'Wrapped Ether'),
  11155420: new Token(11155420, '0x4200000000000000000000000000000000000006', 18, 'WETH', 'Wrapped Ether'),

  42161: new Token(42161, '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', 18, 'WETH', 'Wrapped Ether'),
  421611: new Token(421611, '0xB47e6A5f8b33b3F17603C83a0535A9dcD7E32681', 18, 'WETH', 'Wrapped Ether'),
  421614: new Token(421614, '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73', 18, 'WETH', 'Wrapped Ether'),

  8453: new Token(8453, '0x4200000000000000000000000000000000000006', 18, 'WETH', 'Wrapped Ether'),

  56: new Token(56, '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', 18, 'WBNB', 'Wrapped BNB'),
  137: new Token(137, '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', 18, 'WMATIC', 'Wrapped MATIC'),
  43114: new Token(43114, '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', 18, 'WAVAX', 'Wrapped AVAX'),
}
