import type { WatchQueryFetchPolicy } from '@apollo/client'
import type { WalletBalanceCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useMemo } from 'react'
import type { PollingInterval } from 'uniswap/src/constants/misc'
import {
  PortfolioBalancePart,
  selectPortfolioBalanceBreakdown,
  selectorForPart,
  useGetWalletBalancesQuery,
  useWalletBalancesIncludeCategories,
  type PortfolioBalanceBreakdown,
} from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { PortfolioTotalValueResult } from 'uniswap/src/features/dataApi/balances/buildPortfolioBalance'
import { useRestPortfolioValueModifier } from 'uniswap/src/features/dataApi/balances/useRestPortfolioValueModifier'
import { mapRestStatusToNetworkStatus } from 'uniswap/src/features/dataApi/balances/utils'
import type { BaseResult } from 'uniswap/src/features/dataApi/types'
import { usePlatformBasedFetchPolicy } from 'uniswap/src/utils/usePlatformBasedFetchPolicy'

type UsePortfolioBalancePartParams = {
  part: PortfolioBalancePart
  evmAddress?: Address
  svmAddress?: Address
  pollInterval?: PollingInterval
  fetchPolicy?: WatchQueryFetchPolicy
  enabled?: boolean
  /** Cache-only read: never fetches, but still re-renders when another observer updates the cached data. */
  cacheOnly?: boolean
  chainIds?: UniverseChainId[]
}

export type UsePortfolioTotalValueParams = Omit<UsePortfolioBalancePartParams, 'part'>

type PortfolioBalanceQueryConfig = {
  /** Opt-in categories sent with the request, so a missing slice can be told apart from "not requested". */
  requestedCategories: WalletBalanceCategory[]
  queryInput: {
    evmAddress?: Address
    svmAddress?: Address
    chainIds: UniverseChainId[]
    includeCategories: WalletBalanceCategory[]
    modifier: ReturnType<typeof useRestPortfolioValueModifier>
  }
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
  const includeCategories = useWalletBalancesIncludeCategories()
  const walletAddress = evmAddress ?? svmAddress
  const queryEnabled = !!walletAddress && enabled

  const { chains: defaultChainIds } = useEnabledChains()
  const effectiveChainIds = chainIds || defaultChainIds

  const { pollInterval: internalPollInterval } = usePlatformBasedFetchPolicy({
    fetchPolicy,
    pollInterval,
  })

  // Compute the modifier even when disabled: GetWalletBalances omits it from the query key, so all
  // observers share one query, and a disabled, modifier-less observer would clobber the shared queryFn —
  // dropping include/exclude overrides on option-less refetches (invalidateQueries).
  // TODO(CONS-1074): GetWalletBalances REST endpoint does not yet support modifier array; it will take 1 evm/svm address, but will apply the modifications across the board
  const modifier = useRestPortfolioValueModifier(walletAddress)

  return {
    requestedCategories: includeCategories,
    queryInput: { evmAddress, svmAddress, chainIds: effectiveChainIds, includeCategories, modifier },
    walletBalancesQueryEnabled: queryEnabled,
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
  cacheOnly,
  chainIds,
}: UsePortfolioBalancePartParams): PortfolioTotalValueResult {
  const { queryInput, walletBalancesQueryEnabled, refetchInterval } = usePortfolioBalanceQueryConfig({
    evmAddress,
    svmAddress,
    pollInterval,
    fetchPolicy,
    enabled,
    chainIds,
  })

  const selectFromWalletBalances = useMemo(() => selectorForPart(part), [part])

  const walletBalancesResult = useGetWalletBalancesQuery({
    input: queryInput,
    enabled: walletBalancesQueryEnabled,
    cacheOnly,
    refetchInterval,
    select: selectFromWalletBalances,
  })

  return {
    data: walletBalancesResult.data,
    loading: walletBalancesResult.isFetching,
    networkStatus: mapRestStatusToNetworkStatus(walletBalancesResult.status),
    refetch: walletBalancesResult.refetch,
    error: walletBalancesResult.error || undefined,
    dataUpdatedAt: walletBalancesResult.dataUpdatedAt || undefined,
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

export type UsePortfolioBalanceBreakdownResult = BaseResult<PortfolioBalanceBreakdown | undefined> & {
  /** Opt-in categories included in the request, so a missing slice can be told apart from "not requested". */
  requestedCategories: WalletBalanceCategory[]
}

/**
 * Reads the total, token, and pool balance slices from the shared wallet-balances query.
 * `requestedCategories` reports which opt-in categories were included so consumers can distinguish
 * "slice omitted because we didn't ask" from "slice unavailable from the backend".
 */
export function usePortfolioBalanceBreakdown({
  evmAddress,
  svmAddress,
  pollInterval,
  fetchPolicy,
  enabled = true,
  chainIds,
}: UsePortfolioBalanceBreakdownParams): UsePortfolioBalanceBreakdownResult {
  const { requestedCategories, queryInput, walletBalancesQueryEnabled, refetchInterval } =
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
    data: result.data,
    loading: result.isFetching,
    networkStatus: mapRestStatusToNetworkStatus(result.status),
    refetch: result.refetch,
    error: result.error || undefined,
    dataUpdatedAt: result.dataUpdatedAt || undefined,
    requestedCategories,
  }
}
