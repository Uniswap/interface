import type { WatchQueryFetchPolicy } from '@apollo/client'
import type { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb.d'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import type { PollingInterval } from 'uniswap/src/constants/misc'
import { useGetPortfolioQuery } from 'uniswap/src/data/rest/getPortfolio'
import {
  PortfolioBalancePart,
  selectorForPart,
  useGetWalletBalancesQuery,
} from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { PortfolioTotalValueResult } from 'uniswap/src/features/dataApi/balances/buildPortfolioBalance'
import { useRestPortfolioValueModifier } from 'uniswap/src/features/dataApi/balances/useRestPortfolioValueModifier'
import { mapRestStatusToNetworkStatus } from 'uniswap/src/features/dataApi/balances/utils'
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
  const portfolioPoolsBalancesEnabled = useFeatureFlag(FeatureFlags.PortfolioPoolsBalances)

  const { chains: defaultChainIds } = useEnabledChains()
  const effectiveChainIds = chainIds || defaultChainIds

  const { pollInterval: internalPollInterval } = usePlatformBasedFetchPolicy({
    fetchPolicy,
    pollInterval,
  })

  // TODO(CONS-1074): GetPortfolio REST endpoint does not yet support modifier array; it will take 1 evm/svm address, but will apply the modifications across the board
  const modifier = useRestPortfolioValueModifier(enabled ? (evmAddress ?? svmAddress) : undefined)

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
    input: { evmAddress, svmAddress, chainIds: effectiveChainIds, modifier },
    enabled: !!(evmAddress ?? svmAddress) && enabled && !portfolioPoolsBalancesEnabled,
    refetchInterval: internalPollInterval,
    select: selectPortfolioTotalFromGetPortfolio,
  })

  const selectFromWalletBalances = useMemo(() => selectorForPart(part), [part])

  const walletBalancesResult = useGetWalletBalancesQuery({
    input: { evmAddress, svmAddress, chainIds: effectiveChainIds, modifier },
    enabled: !!(evmAddress ?? svmAddress) && enabled && portfolioPoolsBalancesEnabled,
    refetchInterval: internalPollInterval,
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
