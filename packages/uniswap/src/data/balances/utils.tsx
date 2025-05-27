import { useEffect, useState } from 'react'
import { PortfolioBalancesQueryResult } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { logger } from 'utilities/src/logger/logger'

/**
 * Computes the total balances in USD per chain asynchronously to avoid blocking the main thread.
 */
export function useTotalBalancesUsdPerChain(
  portfolioBalances: PortfolioBalancesQueryResult,
): Record<string, number> | undefined {
  const [totalBalancesUsdPerChain, setTotalBalancesUsdPerChain] = useState<Record<string, number> | undefined>(
    undefined,
  )

  const { gqlChains } = useEnabledChains()

  useEffect(() => {
    const calculateBalancesPerChain = async (): Promise<void> => {
      if (!portfolioBalances.data?.portfolios?.[0]?.tokenBalances) {
        return
      }

      const totalBalances = gqlChains.reduce(
        (chainAcc, chain) => {
          chainAcc[chain] =
            portfolioBalances.data?.portfolios?.[0]?.tokenBalances?.reduce((balanceAcc, tokenBalance) => {
              if (tokenBalance?.token?.chain === chain) {
                return balanceAcc + (tokenBalance.denominatedValue?.value || 0)
              }
              return balanceAcc
            }, 0) || 0
          return chainAcc
        },
        {} as Record<string, number>,
      )

      setTotalBalancesUsdPerChain(totalBalances)
    }

    calculateBalancesPerChain().catch((error) => logger.error('useTotalBalancesUsdPerChain', error))
  }, [portfolioBalances.data?.portfolios, gqlChains])

  return totalBalancesUsdPerChain
}
