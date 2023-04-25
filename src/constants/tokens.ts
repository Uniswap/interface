import { Currency, Ether, NativeCurrency, Token } from '@uniswap/sdk-core'
import invariant from 'tiny-invariant'

import { SupportedChainId } from './chains'

export const NATIVE_CHAIN_ID = 'NATIVE'

// When decimals are not specified for an ERC20 token
// use default ERC20 token decimals as specified here:
// https://docs.openzeppelin.com/contracts/3.x/erc20
export const DEFAULT_ERC20_DECIMALS = 18

export const USDC_EVMOS = new Token(
  SupportedChainId.MAINNET,
  '0x15C3Eb3B621d1Bff62CbA1c9536B7c1AE9149b57',
  6,
  'axlUSDC',
  'USD//C'
)

export const STEVMOS = new Token(
  SupportedChainId.MAINNET,
  '0x2C68D1d6aB986Ff4640b51e1F14C716a076E44C4',
  18,
  'stEVMOS',
  'Stride Staked Evmos'
)

export const STATOM = new Token(
  SupportedChainId.MAINNET,
  '0xB5124FA2b2cF92B2D469b249433BA1c96BDF536D',
  6,
  'stATOM',
  'Stride Staked Atom'
)

export const EVMOS_STABLE_COINS = [
  USDC_EVMOS.address.toLowerCase(),
  '0x4A2a90D444DbB7163B5861b772f882BbA394Ca67'.toLowerCase(),
  '0xe01C6D4987Fc8dCE22988DADa92d56dA701d0Fe0'.toLowerCase(),
  '0xecEEEfCEE421D8062EF8d6b4D814efe4dc898265'.toLowerCase(),
  '0x5FD55A1B9FC24967C4dB09C513C3BA0DFa7FF687'.toLowerCase(),
  '0xd567B3d7B8FE3C79a1AD8dA978812cfC4Fa05e75'.toLowerCase(),
  '0xe46910336479F254723710D57e7b683F3315b22B'.toLowerCase(),
  '0xb72A7567847abA28A2819B855D7fE679D4f59846'.toLowerCase(),
  '0x940dAAbA3F713abFabD79CdD991466fe698CBe54'.toLowerCase(),
]

export const WETH_EVMOS = new Token(
  SupportedChainId.MAINNET,
  '0x50dE24B3f0B3136C50FA8A3B8ebc8BD80a269ce5',
  18,
  'axlWETH',
  'Wrapped Ether'
)

export const UNI: { [chainId: number]: Token } = {}

export const WRAPPED_NATIVE_CURRENCY: { [chainId: number]: Token | undefined } = {
  [SupportedChainId.MAINNET]: new Token(
    SupportedChainId.MAINNET,
    '0xD4949664cD82660AaE99bEdc034a0deA8A0bd517',
    18,
    'WEVMOS',
    'Wrapped EVMOS'
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

class EvmosNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (this.chainId !== SupportedChainId.MAINNET) throw new Error('Not Evmos')
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    invariant(wrapped instanceof Token)
    return wrapped
  }

  public constructor(chainId: number) {
    if (chainId !== SupportedChainId.MAINNET) throw new Error('Not Evmos')
    super(chainId, 18, 'EVMOS', 'Evmos')
  }
}

const cachedNativeCurrency: { [chainId: number]: NativeCurrency | Token } = {}
export function nativeOnChain(chainId: number): NativeCurrency | Token {
  if (cachedNativeCurrency[chainId]) return cachedNativeCurrency[chainId]
  let nativeCurrency: NativeCurrency | Token
  if (chainId === SupportedChainId.MAINNET) {
    nativeCurrency = new EvmosNativeCurrency(chainId)
  } else {
    nativeCurrency = ExtendedEther.onChain(chainId)
  }
  return (cachedNativeCurrency[chainId] = nativeCurrency)
}

export const TOKEN_SHORTHANDS: { [shorthand: string]: { [chainId in SupportedChainId]?: string } } = {
  USDC: {
    [SupportedChainId.MAINNET]: USDC_EVMOS.address,
  },
}
