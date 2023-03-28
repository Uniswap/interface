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

export const USDC_TEVMOS = new Token(
  SupportedChainId.TESTNET,
  '0xBf6942D20D1460334B9b147199c4f03c97b70d02',
  6,
  'axlUSDC',
  'USD//C'
)

export const TEVMOS_STABLE_COINS = [USDC_TEVMOS.address.toLowerCase()]

export const WETH_TEVMOS = new Token(
  SupportedChainId.TESTNET,
  '0x43bDe47a34801f6aB2d66016Aef723Ba1b3A62b3',
  18,
  'axlWETH',
  'Wrapped Ether'
)

export const UNI: { [chainId: number]: Token } = {}

export const WRAPPED_NATIVE_CURRENCY: { [chainId: number]: Token | undefined } = {
  [SupportedChainId.TESTNET]: new Token(
    SupportedChainId.TESTNET,
    '0xBeFe898407483f0f2fF605971FBD8Cf8FbD8B160',
    18,
    'WtEVMOS',
    'Wrapped tEVMOS'
  ),
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

class TEvmosNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (this.chainId !== SupportedChainId.TESTNET) throw new Error('Not tEvmos')
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    invariant(wrapped instanceof Token)
    return wrapped
  }

  public constructor(chainId: number) {
    if (chainId !== SupportedChainId.TESTNET) throw new Error('Not tEvmos')
    super(chainId, 18, 'tEVMOS', 'Test Evmos')
  }
}

const cachedNativeCurrency: { [chainId: number]: NativeCurrency | Token } = {}
export function nativeOnChain(chainId: number): NativeCurrency | Token {
  if (cachedNativeCurrency[chainId]) return cachedNativeCurrency[chainId]
  let nativeCurrency: NativeCurrency | Token
  if (chainId === SupportedChainId.FUJI) {
    nativeCurrency = new FujiNativeCurrency(chainId)
  } else if (chainId === SupportedChainId.TESTNET) {
    nativeCurrency = new TEvmosNativeCurrency(chainId)
  } else {
    nativeCurrency = ExtendedEther.onChain(chainId)
  }
  return (cachedNativeCurrency[chainId] = nativeCurrency)
}

export const TOKEN_SHORTHANDS: { [shorthand: string]: { [chainId in SupportedChainId]?: string } } = {
  USDC: {
    [SupportedChainId.TESTNET]: USDC_TEVMOS.address,
    [SupportedChainId.FUJI]: USDC_FUJI.address,
  },
}
