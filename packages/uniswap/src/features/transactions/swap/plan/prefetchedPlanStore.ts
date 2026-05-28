import { TradingApi } from '@universe/api'
import { PlanResponse } from '@universe/api/src/clients/trading/__generated__/models/PlanResponse'
import { TradingApiSessionClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiSessionClient'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isChained } from 'uniswap/src/features/transactions/swap/utils/routing'
import { requireAcceptNewTrade } from 'uniswap/src/features/transactions/swap/utils/trade'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const PREFETCH_TTL_MS = 15 * ONE_SECOND_MS

interface PrefetchedPlan {
  promise: Promise<PlanResponse>
  trade: Trade
}

let prefetched: PrefetchedPlan | null = null
let expiryTimer: ReturnType<typeof setTimeout> | null = null

export function prefetchPlan(trade: Trade, walletExecutionContext?: TradingApi.WalletExecutionContext): void {
  if (!isChained(trade)) {
    return
  }

  // Clear any prior prefetch
  clearPrefetchedPlan()

  const promise = TradingApiSessionClient.createNewPlan({
    quote: trade.quote.quote,
    // @ts-expect-error - CHAINED is the only supported but doesn't satisfy input param type for some reason
    routing: trade.quote.routing,
    walletExecutionContext,
  })

  prefetched = { promise, trade }

  // Auto-invalidate after TTL so stale plans are never consumed
  expiryTimer = setTimeout(() => {
    if (prefetched?.promise === promise) {
      prefetched = null
    }
    expiryTimer = null
  }, PREFETCH_TTL_MS)

  // Fire-and-forget: log + clear on error
  promise.catch((error) => {
    logger.warn('prefetchedPlanStore', 'prefetchPlan', 'Prefetch failed, will fall back to normal plan creation', {
      error: error instanceof Error ? error.message : String(error),
    })
    // Only clear if this is still the active prefetch
    if (prefetched?.promise === promise) {
      prefetched = null
    }
  })
}

export async function consumePrefetchedPlan(currentTrade: Trade): Promise<PlanResponse | null> {
  // One-shot: grab and null out immediately
  const current = prefetched
  prefetched = null

  if (!current) {
    return null
  }

  // Trade drifted since prefetch — discard
  if (requireAcceptNewTrade(current.trade, currentTrade)) {
    logger.info('prefetchedPlanStore', 'consumePrefetchedPlan', 'Trade drifted since prefetch, discarding')
    return null
  }

  try {
    return await current.promise
  } catch {
    // Prefetch failed — caller will fall through to normal plan creation
    return null
  }
}

export function clearPrefetchedPlan(): void {
  prefetched = null
  if (expiryTimer) {
    clearTimeout(expiryTimer)
    expiryTimer = null
  }
}
