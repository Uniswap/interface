import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TokenProtectionWarning } from 'uniswap/src/features/tokens/warnings/types'

export type SerializedTokenMap<T> = {
  [chainId: number]: {
    [address: string]: T
  }
}

export type TokenDismissInfo = SerializedToken | BasicTokenInfo

export interface TokenWarningDismissal {
  token: TokenDismissInfo
  warnings: TokenProtectionWarning[]
}

export interface BasicTokenInfo {
  chainId: UniverseChainId
  address: string
}

export function isBasicTokenInfo(x: unknown): x is BasicTokenInfo {
  return Boolean(x && typeof x === 'object' && 'chainId' in x && 'address' in x)
}

export interface SerializedToken extends BasicTokenInfo {
  decimals: number
  symbol?: string
  name?: string
}

export function isSerializedToken(t: BasicTokenInfo | SerializedToken): t is SerializedToken {
  return 'decimals' in t
}
