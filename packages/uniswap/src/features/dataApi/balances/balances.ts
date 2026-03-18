/* eslint-disable max-lines */

import { NetworkStatus } from '@apollo/client'
import { QueryHookOptions } from '@apollo/client/react/types/types'
import { GqlResult, GraphQLApi, SpamCode } from '@universe/api'
import isEqual from 'lodash/isEqual'
import { useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type {
  PortfolioDataResult,
  PortfolioDataResultMultichain,
} from 'uniswap/src/features/dataApi/balances/balancesRest'

export type { PortfolioDataResult } from 'uniswap/src/features/dataApi/balances/balancesRest'

import { usePortfolioData, usePortfolioDataMultichain } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { sortBalancesByName } from 'uniswap/src/features/dataApi/balances/utils'
import { BaseResult, PortfolioBalance, PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { useHideSmallBalancesSetting, useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { useCurrencyIdToVisibility } from 'uniswap/src/features/transactions/selectors'
import { CurrencyId } from 'uniswap/src/types/currency'
import { currencyId } from 'uniswap/src/utils/currencyId'

export type PortfolioTotalValueResult = BaseResult<PortfolioTotalValue>

export type SortedPortfolioBalances = {
  balances: PortfolioBalance[]
  hiddenBalances: PortfolioBalance[]
}

export type SortedPortfolioBalancesMultichain = {
  balances: PortfolioMultichainBalance[]
  hiddenBalances: PortfolioMultichainBalance[]
}

export type PortfolioTotalValue = {
  balanceUSD: number | undefined
  percentChange: number | undefined
  absoluteChangeUSD: number | undefined
}

export type PortfolioCacheUpdater = (hidden: boolean, portfolioBalance?: PortfolioBalance) => void

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
} & QueryHookOptions<
  GraphQLApi.PortfolioBalancesQuery,
  GraphQLApi.PortfolioBalancesQueryVariables
>): PortfolioDataResult {
  return usePortfolioData({
    evmAddress,
    svmAddress,
    chainIds,
    ...queryOptions,
    skip: !(evmAddress ?? svmAddress) || queryOptions.skip,
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
} & QueryHookOptions<
  GraphQLApi.PortfolioBalancesQuery,
  GraphQLApi.PortfolioBalancesQueryVariables
>): PortfolioDataResultMultichain {
  return usePortfolioDataMultichain({
    evmAddress,
    svmAddress,
    chainIds,
    requestMultichainFromBackend,
    ...queryOptions,
    skip: !(evmAddress ?? svmAddress) || queryOptions.skip,
  })
}
/**
 * Returns all balances indexed by checksummed currencyId for a given address
 * @param address
 * @param queryOptions.pollInterval optional `PollingInterval` representing polling frequency.
 *  If undefined, will query once and not poll.
 * NOTE:
 *  on TokenDetails, useBalances relies on usePortfolioBalances but don't need polling versions of it.
 *  Including polling was causing multiple polling intervals to be kicked off with usePortfolioBalances.
 *  Same with on Token Selector's TokenSearchResultList, since the home screen has a usePortfolioBalances polling hook,
 *  we don't need to duplicate the polling interval when token selector is open
 * @param queryOptions - QueryHookOptions type for usePortfolioBalancesQuery to be set if not already set internally.
 */

const PORTFOLIO_BALANCE_CACHE = new Map<string, PortfolioBalance>()

export function buildPortfolioBalance(args: PortfolioBalance): PortfolioBalance {
  const cachedPortfolioBalance = PORTFOLIO_BALANCE_CACHE.get(args.cacheId)

  if (cachedPortfolioBalance && isEqual(cachedPortfolioBalance, args)) {
    // This allows us to better memoize components that use a `portfolioBalance` as a dependency.
    return cachedPortfolioBalance
  }

  PORTFOLIO_BALANCE_CACHE.set(args.cacheId, args)
  return args
}

interface TokenOverrides {
  tokenIncludeOverrides: GraphQLApi.ContractInput[]
  tokenExcludeOverrides: GraphQLApi.ContractInput[]
}

export function usePortfolioValueModifiers(
  addresses?: Address | Address[],
): GraphQLApi.PortfolioValueModifier[] | undefined {
  // Memoize array creation if passed a string to avoid recomputing at every render
  const addressArray = useMemo(
    () => (!addresses ? [] : Array.isArray(addresses) ? addresses : [addresses]),
    [addresses],
  )
  const currencyIdToTokenVisibility = useCurrencyIdToVisibility(addressArray)

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
      includeSpamTokens: !hideSpamTokens,
    }))
  }, [addressArray, currencyIdToTokenVisibility, hideSmallBalances, hideSpamTokens])

  return modifiers.length > 0 ? modifiers : undefined
}

