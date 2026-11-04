import type { UniverseChainId } from '@universe/chains'

// The card only needs chain + address to defer-fetch its own CurrencyInfo on hover; `symbol` is read
// as a pre-fetch analytics fallback.
export type TokenHoverCardToken = {
  chainId: UniverseChainId
  address: string
  symbol?: string
}
