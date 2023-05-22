import { Ether, NativeCurrency, Token, WETH9 } from '@pollum-io/sdk-core'
import { SupportedChainId } from 'constants/chains'

import { UNI_ADDRESS } from './addresses'

export const NATIVE_CHAIN_ID = 'NATIVE'

// When decimals are not specified for an ERC20 token
// use default ERC20 token decimals as specified here:
// https://docs.openzeppelin.com/contracts/3.x/erc20
export const DEFAULT_ERC20_DECIMALS = 18

export const USDC_ROLLUX = new Token(
  SupportedChainId.ROLLUX,
  '0xdBB59E294A93487822d1d7e164609Cd59d396fb5',
  6,
  'USDC',
  'USD//C'
)
const USDC_ROLLUX_TANENBAUM = new Token(
  SupportedChainId.ROLLUX_TANENBAUM,
  '0x2Be160796F509CC4B1d76fc97494D56CF109C3f1',
  6,
  'USDC',
  'USD//C'
)
export const DAI_ROLLUX = new Token(
  SupportedChainId.ROLLUX,
  '0x5de737495Fe261cc9d6D32E00196d5e4ef43594D',
  18,
  'DAI',
  'Dai stable coin'
)
export const USDT_ROLLUX = new Token(
  SupportedChainId.ROLLUX,
  '0x4DFc340487bbec780bA8458e614b732d7226AE8f',
  6,
  'USDT',
  'Tether USD'
)
export const WBTC_ROLLUX = new Token(
  SupportedChainId.ROLLUX,
  '0x7189ae0d1F60bbb8f26bE96dF1fB97aD5e881FDD',
  8,
  'WBTC',
  'Wrapped BTC'
) // TODO: add WBTC to rollux

export const UNI: { [chainId: number]: Token } = {
  [SupportedChainId.ROLLUX]: new Token(
    SupportedChainId.ROLLUX,
    UNI_ADDRESS[SupportedChainId.ROLLUX],
    18,
    'PSYS',
    'Pegasys'
  ),
  [SupportedChainId.ROLLUX_TANENBAUM]: new Token(
    SupportedChainId.ROLLUX_TANENBAUM,
    UNI_ADDRESS[SupportedChainId.ROLLUX_TANENBAUM],
    18,
    'PSYS',
    'Pegasys'
  ),
}

export const WRAPPED_NATIVE_CURRENCY: { [chainId: number]: Token | undefined } = {
  ...(WETH9 as Record<SupportedChainId, Token>),
  [SupportedChainId.ROLLUX]: new Token(
    SupportedChainId.ROLLUX,
    '0x4200000000000000000000000000000000000006',
    18,
    'WSYS',
    'Wrapped Syscoin'
  ),
  [SupportedChainId.ROLLUX_TANENBAUM]: new Token(
    SupportedChainId.ROLLUX_TANENBAUM,
    '0x4200000000000000000000000000000000000006',
    18,
    'WSYS',
    'Wrapped Syscoin'
  ),
}

class ExtendedEther extends Ether {
  public get wrapped(): Token {
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    if (wrapped) return wrapped
    throw new Error(`Unsupported chain ID: ${this.chainId}`)
  }

  private static _cachedExtendedEther: { [chainId: number]: NativeCurrency } = {}

  public static onChain(chainId: number): ExtendedEther {
    return this._cachedExtendedEther[chainId] ?? (this._cachedExtendedEther[chainId] = new ExtendedEther(chainId))
  }
}

const cachedNativeCurrency: { [chainId: number]: NativeCurrency | Token } = {}
export function nativeOnChain(chainId: number): NativeCurrency | Token {
  if (cachedNativeCurrency[chainId]) return cachedNativeCurrency[chainId]

  const nativeCurrency: NativeCurrency | Token = ExtendedEther.onChain(chainId)
  return (cachedNativeCurrency[chainId] = nativeCurrency)
}

export const TOKEN_SHORTHANDS: { [shorthand: string]: { [chainId in SupportedChainId]?: string } } = {
  USDC: {
    [SupportedChainId.ROLLUX]: USDC_ROLLUX.address,
    [SupportedChainId.ROLLUX_TANENBAUM]: USDC_ROLLUX_TANENBAUM.address,
  },
}
