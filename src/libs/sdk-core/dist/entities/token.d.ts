import { ChainId } from '../constants'
import { BaseCurrency } from './baseCurrency'
/**
 * Represents an ERC20 token with a unique address and some metadata.
 */
export declare class Token extends BaseCurrency {
  readonly isEther: false
  readonly isToken: true
  readonly chainId: ChainId | number
  readonly address: string
  constructor(chainId: ChainId | number, address: string, decimals: number, symbol?: string, name?: string)
  /**
   * Returns true if the two tokens are equivalent, i.e. have the same chainId and address.
   * @param other other token to compare
   */
  equals(other: Token): boolean
  /**
   * Returns true if the address of this token sorts before the address of the other token
   * @param other other token to compare
   * @throws if the tokens have the same address
   * @throws if the tokens are on different chains
   */
  sortsBefore(other: Token): boolean
}
export declare const WETH9: {
  [chainId in ChainId]: Token
}
