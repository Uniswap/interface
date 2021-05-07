import { ChainId, Token } from '@uniswap/sdk-core'
import { TokenInfo } from '@uniswap/token-lists'
import { isAddress } from '../../utils'
import { TagInfo } from './hooks'

/**
 * Token instances created from token info on a token list.
 */
export class WrappedTokenInfo implements Token {
  public readonly isEther: false = false
  public readonly isToken: true = true

  public readonly tokenInfo: TokenInfo
  public readonly tags: TagInfo[]

  constructor(tokenInfo: TokenInfo, tags: TagInfo[]) {
    this.tokenInfo = tokenInfo
    this.tags = tags
  }

  private _checksummedAddress: string | null = null

  public get address(): string {
    if (this._checksummedAddress) return this._checksummedAddress
    const checksummedAddress = isAddress(this.tokenInfo.address)
    if (!checksummedAddress) throw new Error(`Invalid token address: ${this.tokenInfo.address}`)
    return (this._checksummedAddress = checksummedAddress)
  }

  public get chainId(): ChainId | number {
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

  equals(other: Token): boolean {
    return other.chainId === this.chainId && other.address.toLowerCase() === this.address.toLowerCase()
  }

  sortsBefore(other: Token): boolean {
    if (this.equals(other)) throw new Error('Addresses should not be equal')
    return this.address.toLowerCase() < other.address.toLowerCase()
  }
}
