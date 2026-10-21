import { useEffect, useState } from 'react'
import { MARGIN_MARKETS_REFETCH_MS } from '~/constants/margin'

/**
 * Re-renders its host once per markets-poll interval, so a mark's freshness bound keeps being
 * re-evaluated.
 *
 * `isMarketsPollStale` compares against `Date.now()`, which only advances a render. A SUCCESSFUL poll
 * re-renders subscribers on its own — but react-query stops fetching when the browser goes OFFLINE, and
 * a failing refetch eventually stops changing state too. Both are exactly when a mark ages out, so
 * without this the bound falls silent at the moment the disclosure starts to matter: the surface keeps
 * serving an aged mark and the impact row keeps reporting it as current.
 *
 * A sibling of `useMarginPositionMarkIsStale`, which carries the same ticker for the positions poll.
 * Separate because the two polls stamp different marks and neither says anything about the other's.
 */
export function useMarginMarketsStaleTick(): void {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), MARGIN_MARKETS_REFETCH_MS)
    return () => clearInterval(id)
  }, [])
}
