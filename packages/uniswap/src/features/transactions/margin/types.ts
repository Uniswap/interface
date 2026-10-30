import { TradingApi } from '@universe/api'

// Shared margin primitives used by both the form store (uniswap) and the web trade surface.
// Venue-free market identity: lowercased `${collateral}-${debt}` (see marginPairKey). Role-ordered,
// so a pair's long and its short stay distinct keys. This is what the FORM speaks — a manage request
// never names a venue, and `open.venues[]` is the only place venues ride a request.
export type MarginPairKey = string

// One venue's row under a pair — `${pairKey}-${venue}`. The markets registry is keyed by this; form
// identity is not. The builder lives in the web app because it composes app-level constants, so this
// package declares the type only.
export type MarginMarketKey = string

// The five position-management actions the row overflow menu and the drawer icon row both expose.
// The user's action, not the wire shape: each one resolves to an action key through
// resolveMarginActionKey, and the execution store carries it through to the completion toast.
export type MarginManageAction = 'add' | 'withdraw' | 'leverage' | 'adjust' | 'close'

// Lending venue backing a margin market. Rides the wire and the FE market key so a pair's several
// venue rows never collide. Closed to the venues this build knows: a wire venue outside the union
// reaches the UI as a raw string through marginVenueLabel, which takes `string` for exactly that
// reason and falls back to the raw value rather than rendering blank. Keep venue reads on that path
// rather than switching exhaustively over this type.
export type MarginVenue = 'MORPHO' | 'AAVE_V3' | 'AAVE_V4' | 'COMPOUND_V3'

// Position/market direction — the generated wire enum (LONG/SHORT), re-exported as the margin
// surface's canonical direction so call sites read MarginDirection.SHORT and a renamed wire value
// fails to compile here. Absent on data predating shorts — derive from the pair's token identity
// (marginMarketDirection).
export const MarginDirection = TradingApi.MarginDirection
export type MarginDirection = TradingApi.MarginDirection

// Payment token selected to fund an open / add-collateral (native ETH = isNative).
export interface MarginPaymentToken {
  address: string
  symbol: string
  decimals: number
  isNative: boolean
  // Payment source chain (margin chain for mainnet tokens, an L2 for bridge sources).
  chainId: number
}
