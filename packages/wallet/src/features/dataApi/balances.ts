import { NetworkStatus, Reference, useApolloClient, WatchQueryFetchPolicy } from '@apollo/client'
import { useCallback, useMemo } from 'react'
import {
  ContractInput,
  IAmount,
  Portfolio,
  PortfolioBalanceDocument,
  PortfolioValueModifier,
  usePortfolioBalancesQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GqlResult } from 'uniswap/src/data/types'
import { logger } from 'utilities/src/logger/logger'
import { PollingInterval } from 'wallet/src/constants/misc'
import { fromGraphQLChain } from 'wallet/src/features/chains/utils'
import { CurrencyInfo, PortfolioBalance } from 'wallet/src/features/dataApi/types'
import {
  buildCurrency,
  currencyIdToContractInput,
  usePersistedError,
} from 'wallet/src/features/dataApi/utils'
import { useAccountToTokenVisibility } from 'wallet/src/features/transactions/selectors'
import {
  useHideSmallBalancesSetting,
  useHideSpamTokensSetting,
} from 'wallet/src/features/wallet/hooks'
import { CurrencyId, currencyId } from 'wallet/src/utils/currencyId'

type SortedPortfolioBalances = {
  balances: PortfolioBalance[]
  hiddenBalances: PortfolioBalance[]
}

export type PortfolioTotalValue = {
  balanceUSD: number | undefined
  percentChange: number | undefined
  absoluteChangeUSD: number | undefined
}

export type PortfolioCacheUpdater = (hidden: boolean, portfolioBalance?: PortfolioBalance) => void

export function usePortfolioValueModifiers(
  address?: Address | Address[]
): PortfolioValueModifier[] | undefined {
  // Memoize array creation if passed a string to avoid recomputing at every render
  const addressArray = useMemo(
    () => (!address ? [] : Array.isArray(address) ? address : [address]),
    [address]
  )
  const accountToTokensVisibility = useAccountToTokenVisibility(addressArray)

  const hideSpamTokens = useHideSpamTokensSetting()
  const hideSmallBalances = useHideSmallBalancesSetting()

  const modifiers = useMemo<PortfolioValueModifier[]>(() => {
    return addressArray.map((addr) => {
      const tokenOverrides = accountToTokensVisibility[addr] || {}

      interface TokenOverrides {
        tokenIncludeOverrides: ContractInput[]
        tokenExcludeOverrides: ContractInput[]
      }

      const { tokenIncludeOverrides, tokenExcludeOverrides } = Object.entries(
        tokenOverrides
      ).reduce(
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
        }
      )

      return {
        ownerAddress: addr,
        tokenIncludeOverrides,
        tokenExcludeOverrides,
        includeSmallBalances: !hideSmallBalances,
        includeSpamTokens: !hideSpamTokens,
      }
    })
  }, [accountToTokensVisibility, addressArray, hideSmallBalances, hideSpamTokens])

  return modifiers.length > 0 ? modifiers : undefined
}

/**
 * Returns all balances indexed by checksummed currencyId for a given address
 * @param address
 * @param pollInterval optional `PollingInterval` representing polling frequency.
 *  If undefined, will query once and not poll.
 * NOTE:
 *  on TokenDetails, useBalances relies rely on usePortfolioBalances but don't need
 *  polling versions of it. Including polling was causing multiple polling intervals
 *  to be kicked off with usePortfolioBalances.
 *  Same with on Token Selector's TokenSearchResultList, since the home screen
 *  has a usePortfolioBalances polling hook, we don't need to duplicate the
 *  polling interval when token selector is open
 * @param onCompleted
 * @param fetchPolicy
 * @returns
 */
