import { USDC_MAINNET } from 'constants/tokens'

import { deserializeToken, serializeToken } from './hooks'

describe('serializeToken', () => {
  it('serializes the token', () => {
    expect(serializeToken(USDC_MAINNET)).toEqual({
      chainId: 1,
      decimals: 6,
      name: 'USD//C',
      symbol: 'USDC',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    })
  })
})

describe('deserializeToken', () => {
  it('deserializes the token', () => {
    expect(deserializeToken(serializeToken(USDC_MAINNET))).toEqual(USDC_MAINNET)
  })
})
