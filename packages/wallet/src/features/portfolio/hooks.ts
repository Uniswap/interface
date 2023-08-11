import { ApolloError } from '@apollo/client'
import { PollingInterval } from 'wallet/src/constants/misc'
import { usePortfolioBalanceQuery } from 'wallet/src/data/__generated__/types-and-hooks'

export function usePortfolioUSDBalance(address: Address): {
  portfolioBalanceUSD: number | undefined
  portfolioChange: number | undefined
  loading: boolean
  error: ApolloError | undefined
} {
  const { data, loading, error } = usePortfolioBalanceQuery({
    variables: {
      owner: address,
    },
    pollInterval: PollingInterval.Slow,
  })

  const portfolioBalance = data?.portfolios?.[0]
  const portfolioChange = portfolioBalance?.tokensTotalDenominatedValueChange?.percentage?.value
  const portfolioBalanceUSD = portfolioBalance?.tokensTotalDenominatedValue?.value

  return { portfolioBalanceUSD, portfolioChange, loading, error }
}
