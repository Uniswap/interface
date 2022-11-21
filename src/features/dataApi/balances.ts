import { NetworkStatus } from '@apollo/client'
import { Currency, Token } from '@uniswap/sdk-core'
import { useCallback, useMemo } from 'react'
import { PollingInterval } from 'src/constants/misc'
import { usePortfolioBalancesQuery } from 'src/data/__generated__/types-and-hooks'
import { CurrencyInfo, GqlResult, PortfolioBalance } from 'src/features/dataApi/types'
import { usePersistedError } from 'src/features/dataApi/utils'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { HIDE_SMALL_USD_BALANCES_THRESHOLD } from 'src/features/wallet/walletSlice'
import { fromGraphQLChain } from 'src/utils/chainId'
import { currencyId, CurrencyId } from 'src/utils/currencyId'

type SortedPortfolioBalances = {
  balances: PortfolioBalance[]
  smallBalances: PortfolioBalance[]
  spamBalances: PortfolioBalance[]
}

/** Returns all balances indexed by currencyId for a given address */
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
    variables: { ownerAddress: address },
    pollInterval: shouldPoll ? PollingInterval.Fast : undefined,
    notifyOnNetworkStatusChange: true,
    onCompleted: onCompleted,
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
        !balance.denominatedValue ||
        !balance.denominatedValue.value ||
        !balance.token ||
        !balance.token.decimals ||
        !balance.token.symbol ||
        !balance.token.name
      )
        return

      if (hideSmallBalances && balance.denominatedValue.value < HIDE_SMALL_USD_BALANCES_THRESHOLD)
        return null
      if (hideSpamTokens && balance.tokenProjectMarket?.tokenProject?.isSpam) return null

      const currency = balance.token.address
        ? new Token(
            chainId,
            balance.token.address,
            balance.token.decimals,
            balance.token.symbol,
            balance.token.name
          )
        : NativeCurrency.onChain(chainId)

      const id = currencyId(currency)

      const currencyInfo: CurrencyInfo = {
        currency,
        currencyId: currencyId(currency),
        logoUrl: balance.tokenProjectMarket?.tokenProject?.logoUrl,
        isSpam: balance.tokenProjectMarket?.tokenProject?.isSpam,
        safetyLevel: balance.tokenProjectMarket?.tokenProject.safetyLevel,
      }

      const portfolioBalance: PortfolioBalance = {
        quantity: balance.quantity,
        balanceUSD: balance.denominatedValue.value,
        currencyInfo: currencyInfo,
        relativeChange24: balance.tokenProjectMarket?.relativeChange24?.value ?? 0,
      }

      byId[id] = portfolioBalance
    })

    return byId
  }, [balancesForAddress, hideSmallBalances, hideSpamTokens])

  const retry = useCallback(() => refetch({ ownerAddress: address }), [address, refetch])

  return { data: formattedData, loading, networkStatus, refetch: retry, error: persistedError }
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
        } else if (hideSmallBalances && balance.balanceUSD < HIDE_SMALL_USD_BALANCES_THRESHOLD) {
          acc.smallBalances.push(balance)
        } else {
          acc.balances.push(balance)
        }
        return acc
      },
      { balances: [], smallBalances: [], spamBalances: [] }
    )

    return {
      balances: balances.sort((a, b) => b.balanceUSD - a.balanceUSD),
      smallBalances: smallBalances.sort((a, b) => b.balanceUSD - a.balanceUSD),
      spamBalances: spamBalances.sort((a, b) => b.balanceUSD - a.balanceUSD),
    }
  }, [balancesById, hideSmallBalances, hideSpamTokens])

  return { data: formattedData, loading, networkStatus, refetch }
}

/** Helper hook to retrieve balance for a single currency for the active account. */
export function useSingleBalance(currency: NullUndefined<Currency>): PortfolioBalance | null {
  const address = useActiveAccountAddressWithThrow()
  const { data: portfolioBalances } = usePortfolioBalances(address, /*shouldPoll=*/ false)

  return useMemo(() => {
    if (!currency || !portfolioBalances) return null

    const id = currencyId(currency)
    return portfolioBalances[id] ?? null
  }, [portfolioBalances, currency])
}

/** Helper hook to retrieve balances for a set of currencies for the active account. */
export function useMultipleBalances(currencies: CurrencyId[]): PortfolioBalance[] | null {
  const address = useActiveAccountAddressWithThrow()
  const { data: balances } = usePortfolioBalances(address, /*shouldPoll=*/ false)

  return useMemo(() => {
    if (!currencies || !currencies.length || !balances) return null

    return currencies.map((id: CurrencyId) => balances[id] ?? null).filter(Boolean)
  }, [balances, currencies])
}
