import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Pair } from '@uniswap/v2-sdk'
import { Pool as V3Pool } from '@uniswap/v3-sdk'
import { Hook, HookOptions, Pool as V4Pool } from '@uniswap/v4-sdk'
import { useMemo } from 'react'
import { isPoolRejectsLiquidityError } from 'uniswap/src/features/transactions/liquidity/utils'

/**
 * True when a CreatePosition error is attributable to an existing v4 pool's hook rejecting the
 * added liquidity: the hook has the before-add-liquidity permission and the backend failed to
 * estimate gas (or returned the explicit POOL_REJECTS_LIQUIDITY reason).
 *
 * Note: hooks with the permission can still conditionally allow adds, so this only reclassifies
 * an error after the fact — it must not be used to hide or disable the form preemptively.
 */
export function useHookRejectsLiquidity({
  createError,
  creatingPoolOrPair,
  protocolVersion,
  poolOrPair,
  hook,
}: {
  createError: Error | null
  creatingPoolOrPair?: boolean
  protocolVersion: ProtocolVersion
  poolOrPair: V4Pool | V3Pool | Pair | undefined
  hook?: string
}): boolean {
  return useMemo(() => {
    if (!createError || creatingPoolOrPair || protocolVersion !== ProtocolVersion.V4) {
      return false
    }
    const hookAddress = poolOrPair instanceof V4Pool ? poolOrPair.hooks : hook
    if (!hookAddress) {
      return false
    }
    return Hook.hasPermission(hookAddress, HookOptions.BeforeAddLiquidity) && isPoolRejectsLiquidityError(createError)
  }, [createError, creatingPoolOrPair, protocolVersion, poolOrPair, hook])
}
