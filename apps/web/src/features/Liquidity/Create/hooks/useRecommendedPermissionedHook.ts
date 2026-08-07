import type { ListPoolsResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { CHAIN_TO_ADDRESSES_MAP, type Currency } from '@uniswap/sdk-core'
import type { Dispatch, SetStateAction } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useGetPoolsByTokens } from 'uniswap/src/data/apiClients/dataApiService/pools/getPools'
import { usePermissionedSwapPair } from 'uniswap/src/features/permissionedTokens/usePermissionedSwapPair'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import type { PositionState } from '~/features/Liquidity/Create/types'
import { getTokenOrZeroAddress } from '~/features/Liquidity/utils/currency'

const INTEGER_STRING_REGEX = /^\d+$/

type RecommendedPermissionedHookResult = {
  recommendedHook: string | undefined
  isLoading: boolean
}

/** Canonical per-chain PermissionedHooks deployment from sdk-core, checksummed. */
function getPermissionedV4HooksAddress(chainId: number): string | undefined {
  const address = CHAIN_TO_ADDRESSES_MAP[chainId as keyof typeof CHAIN_TO_ADDRESSES_MAP]?.permissionedV4HooksAddress
  if (!address) {
    return undefined
  }
  return getValidAddress({ address, withEVMChecksum: true, platform: Platform.EVM }) ?? undefined
}

/** Deepest hooked pool wins (mirrors the mostUsedFeeTier heuristic); raw liquidity breaks TVL ties. */
function findDeepestHookedPool(data: ListPoolsResponse | undefined): string | undefined {
  if (!data) {
    return undefined
  }
  const hookedPools = data.pools.flatMap((pool) => {
    const hookAddress = pool.hooks?.address
    if (!hookAddress || hookAddress.toLowerCase() === ZERO_ADDRESS) {
      return []
    }
    const tvl = Number(pool.totalLiquidityUsd)
    return [
      {
        hookAddress,
        tvl: Number.isFinite(tvl) ? tvl : 0,
        liquidity: INTEGER_STRING_REGEX.test(pool.liquidity) ? BigInt(pool.liquidity) : 0n,
      },
    ]
  })
  if (hookedPools.length === 0) {
    return undefined
  }
  const best = hookedPools.reduce((a, b) => {
    if (a.tvl !== b.tvl) {
      return a.tvl > b.tvl ? a : b
    }
    return a.liquidity >= b.liquidity ? a : b
  }, hookedPools[0])
  return (
    getValidAddress({ address: best.hookAddress, withEVMChecksum: true, platform: Platform.EVM }) ?? best.hookAddress
  )
}

/**
 * Discovers the recommended v4 hook for a permissioned token pair from the existing pools
 * (ECO-577). Interim registry-free approach until the backend serves `recommendedHook` on
 * the CheckPermissions response; swap this query out once that field ships.
 *
 * The v4 pools hold the permissioned adapter (PA) token, not the sec-token the user selected,
 * so discovery maps each permissioned side to its adapter before querying. Verified live:
 * ListPools returns nothing for the underlying pair and requires sorted token order.
 *
 * When discovery settles empty — no v4 pool for the pair yet, none hooked, or the query
 * errored — falls back to the canonical per-chain PermissionedHooks address from sdk-core
 * so the first-ever pool of a permissioned pair still gets a recommendation.
 */
