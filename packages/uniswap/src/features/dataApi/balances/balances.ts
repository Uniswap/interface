import { NetworkStatus } from '@apollo/client'
import { QueryHookOptions } from '@apollo/client/react/types/types'
import { GqlResult, GraphQLApi, SpamCode } from '@universe/api'
import isEqual from 'lodash/isEqual'
import { useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePortfolioData } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { sortBalancesByName } from 'uniswap/src/features/dataApi/balances/utils'
import { BaseResult, PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { useHideSmallBalancesSetting, useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { useCurrencyIdToVisibility } from 'uniswap/src/features/transactions/selectors'
import { CurrencyId } from 'uniswap/src/types/currency'
import { currencyId } from 'uniswap/src/utils/currencyId'

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
 * Hook that returns portfolio data using REST API
 */
export function usePortfolioBalances({
  evmAddress,
  svmAddress,
  ...queryOptions
}: {
  evmAddress?: Address
  svmAddress?: Address
} & QueryHookOptions<
  GraphQLApi.PortfolioBalancesQuery,
  GraphQLApi.PortfolioBalancesQueryVariables
>): PortfolioDataResult {
  return usePortfolioData({
    evmAddress: evmAddress || '',
    svmAddress: svmAddress || '',
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
 *  on TokenDetails, useBalances relies rely on usePortfolioBalances but don't need polling versions of it.
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
  evmAddress,
  svmAddress,
  pollInterval,
  onCompleted,
}: {
  evmAddress?: Address
  svmAddress?: Address
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
    evmAddress,
    svmAddress,
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
