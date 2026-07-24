import { GraphQLApi } from '@universe/api'
import { useMemo } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type {
  PortfolioDataResult,
  PortfolioDataResultMultichain,
  UsePortfolioDataQueryOptions,
} from 'uniswap/src/features/dataApi/balances/balancesRest'
import { usePortfolioData, usePortfolioDataMultichain } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { PortfolioBalance, PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { getChainGasToken } from 'uniswap/src/features/gas/hooks/useChainGasToken'
import {
  shouldHideMultichainPortfolioRow,
  shouldHidePortfolioBalance,
} from 'uniswap/src/features/portfolio/balances/portfolioBalanceVisibility'
import {
  sortMultichainBalances,
  sortPortfolioBalances,
} from 'uniswap/src/features/portfolio/balances/sortPortfolioBalances'
import type {
  SortedPortfolioBalances,
  SortedPortfolioBalancesMultichain,
  SortedPortfolioBalancesResult,
  SortedPortfolioBalancesResultMultichain,
  UseSortedPortfolioBalancesOptions,
} from 'uniswap/src/features/portfolio/balances/types'
import { useHideSmallBalancesSetting, useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { useCurrencyIdToVisibility } from 'uniswap/src/features/transactions/selectors'
import { CurrencyId } from 'uniswap/src/types/currency'
import { areCurrencyIdsEqual, currencyId } from 'uniswap/src/utils/currencyId'

/**
 * Hook that returns portfolio data using REST API (Record<CurrencyId, PortfolioBalance>).
 */
export function usePortfolioBalances({
  evmAddress,
  svmAddress,
  chainIds,
  ...queryOptions
}: {
  evmAddress?: Address
  svmAddress?: Address
  chainIds?: UniverseChainId[]
} & UsePortfolioDataQueryOptions): PortfolioDataResult {
  return usePortfolioData({
    evmAddress,
    svmAddress,
    chainIds,
    ...queryOptions,
    skip: !(evmAddress ?? svmAddress) || Boolean(queryOptions.skip),
  })
}

/**
 * Hook that returns portfolio data using REST API in multichain format (Record<CurrencyId, PortfolioMultichainBalance>).
 * When requestMultichainFromBackend is false (default): legacy data, transformed to multichain shape on client.
 * When true: multichain data from backend (mock, already in shape).
 */
export function usePortfolioBalancesMultichain({
  evmAddress,
  svmAddress,
  chainIds,
  requestMultichainFromBackend,
  ...queryOptions
}: {
  evmAddress?: Address
  svmAddress?: Address
  chainIds?: UniverseChainId[]
  /** When true, request multichain from backend. Default false. */
  requestMultichainFromBackend?: boolean
} & UsePortfolioDataQueryOptions): PortfolioDataResultMultichain {
  return usePortfolioDataMultichain({
    evmAddress,
    svmAddress,
    chainIds,
    requestMultichainFromBackend,
    ...queryOptions,
    skip: !(evmAddress ?? svmAddress) || Boolean(queryOptions.skip),
  })
}

interface TokenOverrides {
  tokenIncludeOverrides: GraphQLApi.ContractInput[]
  tokenExcludeOverrides: GraphQLApi.ContractInput[]
}

/**
 * Portfolio value modifiers for GraphQL (visibility, small balances, spam).
 */
export function usePortfolioValueModifiers(
  addresses?: Address | Address[],
): GraphQLApi.PortfolioValueModifier[] | undefined {
  const addressArray = useMemo(
    () => (!addresses ? [] : Array.isArray(addresses) ? addresses : [addresses]),
    [addresses],
  )
  const currencyIdToTokenVisibility = useCurrencyIdToVisibility(addressArray)
  const { isTestnetModeEnabled } = useEnabledChains()

  const hideSpamTokens = useHideSpamTokensSetting()
  const hideSmallBalances = useHideSmallBalancesSetting()

  const modifiers = useMemo<GraphQLApi.PortfolioValueModifier[]>(() => {
    const { tokenIncludeOverrides, tokenExcludeOverrides } = Object.entries(currencyIdToTokenVisibility).reduce(
      (acc: TokenOverrides, [key, tokenVisibility]) => {
        const contractInput = currencyIdToContractInput(key)
        if (tokenVisibility.isVisible) {
          acc.tokenIncludeOverrides.push(contractInput)
        } else {
          acc.tokenExcludeOverrides.push(contractInput)
        }
        return acc
      },
      {
        tokenIncludeOverrides: [],
        tokenExcludeOverrides: [],
      },
    )

    return addressArray.map((addr) => ({
      ownerAddress: addr,
      tokenIncludeOverrides,
      tokenExcludeOverrides,
      includeSmallBalances: !hideSmallBalances,
      includeSpamTokens: isTestnetModeEnabled || !hideSpamTokens,
    }))
  }, [addressArray, currencyIdToTokenVisibility, hideSmallBalances, hideSpamTokens, isTestnetModeEnabled])

  return modifiers.length > 0 ? modifiers : undefined
}

/**
 * Returns portfolio balances for a given address sorted by USD value.
 */
export function useSortedPortfolioBalances(options: UseSortedPortfolioBalancesOptions): SortedPortfolioBalancesResult {
  const { evmAddress, svmAddress, pollInterval, chainIds } = options
  const { isTestnetModeEnabled } = useEnabledChains()

  const {
    data: balancesById,
    loading,
    isPending,
    isError,
    refetch,
  } = usePortfolioBalances({
    evmAddress,
    svmAddress,
    pollInterval,
    fetchPolicy: 'cache-and-network',
    chainIds,
  })

  const currencyIdArray = useMemo(() => {
    return balancesById ? Object.keys(balancesById) : []
  }, [balancesById])
  const currencyIdToTokenVisibility = useCurrencyIdToVisibility(currencyIdArray)

  const data = useMemo((): SortedPortfolioBalances | undefined => {
    if (!balancesById) {
      return { balances: [], hiddenBalances: [] }
    }
    const { shown, hidden } = Object.values(balancesById).reduce<{
      shown: PortfolioBalance[]
      hidden: PortfolioBalance[]
    }>(
      (acc, balance) => {
        const isBalanceHidden = shouldHidePortfolioBalance({
          balance,
          isTestnetModeEnabled,
          currencyIdToTokenVisibility,
        })
        if (isBalanceHidden) {
          acc.hidden.push(balance)
        } else {
          acc.shown.push(balance)
        }
        return acc
      },
      { shown: [], hidden: [] },
    )
    return {
      balances: sortPortfolioBalances({ balances: shown, isTestnetModeEnabled }),
      hiddenBalances: sortPortfolioBalances({ balances: hidden, isTestnetModeEnabled }),
    }
  }, [balancesById, isTestnetModeEnabled, currencyIdToTokenVisibility])

  return {
    data,
    loading,
    isPending,
    isError,
    refetch,
  }
}

/**
 * Returns portfolio balances for a given address sorted by USD value in multichain format.
 */
export function useSortedPortfolioBalancesMultichain(
  options: UseSortedPortfolioBalancesOptions,
): SortedPortfolioBalancesResultMultichain {
  const { evmAddress, svmAddress, pollInterval, chainIds, requestMultichainFromBackend } = options
  const { isTestnetModeEnabled } = useEnabledChains()

  const {
    data: balancesById,
    loading,
    isPending,
    isError,
    refetch,
    error,
    dataUpdatedAt,
  } = usePortfolioBalancesMultichain({
    evmAddress,
    svmAddress,
    pollInterval,
    fetchPolicy: 'cache-and-network',
    chainIds,
    requestMultichainFromBackend,
  })

  const currencyIdArray = useMemo(() => {
    return balancesById ? Object.keys(balancesById) : []
  }, [balancesById])
  const currencyIdToTokenVisibility = useCurrencyIdToVisibility(currencyIdArray)

  const data = useMemo((): SortedPortfolioBalancesMultichain | undefined => {
    if (!balancesById) {
      return undefined
    }
    const multichainList = Object.values(balancesById)
    const { shown, hidden } = multichainList.reduce<{
      shown: PortfolioMultichainBalance[]
      hidden: PortfolioMultichainBalance[]
    }>(
      (acc, balance) => {
        // oxlint-disable-next-line typescript/no-unnecessary-condition
        const tokens = balance.tokens ?? []
        if (
          shouldHideMultichainPortfolioRow({
            chainTokens: tokens,
            multichainIsHidden: balance.isHidden,
            isTestnetModeEnabled,
            currencyIdToTokenVisibility,
          })
        ) {
          acc.hidden.push(balance)
        } else {
          acc.shown.push(balance)
        }
        return acc
      },
      { shown: [], hidden: [] },
    )
    return {
      balances: sortMultichainBalances(shown, isTestnetModeEnabled),
      hiddenBalances: sortMultichainBalances(hidden, isTestnetModeEnabled),
    }
  }, [balancesById, isTestnetModeEnabled, currencyIdToTokenVisibility])

  return {
    data,
    balancesById,
    loading,
    isPending,
    isError,
    refetch,
    error,
    dataUpdatedAt,
  }
}

/**
 * Groups token balances from `balancesById` into shown vs hidden using the same visibility rules as the sorted hooks.
 */
export function useTokenBalancesGroupedByVisibility({
  balancesById,
}: {
  balancesById?: Record<string, PortfolioBalance>
}): {
  shownTokens: PortfolioBalance[] | undefined
  hiddenTokens: PortfolioBalance[] | undefined
} {
  const { isTestnetModeEnabled } = useEnabledChains()
  const currencyIdArray = useMemo(() => {
    return balancesById ? Object.keys(balancesById) : []
  }, [balancesById])

  const currencyIdToTokenVisibility = useCurrencyIdToVisibility(currencyIdArray)

  return useMemo(() => {
    if (!balancesById) {
      return { shownTokens: undefined, hiddenTokens: undefined }
    }

    const { shown, hidden } = Object.values(balancesById).reduce<{
      shown: PortfolioBalance[]
      hidden: PortfolioBalance[]
    }>(
      (acc, balance) => {
        const isBalanceHidden = shouldHidePortfolioBalance({
          balance,
          isTestnetModeEnabled,
          currencyIdToTokenVisibility,
        })

        if (isBalanceHidden) {
          acc.hidden.push(balance)
        } else {
          acc.shown.push(balance)
        }

        return acc
      },
      { shown: [], hidden: [] },
    )
    return {
      shownTokens: shown.length ? shown : undefined,
      hiddenTokens: hidden.length ? hidden : undefined,
    }
  }, [balancesById, currencyIdToTokenVisibility, isTestnetModeEnabled])
}

/**
 * Currency id to preselect from the highest-balance entry in the sorted portfolio list.
 * Prefers the native currency, then the chain's gas token, and finally falls back to the gas token of the
 * requested chainId or the default chain when no chainId is provided.
 */
export function useHighestBalanceNativeCurrencyId({
  evmAddress,
  svmAddress,
  chainId,
}: {
  evmAddress?: Address
  svmAddress?: Address
  chainId?: UniverseChainId
}): CurrencyId {
  const { data } = useSortedPortfolioBalances({ evmAddress, svmAddress })
  const { defaultChainId } = useEnabledChains()
  const balances = data?.balances ?? []

  for (const { currencyInfo } of balances) {
    if (currencyInfo.currency.isNative && (!chainId || currencyInfo.currency.chainId === chainId)) {
      return currencyInfo.currencyId
    }
  }

  for (const { currencyInfo } of balances) {
    if (
      (!chainId || currencyInfo.currency.chainId === chainId) &&
      areCurrencyIdsEqual(currencyInfo.currencyId, currencyId(getChainGasToken(currencyInfo.currency.chainId)))
    ) {
      return currencyInfo.currencyId
    }
  }

  const targetChainId = chainId ?? defaultChainId
  return currencyId(getChainGasToken(targetChainId))
}
