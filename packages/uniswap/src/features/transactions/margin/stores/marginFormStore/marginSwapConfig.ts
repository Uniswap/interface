import { TradingApi } from '@universe/api'

// The pay-in swap's wire config: only the leg's own slippage rides here now (walletToken/walletChainId
// hoisted to the envelope, amount onto the action key). Generated from the spec — SWAP-3352.
type MarginSwapConfig = TradingApi.MarginSwapConfig

// Exactly one tolerance, as a type rather than a runtime check: the wire xors the
// two, so "both" and "neither" are equally a 400 — and "neither" would leave a
// real wallet-side swap unbounded.
type MarginRailSlippage =
  | { slippageTolerance: number; autoSlippage?: never }
  | { slippageTolerance?: never; autoSlippage: string }

// The wallet-side rail as a REQUEST may carry it. Narrower than the wire type on
// purpose: `token` is unconditional, the server-authored floors are absent, and
// the tolerance pair is a xor. An illegal rail does not typecheck.
export type MarginQuoteSwapConfig = {
  // What you pay with on a pay-in, and what you want back on a withdrawal / close — so
  // it is named in BOTH directions, never only when funding flows in.
  token: string
  // Cross-chain funding source. Meaningless without `token`, which is why the
  // type keeps them together.
  chainId?: number
  type?: 'EXACT_INPUT' | 'EXACT_OUTPUT'
  // THE equity magnitude, raw units of `token`. Absent on `close`, which moves the
  // whole position and names a payout token but no amount; the builder enforces its
  // presence on the keys (MARGIN_EQUITY_ACTION_KEYS) that do carry one.
  amount?: string
  protocols?: string[]
} & MarginRailSlippage

// Percent, as both slippage configs carry it. The form stores one bps setting and
// it governs both legs — they are independent on the wire, and neither defaults
// from the other.
export function bpsToSlippagePercent(bps: number): number {
  return bps / 100
}

// The complete rail, from form state. Callers hand this straight to a request:
// there is no assembly step left that could drop `token` or leave the swap
// unbounded. `undefined` means there is no magnitude yet, not a partial rail.
export function buildMarginSwapConfig({
  token,
  chainId,
  amountRaw,
  slippageToleranceBps,
  autoSlippage,
  type,
  protocols,
}: {
  token: string
  chainId?: number
  amountRaw?: string
  slippageToleranceBps: number
  // Only when the user picked auto — it displaces the concrete percent rather
  // than riding beside it.
  autoSlippage?: string
  type?: 'EXACT_INPUT' | 'EXACT_OUTPUT'
  protocols?: string[]
}): MarginQuoteSwapConfig | undefined {
  if (!token || !amountRaw || amountRaw === '0') {
    return undefined
  }
  const base = {
    token,
    ...(chainId !== undefined ? { chainId } : {}),
    ...(type ? { type } : {}),
    amount: amountRaw,
    ...(protocols ? { protocols } : {}),
  }
  return autoSlippage !== undefined
    ? { ...base, autoSlippage }
    : { ...base, slippageTolerance: bpsToSlippagePercent(slippageToleranceBps) }
}

// The wallet-side rail split into its wire pieces. The current contract carries the pay/receive
// token and its chain at the TOP LEVEL (`walletToken`/`walletChainId`), the equity magnitude inside
// the action key (`open.amount` etc.), and leaves only the pay-in swap's own slippage on
// `swapConfig` — so the single FE rail object fans out across three wire locations. `amount` is
// returned separately because it lands on the action key, not here.
export interface MarginRailWireParts {
  walletToken: string
  walletChainId?: number
  amount?: string
  swapConfig: MarginSwapConfig
}

// `undefined` when the rail carries no concrete slippage (auto mode) — margin's wire forbids
// autoSlippage on the pay-in swap, so an auto-only rail is not a legal margin request and disables
// the quote rather than sending an unbounded swap.
export function toRailWireParts(rail: MarginQuoteSwapConfig): MarginRailWireParts | undefined {
  if (rail.slippageTolerance === undefined) {
    return undefined
  }
  return {
    walletToken: rail.token,
    ...(rail.chainId !== undefined ? { walletChainId: rail.chainId } : {}),
    ...(rail.amount !== undefined ? { amount: rail.amount } : {}),
    swapConfig: { slippageTolerance: rail.slippageTolerance },
  }
}
