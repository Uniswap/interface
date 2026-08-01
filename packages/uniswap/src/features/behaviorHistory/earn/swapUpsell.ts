import { ONE_DAY_MS } from 'utilities/src/time/time'

export interface EarnSwapUpsellTokenHistory {
  qualifyingSwapCount?: number
  interactionCount?: number
  lastInteractionAtMs?: number
  permanentlyDismissed?: boolean
  countedTransactionIds?: Record<string, true>
}

export interface EarnSwapUpsellHistory {
  byTokenCurrencyId?: Record<string, EarnSwapUpsellTokenHistory>
}

export const EARN_SWAP_UPSELL_DISPLAY_RULES = [
  { qualifyingSwapCount: 1, minTimeSinceLastInteractionMs: 0 },
  { qualifyingSwapCount: 3, minTimeSinceLastInteractionMs: 3 * ONE_DAY_MS },
  { qualifyingSwapCount: 7, minTimeSinceLastInteractionMs: 7 * ONE_DAY_MS },
] as const

export const EARN_SWAP_UPSELL_MAX_DISPLAYS = EARN_SWAP_UPSELL_DISPLAY_RULES.length

export interface EarnSwapUpsellBehaviorHistoryState {
  earnSwapUpsell?: EarnSwapUpsellHistory
}

export function getOrCreateEarnSwapUpsellTokenHistory(
  state: EarnSwapUpsellBehaviorHistoryState,
  tokenCurrencyId: string,
): EarnSwapUpsellTokenHistory {
  state.earnSwapUpsell ??= {}
  state.earnSwapUpsell.byTokenCurrencyId ??= {}
  return (state.earnSwapUpsell.byTokenCurrencyId[tokenCurrencyId] ??= {
    qualifyingSwapCount: 0,
    interactionCount: 0,
    countedTransactionIds: {},
  })
}

export function shouldShowEarnSwapUpsell({
  history,
  nowMs,
}: {
  history: EarnSwapUpsellTokenHistory | undefined
  nowMs: number
}): boolean {
  if (!history || history.permanentlyDismissed) {
    return false
  }

  const interactionCount = history.interactionCount ?? 0
  const rule = EARN_SWAP_UPSELL_DISPLAY_RULES[interactionCount]
  if (!rule) {
    return false
  }

  if ((history.qualifyingSwapCount ?? 0) < rule.qualifyingSwapCount) {
    return false
  }

  const lastInteractionAtMs = history.lastInteractionAtMs
  if (lastInteractionAtMs && nowMs - lastInteractionAtMs < rule.minTimeSinceLastInteractionMs) {
    return false
  }

  return true
}
