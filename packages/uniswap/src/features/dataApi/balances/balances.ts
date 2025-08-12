/* eslint-disable max-lines */
import { NetworkStatus, Reference, WatchQueryFetchPolicy, useApolloClient } from '@apollo/client'
import { QueryHookOptions } from '@apollo/client/react/types/types'
import isEqual from 'lodash/isEqual'
import { useCallback, useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
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
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import {
  useRESTPortfolioData,
  useRESTPortfolioTotalValue,
  useRestPortfolioCacheUpdater,
} from 'uniswap/src/features/dataApi/balances/balancesRest'
import { sortBalancesByName } from 'uniswap/src/features/dataApi/balances/utils'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import { usePersistedError } from 'uniswap/src/features/dataApi/utils/usePersistedError'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useHideSmallBalancesSetting, useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { useCurrencyIdToVisibility } from 'uniswap/src/features/transactions/selectors'
import { CurrencyId } from 'uniswap/src/types/currency'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { usePlatformBasedFetchPolicy } from 'uniswap/src/utils/usePlatformBasedFetchPolicy'
import { logger } from 'utilities/src/logger/logger'

interface BaseResult<T> {
  data?: T
  loading: boolean
  networkStatus: NetworkStatus
  refetch: () => void
  error?: Error
}

export type PortfolioDataResult = BaseResult<Record<CurrencyId, PortfolioBalance>>
export type PortfolioTotalValueResult = BaseResult<PortfolioTotalValue>

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
 * Factory hook that returns portfolio data based on the active data source (GraphQL or REST)
 */
export function usePortfolioBalances({
  address,
  ...queryOptions
}: {
  address?: Address
} & QueryHookOptions<PortfolioBalancesQuery, PortfolioBalancesQueryVariables>): PortfolioDataResult {
  const isRestEnabled = useFeatureFlag(FeatureFlags.GqlToRestBalances)

  const graphqlResult = useGraphQLPortfolioData({
    address,
    ...queryOptions,
    skip: isRestEnabled || queryOptions.skip,
  })

  const restResult = useRESTPortfolioData({
    evmAddress: address || '',
    ...queryOptions,
    skip: !address || !isRestEnabled || queryOptions.skip,
  })

  const result = isRestEnabled ? restResult : graphqlResult

  return result
}
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
export function useGraphQLPortfolioData({
  address,
  ...queryOptions
}: {
  address?: Address
} & QueryHookOptions<PortfolioBalancesQuery, PortfolioBalancesQueryVariables>): PortfolioDataResult {
  const { fetchPolicy: internalFetchPolicy, pollInterval: internalPollInterval } = usePlatformBasedFetchPolicy({
    fetchPolicy: queryOptions.fetchPolicy,
    pollInterval: queryOptions.pollInterval,
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
    skip: !address || queryOptions.skip,
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

export function buildPortfolioBalance(args: PortfolioBalance): PortfolioBalance {
  const cachedPortfolioBalance = PORTFOLIO_BALANCE_CACHE.get(args.cacheId)

  if (cachedPortfolioBalance && isEqual(cachedPortfolioBalance, args)) {
    // This allows us to better memoize components that use a `portfolioBalance` as a dependency.
    return cachedPortfolioBalance
  }

  PORTFOLIO_BALANCE_CACHE.set(args.cacheId, args)
  return args
}

/**
 * GraphQL implementation for fetching portfolio total value
 * @deprecated - TODO(WALL-6790): remove once rest migration is complete
 */
export function useGraphQLPortfolioTotalValue({
  address,
  pollInterval,
  fetchPolicy,
  enabled = true,
}: {
  address?: Address
  pollInterval?: PollingInterval
  fetchPolicy?: WatchQueryFetchPolicy
  enabled?: boolean
}): PortfolioTotalValueResult {
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
    pollInterval: internalPollInterval,
    variables: address ? { ownerAddress: address, valueModifiers, chains: gqlChains } : undefined,
    skip: !address || !enabled,
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
      balanceUSD: portfolioForAddress.tokensTotalDenominatedValue?.value,
      percentChange: portfolioForAddress.tokensTotalDenominatedValueChange?.percentage?.value,
      absoluteChangeUSD: portfolioForAddress.tokensTotalDenominatedValueChange?.absolute?.value,
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

/**
 * Factory hook that returns portfolio total value based on the active data source (GraphQL or REST)
 */
export function usePortfolioTotalValue({
  address,
  pollInterval,
  fetchPolicy,
}: {
  address?: Address
  pollInterval?: PollingInterval
  fetchPolicy?: WatchQueryFetchPolicy
}): PortfolioTotalValueResult {
  const isRestEnabled = useFeatureFlag(FeatureFlags.GqlToRestBalances)

  const graphqlResult = useGraphQLPortfolioTotalValue({
    address,
    pollInterval,
    fetchPolicy,
    enabled: !isRestEnabled,
  })

  const restResult = useRESTPortfolioTotalValue({
    address,
    pollInterval,
    fetchPolicy,
    enabled: isRestEnabled,
  })

  return isRestEnabled ? restResult : graphqlResult
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
 * @param chainId if present will only return the NativeCurrency with the highest balance for the given chainId
 * @returns CurrencyId of the NativeCurrency with highest balance, or the native address for the given chainId
 *          (or defaultChainId if no chainId is provided) when no highest balance is found
 *
 */
export function useHighestBalanceNativeCurrencyId(address: Address, chainId?: UniverseChainId): CurrencyId {
  const { data } = useSortedPortfolioBalances({ address })
  const { defaultChainId } = useEnabledChains()
  const highestBalance = data?.balances.find(
    (balance) =>
      balance.currencyInfo.currency.isNative && (!chainId || balance.currencyInfo.currency.chainId === chainId),
  )?.currencyInfo.currencyId

  if (highestBalance) {
    return highestBalance
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
    if (balance.currencyInfo.currency.isNative) {
      const tokenVisibility = currencyIdToTokenVisibility[balance.currencyInfo.currencyId]
      // Only hide native tokens that are manually hidden by user
      if ((tokenVisibility?.isVisible || !tokenVisibility) && !balance.isHidden) {
        return false
      } else {
        return true
      }
    } else {
      if (balance.isHidden) {
        return true
      } else {
        return false
      }
    }
  }
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

export function usePortfolioCacheUpdater(address: string): PortfolioCacheUpdater {
  const isRestEnabled = useFeatureFlag(FeatureFlags.GqlToRestBalances)
  const restUpdater = useRestPortfolioCacheUpdater(address)
  const graphQLUpdater = useGraphQLPortfolioCacheUpdater(address)

  return isRestEnabled ? restUpdater : graphQLUpdater
}

/**
 * Creates a function to update the Apollo cache when a token is shown or hidden.
 * We manually modify the cache to avoid having to wait for the server's response,
 * so that the change is immediately reflected in the UI.
 *
 * @param address active wallet address
 * @returns a `PortfolioCacheUpdater` function that will update the Apollo cache
 */
function useGraphQLPortfolioCacheUpdater(address: string): PortfolioCacheUpdater {
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
