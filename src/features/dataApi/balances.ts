import { Currency, Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { EMPTY_ARRAY, PollingInterval } from 'src/constants/misc'
import { usePortfolioBalancesQuery } from 'src/data/__generated__/types-and-hooks'
import { CurrencyInfo, GqlResult, PortfolioBalance } from 'src/features/dataApi/types'
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
  address: Address
): GqlResult<Record<CurrencyId, PortfolioBalance>> {
  const { data: balancesData, loading } = usePortfolioBalancesQuery({
    variables: { ownerAddress: address },
    pollInterval: PollingInterval.Fast,

    // TODO: either default all error policies to 'all' or remove this once
    // BE fixes the type error here
    errorPolicy: 'all',
  })
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
  }, [balancesForAddress])

  return { data: formattedData, loading }
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
  hideSmallBalances?: boolean,
  hideSpamTokens?: boolean
): SortedPortfolioBalances {
  const { data: balancesById } = usePortfolioBalances(address)

  return useMemo(() => {
    if (!balancesById)
      return { balances: EMPTY_ARRAY, smallBalances: EMPTY_ARRAY, spamBalances: EMPTY_ARRAY }

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
}

/** Helper hook to retrieve balance for a single currency for the active account. */
export function useSingleBalance(currency: NullUndefined<Currency>): PortfolioBalance | null {
  const address = useActiveAccountAddressWithThrow()
  const { data: portfolioBalances } = usePortfolioBalances(address)

  return useMemo(() => {
    if (!currency || !portfolioBalances) return null

    const id = currencyId(currency)
    return portfolioBalances[id] ?? null
  }, [portfolioBalances, currency])
}

/** Helper hook to retrieve balances for a set of currencies for the active account. */
export function useMultipleBalances(currencies: CurrencyId[]): PortfolioBalance[] | null {
  const address = useActiveAccountAddressWithThrow()
  const { data: balances } = usePortfolioBalances(address)

  return useMemo(() => {
    if (!currencies || !currencies.length || !balances) return null

    return currencies.map((id: CurrencyId) => balances[id] ?? null).filter(Boolean)
  }, [balances, currencies])
}
