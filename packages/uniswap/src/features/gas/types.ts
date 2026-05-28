/**
 * The user-visible override values held in the swap settings store.
 * Translated to wire format (wei) at the API boundary.
 */
export type GasFeeOverrides = {
  maxBaseFeeGwei?: string
  priorityFeeGwei?: string
  gasLimit?: string // count
}
