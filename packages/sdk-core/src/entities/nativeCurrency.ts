import { BaseCurrency } from './baseCurrency'

/**
 * Represents the native currency of the chain on which it resides, e.g.
 */
export abstract class NativeCurrency extends BaseCurrency {
  public readonly isNative: true = true
  public readonly isToken: false = false
}
