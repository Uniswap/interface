import { Currency, NativeCurrency, Token } from '@uniswap/sdk-core'

import { WETH_EXTENDED } from './tokens'

export class ExtendedXDC extends NativeCurrency {
  protected constructor(chainId: number) {
    super(chainId, 18, 'XDC', 'XDC')
  }
  get wrapped(): Token {
    if (this.chainId in WETH_EXTENDED) {
      return WETH_EXTENDED[this.chainId]
    }
    throw new Error('Unsupported chain ID')
  }

  private static _cachedXDC: { [chainId: number]: ExtendedXDC } = {}
  static onChain(chainId: number): ExtendedXDC {
    return this._cachedXDC[chainId] ?? (this._cachedXDC[chainId] = new ExtendedXDC(chainId))
  }

  equals(other: Currency): boolean {
    return other.isNative && other.symbol === this.symbol && other.chainId === this.chainId
  }
}
