import { WalletBalanceCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { getUnavailableCategories } from 'uniswap/src/data/apiClients/dataApiService/balances/getWalletBalances/getWalletBalances'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioBalanceBreakdown } from 'uniswap/src/features/dataApi/balances/balancesRest'

interface UsePoolsFailedNetworksParams {
  evmAddress?: string
  svmAddress?: string
  chainId?: UniverseChainId
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
}: UsePoolsFailedNetworksParams): PoolsFailedNetworks {
  const { chains } = useEnabledChains()

  const { data: breakdown, requestedCategories } = usePortfolioBalanceBreakdown({
    evmAddress,
    svmAddress,
    chainIds: chainId ? [chainId] : undefined,
  })

  const hasResolved = breakdown !== undefined
  const rawFailedChainIds = breakdown?.failedChainIds
  const isPoolsUnavailable = getUnavailableCategories({ breakdown, requestedCategories }).includes(
    WalletBalanceCategory.POOLS,
  )

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
