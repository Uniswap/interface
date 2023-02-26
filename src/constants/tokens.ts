import { Currency, Ether, NativeCurrency, Token } from '@uniswap/sdk-core'
import invariant from 'tiny-invariant'

import { SupportedChainId } from './chains'

export const NATIVE_CHAIN_ID = 'NATIVE'

// When decimals are not specified for an ERC20 token
// use default ERC20 token decimals as specified here:
// https://docs.openzeppelin.com/contracts/3.x/erc20
export const DEFAULT_ERC20_DECIMALS = 18

export const USDC_FUJI = new Token(
  SupportedChainId.FUJI,
  '0xeC5bfc01218e1CA43027A987c185E94A67AeDB6D',
  18,
  'USDC',
  'USD//C'
)

export const WETH_FUJI = new Token(
  SupportedChainId.FUJI,
  '0x0F70b839BDdC6E95113cA3A51dFfC0CEd73d55a5',
  18,
  'WETH',
  'Wrapped Ether'
)

export const UNI: { [chainId: number]: Token } = {}

export const WRAPPED_NATIVE_CURRENCY: { [chainId: number]: Token | undefined } = {
  [SupportedChainId.FUJI]: new Token(
    SupportedChainId.FUJI,
    '0x1D308089a2D1Ced3f1Ce36B1FcaF815b07217be3',
    18,
    'WAVAX',
    'Wrapped AVAX'
  ),
  [SupportedChainId.MAINNET]: new Token(
    SupportedChainId.FUJI,
    '0x0F70b839BDdC6E95113cA3A51dFfC0CEd73d55a5',
    18,
    'WMATIC',
    'Wrapped MATIC'
  ),
}

class ExtendedEther extends Ether {
  public get wrapped(): Token {
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    if (wrapped) return wrapped
    throw new Error('Unsupported chain ID')
  }

  private static _cachedExtendedEther: { [chainId: number]: NativeCurrency } = {}

  public static onChain(chainId: number): ExtendedEther {
    return this._cachedExtendedEther[chainId] ?? (this._cachedExtendedEther[chainId] = new ExtendedEther(chainId))
  }
}

class FujiNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (this.chainId !== SupportedChainId.FUJI) throw new Error('Not Fuji')
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    invariant(wrapped instanceof Token)
    return wrapped
  }

  public constructor(chainId: number) {
    if (chainId !== SupportedChainId.FUJI) throw new Error('Not Fuji')
    super(chainId, 18, 'AVAX', 'Avax')
  }
}

const cachedNativeCurrency: { [chainId: number]: NativeCurrency | Token } = {}
export function nativeOnChain(chainId: number): NativeCurrency | Token {
  if (cachedNativeCurrency[chainId]) return cachedNativeCurrency[chainId]
  let nativeCurrency: NativeCurrency | Token
  if (chainId === SupportedChainId.FUJI) {
    nativeCurrency = new FujiNativeCurrency(chainId)
  } else {
    nativeCurrency = ExtendedEther.onChain(chainId)
  }
  return (cachedNativeCurrency[chainId] = nativeCurrency)
}

export const TOKEN_SHORTHANDS: { [shorthand: string]: { [chainId in SupportedChainId]?: string } } = {
  USDC: {
    [SupportedChainId.FUJI]: USDC_FUJI.address,
  },
}
