import type { AdjustFunding } from '~/pages/Swap/Margin/hooks/useMarginQuote'
import { type AdjustLeverageMode, hasAdjustChange } from '~/pages/Swap/Margin/marginAdjustPositionGate'

export type MarginAdjustCtaKind = 'noChange' | 'deposit' | 'withdraw' | 'leverage'

// Which action the Adjust-position CTA names. Funding wins over leverage: someone about to part with
// funds has to read that on the button rather than infer it, so 'leverage' is reachable only when
// nothing moves in or out. The leverage threshold is hasAdjustChange's own, so the label can never
// claim a change the quote gate would reject.
export function getMarginAdjustCtaKind({
  funding,
  mode,
  currentLeverage,
}: {
  funding: AdjustFunding
  mode: AdjustLeverageMode
  currentLeverage: number
}): MarginAdjustCtaKind {
  if (funding.kind === 'deposit') {
    return 'deposit'
  }
  if (funding.kind === 'withdraw') {
    return 'withdraw'
  }
  return hasAdjustChange({ funding, mode, currentLeverage }) ? 'leverage' : 'noChange'
}
