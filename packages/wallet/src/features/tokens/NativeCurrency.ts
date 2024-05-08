// adapted from https://github.com/Uniswap/interface/src/constants/tokens.ts
import { Currency, NativeCurrency as NativeCurrencyClass, Token } from '@uniswap/sdk-core'
import { getNativeAddress } from 'wallet/src/constants/addresses'
import { CHAIN_INFO, ChainId } from 'wallet/src/constants/chains'
import { wrappedNativeCurrency } from 'wallet/src/constants/tokens'
import { toSupportedChainId } from 'wallet/src/features/chains/utils'

export class NativeCurrency implements NativeCurrencyClass {
  constructor(chainId: number) {
    const supportedChainId = toSupportedChainId(chainId)
    if (!supportedChainId) {
      throw new Error(`Unsupported chain ID: ${chainId}`)
    }

    const chainInfo = CHAIN_INFO[supportedChainId]
    if (!chainInfo) {
      throw new Error('Native currrency info not found')
    }

    this.chainId = supportedChainId
    this.decimals = chainInfo.nativeCurrency.decimals
    this.name = chainInfo.nativeCurrency.name
    this.symbol = chainInfo.nativeCurrency.symbol
    this.isNative = true
    this.isToken = false
    this.address = getNativeAddress(this.chainId)
  }

  chainId: ChainId
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
    return (
      this._cachedNativeCurrency[chainId] ??
      (this._cachedNativeCurrency[chainId] = new NativeCurrency(chainId))
    )
  }
}
