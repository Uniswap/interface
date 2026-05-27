import type { WatchQueryFetchPolicy } from '@apollo/client'
import type { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb.d'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import type { PollingInterval } from 'uniswap/src/constants/misc'
import { useGetPortfolioQuery } from 'uniswap/src/data/rest/getPortfolio'
import {
  PortfolioBalancePart,
  selectPortfolioBalanceBreakdown,
  selectorForPart,
  useGetWalletBalancesQuery,
  type PortfolioBalanceBreakdown,
} from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { PortfolioTotalValueResult } from 'uniswap/src/features/dataApi/balances/buildPortfolioBalance'
import { useRestPortfolioValueModifier } from 'uniswap/src/features/dataApi/balances/useRestPortfolioValueModifier'
import { mapRestStatusToNetworkStatus } from 'uniswap/src/features/dataApi/balances/utils'
import type { BaseResult } from 'uniswap/src/features/dataApi/types'
import { usePlatformBasedFetchPolicy } from 'uniswap/src/utils/usePlatformBasedFetchPolicy'
import { useEvent } from 'utilities/src/react/hooks'

type UsePortfolioBalancePartParams = {
  part: PortfolioBalancePart
  evmAddress?: Address
  svmAddress?: Address
  pollInterval?: PollingInterval
  fetchPolicy?: WatchQueryFetchPolicy
  enabled?: boolean
  chainIds?: UniverseChainId[]
}

export type UsePortfolioTotalValueParams = Omit<UsePortfolioBalancePartParams, 'part'>

type PortfolioBalanceQueryConfig = {
  portfolioPoolsBalancesEnabled: boolean
  queryInput: {
    evmAddress?: Address
    svmAddress?: Address
    chainIds: UniverseChainId[]
    modifier: ReturnType<typeof useRestPortfolioValueModifier>
  }
  // TODO(CONS-1952): Collapse to a single enabled value once PortfolioPoolsBalances is removed.
  portfolioQueryEnabled: boolean
  walletBalancesQueryEnabled: boolean
  refetchInterval: number | undefined
}

function usePortfolioBalanceQueryConfig({
  evmAddress,
  svmAddress,
  pollInterval,
  fetchPolicy,
  enabled = true,
  chainIds,
}: UsePortfolioTotalValueParams): PortfolioBalanceQueryConfig {
  const portfolioPoolsBalancesEnabled = useFeatureFlag(FeatureFlags.PortfolioPoolsBalances)
  const walletAddress = evmAddress ?? svmAddress
  const queryEnabled = !!walletAddress && enabled

  const { chains: defaultChainIds } = useEnabledChains()
  const effectiveChainIds = chainIds || defaultChainIds

  const { pollInterval: internalPollInterval } = usePlatformBasedFetchPolicy({
    fetchPolicy,
    pollInterval,
  })

  // TODO(CONS-1074): GetPortfolio REST endpoint does not yet support modifier array; it will take 1 evm/svm address, but will apply the modifications across the board
  const modifier = useRestPortfolioValueModifier(queryEnabled ? walletAddress : undefined)

  return {
    portfolioPoolsBalancesEnabled,
    queryInput: { evmAddress, svmAddress, chainIds: effectiveChainIds, modifier },
    portfolioQueryEnabled: queryEnabled && !portfolioPoolsBalancesEnabled,
    walletBalancesQueryEnabled: queryEnabled && portfolioPoolsBalancesEnabled,
    refetchInterval: internalPollInterval,
  }
}

/**
 * Canonical hook for reading a part of the wallet's portfolio value.
 */
export function usePortfolioBalancePart({
  part,
  evmAddress,
  svmAddress,
  pollInterval,
  fetchPolicy,
  enabled = true,
  chainIds,
}: UsePortfolioBalancePartParams): PortfolioTotalValueResult {
  const {
    portfolioPoolsBalancesEnabled,
    queryInput,
    portfolioQueryEnabled,
    walletBalancesQueryEnabled,
    refetchInterval,
  } = usePortfolioBalanceQueryConfig({
    evmAddress,
    svmAddress,
    pollInterval,
    fetchPolicy,
    enabled,
    chainIds,
  })

  const selectPortfolioTotalFromGetPortfolio = useEvent((portfolioData: GetPortfolioResponse | undefined) => {
    if (!portfolioData?.portfolio) {
      return undefined
    }

    const portfolio = portfolioData.portfolio

    return {
      balanceUSD: portfolio.totalValueUsd,
      percentChange: portfolio.totalValuePercentChange1d,
      absoluteChangeUSD: portfolio.totalValueAbsoluteChange1d,
    }
  })

  const portfolioResult = useGetPortfolioQuery({
    input: queryInput,
    enabled: portfolioQueryEnabled,
    refetchInterval,
    select: selectPortfolioTotalFromGetPortfolio,
  })

  const selectFromWalletBalances = useMemo(() => selectorForPart(part), [part])

  const walletBalancesResult = useGetWalletBalancesQuery({
    input: queryInput,
    enabled: walletBalancesQueryEnabled,
    refetchInterval,
    select: selectFromWalletBalances,
  })

  const active = portfolioPoolsBalancesEnabled ? walletBalancesResult : portfolioResult

  return {
    data: active.data,
    loading: active.isFetching,
    networkStatus: mapRestStatusToNetworkStatus(active.status),
    refetch: active.refetch,
    error: active.error || undefined,
    dataUpdatedAt: active.dataUpdatedAt || undefined,
  }
}

/**
 * Back-compat wrapper around `usePortfolioBalancePart` that always reads the combined total.
 * Existing consumers reach this through the `balancesRest` re-export and do not need to change.
 */
export function usePortfolioTotalValue(params: UsePortfolioTotalValueParams): PortfolioTotalValueResult {
  return usePortfolioBalancePart({ ...params, part: PortfolioBalancePart.Total })
}

export type UsePortfolioBalanceBreakdownParams = Omit<UsePortfolioBalancePartParams, 'part'>

/**
 * Reads the total, token, and pool balance slices from the shared wallet-balances query.
 */
export function usePortfolioBalanceBreakdown({
  evmAddress,
  svmAddress,
  pollInterval,
  fetchPolicy,
  enabled = true,
  chainIds,
}: UsePortfolioBalanceBreakdownParams): BaseResult<PortfolioBalanceBreakdown | undefined> {
  const { portfolioPoolsBalancesEnabled, queryInput, walletBalancesQueryEnabled, refetchInterval } =
    usePortfolioBalanceQueryConfig({
      evmAddress,
      svmAddress,
      pollInterval,
      fetchPolicy,
      enabled,
      chainIds,
    })

  const result = useGetWalletBalancesQuery({
    input: queryInput,
    enabled: walletBalancesQueryEnabled,
    refetchInterval,
    select: selectPortfolioBalanceBreakdown,
  })

  return {
    data: portfolioPoolsBalancesEnabled ? result.data : undefined,
    loading: result.isFetching,
    networkStatus: mapRestStatusToNetworkStatus(result.status),
    refetch: result.refetch,
    error: result.error || undefined,
    dataUpdatedAt: result.dataUpdatedAt || undefined,
  }
}
