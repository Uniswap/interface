import { usePool } from 'hooks/usePools'
import { PositionInfo, PositionState } from 'pages/Pool/Positions/create/types'
import { useMemo } from 'react'

export function useDerivedPositionInfo(state: PositionState): PositionInfo {
  const pool = usePool(state.tokenInputs.TOKEN0, state.tokenInputs.TOKEN1, state.fee)[1] ?? undefined

  return useMemo(
    () => ({
      pool,
    }),
    [pool],
  )
}
