// adapted from https://github.com/Uniswap/interface/src/constants/tokens.ts
import { Currency, NativeCurrency as NativeCurrencyClass, Token } from '@uniswap/sdk-core'
import { NATIVE_ADDRESS, NATIVE_ADDRESS_ALT } from 'wallet/src/constants/addresses'
import { ChainId, CHAIN_INFO } from 'wallet/src/constants/chains'
import { WRAPPED_NATIVE_CURRENCY } from 'wallet/src/constants/tokens'
import { isPolygonChain } from 'wallet/src/features/chains/utils'

export class NativeCurrency implements NativeCurrencyClass {
  constructor(chainId: number) {
    const chainInfo = CHAIN_INFO[chainId]
    if (!chainInfo) throw new Error('Native currrency info not found')

    this.chainId = chainId
    this.decimals = chainInfo.nativeCurrency.decimals
    this.name = chainInfo.nativeCurrency.name
    this.symbol = chainInfo.nativeCurrency.symbol
    this.isNative = true
    this.isToken = false
  }

  chainId: number
  decimals: number
  name: string
  symbol: string
  isNative: true
  isToken: false

  address = NATIVE_ADDRESS

  equals(currency: Currency): boolean {
    return currency.isNative && currency.chainId === this.chainId
  }

  public get wrapped(): Token {
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId as ChainId]
    if (!wrapped) throw new Error('Unsupported chain ID')

    return wrapped
  }

  private static _cachedNativeCurrency: { [chainId: number]: NativeCurrency } = {}

  public static onChain(chainId: number): NativeCurrency {
    return (
      this._cachedNativeCurrency[chainId] ??
      (this._cachedNativeCurrency[chainId] = isPolygonChain(chainId)
        ? new MaticNativeCurrency(chainId)
        : new NativeCurrency(chainId))
    )
  }
}

class MaticNativeCurrency extends NativeCurrency {
  address = NATIVE_ADDRESS_ALT

  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isPolygonChain(this.chainId)) throw new Error('Not matic')

    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    if (!wrapped) throw new Error('Wrapped currency info not found')

    return wrapped
  }

  public constructor(chainId: number) {
    if (!isPolygonChain(chainId)) throw new Error('Not matic')
    super(chainId)
  }
}
