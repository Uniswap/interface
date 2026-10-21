import type { MarginSwapConfig } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'

// Exactly one tolerance, as a type rather than a runtime check: the wire xors the
// two, so "both" and "neither" are equally a 400 — and "neither" would leave a
// real wallet-side swap unbounded.
type MarginRailSlippage =
  | { slippageTolerance: number; autoSlippage?: never }
  | { slippageTolerance?: never; autoSlippage: string }

// The wallet-side rail as a REQUEST may carry it. Narrower than the wire type on
// purpose: `token` and `amount` are unconditional (the wire requires both on
// every key that takes a rail), the server-authored floors are absent, and the
// tolerance pair is a xor. An illegal rail does not typecheck.
export type MarginQuoteSwapConfig = {
  // What you pay with on a pay-in, and what you want back on a withdrawal — so
  // it is named in BOTH directions, never only when funding flows in.
  token: string
  // Cross-chain funding source. Meaningless without `token`, which is why the
  // type keeps them together.
  chainId?: number
  type?: 'EXACT_INPUT' | 'EXACT_OUTPUT'
  // THE equity magnitude, raw units of `token`.
  amount: string
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

// Rebuilt field by field rather than spread through: the wire rejects an
// unrecognized key outright, so a response's server-authored floors
// (minAmount/minBridgeOut) reaching a request would 400 the whole quote.
export function toRequestSwapConfig(swapConfig: MarginQuoteSwapConfig): MarginSwapConfig {
  return {
    token: swapConfig.token,
    ...(swapConfig.chainId !== undefined ? { chainId: swapConfig.chainId } : {}),
    ...(swapConfig.type ? { type: swapConfig.type } : {}),
    amount: swapConfig.amount,
    ...(swapConfig.autoSlippage !== undefined
      ? { autoSlippage: swapConfig.autoSlippage }
      : { slippageTolerance: swapConfig.slippageTolerance }),
    ...(swapConfig.protocols ? { protocols: swapConfig.protocols } : {}),
  }
}
