import { Currency, Token } from '@uniswap/sdk-core'
import invariant from 'tiny-invariant'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isSVMAddress } from 'utilities/src/addresses/svm/svm'

export class SolanaToken implements Token {
  readonly isNative = false
  readonly isToken = true
  readonly decimals: number
  readonly symbol?: string
  readonly name?: string
  readonly chainId: UniverseChainId
  /**
   * The contract address on the chain on which this token lives
   */
  readonly address: string

  /* SPL tokens do not have FOT taxes the way ERC20 tokens do */
  readonly buyFeeBps = undefined
  readonly sellFeeBps = undefined

  // eslint-disable-next-line max-params
  constructor(chainId: number, address: string, decimals: number, symbol?: string, name?: string) {
    if (!isSVMAddress(address)) {
      throw new Error(`Invalid SPL token address: ${address}`)
    }

    this.chainId = chainId
    this.address = address
    this.decimals = decimals
    this.symbol = symbol
    this.name = name
  }

  equals(other: Currency): boolean {
    return !other.isNative && other.address === this.address && other.chainId === this.chainId
  }

  sortsBefore(other: Token): boolean {
    invariant(this.chainId === other.chainId, 'CHAIN_IDS')
    invariant(this.address !== other.address, 'ADDRESSES')
    return this.address < other.address
  }

  get wrapped(): SolanaToken {
    return this
  }
}
