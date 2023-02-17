import { NetworkStatus } from '@apollo/client'
import { Token } from '@uniswap/sdk-core'
import { useCallback, useMemo } from 'react'
import { PollingInterval } from 'src/constants/misc'
import { usePortfolioBalancesQuery } from 'src/data/__generated__/types-and-hooks'
import { CurrencyInfo, GqlResult, PortfolioBalance } from 'src/features/dataApi/types'
import { usePersistedError } from 'src/features/dataApi/utils'
import { NativeCurrency } from 'src/features/tokens/NativeCurrency'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { HIDE_SMALL_USD_BALANCES_THRESHOLD } from 'src/features/wallet/walletSlice'
import { fromGraphQLChain } from 'src/utils/chainId'
import { currencyId, CurrencyId } from 'src/utils/currencyId'

type SortedPortfolioBalances = {
  balances: PortfolioBalance[]
  smallBalances: PortfolioBalance[]
  spamBalances: PortfolioBalance[]
}

/** Returns all balances indexed by checksummed currencyId for a given address */
export function usePortfolioBalances(
  address: Address,
  shouldPoll?: boolean,
  hideSmallBalances?: boolean,
  hideSpamTokens?: boolean,
  onCompleted?: () => void
): GqlResult<Record<CurrencyId, PortfolioBalance>> & { networkStatus: NetworkStatus } {
  const {
    data: balancesData,
    loading,
    networkStatus,
    refetch,
    error,
  } = usePortfolioBalancesQuery({
    // query is re-used by multiple components
    // load from cache and update it if the response has new data
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    onCompleted,
    pollInterval: shouldPoll ? PollingInterval.Fast : undefined,
    variables: { ownerAddress: address },
  })

  const persistedError = usePersistedError(loading, error)
  const balancesForAddress = balancesData?.portfolios?.[0]?.tokenBalances

  const formattedData = useMemo(() => {
    if (!balancesForAddress) return

    const byId: Record<CurrencyId, PortfolioBalance> = {}
    balancesForAddress.forEach((balance) => {
      const chainId = fromGraphQLChain(balance?.token?.chain)

      // require all of these fields to be defined
      if (
        !chainId ||
        !balance ||
        !balance.quantity ||
        !balance.token ||
        !balance.token.decimals ||
        !balance.token.symbol ||
        !balance.token.name
      )
        return

      if (
        hideSmallBalances &&
        (!balance.denominatedValue ||
          balance.denominatedValue?.value < HIDE_SMALL_USD_BALANCES_THRESHOLD)
      )
        return null
      if (hideSpamTokens && balance.token?.project?.isSpam) return null

      const currency = balance.token.address
        ? new Token(
            chainId,
            balance.token.address,
            balance.token.decimals,
            balance.token.symbol,
            balance.token.name,
            /* bypassChecksum:*/ true
          )
        : NativeCurrency.onChain(chainId)

      const id = currencyId(currency)

      const currencyInfo: CurrencyInfo = {
        currency,
        currencyId: currencyId(currency),
        logoUrl: balance.token?.project?.logoUrl,
        isSpam: balance.token?.project?.isSpam,
        safetyLevel: balance.token?.project?.safetyLevel,
      }

      const portfolioBalance: PortfolioBalance = {
        quantity: balance.quantity,
        balanceUSD: balance.denominatedValue?.value,
        currencyInfo,
        relativeChange24: balance.tokenProjectMarket?.relativeChange24?.value,
      }

      byId[id] = portfolioBalance
    })

    return byId
  }, [balancesForAddress, hideSmallBalances, hideSpamTokens])

  const retry = useCallback(() => refetch({ ownerAddress: address }), [address, refetch])

  return { data: formattedData, loading, networkStatus, refetch: retry, error: persistedError }
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
  } = usePortfolioBalances(
    address,
    shouldPoll,
    /*hideSmallBalances=*/ false,
    /*hideSpamBalances=*/ false,
    onCompleted
  )

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
          // Small balances includes tokens that don't have a balanceUSD value
          hideSmallBalances &&
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

/** Helper hook to retrieve balance for a single currency for the active account. */
export function useSingleBalance(_currencyId: CurrencyId): PortfolioBalance | null {
  const address = useActiveAccountAddressWithThrow()
  const { data: portfolioBalances } = usePortfolioBalances(address, /*shouldPoll=*/ false)

  return useMemo(() => {
    if (!portfolioBalances) return null
    return portfolioBalances[_currencyId] ?? null
  }, [portfolioBalances, _currencyId])
}

/** Helper hook to retrieve balances for a set of currencies for the active account. */
export function useMultipleBalances(
  currencies: CurrencyId[] | undefined
): PortfolioBalance[] | null {
  const address = useActiveAccountAddressWithThrow()
  const { data: balances } = usePortfolioBalances(address, /*shouldPoll=*/ false)

  return useMemo(() => {
    if (!currencies || !currencies.length || !balances) return null

    return currencies
      .map((id: CurrencyId) => balances[id] ?? null)
      .filter((x): x is PortfolioBalance => Boolean(x))
  }, [balances, currencies])
}
