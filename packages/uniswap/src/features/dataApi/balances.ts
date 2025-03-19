/* eslint-disable max-lines */
import { NetworkStatus, QueryHookOptions, Reference, useApolloClient, WatchQueryFetchPolicy } from '@apollo/client'
import isEqual from 'lodash/isEqual'
import { useCallback, useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import {
  ContractInput,
  IAmount,
  PortfolioBalancesDocument,
  PortfolioBalancesQuery,
  PortfolioBalancesQueryVariables,
  PortfolioValueModifier,
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  usePortfolioBalancesQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GqlResult, SpamCode } from 'uniswap/src/data/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import {
  buildCurrency,
  buildCurrencyInfo,
  currencyIdToContractInput,
  getCurrencySafetyInfo,
  sortByName,
  usePersistedError,
} from 'uniswap/src/features/dataApi/utils'
import { useHideSmallBalancesSetting, useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { useCurrencyIdToVisibility } from 'uniswap/src/features/transactions/selectors'
import { CurrencyId } from 'uniswap/src/types/currency'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { usePlatformBasedFetchPolicy } from 'uniswap/src/utils/usePlatformBasedFetchPolicy'
import { logger } from 'utilities/src/logger/logger'

export type SortedPortfolioBalances = {
  balances: PortfolioBalance[]
  hiddenBalances: PortfolioBalance[]
}

export type PortfolioTotalValue = {
  balanceUSD: number | undefined
  percentChange: number | undefined
  absoluteChangeUSD: number | undefined
}

export type PortfolioCacheUpdater = (hidden: boolean, portfolioBalance?: PortfolioBalance) => void

/**
 * Returns all balances indexed by checksummed currencyId for a given address
 * @param address
 * @param queryOptions.pollInterval optional `PollingInterval` representing polling frequency.
 *  If undefined, will query once and not poll.
 * NOTE:
 *  on TokenDetails, useBalances relies rely on usePortfolioBalances but don't need polling versions of it.
 *  Including polling was causing multiple polling intervals to be kicked off with usePortfolioBalances.
 *  Same with on Token Selector's TokenSearchResultList, since the home screen has a usePortfolioBalances polling hook,
 *  we don't need to duplicate the polling interval when token selector is open
 * @param queryOptions - QueryHookOptions type for usePortfolioBalancesQuery to be set if not already set internally.
 */
export function usePortfolioBalances({
  address,
  ...queryOptions
}: {
  address?: Address
} & QueryHookOptions<PortfolioBalancesQuery, PortfolioBalancesQueryVariables>): GqlResult<
  Record<CurrencyId, PortfolioBalance>
> & { networkStatus: NetworkStatus } {
  const { fetchPolicy: internalFetchPolicy, pollInterval: internalPollInterval } = usePlatformBasedFetchPolicy({
    fetchPolicy: queryOptions?.fetchPolicy,
    pollInterval: queryOptions?.pollInterval,
  })

  const valueModifiers = usePortfolioValueModifiers(address)
  const { gqlChains } = useEnabledChains()

  const {
    data: balancesData,
    loading,
    networkStatus,
    refetch,
    error,
  } = usePortfolioBalancesQuery({
    ...queryOptions,
    fetchPolicy: internalFetchPolicy,
    notifyOnNetworkStatusChange: true,
    pollInterval: internalPollInterval,
    variables: address ? { ownerAddress: address, valueModifiers, chains: gqlChains } : undefined,
    skip: !address || queryOptions?.skip,
    // Prevents wiping out the cache with partial data on error.
    errorPolicy: 'none',
  })

  const persistedError = usePersistedError(loading, error)
  const balancesForAddress = balancesData?.portfolios?.[0]?.tokenBalances

  const formattedData = useMemo(() => {
    if (!balancesForAddress) {
      return undefined
    }

    const byId: Record<CurrencyId, PortfolioBalance> = {}
    balancesForAddress.forEach((balance) => {
      if (!balance) {
        return
      }

      const {
        __typename: tokenBalanceType,
        id: tokenBalanceId,
        denominatedValue,
        token,
        tokenProjectMarket,
        quantity,
        isHidden,
      } = balance

      // require all of these fields to be defined
      if (!quantity || !token) {
        return
      }

      const { name, address: tokenAddress, chain, decimals, symbol, project, feeData, protectionInfo } = token
      const { logoUrl, isSpam, safetyLevel, spamCode } = project || {}
      const chainId = fromGraphQLChain(chain)

      const currency = buildCurrency({
        chainId,
        address: tokenAddress,
        decimals,
        symbol,
        name,
        buyFeeBps: feeData?.buyFeeBps,
        sellFeeBps: feeData?.sellFeeBps,
      })

      if (!currency) {
        return
      }

      const id = currencyId(currency)

      const currencyInfo = buildCurrencyInfo({
        currency,
        currencyId: id,
        logoUrl,
        isSpam,
        safetyInfo: getCurrencySafetyInfo(safetyLevel, protectionInfo),
        spamCode,
      })

      const portfolioBalance = buildPortfolioBalance({
        id: tokenBalanceId,
        cacheId: `${tokenBalanceType}:${tokenBalanceId}`,
        quantity,
        balanceUSD: denominatedValue?.value,
        currencyInfo,
        relativeChange24: tokenProjectMarket?.relativeChange24?.value,
        isHidden,
      })

      byId[id] = portfolioBalance
    })

    return byId
  }, [balancesForAddress])

  const retry = useCallback(
    () => refetch({ ownerAddress: address, valueModifiers }),
    [address, valueModifiers, refetch],
  )

  return {
    data: formattedData,
    loading,
    networkStatus,
    refetch: retry,
    error: persistedError,
  }
}

const PORTFOLIO_BALANCE_CACHE = new Map<string, PortfolioBalance>()

function buildPortfolioBalance(args: PortfolioBalance): PortfolioBalance {
  const cachedPortfolioBalance = PORTFOLIO_BALANCE_CACHE.get(args.cacheId)

  if (cachedPortfolioBalance && isEqual(cachedPortfolioBalance, args)) {
    // This allows us to better memoize components that use a `portfolioBalance` as a dependency.
    return cachedPortfolioBalance
  }

  PORTFOLIO_BALANCE_CACHE.set(args.cacheId, args)
  return args
}

export function usePortfolioTotalValue({
  address,
  pollInterval,
  onCompleted,
  fetchPolicy,
}: {
  address?: Address
  pollInterval?: PollingInterval
  onCompleted?: () => void
  fetchPolicy?: WatchQueryFetchPolicy
}): GqlResult<PortfolioTotalValue> & { networkStatus: NetworkStatus } {
  const { fetchPolicy: internalFetchPolicy, pollInterval: internalPollInterval } = usePlatformBasedFetchPolicy({
    fetchPolicy,
    pollInterval,
  })

  const valueModifiers = usePortfolioValueModifiers(address)
  const { gqlChains } = useEnabledChains()

  const {
    data: balancesData,
    loading,
    networkStatus,
    refetch,
    error,
  } = usePortfolioBalancesQuery({
    fetchPolicy: internalFetchPolicy,
    notifyOnNetworkStatusChange: true,
    onCompleted,
    pollInterval: internalPollInterval,
    variables: address ? { ownerAddress: address, valueModifiers, chains: gqlChains } : undefined,
    skip: !address,
    // Prevents wiping out the cache with partial data on error.
    errorPolicy: 'none',
  })

  const persistedError = usePersistedError(loading, error)
  const portfolioForAddress = balancesData?.portfolios?.[0]

  const formattedData = useMemo(() => {
    if (!portfolioForAddress) {
      return undefined
    }

    return {
      balanceUSD: portfolioForAddress?.tokensTotalDenominatedValue?.value,
      percentChange: portfolioForAddress?.tokensTotalDenominatedValueChange?.percentage?.value,
      absoluteChangeUSD: portfolioForAddress?.tokensTotalDenominatedValueChange?.absolute?.value,
    }
  }, [portfolioForAddress])

  const retry = useCallback(
    () => refetch({ ownerAddress: address, valueModifiers }),
    [address, valueModifiers, refetch],
  )

  return {
    data: formattedData,
    loading,
    networkStatus,
    refetch: retry,
    error: persistedError,
  }
}

interface TokenOverrides {
  tokenIncludeOverrides: ContractInput[]
  tokenExcludeOverrides: ContractInput[]
}

export function usePortfolioValueModifiers(addresses?: Address | Address[]): PortfolioValueModifier[] | undefined {
  // Memoize array creation if passed a string to avoid recomputing at every render
  const addressArray = useMemo(
    () => (!addresses ? [] : Array.isArray(addresses) ? addresses : [addresses]),
    [addresses],
  )
  const currencyIdToTokenVisibility = useCurrencyIdToVisibility(addressArray)

  const hideSpamTokens = useHideSpamTokensSetting()
  const hideSmallBalances = useHideSmallBalancesSetting()

  const modifiers = useMemo<PortfolioValueModifier[]>(() => {
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
 * @param address to get portfolio balances for
 * @returns CurrencyId of the NativeCurrency with highest balance
 *
 */
export function useHighestBalanceNativeCurrencyId(address: Address): CurrencyId | undefined {
  const { data } = useSortedPortfolioBalances({ address })
  return data?.balances.find((balance) => balance.currencyInfo.currency.isNative)?.currencyInfo.currencyId
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

  return useMemo(() => {
    if (!balancesById) {
      return { shownTokens: undefined, hiddenTokens: undefined }
    }

    const { shown, hidden } = Object.values(balancesById).reduce<{
      shown: PortfolioBalance[]
      hidden: PortfolioBalance[]
    }>(
      (acc, balance) => {
        const isTokenHidden = isTestnetModeEnabled
          ? (balance.currencyInfo.spamCode || SpamCode.LOW) >= SpamCode.HIGH
          : balance.isHidden

        if (isTokenHidden) {
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
  }, [balancesById, isTestnetModeEnabled])
}

/**
 * Returns portfolio balances for a given address sorted by USD value.
 *
 * @param address to get portfolio balances for
 * @param pollInterval optional polling interval for auto refresh.
 *    If undefined, query will run only once.
 * @param onCompleted callback
 * @returns SortedPortfolioBalances object with `balances` and `hiddenBalances`
 */
export function useSortedPortfolioBalances({
  address,
  pollInterval,
  onCompleted,
}: {
  address?: Address
  pollInterval?: PollingInterval
  onCompleted?: () => void
}): GqlResult<SortedPortfolioBalances> & { networkStatus: NetworkStatus } {
  const { isTestnetModeEnabled } = useEnabledChains()

  // Fetch all balances including small balances and spam tokens because we want to return those in separate arrays
  const {
    data: balancesById,
    loading,
    networkStatus,
    refetch,
  } = usePortfolioBalances({
    address,
    pollInterval,
    onCompleted,
    fetchPolicy: 'cache-and-network',
  })

  const { shownTokens, hiddenTokens } = useTokenBalancesGroupedByVisibility({ balancesById })

  return {
    data: {
      balances: sortPortfolioBalances({ balances: shownTokens || [], isTestnetModeEnabled }),
      hiddenBalances: sortPortfolioBalances({ balances: hiddenTokens || [], isTestnetModeEnabled }),
    },
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

    const sortedNonNativeBalances = sortByName(balances.filter((b) => !b.currencyInfo.currency.isNative))

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
    ...sortByName(balancesWithoutUSDValue),
  ]
}

/**
 * Creates a function to update the Apollo cache when a token is shown or hidden.
 * We manually modify the cache to avoid having to wait for the server's response,
 * so that the change is immediately reflected in the UI.
 *
 * @param address active wallet address
 * @returns a `PortfolioCacheUpdater` function that will update the Apollo cache
 */
export function usePortfolioCacheUpdater(address: string): PortfolioCacheUpdater {
  const apolloClient = useApolloClient()
  const { gqlChains } = useEnabledChains()

  const updater = useCallback(
    (hidden: boolean, portfolioBalance?: PortfolioBalance) => {
      if (!portfolioBalance) {
        return
      }

      const cachedPortfolio = apolloClient.readQuery<PortfolioBalancesQuery>({
        query: PortfolioBalancesDocument,
        variables: {
          ownerAddress: address,
          chains: gqlChains,
        },
      })?.portfolios?.[0]

      if (!cachedPortfolio) {
        return
      }

      apolloClient.cache.modify({
        id: portfolioBalance.cacheId,
        fields: {
          isHidden() {
            return hidden
          },
        },
      })

      apolloClient.cache.modify({
        id: apolloClient.cache.identify(cachedPortfolio),
        fields: {
          tokensTotalDenominatedValue(amount: Reference | IAmount, { isReference }) {
            if (isReference(amount)) {
              // I don't think this should ever happen, but this is required to keep TS happy after upgrading to @apollo/client > 3.8.
              logger.error(new Error('Unable to modify cache for `tokensTotalDenominatedValue`'), {
                tags: {
                  file: 'balances.ts',
                  function: 'usePortfolioCacheUpdater',
                },
                extra: {
                  portfolioId: apolloClient.cache.identify(cachedPortfolio),
                },
              })
              return amount
            }

            const newValue = portfolioBalance.balanceUSD
              ? hidden
                ? amount.value - portfolioBalance.balanceUSD
                : amount.value + portfolioBalance.balanceUSD
              : amount.value
            return { ...amount, value: newValue }
          },
        },
      })
    },
    [apolloClient, address, gqlChains],
  )

  return updater
}
