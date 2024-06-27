import { ChainId, Token } from '@uniswap/sdk-core'
import { DAI } from 'constants/tokens'

import { formatCurrencySymbol } from './utils'

describe('formatCurrencySymbol', () => {
  it('should return undefined if currency is undefined', () => {
    expect(formatCurrencySymbol(undefined)).toBeUndefined()
  })
  it('should return DAI for DAI', () => {
    expect(formatCurrencySymbol(DAI)).toEqual('DAI')
  })
  it('should return a truncated symbol if its long', () => {
    const daiWithLongSymbol = new Token(ChainId.MAINNET, DAI.address, DAI.decimals, DAI.symbol?.repeat(10))
    expect(formatCurrencySymbol(daiWithLongSymbol)).toEqual('DAID...AIDAI')
  })
})
