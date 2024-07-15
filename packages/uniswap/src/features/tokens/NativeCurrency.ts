// adapted from https://github.com/Uniswap/interface/src/constants/tokens.ts
import { Currency, NativeCurrency as NativeCurrencyClass, Token } from '@uniswap/sdk-core'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { WalletChainId } from 'uniswap/src/types/chains'
import { wrappedNativeCurrency } from 'uniswap/src/utils/currency'

export class NativeCurrency implements NativeCurrencyClass {
  constructor(chainId: number) {
    const supportedChainId = toSupportedChainId(chainId)
    if (!supportedChainId) {
      throw new Error(`Unsupported chain ID: ${chainId}`)
    }

    const chainInfo = UNIVERSE_CHAIN_INFO[supportedChainId]
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

  chainId: WalletChainId
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
