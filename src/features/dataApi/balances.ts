import { skipToken } from '@reduxjs/toolkit/dist/query'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { graphql } from 'babel-plugin-relay/macro'
import { useMemo } from 'react'
import { useLazyLoadQuery } from 'react-relay'
import { useAppSelector } from 'src/app/hooks'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { dataApi } from 'src/features/dataApi/slice'
import { gqlTokenToCurrency } from 'src/features/dataApi/topTokens'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { balancesQuery } from 'src/features/dataApi/__generated__/balancesQuery.graphql'
import { useAllCurrencies } from 'src/features/tokens/useTokens'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { selectHideSmallBalances } from 'src/features/wallet/selectors'
import { fromGraphQLChain } from 'src/utils/chainId'
import { currencyId, CurrencyId } from 'src/utils/currencyId'
import { percentDifference } from 'src/utils/statistics'

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
export function usePortfolioBalances(address: Address, onlyKnownCurrencies?: boolean) {
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
        amount: CurrencyAmount.fromRawAmount(
          currencyDetails.currency,
          balance.quantity * 10 ** balance.token.decimals
        ),
        balanceUSD: balance.denominatedValue.value,
        relativeChange24: balance.tokenProjectMarket?.relativeChange24?.value ?? 0,
      }

      byId[currencyDetails.currencyId] = portfolioBalance
    })

    return Object.keys(byId).length > 0 ? byId : undefined
  }, [balancesForAddress, onlyKnownCurrencies, tokensByChainId])
}

export function usePortfolioBalancesList(
  address: Address,
  onlyKnownCurrencies?: boolean
): PortfolioBalance[] {
  const balancesById = usePortfolioBalances(address, onlyKnownCurrencies)

  return useMemo(() => (!balancesById ? EMPTY_ARRAY : Object.values(balancesById)), [balancesById])
}

/**
 * Retrieves balance for a single currency from the API cache.
 * Assumes the input currency is a known token.
 */
export function useSingleBalance(currency: NullUndefined<Currency>): PortfolioBalance | null {
  const address = useActiveAccount()?.address
  const hideSmallBalances = useAppSelector(selectHideSmallBalances)
  const balance = dataApi.endpoints.balances.useQueryState(
    address && currency
      ? {
          chainId: currency.chainId,
          address,
          ignoreSmallBalances: hideSmallBalances,
        }
      : skipToken,
    {
      // selectFromResult allows for performant re-renders
      selectFromResult: ({ data }) => data?.[currencyId(currency!)],
    }
  )

  return useMemo(
    () =>
      balance && currency
        ? {
            amount: CurrencyAmount.fromRawAmount(currency, balance.balance),
            balanceUSD: balance.balanceUSD,
            relativeChange24: percentDifference(balance.quote_rate, balance.quote_rate_24h),
          }
        : null,
    [balance, currency]
  )
}