export function usePortfolioBalances({
  address,
  pollInterval,
  onCompleted,
  fetchPolicy,
}: {
  address?: Address
  pollInterval?: PollingInterval
  onCompleted?: () => void
  fetchPolicy?: WatchQueryFetchPolicy
}): GqlResult<Record<CurrencyId, PortfolioBalance>> & { networkStatus: NetworkStatus } {
  const valueModifiers = usePortfolioValueModifiers(address)
  const {
    data: balancesData,
    loading,
    networkStatus,
    refetch,
    error,
  } = usePortfolioBalancesQuery({
    fetchPolicy,
    notifyOnNetworkStatusChange: true,
    onCompleted,
    pollInterval,
    variables: address ? { ownerAddress: address, valueModifiers } : undefined,
    skip: !address,
  })

  const persistedError = usePersistedError(loading, error)
  const balancesForAddress = balancesData?.portfolios?.[0]?.tokenBalances

  const formattedData = useMemo(() => {
    if (!balancesForAddress) {
      return
    }

    const byId: Record<CurrencyId, PortfolioBalance> = {}
    balancesForAddress.forEach((balance) => {
      const {
        __typename: tokenBalanceType,
        id: tokenBalanceId,
        denominatedValue,
        token,
        tokenProjectMarket,
        quantity,
        isHidden,
      } = balance || {}
      const { address: tokenAddress, chain, decimals, symbol, project } = token || {}
      const { name, logoUrl, isSpam, safetyLevel } = project || {}
      const chainId = fromGraphQLChain(chain)

      // require all of these fields to be defined
      if (!balance || !quantity || !token) {
        return
      }

      const currency = buildCurrency({
        chainId,
        address: tokenAddress,
        decimals,
        symbol,
        name,
      })

      if (!currency) {
        return
      }

      const id = currencyId(currency)

      const currencyInfo: CurrencyInfo = {
        currency,
        currencyId: currencyId(currency),
        logoUrl,
        isSpam,
        safetyLevel,
      }

      const portfolioBalance: PortfolioBalance = {
        cacheId: `${tokenBalanceType}:${tokenBalanceId}`,
        quantity,
        balanceUSD: denominatedValue?.value,
        currencyInfo,
        relativeChange24: tokenProjectMarket?.relativeChange24?.value,
        isHidden,
      }

      byId[id] = portfolioBalance
    })

    return byId
  }, [balancesForAddress])

  const retry = useCallback(
    () => refetch({ ownerAddress: address, valueModifiers }),
    [address, valueModifiers, refetch]
  )

  return {
    data: formattedData,
    loading,
    networkStatus,
    refetch: retry,
    error: persistedError,
  }
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
  const valueModifiers = usePortfolioValueModifiers(address)
  const {
    data: balancesData,
    loading,
    networkStatus,
    refetch,
    error,
  } = usePortfolioBalancesQuery({
    fetchPolicy,
    notifyOnNetworkStatusChange: true,
    onCompleted,
    pollInterval,
    variables: address ? { ownerAddress: address, valueModifiers } : undefined,
    skip: !address,
  })

  const persistedError = usePersistedError(loading, error)
  const portfolioForAddress = balancesData?.portfolios?.[0]

  const formattedData = useMemo(() => {
    if (!portfolioForAddress) {
      return
    }

    return {
      balanceUSD: portfolioForAddress?.tokensTotalDenominatedValue?.value,
      percentChange: portfolioForAddress?.tokensTotalDenominatedValueChange?.percentage?.value,
      absoluteChangeUSD: portfolioForAddress?.tokensTotalDenominatedValueChange?.absolute?.value,
    }
  }, [portfolioForAddress])

  const retry = useCallback(
    () => refetch({ ownerAddress: address, valueModifiers }),
    [address, valueModifiers, refetch]
  )

  return {
    data: formattedData,
    loading,
    networkStatus,
    refetch: retry,
    error: persistedError,
  }
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
  return data?.balances.find((balance) => balance.currencyInfo.currency.isNative)?.currencyInfo
    .currencyId
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
  return useMemo(() => {
    if (!balancesById) {
      return { shownTokens: undefined, hiddenTokens: undefined }
    }

    const { shown, hidden } = Object.values(balancesById).reduce<{
      shown: PortfolioBalance[]
      hidden: PortfolioBalance[]
    }>(
      (acc, balance) => {
        if (balance.isHidden) {
          acc.hidden.push(balance)
        } else {
          acc.shown.push(balance)
        }
        return acc
      },
      { shown: [], hidden: [] }
    )
    return {
      shownTokens: shown.length ? shown : undefined,
      hiddenTokens: hidden.length ? hidden : undefined,
    }
  }, [balancesById])
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
  address: Address
  pollInterval?: PollingInterval
  valueModifiers?: PortfolioValueModifier[]
  onCompleted?: () => void
}): GqlResult<SortedPortfolioBalances> & { networkStatus: NetworkStatus } {
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
      balances: sortPortfolioBalances(shownTokens || []),
      hiddenBalances: sortPortfolioBalances(hiddenTokens || []),
    },
    loading,
    networkStatus,
    refetch,
  }
}

/**
 * Helper function to stable sort balances by descending balanceUSD,
 * followed by balances with null balanceUSD values sorted alphabetically
 * */
export function sortPortfolioBalances(balances: PortfolioBalance[]): PortfolioBalance[] {
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
    ...balancesWithoutUSDValue.sort((a, b) => {
      if (!a.currencyInfo.currency.name) {
        return 1
      }
      if (!b.currencyInfo.currency.name) {
        return -1
      }
      return a.currencyInfo.currency.name?.localeCompare(b.currencyInfo.currency.name)
    }),
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

  const updater = useCallback(
    (hidden: boolean, portfolioBalance?: PortfolioBalance) => {
      if (!portfolioBalance) {
        return
      }

      const cachedPortfolio = apolloClient.readQuery<{ portfolios: Portfolio[] }>({
        query: PortfolioBalanceDocument,
        variables: {
          owner: address,
        },
      })?.portfolios[0]

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
    [apolloClient, address]
  )

  return updater
}
