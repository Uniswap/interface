import { WalletBalanceCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useMemo } from 'react'
import { getUnavailableCategories } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePortfolioBalanceBreakdown } from 'uniswap/src/features/dataApi/balances/balancesRest'

interface UsePoolsFailedNetworksParams {
  evmAddress?: string
  svmAddress?: string
  chainId?: UniverseChainId
  enabled: boolean
}

interface PoolsFailedNetworks {
  failedChainIds: UniverseChainId[]
  hasResolved: boolean
  isPoolsUnavailable: boolean
}

export function usePoolsFailedNetworks({
  evmAddress,
  svmAddress,
  chainId,
  enabled,
}: UsePoolsFailedNetworksParams): PoolsFailedNetworks {
  const { chains } = useEnabledChains()

  const { data: breakdown, requestedCategories } = usePortfolioBalanceBreakdown({
    evmAddress,
    svmAddress,
    chainIds: chainId ? [chainId] : undefined,
    enabled,
  })

  const hasResolved = enabled && breakdown !== undefined
  const rawFailedChainIds = enabled ? breakdown?.failedChainIds : undefined
  const isPoolsUnavailable =
    enabled && getUnavailableCategories({ breakdown, requestedCategories }).includes(WalletBalanceCategory.POOLS)

  return useMemo(() => {
    const enabledChainIds = new Set<number>(chains)
    const failedChainIds = (rawFailedChainIds ?? []).filter((id): id is UniverseChainId => enabledChainIds.has(id))
    return {
      failedChainIds,
      hasResolved,
      isPoolsUnavailable,
    }
  }, [rawFailedChainIds, chains, hasResolved, isPoolsUnavailable])
}
