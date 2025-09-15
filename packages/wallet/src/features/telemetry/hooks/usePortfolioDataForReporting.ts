import { UseQueryResult } from '@tanstack/react-query'
import { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useMemo } from 'react'
import { calculateTotalBalancesUsdPerChainRest } from 'uniswap/src/data/balances/utils'
import { useGetPortfolioQuery } from 'uniswap/src/data/rest/getPortfolio'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useRestPortfolioValueModifier } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { useAccountBalances } from 'wallet/src/features/accounts/useAccountListData'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

const PORTFOLIO_REFETCH_INTERVAL = ONE_MINUTE_MS

interface PortfolioDataForReporting {
  portfolioQuery: UseQueryResult<GetPortfolioResponse | undefined, Error>
  signerAccountAddresses: string[]
  balances: number[]
  totalBalance: number
  totalBalancesUsdPerChain: Record<string, number> | undefined
}

/**
 * Combined hook for telemetry reporting that provides both portfolio data and account balances
 * Returns raw query result for use with calculateTotalBalancesUsdPerChainRest along with account balance data
 */
export function usePortfolioDataForReporting(address: string | undefined): PortfolioDataForReporting {
  const { chains: chainIds } = useEnabledChains()
  const modifier = useRestPortfolioValueModifier(address)
  const accounts = useAccounts()

  const signerAccountAddresses = useMemo(
    () =>
      Object.values(accounts)
        .filter((a: Account) => a.type === AccountType.SignerMnemonic)
        .map((a) => a.address) as string[],
    [accounts],
  )

  const { balances, totalBalance } = useAccountBalances({
    addresses: signerAccountAddresses,
    fetchPolicy: 'cache-first',
  })

  const portfolioQuery = useGetPortfolioQuery({
    input: { evmAddress: address, chainIds, modifier },
    enabled: !!address,
    refetchInterval: PORTFOLIO_REFETCH_INTERVAL,
  })

  const totalBalancesUsdPerChain = useMemo(
    () => calculateTotalBalancesUsdPerChainRest(portfolioQuery.data),
    [portfolioQuery.data],
  )

  return {
    portfolioQuery,
    signerAccountAddresses,
    balances,
    totalBalance,
    totalBalancesUsdPerChain,
  }
}
