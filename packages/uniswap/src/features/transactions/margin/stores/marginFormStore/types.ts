import type {
  MarginDirection,
  MarginPairKey,
  MarginPaymentToken,
  MarginVenue,
} from 'uniswap/src/features/transactions/margin/types'

export interface MarginFormState {
  // Venue-free: the form picks a market pair, the server routes it over the allowlist.
  pairKey: MarginPairKey
  side: MarginDirection
  // Raw user-entered payment amount, in payment-token display units.
  marginAmount: string
  leverage: number
  isSubmitting: boolean
  // undefined = market default (collateral / native ETH).
  paymentToken?: MarginPaymentToken
  selectingPaymentToken: boolean
  // Margin-scoped, default 50. Governs both slippage configs on a quote request.
  slippageToleranceBps: number
  // Venues the user opted OUT of, across every pair. Empty = the default (see isDefaultMarginVenues).
  excludedVenues: MarginVenue[]
  // A venue the user picked on the receipt's Market row, narrowing the allowlist to it. Scoped to the
  // pair it was picked on, so changing pairs leaves it inert without a separate clear.
  pinnedVenue?: { pairKey: MarginPairKey; venue: MarginVenue }
  // In-flight plan for resume / in-flight row.
  activePlanId?: string
}

export interface MarginFormActions {
  setMarginFormState: (newState: Partial<MarginFormState>) => void
  toggleVenue: (venue: MarginVenue) => void
  // Back to the default (nothing excluded). The opt-out sheet's master switch; the per-venue rows
  // can never reach it, since the last enabled venue's toggle is locked.
  resetVenues: () => void
  reset: () => void
}

export type MarginFormStoreState = MarginFormState & { actions: MarginFormActions }
