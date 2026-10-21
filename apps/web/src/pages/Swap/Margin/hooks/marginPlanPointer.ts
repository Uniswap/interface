import { normalizeTokenAddressForCache } from '@universe/chains'
import type { MarginPlanIntent } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { logger } from 'utilities/src/logger/logger'

// Per-wallet localStorage pointer to the wallet's single active plan — the resume-banner source.
// All reads/writes are best-effort: a lost pointer must never brick a live plan (durable
// server-side), and this write runs while the execution lock is held, so an uncaught throw here
// (Safari private mode / quota-exceeded) would strand the lock.

function storageKey(swapper: string): string {
  return `margin.activePlan.${normalizeTokenAddressForCache(swapper)}`
}

export function getPersistedMarginPlanId(swapper: string): { planId: string; intent: MarginPlanIntent } | undefined {
  try {
    const raw = localStorage.getItem(storageKey(swapper))
    return raw ? (JSON.parse(raw) as { planId: string; intent: MarginPlanIntent }) : undefined
  } catch {
    return undefined
  }
}

export function persistPlanId({
  swapper,
  planId,
  intent,
}: {
  swapper: string
  planId: string
  intent: MarginPlanIntent
}): void {
  try {
    // One slot per wallet, so a new plan displaces whatever the slot named. That is usually right (the
    // displaced plan is terminal), but after a reload `useIsPlanInFlight` reads only the in-memory
    // store and reports false, so an open on another market can displace a plan that is still live —
    // and the banner this pointer feeds is the only resume surface. Not silently: which plan's
    // recovery should win is a product call, and this is the record that the choice was made.
    const displaced = getPersistedMarginPlanId(swapper)
    if (displaced !== undefined && displaced.planId !== planId) {
      logger.warn('marginPlanPointer', 'persistPlanId', 'Displacing an existing active-plan pointer', {
        displacedPlanId: displaced.planId,
        displacedIntent: displaced.intent,
        planId,
      })
    }
    localStorage.setItem(storageKey(swapper), JSON.stringify({ planId, intent }))
  } catch (error) {
    logger.warn('marginPlanPointer', 'persistPlanId', 'Failed to persist active plan pointer', error)
  }
}

export function clearPersistedPlanId(swapper: string): void {
  try {
    localStorage.removeItem(storageKey(swapper))
  } catch (error) {
    logger.warn('marginPlanPointer', 'clearPersistedPlanId', 'Failed to clear active plan pointer', error)
  }
}
