import { Currency } from '@uniswap/sdk-core'
import { graphql } from 'babel-plugin-relay/macro'
import { useMemo } from 'react'
import { useLazyLoadQuery } from 'react-relay'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { gqlTokenToCurrency } from 'src/features/dataApi/topTokens'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { balancesQuery } from 'src/features/dataApi/__generated__/balancesQuery.graphql'
import { useAllCurrencies } from 'src/features/tokens/useTokens'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { HIDE_SMALL_USD_BALANCES_THRESHOLD } from 'src/features/wallet/walletSlice'
import { fromGraphQLChain } from 'src/utils/chainId'
import { currencyId, CurrencyId } from 'src/utils/currencyId'

const query = graphql`
  query balancesQuery($ownerAddress: String!) {
    portfolios(ownerAddresses: [$ownerAddress]) {
      tokenBalances {
        quantity
        denominatedValue {
          currency
          value
        }
        token {
          chain
          address
          name
          symbol
          decimals
        }
        tokenProjectMarket {
          relativeChange24: pricePercentChange(duration: DAY) {
            value
          }
        }
      }
    }
  }
`
/** Returns all balances indexed by currencyId for a given address */
export function usePortfolioBalances(
  address: Address,
  onlyKnownCurrencies?: boolean
): Record<CurrencyId, PortfolioBalance> | undefined {
  const balancesData = useLazyLoadQuery<balancesQuery>(query, { ownerAddress: address })
  const balancesForAddress = balancesData?.portfolios?.[0]?.tokenBalances
  const tokensByChainId = useAllCurrencies()

  return useMemo(() => {
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
        !balance.token.decimals
      )
        return

      const currencyDetails = gqlTokenToCurrency(
        balance.token,
        tokensByChainId,
        onlyKnownCurrencies
      )
      if (!currencyDetails) return

      const portfolioBalance: PortfolioBalance = {
        quantity: balance.quantity,
        balanceUSD: balance.denominatedValue.value,
        currency: currencyDetails.currency,
        relativeChange24: balance.tokenProjectMarket?.relativeChange24?.value ?? 0,
      }

      byId[currencyDetails.currencyId] = portfolioBalance
    })

    return Object.keys(byId).length > 0 ? byId : undefined
  }, [balancesForAddress, onlyKnownCurrencies, tokensByChainId])
}

/** Returns portfolio balances for a given address sorted by USD value. */
export function useSortedPortfolioBalancesList(
  address: Address,
  onlyKnownCurrencies?: boolean,
  hideSmallBalances?: boolean
): PortfolioBalance[] {
  const balancesById = usePortfolioBalances(address, onlyKnownCurrencies)

  return useMemo(() => {
    if (!balancesById) return EMPTY_ARRAY

    const balances = hideSmallBalances
      ? Object.values(balancesById).filter(
          (balance) => balance.balanceUSD > HIDE_SMALL_USD_BALANCES_THRESHOLD
        )
      : Object.values(balancesById)
    return balances.sort((a, b) => b.balanceUSD - a.balanceUSD)
  }, [balancesById, hideSmallBalances])
}

/** Helper hook to retrieve balance for a single currency for the active account. */
export function useSingleBalance(currency: NullUndefined<Currency>): PortfolioBalance | null {
  const address = useActiveAccountAddressWithThrow()
  const portfolioBalances = usePortfolioBalances(address)

  return useMemo(() => {
    if (!currency || !portfolioBalances) return null

    const id = currencyId(currency)
    return portfolioBalances[id] ?? null
  }, [portfolioBalances, currency])
}

/** Helper hook to retrieve balances for a set of currencies for the active account. */
export function useMultipleBalances(currencies: CurrencyId[]): PortfolioBalance[] | null {
  const address = useActiveAccountAddressWithThrow()
  const balances = usePortfolioBalances(address)

  return useMemo(() => {
    if (!currencies || !currencies.length || !balances) return null

    return currencies.map((id: CurrencyId) => balances[id] ?? null).filter(Boolean)
  }, [balances, currencies])
}
