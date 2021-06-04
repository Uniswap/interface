import { Currency, Token } from '@uniswap/sdk-core'
import { Tags, TokenInfo } from '@uniswap/token-lists'
import { TokenList } from '@uniswap/token-lists/dist/types'
import { isAddress } from '../../utils'

type TagDetails = Tags[keyof Tags]
export interface TagInfo extends TagDetails {
  id: string
}
/**
 * Token instances created from token info on a token list.
 */
export class WrappedTokenInfo implements Token {
  public readonly isNative: false = false
  public readonly isToken: true = true
  public readonly list: TokenList

  public readonly tokenInfo: TokenInfo

  constructor(tokenInfo: TokenInfo, list: TokenList) {
    this.tokenInfo = tokenInfo
    this.list = list
  }

  private _checksummedAddress: string | null = null

  public get address(): string {
    if (this._checksummedAddress) return this._checksummedAddress
    const checksummedAddress = isAddress(this.tokenInfo.address)
    if (!checksummedAddress) throw new Error(`Invalid token address: ${this.tokenInfo.address}`)
    return (this._checksummedAddress = checksummedAddress)
  }

  public get chainId(): number {
    return this.tokenInfo.chainId
  }

  public get decimals(): number {
    return this.tokenInfo.decimals
  }

  public get name(): string {
    return this.tokenInfo.name
  }

  public get symbol(): string {
    return this.tokenInfo.symbol
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

    return (this._tags = this.tokenInfo.tags.map((tagId) => {
      return {
        ...listTags[tagId],
        id: tagId,
      }
    }))
  }

  equals(other: Currency): boolean {
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
