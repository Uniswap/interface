import { useEffect, useState } from 'react'
import type { FeeData } from 'uniswap/src/features/positions/types'
import type { PoolData } from '~/data/pools/poolData'
import { normalizeHookForMatch } from '~/features/Liquidity/utils/normalizeHookForMatch'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'

function isSameFee(a: FeeData | undefined, b: FeeData | undefined): boolean {
  return (
    a?.feeAmount === b?.feeAmount &&
    a?.tickSpacing === b?.tickSpacing &&
    Boolean(a?.isDynamic) === Boolean(b?.isDynamic)
  )
}

/**
 * The add route's form can mount from URL tokens before `poolData` resolves (see the render guard), and
 * the provider seeds position state exactly once. Bring the hook and fee in line with the pool the route
 * names as soon as it arrives, so the hook review and the calldata key on the pool's hook rather than on
 * whatever the link carried. Applied once per pool so a later refetch can't overwrite an edit.
 */
export function useSeedPositionFromPool(poolData: PoolData | undefined): void {
  const { setPositionState } = useCreateLiquidityContext()
  const [seededPoolId, setSeededPoolId] = useState<string>()

  useEffect(() => {
    if (!poolData || poolData.idOrAddress === seededPoolId) {
      return
    }
    setSeededPoolId(poolData.idOrAddress)
    const hook = poolData.hookAddress
    setPositionState((state) => {
      const fee = poolData.feeTier ?? state.fee
      const sameHook = normalizeHookForMatch(state.hook) === normalizeHookForMatch(hook)
      return sameHook && isSameFee(state.fee, fee) ? state : { ...state, hook, fee }
    })
  }, [poolData, seededPoolId, setPositionState])
}