/**
 * Returns NativeCurrency with highest balance.
 *
 * @param evmAddress to get portfolio balances for
 * @param chainId if present will only return the NativeCurrency with the highest balance for the given chainId
 * @returns CurrencyId of the NativeCurrency with highest balance, or the native address for the given chainId
 *          (or defaultChainId if no chainId is provided) when no highest balance is found
 *
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
  const currencyIdFromBalance = ((): CurrencyId | undefined => {
    const balances = data?.balances ?? []
    for (const balance of balances) {
      const currencyInfo = balance.currencyInfo
      if (currencyInfo.currency.isNative && (!chainId || currencyInfo.currency.chainId === chainId)) {
        return currencyInfo.currencyId
      }
    }
    return undefined
  })()

  if (currencyIdFromBalance) {
    return currencyIdFromBalance
  }

  // If no highest balance is found, return native address for the given chainId or defaultChainId
  const targetChainId = chainId ?? defaultChainId
  const nativeCurrency = nativeOnChain(targetChainId)
  return currencyId(nativeCurrency)
}

/**
 * Determines whether a portfolio balance should be hidden from the user interface.
 *
 * The hiding logic varies based on testnet mode and token type:
 * - **Testnet mode**: Hides tokens with high spam codes (>= SpamCode.HIGH)
 * - **Normal mode**:
 *   - Native tokens: Only hidden if manually hidden by user or visibility settings indicate hidden
 *   - Non-native tokens: Hidden based on the `isHidden` flag from the API
 *
 * @param balance - The portfolio balance to evaluate
 * @param isTestnetModeEnabled - Whether testnet mode is enabled
 * @param currencyIdToTokenVisibility - Currency ID to visibility mapping
 *
 * @returns `true` if the balance should be hidden, `false` if it should be shown
 */
function shouldHideBalance({
  balance,
  isTestnetModeEnabled,
  currencyIdToTokenVisibility,
}: {
  balance: PortfolioBalance
  isTestnetModeEnabled: boolean
  currencyIdToTokenVisibility: ReturnType<typeof useCurrencyIdToVisibility>
}): boolean {
  if (isTestnetModeEnabled) {
    if ((balance.currencyInfo.spamCode || SpamCode.LOW) >= SpamCode.HIGH) {
      return true
    } else {
      return false
    }
  } else {
    const tokenVisibility = currencyIdToTokenVisibility[balance.currencyInfo.currencyId]
    if (balance.currencyInfo.currency.isNative) {
      // Only hide native tokens that are manually hidden by user
      if ((tokenVisibility?.isVisible || !tokenVisibility) && !balance.isHidden) {
        return false
      } else {
        return true
      }
    } else {
      if (tokenVisibility?.isVisible === false) {
        return true
      } else if (tokenVisibility?.isVisible === true) {
        return false
      } else {
        // If no manual setting, fall back to API response
        return !!balance.isHidden
      }
    }
  }
}

function shouldHideMultichainBalance({
  balance,
  isTestnetModeEnabled,
  currencyIdToTokenVisibility,
}: {
  balance: PortfolioMultichainBalance
  isTestnetModeEnabled: boolean
  currencyIdToTokenVisibility: ReturnType<typeof useCurrencyIdToVisibility>
}): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const firstToken = balance.tokens?.[0]
  if (!firstToken) {
    return true
  }
  if (isTestnetModeEnabled) {
    if ((firstToken.currencyInfo.spamCode || SpamCode.LOW) >= SpamCode.HIGH) {
      return true
    }
    return false
  }
  const tokenVisibility = currencyIdToTokenVisibility[firstToken.currencyInfo.currencyId]
  if (firstToken.currencyInfo.currency.isNative) {
    if ((tokenVisibility?.isVisible || !tokenVisibility) && !balance.isHidden) {
      return false
    }
    return true
  }
  if (tokenVisibility?.isVisible === false) {
    return true
  }
  if (tokenVisibility?.isVisible === true) {
    return false
  }
  return !!balance.isHidden
}

/**
 * Sorts multichain balances by totalValueUsd desc, then by name.
 * Uses optional chaining on tokens/name to guard against malformed API data.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition -- defensive checks for malformed API data */
function sortMultichainBalances(
  balances: PortfolioMultichainBalance[],
  isTestnetModeEnabled: boolean,
): PortfolioMultichainBalance[] {
  const safeName = (b: PortfolioMultichainBalance): string => b.name ?? ''
  if (isTestnetModeEnabled) {
    const nativeBalances = balances.filter((b) => b.tokens[0] && b.tokens[0].currencyInfo.currency.isNative)
    const nonNative = balances.filter((b) => b.tokens[0] && !b.tokens[0].currencyInfo.currency.isNative)
    const sortedNative = [...nativeBalances].sort((a, b) => (b.tokens[0]?.quantity ?? 0) - (a.tokens[0]?.quantity ?? 0))
    const sortedNonNative = [...nonNative].sort((a, b) => safeName(a).localeCompare(safeName(b)))
    return [...sortedNative, ...sortedNonNative]
  }
  const withValue = balances.filter((b) => b.totalValueUsd != null && b.totalValueUsd > 0)
  const withoutValue = balances.filter((b) => !b.totalValueUsd || b.totalValueUsd === 0)
  return [
    ...withValue.sort((a, b) => (b.totalValueUsd ?? 0) - (a.totalValueUsd ?? 0)),
    ...withoutValue.sort((a, b) => safeName(a).localeCompare(safeName(b))),
  ]
}

