/* eslint-disable import/no-unused-modules */
import { ChainId, Currency, NativeCurrency, Token, WETH9 } from '@kinetix/sdk-core'
import invariant from 'tiny-invariant'

export const NATIVE_CHAIN_ID = 'NATIVE'

// When decimals are not specified for an ERC20 token
// use default ERC20 token decimals as specified here:
// https://docs.openzeppelin.com/contracts/3.x/erc20
export const DEFAULT_ERC20_DECIMALS = 18

export const USDT_KAVA = new Token(ChainId.KAVA, '0x919C1c267BC06a7039e03fcc2eF738525769109c', 6, 'USDt', 'TetherUSDt')

export const axlUSDC_KAVA = new Token(
  ChainId.KAVA,
  '0xEB466342C4d449BC9f53A865D5Cb90586f405215',
  6,
  'axlUSDC',
  'Axelar Wrapped USDC'
)

export const axlWBTC_KAVA = new Token(
  ChainId.KAVA,
  '0x1a35EE4640b0A3B87705B0A4B45D227Ba60Ca2ad',
  8,
  'axlWBTC',
  'Axelar Wrapped Bitcoin'
)

export const axlETH_KAVA = new Token(
  ChainId.KAVA,
  '0xb829b68f57CC546dA7E5806A929e53bE32a4625D',
  18,
  'axlETH',
  'Axelar Wrapped Ethereum'
)

export const ATOM_KAVA = new Token(ChainId.KAVA, '0x15932E26f5BD4923d46a2b205191C4b5d5f43FE3', 6, 'ATOM', 'ATOM')

export const MIM_KAVA = new Token(
  ChainId.KAVA,
  '0x471EE749bA270eb4c1165B5AD95E614947f6fCeb',
  18,
  'MIM',
  'Magic Internet Money'
)
export const WRAPPED_NATIVE_CURRENCY: { [chainId: number]: Token | undefined } = {
  ...(WETH9 as Record<ChainId, Token>),
  [ChainId.KAVA]: new Token(ChainId.KAVA, '0xc86c7C0eFbd6A49B35E8714C5f59D99De09A225b', 18, 'WKAVA', 'Wrapped KAVA'),
}

export function isKava(chainId: number): chainId is ChainId.KAVA {
  return chainId === ChainId.KAVA
}

class KavaNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isKava(this.chainId)) throw new Error('Not kava')
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    invariant(wrapped instanceof Token)
    return wrapped
  }

  public constructor(chainId: number) {
    if (!isKava(chainId)) throw new Error('Not kava')
    super(chainId, 18, 'KAVA', 'KAVA')
  }
}

const cachedNativeCurrency: { [chainId: number]: NativeCurrency | Token } = {}
export function nativeOnChain(chainId: number): NativeCurrency | Token {
  if (cachedNativeCurrency[chainId]) return cachedNativeCurrency[chainId]
  return (cachedNativeCurrency[chainId] = new KavaNativeCurrency(chainId))
}

export function getSwapCurrencyId(currency: Currency): string {
  if (currency.isToken) {
    return currency.address
  }
  return NATIVE_CHAIN_ID
}

export const TOKEN_SHORTHANDS: { [shorthand: string]: { [chainId in ChainId]?: string } } = {
  USDC: {
    [ChainId.KAVA]: axlUSDC_KAVA.address,
  },
  USDT: {
    [ChainId.KAVA]: USDT_KAVA.address,
  },
}
