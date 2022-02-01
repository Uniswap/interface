// adapted from https://github.com/Uniswap/interface/src/constants/tokens.ts
import { Currency, NativeCurrency as NativeCurrencyClass, Token } from '@uniswap/sdk-core'
import { CHAIN_INFO, isMatic } from 'src/constants/chains'
import { WRAPPED_NATIVE_CURRENCY } from 'src/constants/tokens'

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
    if (this.chainId in WRAPPED_NATIVE_CURRENCY) return WRAPPED_NATIVE_CURRENCY[this.chainId]
    throw new Error('Unsupported chain ID')
  }

  private static _cachedNativeCurrency: { [chainId: number]: NativeCurrency } = {}

  public static onChain(chainId: number): NativeCurrency {
    return (
      this._cachedNativeCurrency[chainId] ??
      (this._cachedNativeCurrency[chainId] = isMatic(chainId)
        ? new MaticNativeCurrency(chainId)
        : new NativeCurrency(chainId))
    )
  }
}

class MaticNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isMatic(this.chainId)) throw new Error('Not matic')
    return WRAPPED_NATIVE_CURRENCY[this.chainId]
  }

  public constructor(chainId: number) {
    if (!isMatic(chainId)) throw new Error('Not matic')
    super(chainId)
  }
}
