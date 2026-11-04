import { useEffect, useState } from 'react'
import { MARGIN_ACTIVE_POSITION_STATUSES } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { useMarginPositionsQuery } from 'uniswap/src/data/apiClients/tradingApi/useMarginPositionsQuery'
import { useAccount } from '~/connection/hooks/useAccount'
import { MARGIN_CHAIN_ID, MARGIN_POSITIONS_REFETCH_MS } from '~/constants/margin'
import { isMarkStale } from '~/features/margin/utils/marginFormat'

// Whether the mark a POSITION carries has aged out. `oraclePrice` is stamped by the positions poll, so
// a surface measuring against it tracks THAT poll — the markets poll stamps market marks and says
// nothing about this one.
export function useMarginPositionMarkIsStale(): boolean {
  const account = useAccount()
  const { dataUpdatedAt } = useMarginPositionsQuery({
    params: account.address
      ? { swapper: account.address, chainId: MARGIN_CHAIN_ID, statuses: MARGIN_ACTIVE_POSITION_STATUSES }
      : undefined,
    refetchInterval: MARGIN_POSITIONS_REFETCH_MS,
  })
  // The threshold is time-derived, so it needs something to re-evaluate it. A successful poll re-renders
  // subscribers on its own — but react-query stops fetching when the browser goes OFFLINE, and offline is
  // exactly when a mark ages out. Without this the observer falls silent at the moment the disclosure
  // starts to matter and the sheet keeps showing an aged mark as if it were current.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), MARGIN_POSITIONS_REFETCH_MS)
    return () => clearInterval(id)
  }, [])
  return isMarkStale({ updatedAt: dataUpdatedAt, now: Date.now(), refetchMs: MARGIN_POSITIONS_REFETCH_MS })
}
