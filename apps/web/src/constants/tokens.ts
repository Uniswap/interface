import { ChainId, Currency, NativeCurrency, Token, WETH9 } from '@jaguarswap/sdk-core'
import invariant from 'tiny-invariant'

// eslint-disable-next-line no-restricted-syntax
export const NATIVE_CHAIN_ID = 'NATIVE'

export const USDC = new Token(ChainId.X1, '0x74b7f16337b8972027f6196a17a631ac6de26d22', 6, 'USDC', 'USD Coin')
export const USDT = new Token(ChainId.X1, '0x1e4a5963abfd975d8c9021ce480b42188849d41d', 6, 'USDT', 'Tether USD')
export const DAI = new Token(ChainId.X1, '0xc5015b9d9161dca7e18e32f6f25c4ad850731fd4', 18, 'DAI', 'Dai Stablecoin')
export const WOKB = new Token(ChainId.X1, '0xe538905cf8410324e03A5A23C1c177a474D59b2b', 18, 'WOKB', 'Wrapped OKB')


export const USDC_X1_TestNet = new Token(ChainId.X1_TESTNET, '0x04292af1cf8687235a83766d55b307880fc5e76d', 6, 'USDC', 'USD Coin')
export const USDT_X1_TestNet = new Token(ChainId.X1_TESTNET, '0xded3ac2a172a21a729063c39da55c030ec4a8cc9', 6, 'USDT', 'Tether USD')
export const DAI_X1_TestNet = new Token(ChainId.X1_TESTNET, '0x1b981e783d8d139e74ebbd7be5d99d8a0a7eeb0a', 18, 'DAI', 'Dai Stablecoin')
export const WOKB_X1_TestNet = new Token(ChainId.X1_TESTNET, '0xee1a9629cce8f26deb1ecffbd8f306bef2117423', 18, 'WOKB', 'Wrapped OKB')

export const WRAPPED_NATIVE_CURRENCY: { [chainId: number]: Token | undefined } = {
  ...(WETH9 as Record<ChainId, Token>),
  [ChainId.X1]: new Token(ChainId.X1, '0xe538905cf8410324e03A5A23C1c177a474D59b2b', 18, 'WOKB', 'Wrapped OKB'),
  [ChainId.X1_TESTNET]: new Token(ChainId.X1_TESTNET, '0xee1a9629cce8f26deb1ecffbd8f306bef2117423', 18, 'OKB', 'Wrapped OKB'),
}

export function isX1(chainId: number): chainId is ChainId.X1_TESTNET {
  return chainId === ChainId.X1
}
class X1NativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isX1(this.chainId)) throw new Error('Not X1')
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    invariant(wrapped instanceof Token)
    return wrapped
  }

  public constructor(chainId: number) {
    if (!isX1(chainId)) throw new Error('Not X1')
    super(chainId, 18, 'OKB', 'Wrapped OKB')
  }
}
export function isX1Testnet(chainId: number): chainId is ChainId.X1_TESTNET {
  return chainId === ChainId.X1_TESTNET
}

class X1TestnetNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isX1Testnet(this.chainId)) throw new Error('Not X1 Testnet')
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    invariant(wrapped instanceof Token)
    return wrapped
  }

  public constructor(chainId: number) {
    if (!isX1Testnet(chainId)) throw new Error('Not X1 Testnet')
    super(chainId, 18, 'OKB', 'Wrapped OKB')
  }
}

class ExtendedEther extends NativeCurrency {
  public get wrapped(): Token {
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    if (wrapped) return wrapped
    throw new Error(`Unsupported chain ID: ${this.chainId}`)
  }

  protected constructor(chainId: number) {
    super(chainId, 18, 'ETH', 'Ethereum')
  }

  private static _cachedExtendedEther: { [chainId: number]: NativeCurrency } = {}

  public static onChain(chainId: number): ExtendedEther {
    return this._cachedExtendedEther[chainId] ?? (this._cachedExtendedEther[chainId] = new ExtendedEther(chainId))
  }

  public equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }
}

const cachedNativeCurrency: { [chainId: number]: NativeCurrency | Token } = {}
export function nativeOnChain(chainId: number): NativeCurrency | Token {
  if (cachedNativeCurrency[chainId]) return cachedNativeCurrency[chainId]
  let nativeCurrency: NativeCurrency | Token
  if (isX1(chainId)) {
    nativeCurrency = new X1NativeCurrency(chainId)
  } else if (isX1Testnet(chainId)) {
    nativeCurrency = new X1TestnetNativeCurrency(chainId)
  } else {
    nativeCurrency = ExtendedEther.onChain(chainId)
  }
  // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
  return (cachedNativeCurrency[chainId] = nativeCurrency)
}

export const TOKEN_SHORTHANDS: { [shorthand: string]: { [chainId in ChainId]?: string } } = {
  USDC: {
    [ChainId.X1]: USDC.address,
    [ChainId.X1_TESTNET]: USDC_X1_TestNet.address,
  },
}

const STABLECOINS: { [chainId in ChainId]: Token[] } = {
  [ChainId.X1]: [USDC, USDT, DAI],
  [ChainId.X1_TESTNET]: [USDC_X1_TestNet, USDT_X1_TestNet, DAI_X1_TestNet],
}

export function isStablecoin(currency?: Currency): boolean {
  if (!currency) return false

  return STABLECOINS[currency.chainId as ChainId].some((stablecoin) => stablecoin.equals(currency))
}

export const UNKNOWN_TOKEN_SYMBOL = 'UNKNOWN'
export const UNKNOWN_TOKEN_NAME = 'Unknown Token'
