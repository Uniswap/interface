import { NetworkStatus, WatchQueryFetchPolicy } from '@apollo/client'
import { useCallback, useMemo } from 'react'
import { PollingInterval } from 'wallet/src/constants/misc'
import { usePortfolioBalancesQuery } from 'wallet/src/data/__generated__/types-and-hooks'
import { fromGraphQLChain } from 'wallet/src/features/chains/utils'
import { CurrencyInfo, GqlResult, PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { buildCurrency, usePersistedError } from 'wallet/src/features/dataApi/utils'
import { HIDE_SMALL_USD_BALANCES_THRESHOLD } from 'wallet/src/features/wallet/slice'
import { CurrencyId, currencyId } from 'wallet/src/utils/currencyId'

type SortedPortfolioBalances = {
  balances: PortfolioBalance[]
  smallBalances: PortfolioBalance[]
  spamBalances: PortfolioBalance[]
}

/**
 * Returns all balances indexed by checksummed currencyId for a given address
 * @param address
 * @param shouldPoll whether query should poll
 * NOTE:
 *  on TokenDetails, useBalances relies rely on usePortfolioBalances but don't need
 *  polling versions of it. Including polling was causing multiple polling intervals
 *  to be kicked off with usePortfolioBalances.
 *  Same with on Token Selector's TokenSearchResultList, since the home screen
 *  has a usePortfolioBalances polling hook, we don't need to duplicate the
 *  polling interval when token selector is open
 * @param hideSmallBalances
 * @param hideSpamTokens
 * @param onCompleted
 * @returns
 */
export function usePortfolioBalances({
  address,
  shouldPoll,
  onCompleted,
  fetchPolicy,
}: {
  address?: Address
  shouldPoll?: boolean
  onCompleted?: () => void
  fetchPolicy?: WatchQueryFetchPolicy
}): GqlResult<Record<CurrencyId, PortfolioBalance>> & { networkStatus: NetworkStatus } {
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
    pollInterval: shouldPoll ? PollingInterval.KindaFast : undefined,
    variables: address ? { ownerAddress: address } : undefined,
    skip: !address,
  })

  const persistedError = usePersistedError(loading, error)
  const balancesForAddress = balancesData?.portfolios?.[0]?.tokenBalances

  const formattedData = useMemo(() => {
    if (!balancesForAddress) return

    const byId: Record<CurrencyId, PortfolioBalance> = {}
    balancesForAddress.forEach((balance) => {
      const { denominatedValue, token, tokenProjectMarket, quantity } = balance || {}
      const { address: tokenAddress, chain, decimals, symbol, project } = token || {}
      const { name, logoUrl, isSpam, safetyLevel } = project || {}
      const chainId = fromGraphQLChain(chain)

      // require all of these fields to be defined
      if (!balance || !quantity || !token) return

      const currency = buildCurrency({
        chainId,
        address: tokenAddress,
        decimals,
        symbol,
        name,
      })

      if (!currency) return

      const id = currencyId(currency)

      const currencyInfo: CurrencyInfo = {
        currency,
        currencyId: currencyId(currency),
        logoUrl,
        isSpam,
        safetyLevel,
      }

      const portfolioBalance: PortfolioBalance = {
        quantity,
        balanceUSD: denominatedValue?.value,
        currencyInfo,
        relativeChange24: tokenProjectMarket?.relativeChange24?.value,
      }

      byId[id] = portfolioBalance
    })

    return byId
  }, [balancesForAddress])

  const retry = useCallback(() => refetch({ ownerAddress: address }), [address, refetch])

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
  const { data } = useSortedPortfolioBalances(address, /*shouldPoll=*/ false)
  return data?.balances.find((balance) => balance.currencyInfo.currency.isNative)?.currencyInfo
    .currencyId
}

/**
 * Returns portfolio balances for a given address sorted by USD value.
 * Can optionally split out small balances and spam balances into separate arrays.
 *
 * @param address to get portfolio balances for
 * @param hideSmallBalances whether to return small balances in separate array
 * @param hideSpamTokens whether to return spam token balances in separate array
 * @returns SortedPortfolioBalances object with `balances`, `smallBalances`, `spamBalances`
 *
 */
export function useSortedPortfolioBalances(
  address: Address,
  shouldPoll: boolean,
  hideSmallBalances?: boolean,
  hideSpamTokens?: boolean,
  onCompleted?: () => void
): GqlResult<SortedPortfolioBalances> & { networkStatus: NetworkStatus } {
  // Fetch all balances including small balances and spam tokens because we want to return those in separate arrays
  const {
    data: balancesById,
    loading,
    networkStatus,
    refetch,
  } = usePortfolioBalances({
    address,
    shouldPoll,
    onCompleted,
    fetchPolicy: 'cache-and-network',
  })

  const formattedData = useMemo(() => {
    if (!balancesById) return

    const { balances, smallBalances, spamBalances } = Object.values(
      balancesById
    ).reduce<SortedPortfolioBalances>(
      (acc, balance) => {
        // Prioritize isSpam over small balance
        if (hideSpamTokens && balance.currencyInfo.isSpam) {
          acc.spamBalances.push(balance)
        } else if (
          // Small balances includes tokens that don't have a balanceUSD value but should exclude native currencies
          hideSmallBalances &&
          !balance.currencyInfo.currency.isNative &&
          (!balance.balanceUSD || balance.balanceUSD < HIDE_SMALL_USD_BALANCES_THRESHOLD)
        ) {
          acc.smallBalances.push(balance)
        } else {
          acc.balances.push(balance)
        }
        return acc
      },
      { balances: [], smallBalances: [], spamBalances: [] }
    )

    return {
      balances: sortPortfolioBalances(balances),
      smallBalances: sortPortfolioBalances(smallBalances),
      spamBalances: sortPortfolioBalances(spamBalances),
    }
  }, [balancesById, hideSmallBalances, hideSpamTokens])

  return { data: formattedData, loading, networkStatus, refetch }
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
      if (!a.balanceUSD) return 1
      if (!b.balanceUSD) return -1
      return b.balanceUSD - a.balanceUSD
    }),
    ...balancesWithoutUSDValue.sort((a, b) => {
      if (!a.currencyInfo.currency.name) return 1
      if (!b.currencyInfo.currency.name) return -1
      return a.currencyInfo.currency.name?.localeCompare(b.currencyInfo.currency.name)
    }),
  ]
}
