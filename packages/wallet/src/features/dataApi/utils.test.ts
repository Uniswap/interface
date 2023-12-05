import { Token } from '@uniswap/sdk-core'
import { ChainId } from 'wallet/src/constants/chains'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import { buildCurrency } from './utils'

describe(buildCurrency, () => {
  it('should return a new Token instance when all parameters are provided', () => {
    const token = buildCurrency({
      chainId: ChainId.Mainnet,
      address: '0x0000000000000000000000000000000000000000',
      decimals: 0,
      symbol: 'TEST',
      name: 'Test Token',
    }) as Token
    expect(token).toBeInstanceOf(Token)
    expect(token.chainId).toBe(ChainId.Mainnet)
    expect(token.address).toBe('0x0000000000000000000000000000000000000000')
    expect(token.decimals).toBe(0)
    expect(token.symbol).toBe('TEST')
    expect(token.name).toBe('Test Token')
  })

  it('should return a new NativeCurrency instance when address is not provided', () => {
    const nativeCurrency = buildCurrency({
      chainId: ChainId.Mainnet,
      address: null,
      decimals: 18,
    }) as NativeCurrency
    expect(nativeCurrency).toBeInstanceOf(NativeCurrency)
    expect(nativeCurrency.chainId).toBe(ChainId.Mainnet)
  })

  it('should return undefined when chainId or decimals are not provided', () => {
    expect(
      buildCurrency({
        chainId: null,
        address: '0x0',
        decimals: 18,
      })
    ).toBeUndefined()
    expect(
      buildCurrency({
        chainId: ChainId.Mainnet,
        address: '0x0',
        decimals: null,
      })
    ).toBeUndefined()
  })
})
