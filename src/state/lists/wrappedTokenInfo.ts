import { Token } from '@kyberswap/ks-sdk-core'
import { Tags, TokenInfo, TokenList } from '@uniswap/token-lists'

import { isAddress } from '../../utils'

type TagDetails = Tags[keyof Tags]
interface TagInfo extends TagDetails {
  id: string
}
/**
 * Token instances created from token info on a token list.
 */

export type LiteTokenList = Omit<TokenList, 'tokens'>

const LIST_DEFAULT = {
  name: '',
  timestamp: '',
  version: { major: 0, minor: 0, patch: 0 },
  keywords: [],
  tags: [] as unknown as Tags,
  logoURI: '',
}

export class WrappedTokenInfo extends Token {
  public readonly isNative: false = false
  public readonly isToken: true = true
  public readonly list: LiteTokenList
  public readonly isWhitelisted: boolean = false

  public readonly tokenInfo: TokenInfo

  constructor(tokenInfo: TokenInfo & { isWhitelisted?: boolean }, list: LiteTokenList = LIST_DEFAULT) {
    super(
      tokenInfo.chainId,
      isAddress(tokenInfo.address) || tokenInfo.address,
      tokenInfo.decimals,
      tokenInfo.symbol,
      tokenInfo.name,
    )
    this.tokenInfo = tokenInfo
    if (tokenInfo.isWhitelisted) this.isWhitelisted = tokenInfo.isWhitelisted
    const { name, timestamp, version, keywords, tags, logoURI } = list
    this.list = { name, timestamp, version, keywords, tags, logoURI }
  }

  public get logoURI(): string | undefined {
    return this.tokenInfo.logoURI
  }

  private _tags: TagInfo[] | null = null
  public get tags(): TagInfo[] {
    if (this._tags !== null) return this._tags
    if (!this.tokenInfo.tags) return (this._tags = [])
    const listTags = this.list.tags
    if (!listTags) return (this._tags = [])

    return (this._tags = this.tokenInfo.tags.map(tagId => {
      return {
        ...listTags[tagId],
        id: tagId,
      }
    }))
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
