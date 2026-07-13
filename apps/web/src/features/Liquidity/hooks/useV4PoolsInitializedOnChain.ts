import { CHAIN_TO_ADDRESSES_MAP, Currency } from '@uniswap/sdk-core'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { useMemo } from 'react'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useReadContracts } from 'wagmi'
import { getFeeTierKey } from '~/features/Liquidity/utils/feeTiers'
import { assume0xAddress } from '~/utils/wagmi'

const STATE_VIEW_GET_SLOT0_ABI = [
  {
    type: 'function',
    name: 'getSlot0',
    stateMutability: 'view',
    inputs: [{ name: 'poolId', type: 'bytes32' }],
    outputs: [
      { name: 'sqrtPriceX96', type: 'uint160' },
      { name: 'tick', type: 'int24' },
      { name: 'protocolFee', type: 'uint24' },
      { name: 'lpFee', type: 'uint24' },
    ],
  },
] as const

interface FeeTierCandidate {
  feeAmount: number
  tickSpacing: number
  isDynamic?: boolean
}

function getV4StateViewAddress(chainId?: number): string | undefined {
  if (!chainId) {
    return undefined
  }
  return CHAIN_TO_ADDRESSES_MAP[chainId as keyof typeof CHAIN_TO_ADDRESSES_MAP]?.v4StateView
}

/**
 * Reads v4 pool initialization on-chain (`StateView.getSlot0`) for each candidate fee tier and returns
 * the set of fee-tier keys whose pool already exists (`sqrtPriceX96 != 0`).
 *
 * This mirrors the launcher's `MigratorParams.validateHook`, which rejects **any initialized** pool —
 * including abandoned, zero-liquidity pools. The indexed `listPools` data (TVL-ranked + paginated) omits
 * those, so it can't be trusted as the existing-pool gate for the CCA flow that requires a brand-new pool.
 */
export function useV4PoolsInitializedOnChain({
  chainId,
  sdkCurrencies,
  hook = ZERO_ADDRESS,
  feeTiers,
  enabled = true,
}: {
  chainId?: number
  sdkCurrencies: { TOKEN0: Maybe<Currency>; TOKEN1: Maybe<Currency> }
  hook?: string
  feeTiers: FeeTierCandidate[]
  enabled?: boolean
}): { initializedFeeTierKeys: Set<string>; isLoading: boolean; isError: boolean } {
  const { TOKEN0, TOKEN1 } = sdkCurrencies
  const stateViewAddress = getV4StateViewAddress(chainId)

  // Dynamic-fee tiers have no fixed (fee, tickSpacing) poolId, so they can't be checked this way.
  const candidates = useMemo(() => feeTiers.filter((tier) => !tier.isDynamic), [feeTiers])

  const poolIds = useMemo(() => {
    if (!TOKEN0 || !TOKEN1) {
      return []
    }
    return candidates.map((tier) => {
      try {
        return V4Pool.getPoolId(TOKEN0, TOKEN1, tier.feeAmount, tier.tickSpacing, hook)
      } catch {
        return undefined
      }
    })
  }, [TOKEN0, TOKEN1, candidates, hook])

  const queryEnabled = Boolean(enabled && stateViewAddress && TOKEN0 && TOKEN1 && candidates.length > 0)

  const {
    data,
    isLoading,
    isError: isReadError,
  } = useReadContracts({
    contracts: useMemo(
      () =>
        poolIds.map(
          (poolId) =>
            ({
              address: assume0xAddress(stateViewAddress) ?? '0x',
              abi: STATE_VIEW_GET_SLOT0_ABI,
              functionName: 'getSlot0',
              args: [assume0xAddress(poolId) ?? `0x${'0'.repeat(64)}`],
              chainId,
            }) as const,
        ),
      [poolIds, stateViewAddress, chainId],
    ),
    query: { enabled: queryEnabled },
  })

  return useMemo(() => {
    const initializedFeeTierKeys = new Set<string>()
    // Fail closed: a read error means we couldn't confirm the pool is free, so surface an
    // error/unknown state (callers keep the UI gated) rather than defaulting the tier to "available"
    // and re-exposing the InvalidHook(0) path this check exists to prevent.
    let isError = isReadError
    if (!data) {
      return { initializedFeeTierKeys, isLoading, isError }
    }
    data.forEach((entry, i) => {
      if (entry.status !== 'success') {
        isError = true
        return
      }
      const sqrtPriceX96 = entry.result[0]
      if (sqrtPriceX96 && sqrtPriceX96 !== 0n) {
        const key = getFeeTierKey({ feeTier: candidates[i].feeAmount, tickSpacing: candidates[i].tickSpacing })
        if (key) {
          initializedFeeTierKeys.add(key)
        }
      }
    })
    return { initializedFeeTierKeys, isLoading, isError }
  }, [data, isLoading, isReadError, candidates])
}