export function useRecommendedPermissionedHook({
  tokenA,
  tokenB,
  enabled = true,
}: {
  tokenA: Maybe<Currency>
  tokenB: Maybe<Currency>
  enabled?: boolean
}): RecommendedPermissionedHookResult {
  const activeAddress = useActiveAddress(Platform.EVM)

  const {
    isPermissioned,
    isLoading: isPermissionsLoading,
    inputAdapterAddress,
    outputAdapterAddress,
  } = usePermissionedSwapPair({
    inputCurrency: tokenA ?? undefined,
    outputCurrency: tokenB ?? undefined,
    walletAddress: activeAddress ?? undefined,
  })

  const sameChain = !!tokenA && !!tokenB && tokenA.chainId === tokenB.chainId
  const addressA = (inputAdapterAddress ?? getTokenOrZeroAddress(tokenA))?.toLowerCase()
  const addressB = (outputAdapterAddress ?? getTokenOrZeroAddress(tokenB))?.toLowerCase()
  const [sorted0, sorted1] = addressA && addressB && addressA > addressB ? [addressB, addressA] : [addressA, addressB]

  const shouldFetch = enabled && isPermissioned && sameChain && !!sorted0 && !!sorted1 && sorted0 !== sorted1
  // No `hooks` filter: the point is discovering which hook the existing pool uses.
  const {
    data,
    isLoading: isPoolsLoading,
    isError: isPoolsError,
  } = useGetPoolsByTokens(
    {
      chainId: tokenA?.chainId,
      protocolVersions: [ProtocolVersion.V4],
      token0: sorted0,
      token1: sorted1,
    },
    shouldFetch,
  )

  const chainId = tokenA?.chainId
  const recommendedHook = useMemo(() => {
    if (!shouldFetch) {
      return undefined
    }
    const discovered = findDeepestHookedPool(data)
    if (discovered) {
      return discovered
    }
    // Last-resort fallback: discovery settled empty (query succeeded with no hooked pools, or
    // errored), so recommend the canonical deployment. Never applied while the query is loading —
    // an existing pool's hook must win.
    const settledEmpty = !isPoolsLoading && (data !== undefined || isPoolsError)
    if (!settledEmpty || chainId === undefined) {
      return undefined
    }
    return getPermissionedV4HooksAddress(chainId)
  }, [shouldFetch, data, isPoolsLoading, isPoolsError, chainId])

  return {
    recommendedHook,
    isLoading: (enabled && isPermissionsLoading) || (shouldFetch && isPoolsLoading),
  }
}

/**
 * Prefills the create-position hook field with the recommended permissioned hook so users
 * don't need to know the hook address in advance (ECO-577). Mirrors the mostUsedFeeTier
 * auto-select pattern in SelectTokensStep.
 *
 * - Skipped when a hook is already set or supplied via `?hook=` (integrator contract preserved).
 * - Applied at most once per token-pair identity, so the user can clear the suggestion
 *   without the effect fighting them; changing either token re-arms it.
 * - `userApprovedHook` is intentionally NOT set: the HookModal review still gates Continue,
 *   matching the `?hook=` path.
 */
export function useRecommendedHookPrefill({
  tokenA,
  tokenB,
  protocolVersion,
  hook,
  urlHook,
  setPositionState,
}: {
  tokenA: Maybe<Currency>
  tokenB: Maybe<Currency>
  protocolVersion: ProtocolVersion
  hook: string | undefined
  urlHook: string | null | undefined
  setPositionState: Dispatch<SetStateAction<PositionState>>
}): void {
  const [prefilledPairKey, setPrefilledPairKey] = useState<string | undefined>(undefined)
  const pairKey = tokenA && tokenB ? `${currencyId(tokenA)}|${currencyId(tokenB)}` : undefined

  const enabled =
    protocolVersion === ProtocolVersion.V4 && !hook && !urlHook && !!pairKey && prefilledPairKey !== pairKey
  const { recommendedHook } = useRecommendedPermissionedHook({ tokenA, tokenB, enabled })

  useEffect(() => {
    if (!enabled || !recommendedHook || !pairKey) {
      return
    }
    setPrefilledPairKey(pairKey)
    // Reset fee like a user-selected hook (AddHook.onSelectHook) so the fee-tier auto-select
    // re-runs against the hooked pools. Syncs to the URL via the provider's existing effect,
    // which is what flips AddHook into its filled display state.
    setPositionState((state) => ({ ...state, hook: recommendedHook, fee: undefined }))
  }, [enabled, recommendedHook, pairKey, setPositionState])
}
