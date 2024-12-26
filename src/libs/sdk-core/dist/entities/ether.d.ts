import { BaseCurrency } from './baseCurrency'
/**
 * Represents the currency Ether
 */
export declare class Ether extends BaseCurrency {
  readonly isEther: true
  readonly isToken: false
  constructor(symbol?: string, name?: string)
  /**
   * The only instance of the class `Ether`.
   */
  static readonly ETHER: Ether
}
export declare const ETHER: Ether
