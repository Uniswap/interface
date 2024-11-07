// adapted from https://github.com/Uniswap/interface/src/constants/tokens.ts
import { Currency, NativeCurrency as NativeCurrencyClass, Token } from '@uniswap/sdk-core'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { wrappedNativeCurrency } from 'uniswap/src/utils/currency'

export class NativeCurrency implements NativeCurrencyClass {
  constructor(chainId: number) {
    const supportedChainId = toSupportedChainId(chainId)
    if (!supportedChainId) {
      throw new Error(`Unsupported chain ID: ${chainId}`)
    }

    const { nativeCurrency } = getChainInfo(supportedChainId)

    this.chainId = supportedChainId
    this.decimals = nativeCurrency.decimals
    this.name = nativeCurrency.name
    this.symbol = nativeCurrency.symbol
    this.isNative = true
    this.isToken = false
    this.address = getNativeAddress(this.chainId)
  }

  chainId: UniverseChainId
  decimals: number
  name: string
  symbol: string
  isNative: true
  isToken: false
  address: string

  equals(currency: Currency): boolean {
    return currency.isNative && currency.chainId === this.chainId
  }

  public get wrapped(): Token {
    return wrappedNativeCurrency(this.chainId)
  }

  private static _cachedNativeCurrency: { [chainId: number]: NativeCurrency } = {}

  public static onChain(chainId: number): NativeCurrency {
    return this._cachedNativeCurrency[chainId] ?? (this._cachedNativeCurrency[chainId] = new NativeCurrency(chainId))
  }
}
