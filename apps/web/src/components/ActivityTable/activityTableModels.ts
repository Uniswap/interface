/**
 * Models for activity table presentation layer.
 * These types describe table-ready data from transaction parsers, without formatting or i18n.
 * Each adapter returns raw IDs, amounts, addresses, and translation keys.
 */

/**
 * Represents the amount/token data for different transaction types
 */
type ActivityAmountModel =
  | {
      kind: 'pair'
      inputCurrencyId: string
      outputCurrencyId: string
      inputAmountRaw?: string
      outputAmountRaw?: string
    }
  | {
      kind: 'single'
      currencyId?: string
      amountRaw?: string
    }
  | {
      kind: 'approve'
      currencyId?: string
      approvalAmount?: string | 'INF'
    }
  | {
      kind: 'wrap'
      unwrapped: boolean
      amountRaw?: string
    }
  | {
      kind: 'liquidity-pair'
      currency0Id: string
      currency1Id: string
      currency0AmountRaw: string
      currency1AmountRaw?: string
    }

/**
 * Represents the type label and grouping for a transaction
 */
interface ActivityTypeLabel {
  /** Base group for filtering and icon mapping */
  baseGroup: 'swaps' | 'sent' | 'received' | 'deposits' | null
  /** Optional override translation key for custom labels (e.g., "Wrapped"/"Unwrapped") */
  overrideLabelKey?: string
}

/**
 * Complete row data fragments for a single transaction in the activity table
 */
export interface ActivityRowFragments {
  /** Amount/token data for the transaction */
  amount?: ActivityAmountModel | null
  /** Counterparty address (sender/recipient/spender) */
  counterparty?: Address | null
  /** Type label and grouping information */
  typeLabel?: ActivityTypeLabel | null
}