/**
 * Custom hook to group Token Balances fetched from API to shown and hidden.
 *
 * @param balancesById - An object where keys are token ids and values are the corresponding balances. May be undefined.
 *
 * @returns {object} An object containing two fields:
 *  - `shownTokens`: shown tokens.
 *  - `hiddenTokens`: hidden tokens.
 *
 * @example
 * const { shownTokens, hiddenTokens } = useTokenBalancesGroupedByVisibility({ balancesById });
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
        const isBalanceHidden = shouldHideBalance({ balance, isTestnetModeEnabled, currencyIdToTokenVisibility })

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

type SortedPortfolioBalancesResultBase = {
  networkStatus: NetworkStatus
}
export type SortedPortfolioBalancesResult = GqlResult<SortedPortfolioBalances> & SortedPortfolioBalancesResultBase
export type SortedPortfolioBalancesResultMultichain = GqlResult<SortedPortfolioBalancesMultichain> &
  SortedPortfolioBalancesResultBase

type UseSortedPortfolioBalancesOptions = {
  evmAddress?: Address
  svmAddress?: Address
  pollInterval?: PollingInterval
  onCompleted?: () => void
  chainIds?: UniverseChainId[]
  /** When true, request multichain from backend. Default false. */
  requestMultichainFromBackend?: boolean
}

/**
 * Returns portfolio balances for a given address sorted by USD value.
 */
export function useSortedPortfolioBalances(options: UseSortedPortfolioBalancesOptions): SortedPortfolioBalancesResult {
  const { evmAddress, svmAddress, pollInterval, onCompleted, chainIds } = options
  const { isTestnetModeEnabled } = useEnabledChains()

  const {
    data: balancesById,
    loading,
    networkStatus,
    refetch,
  } = usePortfolioBalances({
    evmAddress,
    svmAddress,
    pollInterval,
    onCompleted,
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
        const isBalanceHidden = shouldHideBalance({
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
    networkStatus,
    refetch,
  }
}

/**
 * Returns portfolio balances for a given address sorted by USD value in multichain format.
 */
export function useSortedPortfolioBalancesMultichain(
  options: UseSortedPortfolioBalancesOptions,
): SortedPortfolioBalancesResultMultichain {
  const { evmAddress, svmAddress, pollInterval, onCompleted, chainIds, requestMultichainFromBackend } = options
  const { isTestnetModeEnabled } = useEnabledChains()

  const {
    data: balancesById,
    loading,
    networkStatus,
    refetch,
  } = usePortfolioBalancesMultichain({
    evmAddress,
    svmAddress,
    pollInterval,
    onCompleted,
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
      return { balances: [], hiddenBalances: [] }
    }
    const multichainList = Object.values(balancesById)
    const { shown, hidden } = multichainList.reduce<{
      shown: PortfolioMultichainBalance[]
      hidden: PortfolioMultichainBalance[]
    }>(
      (acc, balance) => {
        const isHidden = shouldHideMultichainBalance({
          balance,
          isTestnetModeEnabled,
          currencyIdToTokenVisibility,
        })
        if (isHidden) {
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
    loading,
    networkStatus,
    refetch,
  }
}

/**
 * Helper function to stable sort balances by descending balanceUSD – or native balance tokens in testnet mode –
 * followed by all other tokens sorted alphabetically
 * */
export function sortPortfolioBalances({
  balances,
  isTestnetModeEnabled,
}: {
  balances: PortfolioBalance[]
  isTestnetModeEnabled: boolean
}): PortfolioBalance[] {
  if (isTestnetModeEnabled) {
    const sortedNativeBalances = balances
      .filter((b) => b.currencyInfo.currency.isNative)
      .sort((a, b) => b.quantity - a.quantity)

    const sortedNonNativeBalances = sortBalancesByName(balances.filter((b) => !b.currencyInfo.currency.isNative))

    return [...sortedNativeBalances, ...sortedNonNativeBalances]
  }

  const balancesWithUSDValue = balances.filter((b) => b.balanceUSD)
  const balancesWithoutUSDValue = balances.filter((b) => !b.balanceUSD)

  return [
    ...balancesWithUSDValue.sort((a, b) => {
      if (!a.balanceUSD) {
        return 1
      }
      if (!b.balanceUSD) {
        return -1
      }
      return b.balanceUSD - a.balanceUSD
    }),
    ...sortBalancesByName(balancesWithoutUSDValue),
  ]
}
