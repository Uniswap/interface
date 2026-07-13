import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { PortfolioBalancePart } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { createWalletBalancesVisibilityUpdater } from 'uniswap/src/data/rest/getWalletBalances/walletBalancesVisibility'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useRestPortfolioValueModifier } from 'uniswap/src/features/dataApi/balances/balancesRest'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { useEvent } from 'utilities/src/react/hooks'

export type PoolPositionCacheUpdater = (hidden: boolean, position: PositionInfo) => void

/**
 * Optimistically mutates the cached `GetWalletBalances` entry so the Pools-tab header reflects
 * a hide/unhide before the next poll. The `modifier` is excluded from the query key (see
 * `getGetWalletBalancesQueryOptions`), so a state change does not invalidate the cache naturally —
 * this writer bridges the gap. The server reconciles on the next poll via the pool include/exclude
 * overrides written into the modifier.
 *
 * USD comes from `position.totalValueUsd` (server-provided on `pools.v1.Position`). When absent
 * the count still moves and USD reconciles on next poll.
 */
export function usePoolPositionCacheUpdater(evmAddress?: string, svmAddress?: string): PoolPositionCacheUpdater {
  const { chains: chainIds } = useEnabledChains()
  const queryClient = useQueryClient()
  const modifier = useRestPortfolioValueModifier(evmAddress ?? svmAddress)

  const writeDelta = useMemo(() => createWalletBalancesVisibilityUpdater(queryClient), [queryClient])

  return useEvent((hidden: boolean, position: PositionInfo) => {
    const valueUsd = position.totalValueUsd ?? 0
    writeDelta({
      input: { evmAddress, svmAddress, chainIds, modifier },
      deltaUsd: hidden ? -valueUsd : valueUsd,
      countDelta: hidden ? -1 : 1,
      part: PortfolioBalancePart.Pools,
      // Broad-scan: the rendered query may be chain-filtered (chainIds=[chainId])
      // while this hook reads useEnabledChains for the all-chains list. Scope the
      // write to entries that cover the position's actual chain so the chain-filter
      // view updates instead of writing to an entry the UI is not subscribed to.
      scanChainId: position.chainId,
    })
  })
}
