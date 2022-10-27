import { Token } from '@kyberswap/ks-sdk-core'
import { TokenInfo, TokenList } from '@uniswap/token-lists'

import { MultiChainTokenInfo } from 'pages/Bridge/type'

import { isAddress } from '../../utils'

/**
 * Token instances created from token info on a token list.
 */

export type LiteTokenList = Omit<TokenList, 'tokens'>

export class WrappedTokenInfo extends Token {
  public readonly isNative: false = false
  public readonly isToken: true = true
  public readonly tokenInfo: TokenInfo

  public readonly isWhitelisted: boolean = false // from backend
  public readonly multichainInfo: MultiChainTokenInfo | undefined = undefined // from multichain api

  constructor(tokenInfo: TokenInfo & { isWhitelisted?: boolean; multichainInfo?: MultiChainTokenInfo }) {
    const { isWhitelisted, multichainInfo, chainId, decimals, symbol, name, address } = tokenInfo
    super(chainId, isAddress(address) || address, decimals, symbol, name)
    this.tokenInfo = tokenInfo

    if (isWhitelisted) this.isWhitelisted = isWhitelisted
    if (multichainInfo) this.multichainInfo = multichainInfo
  }

  public get logoURI(): string | undefined {
    return this.tokenInfo.logoURI
  }

  equals(other: Token): boolean {
    return other.chainId === this.chainId && other.isToken && other.address.toLowerCase() === this.address.toLowerCase()
  }

  sortsBefore(other: Token): boolean {
    if (this.equals(other)) throw new Error('Addresses should not be equal')
    return this.address.toLowerCase() < other.address.toLowerCase()
  }

  public get wrapped(): Token {
    return this
  }
}
