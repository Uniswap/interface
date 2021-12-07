// adapted from https://github.com/Uniswap/interface/src/constants/tokens.ts
import { Currency, NativeCurrency as NativeCurrencyClass, Token, WETH9 } from '@uniswap/sdk-core'
import { CHAIN_INFO } from 'src/constants/chains'

export const DUMMY_ADDRESS = '-1'

export class NativeCurrency implements NativeCurrencyClass {
  constructor(chainId: number) {
    if (!CHAIN_INFO[chainId]) throw new Error('Native currrency info not found')

    this.chainId = chainId
    this.decimals = CHAIN_INFO[chainId].nativeCurrency.decimals
    this.name = CHAIN_INFO[chainId].nativeCurrency.name
    this.symbol = CHAIN_INFO[chainId].nativeCurrency.symbol
    this.isNative = true
    this.isToken = false
  }

  chainId: number
  decimals: number
  name: string
  symbol: string
  isNative: true
  isToken: false

  address = DUMMY_ADDRESS

  equals(currency: Currency) {
    return currency.isNative && currency.chainId === this.chainId
  }

  public get wrapped(): Token {
    if (this.chainId in WETH9) return WETH9[this.chainId]
    throw new Error('Unsupported chain ID')
  }

  private static _cachedNativeCurrency: { [chainId: number]: NativeCurrency } = {}

  public static onChain(chainId: number): NativeCurrency {
    return (
      this._cachedNativeCurrency[chainId] ??
      (this._cachedNativeCurrency[chainId] = new NativeCurrency(chainId))
    )
  }
}
