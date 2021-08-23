import { Currency, Token } from '@swapr/sdk'
import { Tags, TokenInfo, TokenList } from '@uniswap/token-lists'
import { getAddress } from 'ethers/lib/utils'

type TagDetails = Tags[keyof Tags]
export interface TagInfo extends TagDetails {
  id: string
}

/**
 * Token instances created from token info.
 */
export class WrappedTokenInfo extends Token {
  public readonly list: TokenList

  public readonly tokenInfo: TokenInfo

  constructor(tokenInfo: TokenInfo, list: TokenList) {
    super(tokenInfo.chainId, getAddress(tokenInfo.address), tokenInfo.decimals, tokenInfo.symbol, tokenInfo.name)
    this.tokenInfo = tokenInfo
    this.list = list
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
        id: tagId
      }
    }))
  }

  equals(other: Currency): boolean {
    return other instanceof Token && other.address.toLowerCase() === this.address.toLowerCase()
  }

  sortsBefore(other: Token): boolean {
    if (this.equals(other)) throw new Error('Addresses should not be equal')
    return this.address.toLowerCase() < other.address.toLowerCase()
  }
}
