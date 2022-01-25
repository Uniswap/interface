import invariant from 'tiny-invariant'
import { Currency } from './currency'
import { Token } from './token'

/**
 * A currency is any fungible financial instrument, including Ether, all ERC20 tokens, and other chain-native currencies
 */
export abstract class BaseCurrency {
  /**
   * Returns whether the currency is native to the chain and must be wrapped (e.g. Ether)
   */
  public abstract readonly isNative: boolean
  /**
   * Returns whether the currency is a token that is usable in Uniswap without wrapping
   */
  public abstract readonly isToken: boolean

  /**
   * The chain ID on which this currency resides
   */
  public readonly chainId: number
  /**
   * The decimals used in representing currency amounts
   */
  public readonly decimals: number
  /**
   * The symbol of the currency, i.e. a short textual non-unique identifier
   */
  public readonly symbol?: string
  /**
   * The name of the currency, i.e. a descriptive textual non-unique identifier
   */
  public readonly name?: string

  /**
   * Constructs an instance of the base class `BaseCurrency`.
   * @param chainId the chain ID on which this currency resides
   * @param decimals decimals of the currency
   * @param symbol symbol of the currency
   * @param name of the currency
   */
  protected constructor(chainId: number, decimals: number, symbol?: string, name?: string) {
    invariant(Number.isSafeInteger(chainId), 'CHAIN_ID')
    invariant(decimals >= 0 && decimals < 255 && Number.isInteger(decimals), 'DECIMALS')

    this.chainId = chainId
    this.decimals = decimals
    this.symbol = symbol
    this.name = name
  }

  /**
   * Returns whether this currency is functionally equivalent to the other currency
   * @param other the other currency
   */
  public abstract equals(other: Currency): boolean

  /**
   * Return the wrapped version of this currency that can be used with the Uniswap contracts. Currencies must
   * implement this to be used in Uniswap
   */
  public abstract get wrapped(): Token
}
