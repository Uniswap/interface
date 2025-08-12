import { NativeCurrency, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'

const TEST_TOKEN_ADDRESS = '0xabcdef0123456789abcdef0123456789abcdef01'

describe(buildCurrency, () => {
  it('should return a new Token instance when all parameters are provided', () => {
    const token = buildCurrency({
      chainId: UniverseChainId.Mainnet,
      address: TEST_TOKEN_ADDRESS,
      decimals: 0,
      symbol: 'TEST',
      name: 'Test Token',
    }) as Token
    expect(token).toBeInstanceOf(Token)
    expect(token.chainId).toBe(UniverseChainId.Mainnet)
    expect(token.address).toBe(TEST_TOKEN_ADDRESS)
    expect(token.decimals).toBe(0)
    expect(token.symbol).toBe('TEST')
    expect(token.name).toBe('Test Token')
  })

  it('should return the same reference when the same parameters are provided', () => {
    const args = {
      chainId: UniverseChainId.Mainnet,
      address: TEST_TOKEN_ADDRESS,
      decimals: 0,
      symbol: 'TEST',
      name: 'Test Token',
    }

    const tokenA = buildCurrency({ ...args }) as Token
    const tokenB = buildCurrency({ ...args }) as Token

    expect(tokenA).toBeInstanceOf(Token)
    expect(tokenA).toBe(tokenB)
  })

  it('should return a new NativeCurrency instance when address is not provided', () => {
    const nativeCurrency = buildCurrency({
      chainId: UniverseChainId.Mainnet,
      address: null,
      decimals: 18,
    }) as NativeCurrency
    expect(nativeCurrency).toBeInstanceOf(NativeCurrency)
    expect(nativeCurrency.chainId).toBe(UniverseChainId.Mainnet)
  })

  it('should return undefined when chainId or decimals are not provided', () => {
    expect(
      buildCurrency({
        chainId: null,
        address: '0x0',
        decimals: 18,
      }),
    ).toBeUndefined()
    expect(
      buildCurrency({
        chainId: UniverseChainId.Mainnet,
        address: '0x0',
        decimals: null,
      }),
    ).toBeUndefined()
  })
})
